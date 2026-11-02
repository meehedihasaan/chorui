import { UserRoundPlus, UserRoundCheck } from 'lucide-react';
import { useAuth } from '@lib/context/auth-context';
import { useFollowAction } from '@lib/hooks/useFollowAction';
import { Button } from '@components/ui/button';
import { preventBubbling } from '@lib/utils';

export function PostFollow({ userId, username }: { userId: string; username: string }) {
  const { user } = useAuth();
  const { followed, pending, toggle } = useFollowAction(userId);
  if (!user || user.id === userId) return null;
  const Icon = followed ? UserRoundCheck : UserRoundPlus;
  return <Button title={followed ? `Unfollow @${username}` : `Follow @${username}`}
    aria-label={followed ? `Unfollow @${username}` : `Follow @${username}`} disabled={pending}
    onClick={preventBubbling(toggle)}
    className='-my-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0 hover:bg-main-accent/10'>
    <Icon className='h-[18px] w-[18px]' strokeWidth={1.8} />
  </Button>;
}