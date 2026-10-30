import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { PageShell, pageHead } from '@components/layout/page-shell';
import { MainHeader } from '@components/home/main-header';
import { DisplayModal } from '@components/modal/display-modal';
import { HeroIcon } from '@components/ui/hero-icon';
import type { FormEvent, ReactNode } from 'react';

export const Route = createFileRoute('/settings')({
  ssr: false,
  head: () => pageHead('Settings', 'Manage your Chorui account, display and security.'),
  component: SettingsPage
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='border-b border-light-border dark:border-dark-border'>
      <h3 className='px-4 pt-4 pb-2 text-xl font-extrabold'>{title}</h3>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (pw !== pw2) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setPw(''); setPw2('');
    toast.success('Password updated');
  };

  const row = 'flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-light-primary/5 dark:hover:bg-dark-primary/5';
  const input = 'w-full rounded-md border border-light-line-reply bg-transparent px-3 py-2 outline-none focus:border-main-accent dark:border-dark-border';

  return (
    <PageShell>
      <MainHeader title='Settings' />
      <Section title='Your account'>
        <div className='px-4 pb-2 text-light-secondary dark:text-dark-secondary'>
          <p><span className='font-semibold text-light-primary dark:text-dark-primary'>{user?.name}</span> @{user?.username}</p>
        </div>
        <Link to='/user/$id' params={{ id: user?.username ?? '' }} className={row}>
          <HeroIcon className='h-6 w-6' iconName='UserIcon' />
          <div><p>Edit profile</p><p className='text-sm text-light-secondary dark:text-dark-secondary'>Change your photo, name, bio and more.</p></div>
        </Link>
      </Section>
      <Section title='Security'>
        <form onSubmit={changePassword} className='flex flex-col gap-3 px-4 pb-4'>
          <p className='text-light-secondary dark:text-dark-secondary'>Change your password</p>
          <input className={input} type='password' placeholder='New password' value={pw} onChange={(e) => setPw(e.target.value)} />
          <input className={input} type='password' placeholder='Confirm password' value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <button disabled={saving} className='self-end rounded-full bg-main-accent px-4 py-1.5 font-bold text-white disabled:opacity-50'>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Section>
      <Section title='Accessibility, display and languages'>
        <button type='button' className={row} onClick={() => setShowDisplay((v) => !v)}>
          <HeroIcon className='h-6 w-6' iconName='PaintBrushIcon' />
          <div><p>Display</p><p className='text-sm text-light-secondary dark:text-dark-secondary'>Theme, color and background.</p></div>
        </button>
        {showDisplay && <div className='px-4 pb-4'><DisplayModal closeModal={() => setShowDisplay(false)} /></div>}
      </Section>
      <button type='button' onClick={() => void signOut()} className={`${row} font-bold text-accent-red`}>
        <HeroIcon className='h-6 w-6' iconName='ArrowRightOnRectangleIcon' />
        Log out @{user?.username}
      </button>
    </PageShell>
  );
}
