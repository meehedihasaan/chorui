import cn from 'clsx';
import { preventBubbling } from '@lib/utils';
import { useNavigate, useSearch } from '@lib/router';
import type { MouseEvent } from 'react';

const tabs = [
  { id: 'foryou', name: 'For you' },
  { id: 'following', name: 'Following' }
] as const;

export function FeedTabs(): JSX.Element {
  const navigate = useNavigate();
  const { tab } = useSearch({ from: '/home' }) as { tab?: string };

  const activeTab = tab === 'following' ? 'following' : 'foryou';

  const handleClick =
    (id: string) =>
    (e: MouseEvent<HTMLButtonElement>): void => {
      preventBubbling()(e);
      void navigate({
        to: '/home',
        search: id === 'following' ? { tab: 'following' } : {}
      });
    };

  return (
    <nav className='flex w-full gap-2 py-2'>
      {tabs.map(({ id, name }) => (
        <button
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
            activeTab === id
              ? 'border-main-accent bg-main-accent text-main-accent-foreground'
              : 'border-light-border text-light-secondary hover:bg-light-primary/10 dark:border-dark-border dark:text-dark-secondary dark:hover:bg-dark-primary/10'
          )}
          onClick={handleClick(id)}
          key={id}
          type='button'
        >
          {name}
        </button>
      ))}
    </nav>
  );
}
