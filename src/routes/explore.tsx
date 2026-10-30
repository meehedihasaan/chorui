import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import cn from 'clsx';
import { AnimatePresence } from 'framer-motion';
import { useSearchResults } from '@lib/hooks/useSearchResults';
import { PageShell, pageHead } from '@components/layout/page-shell';
import { MainHeader } from '@components/home/main-header';
import { Tweet } from '@components/tweet/tweet';
import { UserCard } from '@components/user/user-card';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import { WORLDWIDE_TRENDS as trends } from '@lib/trends-data';
import type { FormEvent } from 'react';

type Search = { q?: string; tab?: 'top' | 'people' };

export const Route = createFileRoute('/explore')({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === 'string' && s.q ? s.q : undefined,
    tab: s.tab === 'people' ? 'people' : undefined
  }),
  head: () => pageHead('Explore', 'Search posts and people, and see what is trending on Chorui.'),
  component: ExplorePage
});

function ExplorePage() {
  const { q = '', tab } = Route.useSearch();
  const navigate = useNavigate({ from: '/explore' });
  const [input, setInput] = useState(q);
  const { tweets, people, loading } = useSearchResults(q);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void navigate({ search: { q: input.trim() || undefined, tab } });
  };

  return (
    <PageShell>
      <MainHeader className='flex flex-col !gap-2'>
        <form onSubmit={submit} className='flex w-full items-center gap-3 rounded-full bg-main-search-background px-4 py-2'>
          <HeroIcon className='h-5 w-5 text-light-secondary dark:text-dark-secondary' iconName='MagnifyingGlassIcon' />
          <input
            className='w-full bg-transparent outline-none placeholder:text-light-secondary dark:placeholder:text-dark-secondary'
            placeholder='Search Chorui'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
        {q && (
          <nav className='flex w-full'>
            {(['top', 'people'] as const).map((t) => {
              const active = (tab ?? 'top') === t;
              return (
                <button
                  key={t}
                  type='button'
                  onClick={() => void navigate({ search: { q, tab: t === 'people' ? 'people' : undefined } })}
                  className={cn('relative flex-1 py-3 font-semibold hover:bg-light-primary/10 dark:hover:bg-dark-primary/10',
                    !active && 'text-light-secondary dark:text-dark-secondary')}
                >
                  {t === 'top' ? 'Top' : 'People'}
                  {active && <span className='absolute inset-x-8 bottom-0 h-1 rounded-full bg-main-accent' />}
                </button>
              );
            })}
          </nav>
        )}
      </MainHeader>
      <section className='mt-0.5'>
        {!q ? (
          <div>
            <h2 className='px-4 py-3 text-xl font-extrabold'>Trends for you</h2>
            {trends.slice(0, 15).map((t, i) => (
              <button
                key={t.name + i}
                type='button'
                onClick={() => { setInput(t.name); void navigate({ search: { q: t.name } }); }}
                className='block w-full px-4 py-3 text-left hover:bg-light-primary/5 dark:hover:bg-dark-primary/5'
              >
                <p className='text-sm text-light-secondary dark:text-dark-secondary'>{i + 1} · Trending</p>
                <p className='font-bold'>{t.name}</p>
              </button>
            ))}
          </div>
        ) : loading ? (
          <Loading className='mt-5' />
        ) : tab === 'people' ? (
          people?.length ? people.map((u) => <UserCard {...u} key={u.id} follow />)
            : <Empty q={q} />
        ) : tweets?.length ? (
          <AnimatePresence mode='popLayout'>
            {tweets.map((t) => <Tweet {...t} key={t.id} />)}
          </AnimatePresence>
        ) : <Empty q={q} />}
      </section>
    </PageShell>
  );
}

function Empty({ q }: { q: string }) {
  return (
    <div className='px-8 py-10 text-center'>
      <p className='text-2xl font-extrabold'>No results for “{q}”</p>
      <p className='text-light-secondary dark:text-dark-secondary'>Try searching for something else.</p>
    </div>
  );
}
