import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AccountForm } from '@components/login/account-form';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { useAuth } from '@lib/context/auth-context';
import { rememberAccount, switchAccount, forgetAccount, savedAccounts } from '@lib/account-sessions';
import type { SavedAccount } from '@lib/account-sessions';

export const Route = createFileRoute('/accounts')({ ssr: false,
  head: () => ({ meta: [{ title: 'Switch accounts / Chorui' }, { name: 'description', content: 'Add and switch between your Chorui accounts.' }, { property: 'og:title', content: 'Switch accounts / Chorui' }, { property: 'og:description', content: 'Manage your Chorui accounts.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: AccountsPage });
function AccountsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { void rememberAccount().then(setAccounts); }, [user?.id]);
  return <main className='min-h-screen bg-main-background px-5 py-6 text-light-primary dark:text-dark-primary'>
    <div className='mx-auto max-w-sm'>
      <Button aria-label='Back' className='mb-6 p-2' onClick={() => adding ? setAdding(false) : navigate({ to: '/home' })}><HeroIcon className='h-6 w-6' iconName='ArrowLeftIcon' /></Button>
      {adding ? <AccountForm onSignedIn={() => { void rememberAccount().then(() => navigate({ to: '/home' })); }} /> : <>
        <h1 className='mb-6 text-2xl font-bold'>Your accounts</h1>
        <div className='divide-y divide-light-border dark:divide-dark-border'>
          {accounts.map(a => <div key={a.id} className='flex items-center gap-2 py-3'>
            <Button disabled={busy} className='flex min-w-0 flex-1 items-center gap-3 rounded-md p-2 text-left hover:bg-main-accent/5' onClick={async () => { setBusy(true); setError(''); try { await switchAccount(a); await navigate({ to: '/home' }); } catch (e) { setError(e instanceof Error ? e.message : 'Please sign in again.'); setAdding(true); } finally { setBusy(false); } }}>
              <HeroIcon className='h-7 w-7 shrink-0' iconName='UserCircleIcon' /><span className='min-w-0 flex-1'><span className='block truncate font-bold'>{a.name}</span><span className='block truncate text-sm text-light-secondary dark:text-dark-secondary'>{a.email}</span></span>{a.id === user?.id && <HeroIcon iconName='CheckIcon' className='h-5 w-5' />}
            </Button>
            {a.id !== user?.id && <Button aria-label={`Remove ${a.name} from account switcher`} title='Remove account' className='p-2' onClick={() => { forgetAccount(a.id); setAccounts(savedAccounts()); }}><HeroIcon className='h-4 w-4' iconName='XMarkIcon' /></Button>}
          </div>)}
        </div>
        <Button className='mt-6 flex w-full items-center justify-center gap-2 bg-main-accent py-3 font-bold text-main-accent-foreground' onClick={() => setAdding(true)}><HeroIcon className='h-5 w-5' iconName='PlusIcon' />Add an existing or new account</Button>
      </>}
      {error && <p role='alert' className='mt-4 text-sm text-accent-red'>{error}</p>}
    </div>
  </main>;
}