/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCollection,
  populateUsers,
  queryKey,
  mapProfile,
  mapTweet,
  mapStats,
  mapBookmark
} from '@lib/firebase/db';
import type { CollectionRef, QueryConstraint, RawRow } from '@lib/firebase/db';
import { onDataChanged } from '@lib/firebase/utils';
import type { User } from '@lib/types/user';
import { supabase } from '@/integrations/supabase/client';

type UseCollection<T> = {
  data: T[] | null;
  loading: boolean;
};

type DataWithUser<T> = UseCollection<T & { user: User }>;

export type UseCollectionOptions = {
  includeUser?: boolean;
  allowNull?: boolean;
  disabled?: boolean;
  preserve?: boolean;
};

const MAPPERS: Record<string, (row: RawRow) => unknown> = {
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

  const queryClient = useQueryClient();

  useEffect(() => {
    const listener = (): void => {
      void queryClient.invalidateQueries({ queryKey: queryKey(ref) });
    };

    return onDataChanged(listener);
  }, [queryClient, ref]);

  const { data, isPending } = useQuery({
    queryKey: queryKey(ref),
    queryFn: async () => {
      const rows = await fetchCollection<T>(
        ref,
        MAPPERS[ref.table] as (row: RawRow) => T | null
      );

      if (!rows) return null;

      let visibleRows = rows;
      if (ref.table === 'tweets') {
        const { data: mutes } = await supabase.from('user_mutes').select('target_id');
        const hidden = new Set(mutes?.map(m => m.target_id) ?? []);
        visibleRows = rows.filter(row => !hidden.has((row as { createdBy?: string }).createdBy ?? ''));
      }
      if (includeUser)
        return (await populateUsers(
          visibleRows as unknown as (T & { createdBy: string })[]
        )) as unknown as (T & { user: User })[];

      return visibleRows;
    },
    enabled: !disabled,
    placeholderData: preserve ? (previous) => previous : undefined,
    staleTime: 10_000
  });

  const loading = !disabled && isPending && !data;

  const result = data ?? (allowNull ? null : []);

  if (includeUser)
    return {
      data: (result ?? null) as (T & { user: User })[] | null,
      loading
    } as DataWithUser<T>;

  return { data: result as T[] | null, loading };
}

export type { QueryConstraint };
