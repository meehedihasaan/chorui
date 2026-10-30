/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from '@tanstack/react-query';
import {
  fetchCollection,
  populateUsers,
  queryKey,
  mapProfile,
  mapTweet,
  mapStats,
  mapBookmark
} from '@lib/firebase/db';
import type { CollectionRef, RawRowAlias } from './db-types';
import type { User } from '@lib/types/user';

type UseCollection<T> = {
  data: T[] | null;
  loading: boolean;
};

type DataWithUser<T> = UseCollection<T & { user: User | null }>;

export type UseCollectionOptions = {
  includeUser?: boolean;
  allowNull?: boolean;
  disabled?: boolean;
  preserve?: boolean;
};

const MAPPERS: Record<string, (row: RawRowAlias) => unknown> = {
  profiles: mapProfile,
  tweets: mapTweet,
  user_stats: mapStats,
  bookmarks: mapBookmark
};

export function useCollection<T>(
  ref: CollectionRef<T>,
  options: {
    includeUser: true;
    allowNull?: boolean;
    disabled?: boolean;
    preserve?: boolean;
  }
): DataWithUser<T>;

export function useCollection<T>(
  ref: CollectionRef<T>,
  options?: UseCollectionOptions
): UseCollection<T>;

export function useCollection<T>(
  ref: CollectionRef<T>,
  options?: UseCollectionOptions
): UseCollection<T> | DataWithUser<T> {
  const { includeUser, allowNull, disabled, preserve } = options ?? {};

  const { data, isPending } = useQuery({
    queryKey: queryKey(ref),
    queryFn: async () => {
      const rows = await fetchCollection<T>(ref, MAPPERS[ref.table] as (row: RawRowAlias) => T | null);

      if (!rows) return null;

      if (includeUser)
        return (await populateUsers(rows as (T & { createdBy: string })[])) as (T & {
          user: User | null;
        })[];

      return rows;
    },
    enabled: !disabled,
    placeholderData: preserve ? (previous) => previous : undefined,
    staleTime: 10_000
  });

  const loading = !disabled && isPending && !data;

  const result = data ?? (allowNull ? null : []);

  if (includeUser)
    return { data: result as (T & { user: User | null })[] | null, loading } as DataWithUser<T>;

  return { data: result as T[] | null, loading };
}
