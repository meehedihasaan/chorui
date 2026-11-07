import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from '@lib/router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { mapProfile } from '@lib/firebase/db';
import { UserAvatar } from '@components/user/user-avatar';
import { UserName } from '@components/user/user-name';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FollowButton } from '@components/ui/follow-button';
import { HeroIcon } from '@components/ui/hero-icon';
import type { User } from '@lib/types/user';

const CARD_WIDTH = 168;

/** Swipeable "Who to follow" row shown inside the Home feed. */
export function FeedWhoToFollow(): JSX.Element | null {
  const { randomSeed, user } = useAuth();
  const scroller = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ['feed-suggestions', user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc('get_suggested_users', {
        p_seed: randomSeed,
        p_limit: 12
      });
      if (error) return [];
      const following = new Set(user?.following ?? []);
      // Snapshot at load: people followed from this row stay visible.
      return ((rows as Record<string, unknown>[]) ?? [])
        .map((row) => mapProfile(row))
        .filter((u): u is User => !!u && u.id !== user?.id && !following.has(u.id));
    },
    enabled: !!user,
    staleTime: 5 * 60_000
  });

  const people = (data ?? []).filter((p) => !dismissed.includes(p.id));
  if (!people.length) return null;

  const scrollBy = (dir: 1 | -1): void =>
    scroller.current?.scrollBy({ left: dir * (CARD_WIDTH + 12) * 2, behavior: 'smooth' });

  return (
    <section
      aria-label='Who to follow'
      className='border-b border-light-border py-3 dark:border-dark-border'
    >
      <div className='mb-2 flex items-center justify-between px-4'>
        <h2 className='text-xl font-bold'>Who to follow</h2>
        <div className='hidden gap-1 xs:flex'>
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type='button'
              aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
              onClick={() => scrollBy(dir)}
              className='hover-animation flex h-8 w-8 items-center justify-center rounded-full
                         hover:bg-light-primary/10 dark:hover:bg-dark-primary/10'
            >
              <HeroIcon
                className='h-5 w-5'
                iconName={dir === -1 ? 'ChevronLeftIcon' : 'ChevronRightIcon'}
              />
            </button>
          ))}
        </div>
      </div>
      <div
        ref={scroller}
        className='no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1'
      >
        {people.map((person) => (
          <article
            key={person.id}
            style={{ width: CARD_WIDTH }}
            className='relative flex shrink-0 snap-start flex-col items-center gap-2 rounded-2xl
                       border border-light-border px-3 pb-3 pt-5 text-center dark:border-dark-border'
          >
            <button
              type='button'
              aria-label={`Hide @${person.username}`}
              onClick={() => setDismissed((d) => [...d, person.id])}
              className='hover-animation absolute right-1.5 top-1.5 flex h-7 w-7 items-center
                         justify-center rounded-full text-light-secondary hover:bg-light-primary/10
                         dark:text-dark-secondary dark:hover:bg-dark-primary/10'
            >
              <HeroIcon className='h-4 w-4' iconName='XMarkIcon' />
            </button>
            <UserAvatar
              src={person.photoURL}
              alt={person.name}
              username={person.username}
              size={64}
            />
            <div className='flex w-full min-w-0 flex-col items-center'>
              <UserName
                className='max-w-full justify-center truncate'
                name={person.name}
                username={person.username}
                verified={person.verified}
              />
              <p className='max-w-full truncate text-sm text-light-secondary dark:text-dark-secondary'>
                @{person.username}
              </p>
            </div>
            <div className='mt-auto flex w-full justify-center [&>button]:self-center'>
              <FollowButton userTargetId={person.id} userTargetUsername={person.username} />
            </div>
          </article>
        ))}
        <Link href='/people'>
          <a
            style={{ width: 120 }}
            className='hover-animation flex shrink-0 snap-start items-center justify-center rounded-2xl
                       border border-light-border font-bold text-main-accent hover:bg-light-primary/5
                       dark:border-dark-border dark:hover:bg-dark-primary/5'
          >
            Show more
          </a>
        </Link>
      </div>
    </section>
  );
}
