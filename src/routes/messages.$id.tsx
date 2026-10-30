import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import cn from 'clsx';
import { toast } from 'react-hot-toast';
import { useAuth } from '@lib/context/auth-context';
import { useConversations } from '@lib/hooks/useConversations';
import { markConversationRead, sendMessage, useMessages } from '@lib/hooks/useMessages';
import { PageShell, pageHead } from '@components/layout/page-shell';
import { MainHeader } from '@components/home/main-header';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import type { FormEvent } from 'react';

export const Route = createFileRoute('/messages/$id')({
  ssr: false,
  head: () => pageHead('Conversation', 'A private conversation on Chorui.'),
  component: ChatPage
});

function ChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const me = user?.id as string;
  const { data: convos } = useConversations();
  const other = convos?.find((c) => c.conversation_id === id);
  const { data, loading } = useMessages(id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
    if (me && data.some((m) => !m.read && m.sender_id !== me)) void markConversationRead(id, me);
  }, [data.length]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await sendMessage(id, me, t);
      setText('');
    } catch {
      toast.error('Message could not be sent');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell>
      <MainHeader useActionButton action={() => history.back()} title={other ? other.other_name : 'Conversation'} />
      <section className='flex flex-1 flex-col gap-2 px-4 py-4 pb-24'>
        {loading ? <Loading className='mt-5' /> : data.length === 0 ? (
          <p className='mt-10 text-center text-light-secondary dark:text-dark-secondary'>Say hi 👋</p>
        ) : data.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <p className={cn('max-w-[80%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2',
                mine ? 'rounded-br-md bg-main-accent text-white' : 'rounded-bl-md bg-main-search-background')}>
                {m.text}
              </p>
              <span className='mt-0.5 text-xs text-light-secondary dark:text-dark-secondary'>
                {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={end} />
      </section>
      <form onSubmit={submit}
        className='sticky bottom-16 z-10 flex items-center gap-2 border-t border-light-border bg-main-background px-3 py-2 dark:border-dark-border xs:bottom-0'>
        <input
          className='flex-1 rounded-full bg-main-search-background px-4 py-2 outline-none'
          placeholder='Start a new message'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type='submit' disabled={!text.trim() || sending} className='p-2 text-main-accent disabled:opacity-50' aria-label='Send'>
          <HeroIcon className='h-5 w-5' iconName='PaperAirplaneIcon' />
        </button>
      </form>
    </PageShell>
  );
}
