/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProfile, mapTweet, mapStats, mapBookmark } from '@lib/firebase/db';
import type { CollectionRef, RawRowAlias } from './db-types';
import type { User } from '@lib/types/user';

type UserArrayDocument<T> = {
  data: T[] | null;
  loading: boolean;
};

type DataWithUser<T> = UserArrayDocument<T & { user: User | null }>;

export function useArrayDocument<T>(
  docsIds: string[],
  collectionRef: CollectionRef<T>,
  options?: { includeUser?: boolean; disabled?: boolean }
): UserArrayDocument<T> | DataWithUser<T> {
  const { includeUser, disabled } = options ?? {};

  const idsKey = docsIds.join(',');

  const { data, isPending } = useQuery({
    queryKey: ['arrayDocs', collectionRef.table, idsKey],
    queryFn: async () => {
      if (!docsIds.length) return null;

      const { data: rows, error } = await supabase
        .from(collectionRef.table)
        .select('*')
        .in('id', docsIds);

      if (error) {
        console.error('array fetch failed', error.message);
        return null;
      }

      const mapped = MAPPERS[collectionRef.table];
      const rowsById = new Map(
        ((rows as RawRowAlias[]) ?? [])
          .map((row) => mapped(row as RawRowAlias))
          .filter(Boolean)
          .map((row) => [(row as { id: string }).id, row])
      );

      const ordered = docsIds
        .map((id) => rowsById.get(id))
        .filter(Boolean) as (T & { createdBy: string })[];

      if (!ordered.length) return null;

      if (!includeUser) return ordered;

      const ownerIds = [...new Set(ordered.map(({ createdBy }) => createdBy))];

      const { data: userRows } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ownerIds);

      const usersById = new Map(
        ((userRows as RawRowAlias[]) ?? [])
          .map((row) => mapProfile(row))
          .filter(Boolean)
          .map((user) => [(user as User).id, user])
      );

      return ordered.map((item) => ({
        ...item,
        user: usersById.get(item.createdBy) as User
      }));
    },
    enabled: !disabled,
    staleTime: 10_000
  });

  const loading = !disabled && isPending && !data;

  if (includeUser)
    return { data: (data ?? null) as (T & { user: User | null })[] | null, loading } as DataWithUser<T>;

  return { data: (data ?? null) as T[] | null, loading };
}
