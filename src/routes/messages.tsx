import { createFileRoute, Link, Outlet, useMatch } from '@tanstack/react-router';
import { useConversations } from '@lib/hooks/useConversations';
import { PageShell, pageHead } from '@components/layout/page-shell';
import { MainHeader } from '@components/home/main-header';
import { Loading } from '@components/ui/loading';
import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '@lib/default-avatar';

export const Route = createFileRoute('/messages')({
  ssr: false,
  head: () => pageHead('Messages', 'Private conversations with people on Chorui.'),
  component: MessagesPage
});

function MessagesPage() {
  const child = useMatch({ from: '/messages/$id', shouldThrow: false });
  if (child) return <Outlet />;
  return <ConversationList />;
}

function ConversationList() {
  const { data, loading } = useConversations();
  return (
    <PageShell>
      <MainHeader useMobileSidebar title='Messages' />
      <section>
        {loading ? <Loading className='mt-5' /> : !data?.length ? (
          <div className='px-8 py-10'>
            <p className='text-3xl font-extrabold'>Welcome to your inbox!</p>
            <p className='mt-2 text-light-secondary dark:text-dark-secondary'>
              Open someone’s profile and tap the envelope button to start a conversation.
            </p>
          </div>
        ) : data.map((c) => (
          <Link key={c.conversation_id} to='/messages/$id' params={{ id: c.conversation_id }}
            className='flex items-center gap-3 px-4 py-3 hover:bg-light-primary/5 dark:hover:bg-dark-primary/5'>
            <img referrerPolicy='no-referrer' onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_URL; }} src={resolveAvatarUrl(c.other_photo_url)} alt={c.other_name} width={48} height={48} className='shrink-0 rounded-full object-cover' style={{ width: 48, height: 48 }} />
            <div className='min-w-0 flex-1'>
              <p className='truncate'>
                <span className='font-bold'>{c.other_name}</span>{' '}
                <span className='text-light-secondary dark:text-dark-secondary'>@{c.other_username}</span>
              </p>
              <p className='truncate text-light-secondary dark:text-dark-secondary'>{c.last_text ?? 'No messages yet'}</p>
            </div>
            {c.unread > 0 && <span className='h-2.5 w-2.5 rounded-full bg-main-accent' />}
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
