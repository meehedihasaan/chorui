import { collection } from './db';
import type { CollectionRef } from './db';
import type { User } from '@lib/types/user';
import type { Tweet } from '@lib/types/tweet';
import type { Bookmark } from '@lib/types/bookmark';
import type { Stats } from '@lib/types/stats';

export const usersCollection: CollectionRef<User> = collection<User>('profiles');

export const tweetsCollection: CollectionRef<Tweet> = collection<Tweet>('tweets');

export function userBookmarksCollection(id: string): CollectionRef<Bookmark> {
  return collection<Bookmark>('bookmarks', {
    type: 'where',
    field: 'user_id',
    op: '==',
    value: id
  });
}

export function userStatsCollection(id: string): CollectionRef<Stats> {
  return collection<Stats>('user_stats', {
    type: 'where',
    field: 'user_id',
    op: '==',
    value: id
  });
}
