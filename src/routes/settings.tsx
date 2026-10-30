import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import {
  getNotificationPrefs,
  notificationTypes,
  setNotificationPref
} from '@lib/settings-prefs';
import { PageShell, pageHead } from '@components/layout/page-shell';
import { DisplayModal } from '@components/modal/display-modal';
import { HeroIcon } from '@components/ui/hero-icon';
import type { FormEvent, ReactNode } from 'react';

type SectionId = 'account' | 'security' | 'privacy' | 'notifications' | 'display' | 'resources';
type Search = { section?: SectionId };

const sections: { id: SectionId; label: string; keywords: string }[] = [
  { id: 'account', label: 'Your account', keywords: 'profile name username email info data download' },
  { id: 'security', label: 'Security and account access', keywords: 'password email sessions log out' },
  { id: 'privacy', label: 'Privacy and safety', keywords: 'data download export bookmarks clear' },
  { id: 'notifications', label: 'Notifications', keywords: 'likes reposts replies mentions follows' },
  { id: 'display', label: 'Accessibility, display, and languages', keywords: 'theme color dark motion' },
  { id: 'resources', label: 'Additional resources', keywords: 'about terms privacy policy' }
];

export const Route = createFileRoute('/settings')({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => {
    const v = s.section as SectionId | undefined;
    return sections.some((x) => x.id === v) ? { section: v } : {};
  },
  head: () => pageHead('Settings', 'Manage your Chorui account, security, privacy, notifications and display.'),
  component: SettingsPage
});

const muted = 'text-light-secondary dark:text-dark-secondary';
const rowCls = 'flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-light-primary/5 dark:hover:bg-dark-primary/5';
const inputCls = 'w-full rounded-md border border-light-line-reply bg-transparent px-3 py-2 outline-none focus:border-main-accent dark:border-dark-border';
const btnCls = 'self-end rounded-full bg-main-accent px-4 py-1.5 font-bold text-white disabled:opacity-50';

function Header({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div className='sticky top-0 z-10 flex items-center gap-6 bg-main-background/80 px-4 py-2 backdrop-blur-md'>
      <button type='button' aria-label='Back' onClick={onBack} className='rounded-full p-2 hover:bg-light-primary/10 dark:hover:bg-dark-primary/10'>
        <HeroIcon className='h-5 w-5' iconName='ArrowLeftIcon' />
      </button>
      <div>
        <h2 className='text-xl font-bold'>{title}</h2>
        {subtitle && <p className={`text-sm ${muted}`}>{subtitle}</p>}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { section } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');

  const open = (id?: SectionId) => void navigate({ to: '/settings', search: id ? { section: id } : {} });

  if (section) {
    const s = sections.find((x) => x.id === section)!;
    return (
      <PageShell>
        <Header title={s.label} subtitle={`@${user?.username ?? ''}`} onBack={() => open()} />
        <SectionBody id={section} />
      </PageShell>
    );
  }

  const term = q.trim().toLowerCase();
  const list = sections.filter((s) => !term || `${s.label} ${s.keywords}`.toLowerCase().includes(term));

  return (
    <PageShell>
      <Header title='Settings' subtitle={`@${user?.username ?? ''}`} onBack={() => router.history.back()} />
      <div className='px-3 pb-2'>
        <label className='flex items-center gap-2 rounded-full border border-light-border px-4 py-2.5 focus-within:border-main-accent dark:border-dark-border'>
          <HeroIcon className={`h-5 w-5 ${muted}`} iconName='MagnifyingGlassIcon' />
          <input className='w-full bg-transparent outline-none' placeholder='Search Settings' value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {list.map((s) => (
        <button key={s.id} type='button' className={rowCls} onClick={() => open(s.id)}>
          <span>{s.label}</span>
          <HeroIcon className={`h-5 w-5 ${muted}`} iconName='ChevronRightIcon' />
        </button>
      ))}
      {list.length === 0 && <p className={`px-4 py-6 ${muted}`}>No settings match "{q}".</p>}
      <a className={rowCls} href='https://docs.lovable.dev' target='_blank' rel='noreferrer'>
        <span>Help Center</span>
        <HeroIcon className={`h-5 w-5 ${muted}`} iconName='ArrowUpRightIcon' />
      </a>
    </PageShell>
  );
}

function Block({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className='flex flex-col gap-3 border-b border-light-border px-4 py-4 dark:border-dark-border'>
      <div>
        <p className='font-bold'>{title}</p>
        {desc && <p className={`text-sm ${muted}`}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionBody({ id }: { id: SectionId }) {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
    setPrefs(getNotificationPrefs());
    setReduceMotion(localStorage.getItem('chorui-reduce-motion') === '1');
  }, []);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return void toast.error('Password must be at least 8 characters');
    if (pw !== pw2) return void toast.error('Passwords do not match');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return void toast.error(error.message);
    setPw(''); setPw2('');
    toast.success('Password updated');
  };

  const changeEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) return void toast.error('Enter a valid email');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setBusy(false);
    if (error) return void toast.error(error.message);
    setNewEmail('');
    toast.success('Check your inbox to confirm the new email');
  };

  const logoutEverywhere = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    toast.success('Logged out of all sessions');
    void signOut();
  };

  const downloadData = async () => {
    if (!user) return;
    setBusy(true);
    const [tweets, bookmarks] = await Promise.all([
      supabase.from('tweets').select('*').eq('created_by', user.id),
      supabase.from('bookmarks').select('*')
    ]);
    setBusy(false);
    const blob = new Blob(
      [JSON.stringify({ profile: user, tweets: tweets.data ?? [], bookmarks: bookmarks.data ?? [] }, null, 2)],
      { type: 'application/json' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chorui-${user.username}-data.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Your data was downloaded');
  };

  const clearBookmarks = async () => {
    if (!user || !confirm('Remove all your bookmarks?')) return;
    const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id);
    if (error) return void toast.error(error.message);
    toast.success('All bookmarks cleared');
  };

  const toggle = (on: boolean, onChange: (v: boolean) => void) => (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-main-accent' : 'bg-light-line-reply dark:bg-dark-border'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-main-background transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );

  if (id === 'account')
    return (
      <>
        <Block title='Account information' desc='Your name, username and email.'>
          <p><span className={muted}>Name:</span> {user?.name}</p>
          <p><span className={muted}>Username:</span> @{user?.username}</p>
          <p><span className={muted}>Email:</span> {email || '—'}</p>
          <Link to='/user/$id' params={{ id: user?.username ?? '' }} className='font-bold text-main-accent hover:underline'>
            Edit profile
          </Link>
        </Block>
        <Block title='Download an archive of your data' desc='Get your posts, profile and bookmarks as a file.'>
          <button type='button' disabled={busy} className={btnCls} onClick={() => void downloadData()}>Download</button>
        </Block>
      </>
    );

  if (id === 'security')
    return (
      <>
        <Block title='Change your password'>
          <form onSubmit={changePassword} className='flex flex-col gap-3'>
            <input className={inputCls} type='password' placeholder='New password' value={pw} onChange={(e) => setPw(e.target.value)} />
            <input className={inputCls} type='password' placeholder='Confirm password' value={pw2} onChange={(e) => setPw2(e.target.value)} />
            <button disabled={busy} className={btnCls}>Save</button>
          </form>
        </Block>
        <Block title='Change email' desc={`Current: ${email || '—'}`}>
          <form onSubmit={changeEmail} className='flex flex-col gap-3'>
            <input className={inputCls} type='email' placeholder='New email' value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button disabled={busy} className={btnCls}>Update email</button>
          </form>
        </Block>
        <Block title='Sessions' desc='Log out of Chorui on every device, including this one.'>
          <button type='button' className='self-start font-bold text-accent-red hover:underline' onClick={() => void logoutEverywhere()}>
            Log out of all sessions
          </button>
        </Block>
        <Block title='Log out'>
          <button type='button' className='self-start font-bold text-accent-red hover:underline' onClick={() => void signOut()}>
            Log out @{user?.username}
          </button>
        </Block>
      </>
    );

  if (id === 'privacy')
    return (
      <>
        <Block title='Your data' desc='Download a copy of everything you have posted.'>
          <button type='button' disabled={busy} className={btnCls} onClick={() => void downloadData()}>Download data</button>
        </Block>
        <Block title='Bookmarks' desc='Bookmarks are only visible to you.'>
          <button type='button' className='self-start font-bold text-accent-red hover:underline' onClick={() => void clearBookmarks()}>
            Clear all bookmarks
          </button>
        </Block>
      </>
    );

  if (id === 'notifications')
    return (
      <Block title='Show notifications for' desc='Choose which activity appears on your Notifications page on this device.'>
        {notificationTypes.map(({ type, label }) => (
          <div key={type} className='flex items-center justify-between'>
            <span>{label}</span>
            {toggle(prefs[type] !== false, (v) => {
              setNotificationPref(type, v);
              setPrefs((p) => ({ ...p, [type]: v }));
            })}
          </div>
        ))}
      </Block>
    );

  if (id === 'display')
    return (
      <>
        <div className='px-4 py-4'><DisplayModal closeModal={() => undefined} /></div>
        <Block title='Reduce motion' desc='Limit animations across Chorui.'>
          <div className='flex items-center justify-between'>
            <span>Reduce motion</span>
            {toggle(reduceMotion, (v) => {
              setReduceMotion(v);
              localStorage.setItem('chorui-reduce-motion', v ? '1' : '0');
              document.documentElement.classList.toggle('reduce-motion', v);
            })}
          </div>
        </Block>
        <Block title='Language' desc='Chorui is currently available in English.'>
          <p>English</p>
        </Block>
      </>
    );

  return (
    <>
      <Block title='About Chorui' desc='A place to share what is happening right now.'><span /></Block>
      <Block title='Legal'>
        <p className={muted}>Terms of Service · Privacy Policy · Cookie Policy</p>
      </Block>
    </>
  );
}
