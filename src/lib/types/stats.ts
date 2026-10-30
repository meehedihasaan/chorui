import type { Timestamp, FirestoreDataConverter } from '@lib/firebase/db';

export type Stats = {
  likes: string[];
  tweets: string[];
  updatedAt: Timestamp | null;
};

export const statsConverter: FirestoreDataConverter<Stats> = {
  toFirestore(bookmark) {
    return { ...bookmark };
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);

    return { ...data } as Stats;
  }
};
