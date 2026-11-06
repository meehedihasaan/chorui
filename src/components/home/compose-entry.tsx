import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@lib/context/auth-context';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { resolveAvatarUrl } from '@lib/default-avatar';

export function ComposeEntry(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className='border-b border-light-border px-4 py-3 dark:border-dark-border'>
      <Button aria-label='Create a new post' onClick={() => navigate({ to: '/post' })}
        className='flex w-full min-w-0 items-center gap-3 !rounded-full bg-[#e2e2e2] py-2 pl-2 pr-3 text-[#4a4a4a] hover:brightness-95 dark:bg-[#2f3336] dark:text-dark-secondary'>
        <img src={resolveAvatarUrl(user?.photoURL)} alt='Your profile photo' className='h-9 w-9 shrink-0 rounded-full object-cover' />
        <span className='min-w-0 flex-1 text-left text-base'>What's happening</span>
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#1f6b2a] text-[#111] dark:text-white'>
          <HeroIcon iconName='PlusIcon' className='h-5 w-5' />
        </span>
      </Button>
    </div>
  );
}