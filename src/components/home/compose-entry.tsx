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
        className='flex w-full min-w-0 items-center gap-3 rounded-lg border border-light-border px-3 py-2 text-light-secondary hover:bg-light-primary/5 dark:border-dark-border dark:text-dark-secondary dark:hover:bg-dark-primary/5'>
        <img src={resolveAvatarUrl(user?.photoURL)} alt='Your profile photo' className='h-8 w-8 shrink-0 rounded-full object-cover' />
        <span className='min-w-0 flex-1 text-left text-sm'>What's on your mind?</span>
        <HeroIcon iconName='PlusCircleIcon' className='h-6 w-6 shrink-0 text-light-primary dark:text-dark-primary' />
      </Button>
    </div>
  );
}