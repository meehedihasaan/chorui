/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProfile, mapTweet, mapStats, mapBookmark } from '@lib/firebase/db';
import type { DocumentRef, RawRowAlias } from './db-types';
import type { User } from '@lib/types/user';

type UseDocument<T> = {
  data: T | null;
  loading: boolean;
};

type DataWithUser<T> = UseDocument<T & { user: User | null }>;

export type UseDocumentOptions = {
  includeUser?: boolean;
  allowNull?: boolean;
  disabled?: boolean;
};

const MAPPERS: Record<string, (row: RawRowAlias) => unknown> = {
  profiles: mapProfile,
  tweets: mapTweet,
  user_stats: mapStats,
  bookmarks: mapBookmark
};

export function useDocument<T>(
  docRef: DocumentRef<T>,
  options: { includeUser: true; allowNull?: boolean; disabled?: boolean }
): DataWithUser<T>;

export function useDocument<T>(
  docRef: DocumentRef<T>,
  options?: UseDocumentOptions
): UseDocument<T>;

export function useDocument<T>(
  docRef: DocumentRef<T>,
  options?: UseDocumentOptions
): UseDocument<T> | DataWithUser<T> {
  const { includeUser, allowNull, disabled } = options ?? {};

  const { data, isPending } = useQuery({
    queryKey: ['doc', docRef.table, docRef.id],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from(docRef.table)
        .select('*')
        .eq('id', docRef.id)
        .maybeSingle();

      if (error) {
        console.error('get failed', docRef.table, error.message);
        return null;
      }

      const mapped = MAPPERS[docRef.table]?.(row as RawRowAlias) as (T & { createdBy: string }) | null;

      if (!mapped || !includeUser) return mapped;

      const { data: userRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mapped.createdBy)
        .maybeSingle();

      return { ...mapped, user: mapProfile(userRow as RawRowAlias) };
    },
    enabled: !disabled,
    staleTime: 10_000
  });

  const loading = !disabled && isPending && !data;

  if (includeUser)
    return { data: (data ?? null) as (T & { user: User | null }) | null, loading } as DataWithUser<T>;

  return { data: (data ?? null) as T | null, loading };
}
