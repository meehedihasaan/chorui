import { useRef, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@lib/context/auth-context';
import { manageFollow } from '@lib/firebase/utils';

export function useFollowAction(targetId: string) {
  const { user, setFollowing } = useAuth();
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [override, setOverride] = useState<boolean | null>(null);
  const followed = override ?? !!user?.following.includes(targetId);
  useEffect(() => { if (!busy.current) setOverride(null); }, [user?.following, targetId]);
  const toggle = async () => {
    if (!user || busy.current || user.id === targetId) return;
    const next = !followed;
    busy.current = true;
    setPending(true);
    setOverride(next);
    setFollowing(targetId, next);
    try { await manageFollow(next ? 'follow' : 'unfollow', user.id, targetId); }
    catch { setOverride(!next); setFollowing(targetId, !next); toast.error('Could not update follow. Please try again.'); }
    finally { busy.current = false; setPending(false); }
  };
  return { followed, pending, toggle };
}