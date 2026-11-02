import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import cn from 'clsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import Link, { useRouter } from '@lib/router';
import { resolveAvatarUrl } from '@lib/default-avatar';
import { MainLayout } from '@components/layout/main-layout';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { Loading } from '@components/ui/loading';
import { HeroIcon } from '@components/ui/hero-icon';
import { AdminReview } from '@components/admin/verification-review';
import { GeneralSettings } from '@components/admin/general-settings';

export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Admin panel / Chorui' },
      { name: 'description', content: 'Manage Chorui users, posts, reports and verification.' },
      { name: 'robots', content: 'noindex' },
      { property: 'og:title', content: 'Admin panel / Chorui' },
      { property: 'og:description', content: 'Manage Chorui users, posts, reports and verification.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' }
    ]
  }),
  component: AdminPage
});

const TABS = ['Overview', 'Users', 'Posts', 'Reports', 'Verification', 'Settings'] as const;
type Tab = (typeof TABS)[number];

const btn = 'rounded-full border border-light-line-reply px-3 py-1 text-sm font-bold transition hover:bg-light-primary/10 dark:border-dark-line-reply dark:hover:bg-dark-primary/10 disabled:opacity-50';
const danger = 'rounded-full bg-accent-red px-3 py-1 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50';
const muted = 'text-light-secondary dark:text-dark-secondary';
const inputCls = 'w-full rounded-full border border-light-line-reply bg-transparent px-4 py-2 outline-none focus:border-main-accent dark:border-dark-line-reply';

function AdminPage() {
  return (
    <ProtectedLayout>
      <MainLayout>
        <HomeLayout>
          <AdminContent />
        </HomeLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}

function useDebounced(v: string, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

async function rpc(name: string, args: Record<string, unknown>, ok: string, qc: ReturnType<typeof useQueryClient>) {
  const { error } = await (supabase.rpc as unknown as (n: string, a: Record<string, unknown>) => Promise<{ error: { message: string } | null }>)(name, args);
  if (error) {
    toast.error(error.message.includes('Forbidden') ? 'You are not allowed to do that' : error.message);
    return false;
  }
  toast.success(ok);
  void qc.invalidateQueries({ queryKey: ['admin'] });
  return true;
}

function AdminContent() {
  const { user } = useAuth();
  const { back } = useRouter();
  const [tab, setTab] = useState<Tab>('Overview');
  const isAdmin = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    queryFn: async () => !!(await supabase.rpc('has_role', { _user_id: user!.id, _role: 'admin' })).data
  });

  if (isAdmin.isPending) return <MainContainer><Loading /></MainContainer>;
  if (!isAdmin.data)
    return (
      <MainContainer>
        <MainHeader title='Admin panel' useActionButton action={back} />
        <p className={cn('p-8 text-center', muted)}>You don't have access to this page.</p>
      </MainContainer>
    );

  return (
    <MainContainer>
      <MainHeader title='Admin panel' useActionButton action={back} />
      <nav className='flex overflow-x-auto border-b border-light-border dark:border-dark-border'>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('relative flex-1 whitespace-nowrap px-4 py-3 font-bold hover:bg-light-primary/5 dark:hover:bg-dark-primary/5', tab !== t && muted)}
          >
            {t}
            {tab === t && <span className='absolute bottom-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-main-accent' />}
          </button>
        ))}
      </nav>
      {tab === 'Overview' && <Overview go={setTab} />}
      {tab === 'Users' && <Users />}
      {tab === 'Posts' && <Posts />}
      {tab === 'Reports' && <Reports />}
      {tab === 'Verification' && <AdminReview />}
      {tab === 'Settings' && <GeneralSettings />}
    </MainContainer>
  );
}

function Overview({ go }: { go: (t: Tab) => void }) {
  const q = useQuery({
    queryKey: ['admin', 'stats'],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_stats');
      if (error) throw error;
      return data as Record<string, number>;
    }
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <p className='p-5'>Could not load stats.</p>;
  const s = q.data;
  const cards: [string, number, Tab?][] = [
    ['Users', s.users, 'Users'],
    ['New users (7 days)', s.users_7d, 'Users'],
    ['Posts', s.posts, 'Posts'],
    ['Replies', s.replies, 'Posts'],
    ['Posts (24 hours)', s.posts_24h, 'Posts'],
    ['Messages', s.messages],
    ['Verified accounts', s.verified, 'Users'],
    ['Suspended accounts', s.banned, 'Users'],
    ['Open reports', s.open_reports, 'Reports'],
    ['Pending verifications', s.pending_verifications, 'Verification']
  ];
  return (
    <div className='grid grid-cols-2 gap-3 p-4 sm:grid-cols-3'>
      {cards.map(([label, value, t]) => (
        <button
          key={label}
          disabled={!t}
          onClick={() => t && go(t)}
          className='rounded-2xl border border-light-border p-4 text-left transition enabled:hover:bg-light-primary/5 dark:border-dark-border dark:enabled:hover:bg-dark-primary/5'
        >
          <p className={cn('text-sm', muted)}>{label}</p>
          <p className='mt-1 text-3xl font-bold'>{Number(value ?? 0).toLocaleString()}</p>
        </button>
      ))}
    </div>
  );
}

type AdminUser = { id: string; name: string; username: string; photo_url: string; verified: boolean; total_tweets: number; followers: number; created_at: string; is_admin: boolean; is_banned: boolean };

function Users() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(30);
  const term = useDebounced(search.trim());
  const q = useQuery({
    queryKey: ['admin', 'users', term, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users', { p_query: term, p_limit: limit, p_offset: 0 });
      if (error) throw error;
      return data as AdminUser[];
    }
  });
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (id: string, fn: () => Promise<boolean>) => {
    setBusy(id);
    await fn();
    setBusy(null);
  };

  return (
    <div>
      <div className='p-4'>
        <input className={inputCls} placeholder='Search by name or @username' value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {q.isPending ? <Loading /> : !q.data?.length ? <p className={cn('p-5', muted)}>No users found.</p> : (
        <div className='divide-y divide-light-border dark:divide-dark-border'>
          {q.data.map((u) => {
            const self = u.id === user?.id;
            const b = busy === u.id;
            return (
              <div key={u.id} className='flex flex-col gap-3 p-4'>
                <div className='flex items-center gap-3'>
                  <img src={resolveAvatarUrl(u.photo_url)} alt='' className='h-11 w-11 rounded-full object-cover' />
                  <div className='min-w-0 flex-1'>
                    <Link href={`/user/${u.username}`}>
                      <a className='flex items-center gap-1 truncate font-bold hover:underline'>
                        {u.name || u.username}
                        {u.verified && <HeroIcon iconName='CheckBadgeIcon' solid className='h-4 w-4 text-accent-blue' />}
                      </a>
                    </Link>
                    <p className={cn('truncate text-sm', muted)}>
                      @{u.username} · {u.total_tweets} posts · {u.followers} followers · joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className='flex flex-wrap gap-2 text-xs'>
                  {u.is_admin && <span className='rounded-full bg-main-accent/15 px-2 py-0.5 font-bold'>Admin</span>}
                  {u.is_banned && <span className='rounded-full bg-accent-red/15 px-2 py-0.5 font-bold text-accent-red'>Suspended</span>}
                </div>
                <div className='flex flex-wrap gap-2'>
                  <button className={btn} disabled={b} onClick={() => act(u.id, () => rpc('admin_set_verified', { p_user: u.id, p_value: !u.verified }, u.verified ? 'Badge removed' : 'Badge given', qc))}>
                    {u.verified ? 'Remove badge' : 'Give badge'}
                  </button>
                  {!self && (
                    <button className={btn} disabled={b} onClick={() => act(u.id, () => rpc('admin_set_admin', { p_user: u.id, p_value: !u.is_admin }, u.is_admin ? 'Admin removed' : 'Made admin', qc))}>
                      {u.is_admin ? 'Remove admin' : 'Make admin'}
                    </button>
                  )}
                  {!self && (
                    <button
                      className={u.is_banned ? btn : danger}
                      disabled={b}
                      onClick={() => {
                        if (u.is_banned) return act(u.id, () => rpc('admin_set_ban', { p_user: u.id, p_value: false }, 'Account restored', qc));
                        const reason = window.prompt(`Suspend @${u.username}? Add a reason (optional):`, '');
                        if (reason === null) return;
                        return act(u.id, () => rpc('admin_set_ban', { p_user: u.id, p_value: true, p_reason: reason }, 'Account suspended', qc));
                      }}
                    >
                      {u.is_banned ? 'Unsuspend' : 'Suspend'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {q.data.length >= limit && limit < 100 && (
            <button className='w-full p-4 font-bold text-main-accent hover:underline' onClick={() => setLimit((l) => Math.min(l + 30, 100))}>
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type PostRow = { id: string; text: string | null; images: unknown; parent_id: string | null; created_at: string; user_likes: string[]; user_replies: number; created_by: string; author?: { username: string; name: string } };

async function withAuthors<T extends { created_by: string }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.created_by))];
  if (!ids.length) return rows as (T & { author?: { username: string; name: string } })[];
  const { data } = await supabase.from('profiles').select('id, username, name').in('id', ids);
  const map = new Map((data ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, author: map.get(r.created_by) }));
}

function Posts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim());
  const q = useQuery({
    queryKey: ['admin', 'posts', term],
    queryFn: async () => {
      let query = supabase.from('tweets').select('id, text, images, parent_id, created_at, user_likes, user_replies, created_by').order('created_at', { ascending: false }).limit(50);
      if (term) query = query.ilike('text', `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      return withAuthors((data ?? []) as PostRow[]);
    }
  });
  return (
    <div>
      <div className='p-4'>
        <input className={inputCls} placeholder='Search post text' value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {q.isPending ? <Loading /> : !q.data?.length ? <p className={cn('p-5', muted)}>No posts found.</p> : (
        <div className='divide-y divide-light-border dark:divide-dark-border'>
          {q.data.map((p) => (
            <PostItem key={p.id} post={p} onDelete={() => rpc('admin_delete_post', { p_post: p.id }, 'Post deleted', qc)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostItem({ post, onDelete, extra }: { post: PostRow; onDelete: () => Promise<boolean>; extra?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className='flex flex-col gap-2 p-4'>
      <p className={cn('text-sm', muted)}>
        {post.author ? <Link href={`/user/${post.author.username}`}><a className='font-bold hover:underline'>@{post.author.username}</a></Link> : 'Unknown'} ·{' '}
        {new Date(post.created_at).toLocaleString()} {post.parent_id && '· reply'}
      </p>
      <Link href={`/tweet/${post.id}`}>
        <a className='line-clamp-3 whitespace-pre-line break-words hover:underline'>{post.text || (post.images ? 'Photo post' : '(empty)')}</a>
      </Link>
      <p className={cn('text-xs', muted)}>{post.user_likes?.length ?? 0} likes · {post.user_replies} replies</p>
      <div className='flex flex-wrap gap-2'>
        {extra}
        <button
          className={danger}
          disabled={busy}
          onClick={async () => {
            if (!window.confirm('Delete this post for everyone?')) return;
            setBusy(true);
            await onDelete();
            setBusy(false);
          }}
        >
          Delete post
        </button>
      </div>
    </div>
  );
}

type Report = { id: string; post_id: string; reporter_id: string; reason: string; details: string; status: string; created_at: string };

function Reports() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'dismissed' | 'actioned'>('pending');
  const q = useQuery({
    queryKey: ['admin', 'reports', status],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_reports').select('*').eq('status', status).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      const reports = (data ?? []) as Report[];
      const postIds = [...new Set(reports.map((r) => r.post_id))];
      const { data: posts } = postIds.length
        ? await supabase.from('tweets').select('id, text, images, parent_id, created_at, user_likes, user_replies, created_by').in('id', postIds)
        : { data: [] };
      const withA = await withAuthors((posts ?? []) as PostRow[]);
      const pm = new Map(withA.map((p) => [p.id, p]));
      const grouped = new Map<string, { post?: PostRow; reports: Report[] }>();
      for (const r of reports) {
        const g = grouped.get(r.post_id) ?? { post: pm.get(r.post_id), reports: [] };
        g.reports.push(r);
        grouped.set(r.post_id, g);
      }
      return [...grouped.values()];
    }
  });

  const dismissAll = async (reports: Report[]) => {
    for (const r of reports) {
      const { error } = await supabase.rpc('admin_resolve_report', { p_report: r.id, p_status: 'dismissed' });
      if (error) return void toast.error('Could not dismiss');
    }
    toast.success('Reports dismissed');
    void qc.invalidateQueries({ queryKey: ['admin'] });
  };

  return (
    <div>
      <div className='flex gap-2 p-4'>
        {(['pending', 'dismissed'] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn(btn, 'capitalize', status === s && 'bg-light-primary text-main-background dark:bg-dark-primary')}>
            {s === 'pending' ? 'Open' : s}
          </button>
        ))}
      </div>
      {q.isPending ? <Loading /> : !q.data?.length ? <p className={cn('p-5', muted)}>No reports here.</p> : (
        <div className='divide-y divide-light-border dark:divide-dark-border'>
          {q.data.map(({ post, reports }) => (
            <div key={reports[0].post_id}>
              <div className='px-4 pt-4'>
                <p className='text-sm font-bold text-accent-red'>
                  {reports.length} report{reports.length > 1 ? 's' : ''}: {[...new Set(reports.map((r) => r.reason))].join(', ')}
                </p>
                {reports.filter((r) => r.details).map((r) => (
                  <p key={r.id} className={cn('text-sm', muted)}>“{r.details}”</p>
                ))}
              </div>
              {post ? (
                status === 'pending' ? (
                  <PostItem
                    post={post}
                    onDelete={() => rpc('admin_delete_post', { p_post: post.id }, 'Post removed', qc)}
                    extra={<button className={btn} onClick={() => dismissAll(reports)}>Dismiss</button>}
                  />
                ) : (
                  <p className='line-clamp-2 p-4'>{post.text}</p>
                )
              ) : (
                <p className={cn('p-4 text-sm', muted)}>Post no longer exists.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
