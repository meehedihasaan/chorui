/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getCollectionCount, limit, query } from '@lib/firebase/db';
import { Loading } from '@components/ui/loading';
import { useCollection } from './useCollection';
import type { QueryConstraint, CollectionRef, RawRowAlias } from './db-types';
import type { UseCollectionOptions } from './useCollection';
import type { User } from '@lib/types/user';

type InfiniteScroll<T> = {
  data: T[] | null;
  loading: boolean;
  LoadMore: () => JSX.Element;
};

type InfiniteScrollWithUser<T> = {
  data: (T & { user: User })[] | null;
  loading: boolean;
  LoadMore: () => JSX.Element;
};

export function useInfiniteScroll<T>(
  collection: CollectionRef<T>,
  queryConstraints: QueryConstraint[] | undefined,
  fetchOptions: UseCollectionOptions & { includeUser: true },
  options?: { initialSize?: number; stepSize?: number; marginBottom?: number }
): InfiniteScrollWithUser<T>;

export function useInfiniteScroll<T>(
  collection: CollectionRef<T>,
  queryConstraints?: QueryConstraint[],
  fetchOptions?: UseCollectionOptions,
  options?: { initialSize?: number; stepSize?: number; marginBottom?: number }
): InfiniteScroll<T>;

export function useInfiniteScroll<T>(
  collection: CollectionRef<T>,
  queryConstraints?: QueryConstraint[],
  fetchOptions?: UseCollectionOptions,
  options?: { initialSize?: number; stepSize?: number; marginBottom?: number }
): InfiniteScroll<T> | InfiniteScrollWithUser<T> {
  const { initialSize, stepSize, marginBottom } = options ?? {};

  const [itemsLimit, setItemsLimit] = useState(initialSize ?? 20);
  const [itemsSize, setItemsSize] = useState<number | null>(null);
  const [reachedLimit, setReachedLimit] = useState(false);
  const [loadMoreInView, setLoadMoreInView] = useState(false);

  const { data, loading } = useCollection(
    query(
      collection,
      ...[
        ...(queryConstraints ?? []),
        ...(!reachedLimit ? [limit(itemsLimit)] : [])
      ]
    ),
    fetchOptions as { includeUser: true }
  ) as {
    data: (T & { user: User })[] | null;
    loading: boolean;
  };

  useEffect(() => {
    const checkLimit = itemsSize ? itemsLimit >= itemsSize : false;
    setReachedLimit(checkLimit);
  }, [itemsSize, itemsLimit]);

  useEffect(() => {
    if (reachedLimit) return;

    void getCollectionCount(query(collection, ...(queryConstraints ?? []))).then(
      (count) => setItemsSize(count)
    );
  }, [data?.length]);

  useEffect(() => {
    if (reachedLimit) return;
    if (loadMoreInView) setItemsLimit(itemsLimit + (stepSize ?? 20));
  }, [loadMoreInView]);

  const makeItInView = (): void => setLoadMoreInView(true);
  const makeItNotInView = (): void => setLoadMoreInView(false);

  const isLoadMoreHidden =
    reachedLimit && (data?.length ?? 0) >= (itemsSize ?? 0);

  const LoadMore = useCallback(
    (): JSX.Element => (
      <motion.div
        className={isLoadMoreHidden ? 'hidden' : 'block'}
        viewport={{ margin: `0px 0px ${marginBottom ?? 1000}px` }}
        onViewportEnter={makeItInView}
        onViewportLeave={makeItNotInView}
      >
        <Loading className='mt-5' />
      </motion.div>
    ),
    [isLoadMoreHidden]
  );

  return { data, loading, LoadMore };
}
