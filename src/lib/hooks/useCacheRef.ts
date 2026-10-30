import { useState, useEffect } from 'react';
import { refEqual } from '@lib/firebase/db';
import type { DocumentReference } from '@lib/firebase/db';

export function useCacheRef<T>(
  ref: DocumentReference<T>
): DocumentReference<T> {
  const [cachedRef, setCachedRef] = useState(ref);

  useEffect(() => {
    if (!refEqual(ref, cachedRef)) setCachedRef(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return cachedRef;
}
