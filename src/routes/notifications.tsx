import { isNotificationEnabled } from '@lib/settings-prefs';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import cn from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@lib/context/auth-context';
import { markAllNotificationsRead, useNotifications } from '@lib/hooks/useNotifications';
import { PageShell, pageHead } from '@components/layout/page-shell';
import { MainHeader } from '@components/home/main-header';
import { HeroIcon } from '@components/ui/hero-icon';

import { Loading } from '@components/ui/loading';
import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '@lib/default-avatar';

type Search = { tab?: 'mentions' };

export const Route = createFileRoute('/notifications')({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: s.tab === 'mentions' ? 'mentions' : undefined
  }),
  head: () => pageHead('Notifications', 'Likes, reposts, replies, mentions and new followers.'),
  component: NotificationsPage
});

const meta = {
  like: { icon: 'HeartIcon', color: 'text-like-red', text: 'liked your post' },
  retweet: { icon: 'ArrowPathRoundedSquareIcon', color: 'text-accent-green', text: 'reposted your post' },
  reply: { icon: 'ChatBubbleOvalLeftIcon', color: 'text-main-accent', text: 'replied to your post' },
  mention: { icon: 'AtSymbolIcon', color: 'text-main-accent', text: 'mentioned you' },
  follow: { icon: 'UserIcon', color: 'text-main-accent', text: 'followed you' }
} as const;

function NotificationsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: '/notifications' });
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, loading } = useNotifications(tab ?? 'all');

  useEffect(() => {
    if (!user?.id || !data?.some((n) => !n.read)) return;
    void markAllNotificationsRead(user.id).then(() =>
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
    );
  }, [data, user?.id]);

  return (
    <PageShell>
      <MainHeader className='flex flex-col !items-stretch !gap-0 !pb-0'>
        <h2 className='text-xl font-bold'>Notifications</h2>
        <nav className='flex'>
          {([undefined, 'mentions'] as const).map((t) => (
            <button
              key={t ?? 'all'}
              type='button'
              onClick={() => void navigate({ search: { tab: t } })}
              className={cn('relative flex-1 py-3 font-semibold hover:bg-light-primary/10 dark:hover:bg-dark-primary/10',
                tab !== t && 'text-light-secondary dark:text-dark-secondary')}
            >
              {t ? 'Mentions' : 'All'}
              {tab === t && <span className='absolute inset-x-8 bottom-0 h-1 rounded-full bg-main-accent' />}
            </button>
          ))}
        </nav>
      </MainHeader>
      <section>
        {loading ? <Loading className='mt-5' /> : !data?.length ? (
          <div className='px-8 py-10 text-center'>
            <p className='text-2xl font-extrabold'>Nothing to see here — yet</p>
            <p className='text-light-secondary dark:text-dark-secondary'>Likes, reposts, replies and follows will show up here.</p>
          </div>
        ) : data.filter((n) => n.actor && isNotificationEnabled(n.type)).map((n) => {
          const m = meta[n.type];
          const href = n.tweet ? `/tweet/${n.tweet.id}` : `/user/${n.actor.username}`;
          return (
            <Link key={n.id} to={href}
              className={cn('flex gap-3 border-b border-light-border px-4 py-3 hover:bg-light-primary/5 dark:border-dark-border dark:hover:bg-dark-primary/5',
                !n.read && 'bg-main-accent/5')}>
              <HeroIcon solid className={cn('h-7 w-7 shrink-0', m.color)} iconName={m.icon} />


              <div className='flex min-w-0 flex-col gap-2'>
                <img referrerPolicy='no-referrer' onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_URL; }} src={resolveAvatarUrl(n.actor.photoURL)} alt={n.actor.name} width={32} height={32} className='shrink-0 rounded-full object-cover' style={{ width: 32, height: 32 }} />
                <p><span className='font-bold'>{n.actor.name}</span> {m.text}</p>
                {n.tweet?.text && <p className='truncate text-light-secondary dark:text-dark-secondary'>{n.tweet.text}</p>}
              </div>
            </Link>
          );
        })}
      </section>
    </PageShell>
  );
}
