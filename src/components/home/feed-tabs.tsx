import cn from 'clsx';
import { preventBubbling } from '@lib/utils';
import { useSearch } from '@lib/router';
import type { MouseEvent } from 'react';

const tabs = [
  { id: 'foryou', name: 'For you' },
  { id: 'following', name: 'Following' }
] as const;

export function FeedTabs(): JSX.Element {
  const { tab } = useSearch({ from: '/home' }) as { tab?: string };

  const activeTab = tab === 'following' ? 'following' : 'foryou';

  const handleClick = (id: string) => (e: MouseEvent<HTMLButtonElement>): void => {
    preventBubbling()(e);
    window.history.replaceState(null, '', `/home${id === 'following' ? '?tab=following' : ''}`);
    window.dispatchEvent(new Event('app:feed-tab'));
  };

  return (
    <nav className='flex flex-1 justify-center'>
      {tabs.map(({ id, name }) => (
        <button
          className={cn(
            'hover-animation main-tab dark-bg-tab flex-1 max-w-[200px] px-4 py-2 font-semibold transition-colors',
            'hover:bg-light-primary/10 dark:hover:bg-dark-primary/10',
            activeTab === id ? 'font-bold' : 'text-light-secondary dark:text-dark-secondary'
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
