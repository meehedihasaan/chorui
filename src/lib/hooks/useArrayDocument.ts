/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProfile, mapTweet, mapStats, mapBookmark } from '@lib/firebase/db';
import type { CollectionRef, RawRow } from '@lib/firebase/db';
import type { User } from '@lib/types/user';

type UserArrayDocument<T> = {
  data: T[] | null;
  loading: boolean;
};

type DataWithUser<T> = UserArrayDocument<T & { user: User }>;

const MAPPERS: Record<string, (row: RawRow) => unknown> = {
  profiles: mapProfile,
  tweets: mapTweet,
  user_stats: mapStats,
  bookmarks: mapBookmark
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

export function useArrayDocument<T>(
  docsIds: string[],
  collectionRef: CollectionRef<T>,
  options: { includeUser: true; disabled?: boolean }
): DataWithUser<T>;

export function useArrayDocument<T>(
  docsIds: string[],
  collectionRef: CollectionRef<T>,
  options?: { includeUser?: false; disabled?: boolean }
): UserArrayDocument<T>;

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

      const { data: rows, error } = await client
        .from(collectionRef.table)
        .select('*')
        .in('id', docsIds);

      if (error) {
        console.error('array fetch failed', error.message);
        return null;
      }

      const mapped = MAPPERS[collectionRef.table];
      const rowsById = new Map<string, (T & { createdBy: string }) & { id: string }>();

      for (const row of ((rows as RawRow[]) ?? []) as RawRow[]) {
        const item = mapped(row) as (T & { createdBy: string }) & { id: string };
        if (item) rowsById.set(item.id, item);
      }

      const ordered = docsIds
        .map((id) => rowsById.get(id))
        .filter(Boolean) as ((T & { createdBy: string }) & { id: string })[];

      if (!ordered.length) return null;

      if (!includeUser) return ordered;

      const { data: userRows } = await client
        .from('profiles')
        .select('*')
        .in('id', [...new Set(ordered.map(({ createdBy }) => createdBy))]);

      const usersById = new Map<string, User>();
      for (const row of ((userRows as RawRow[]) ?? []) as RawRow[]) {
        const user = mapProfile(row);
        if (user) usersById.set(user.id, user);
      }

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
    return {
      data: (data ?? null) as (T & { user: User })[] | null,
      loading
    } as DataWithUser<T>;

  return { data: (data ?? null) as T[] | null, loading };
}
