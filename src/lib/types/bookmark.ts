import type { Timestamp, FirestoreDataConverter } from '@lib/firebase/db';

export type Bookmark = {
  id: string;
  createdAt: Timestamp;
};

export const bookmarkConverter: FirestoreDataConverter<Bookmark> = {
  toFirestore(bookmark) {
    return { ...bookmark };
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);

    return { ...data } as Bookmark;
  }
};
