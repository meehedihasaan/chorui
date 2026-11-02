import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@lib/context/auth-context';
import { manageFollow } from '@lib/firebase/utils';

export function useFollowAction(targetId: string) {
  const { user, setFollowing } = useAuth();
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const followed = !!user?.following.includes(targetId);
  const toggle = async () => {
    if (!user || busy.current || user.id === targetId) return;
    const next = !followed;
    busy.current = true;
    setPending(true);
    setFollowing(targetId, next);
    try { await manageFollow(next ? 'follow' : 'unfollow', user.id, targetId); }
    catch { setFollowing(targetId, !next); toast.error('Could not update follow. Please try again.'); }
    finally { busy.current = false; setPending(false); }
  };
  return { followed, pending, toggle };
}