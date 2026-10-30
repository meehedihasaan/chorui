import type { Tweet, TweetWithUser } from './types/tweet';

type DataWithDate<T> = T & { createdAt: string };

export function mergeData<T>(
  sortData: boolean,
  ...tweets: (DataWithDate<T>[] | null)[]
): DataWithDate<T>[] | null {
  const validData = tweets.filter((tweet) => tweet) as DataWithDate<T>[][];
  const mergedData = validData.reduce((acc, tweet) => [...acc, ...tweet], []);

  return mergedData.length
    ? sortData
      ? mergedData.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      : mergedData
    : null;
}

export type { Tweet, TweetWithUser };
