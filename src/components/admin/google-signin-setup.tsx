import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import cn from 'clsx';
import { lovable } from '@/integrations/lovable/index';
import { useAppSettings } from '@lib/app-settings';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { CustomIcon } from '@components/ui/custom-icon';

const muted = 'text-light-secondary dark:text-dark-secondary';
const card = 'rounded-2xl border border-light-border p-4 dark:border-dark-border';

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Set up Google’s consent screen',
    body: 'In the Google Cloud console, open the OAuth consent screen and fill in the app name, support email and logo, then publish it.'
  },
  {
    title: 'Add your site as an authorized domain',
    body: 'On the same consent screen, open Authorized domains and add the domain your site is served from — copy it from the row below.'
  },
  {
    title: 'Create a web OAuth client',
    body: 'Go to APIs & Services → Credentials → Create credentials → OAuth client ID, and choose Web application.'
  },
  {
    title: 'Paste the callback URL into Google',
    body: 'Open More → Users → Auth settings → Sign In Methods → Google, copy the callback URL shown there, and paste it into Google’s Authorized redirect URIs.'
  },
  {
    title: 'Paste Google’s keys back into the settings',
    body: 'Copy Google’s Client ID and Client secret into the same Google sign-in settings screen and save. Your own name and logo then appear on Google’s consent screen.'
  },
  {
    title: 'Test it',
    body: 'Use the button below. A Google window opens; pick an account and you come back signed in.'
  }
];

const TROUBLE: { when: string; then: string }[] = [
  {
    when: '“Unsupported provider”',
    then: 'Google sign-in is switched off. Turn it on in More → Users → Auth settings → Sign In Methods → Google.'
  },
  {
    when: 'No Google window opens',
    then: 'Your browser is blocking pop-ups for this site. Allow them, then test again.'
  },
  {
    when: '“redirect_uri_mismatch”',
    then: 'The redirect URI saved in Google does not match the callback URL shown in the Google settings screen. Copy it again, exactly.'
  },
  {
    when: 'Google asks for permissions you did not ask for',
    then: 'Trim the scopes on the consent screen to email, profile and openid — those are the only three this app needs.'
  }
];

function friendlyError(message: string): string {
  if (message.toLowerCase().includes('unsupported provider'))
    return 'Google sign-in is switched off on the backend. Turn it on in More → Users → Auth settings → Sign In Methods → Google.';
  return message || 'Google sign-in could not be started.';
}

export function GoogleSignInSetup(): JSX.Element {
  const { appName } = useAppSettings();
  const [origin, setOrigin] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed — select the text and copy it by hand.');
    }
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const response = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin
      });
      if (response.error) setResult({ ok: false, message: friendlyError(response.error.message ?? '') });
      else if (response.redirected) setResult({ ok: true, message: 'The Google window opened. Finish signing in there.' });
      else setResult({ ok: true, message: 'Signed in with Google — sign-in works.' });
    } catch (error) {
      setResult({ ok: false, message: friendlyError(error instanceof Error ? error.message : '') });
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className='flex flex-col gap-3 px-4 pt-6'>
      <div className={card}>
        <div className='flex items-start gap-3'>
          <span className='grid h-10 w-10 shrink-0 place-items-center rounded-full border border-light-border dark:border-dark-border'>
            <CustomIcon iconName='GoogleIcon' className='h-5 w-5' />
          </span>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-lg font-bold'>Google sign-in</h2>
              <span className='rounded-full border border-light-border px-2 py-0.5 text-xs font-bold dark:border-dark-border'>
                Managed by Lovable
              </span>
            </div>
            <p className={cn('mt-1 text-sm', muted)}>
              Visitors can already sign in to {appName} with their Google account using the button on the sign-in page.
              This setup uses Lovable’s built-in Google connection, so nothing needs to be installed.
            </p>
          </div>
        </div>

        <p className={cn('mt-3 text-sm', muted)}>
          This page is read-only. Google sign-in is switched on or off in the Lovable editor under More → Users,
          never from inside the app.
        </p>

        <div className='mt-4 flex flex-col gap-2'>
          <Button
            loading={testing}
            onClick={test}
            className='flex items-center justify-center gap-2 rounded-full bg-main-accent px-4 py-2 font-bold text-main-accent-foreground'
          >
            {!testing && <HeroIcon iconName='PlayCircleIcon' className='h-5 w-5' />}
            Test Google sign-in
          </Button>
          <p aria-live='polite' className={cn('min-h-5 text-sm', muted, result && 'font-bold', result?.ok && 'text-accent-green', result && !result.ok && 'text-accent-red')}>
            {result?.message ?? 'Opens a Google window so you can confirm the whole flow works. You will be signed in as the account you pick.'}
          </p>
        </div>
      </div>

      <div className={card}>
        <h3 className='font-bold'>Your site address</h3>
        <p className={cn('mt-1 text-sm', muted)}>
          Google needs this domain authorized before it will show your sign-in button.
        </p>
        <div className='mt-2 flex items-center gap-2'>
          <code className='min-w-0 flex-1 truncate rounded-md border border-light-line-reply px-3 py-2 text-sm dark:border-dark-line-reply'>
            {origin || '…'}
          </code>
          <Button
            aria-label='Copy site address'
            title='Copy site address'
            onClick={() => copy(origin, 'Site address')}
            className='shrink-0 rounded-full border border-light-line-reply p-2 dark:border-dark-line-reply'
          >
            <HeroIcon iconName='ClipboardDocumentIcon' className='h-5 w-5' />
          </Button>
        </div>
      </div>

      <div className={card}>
        <h3 className='font-bold'>Use your own Google app (optional)</h3>
        <p className={cn('mt-1 text-sm', muted)}>
          Do this when you want your own app name, logo and support email on Google’s consent screen instead of the
          built-in one.
        </p>
        <ol className='mt-3 flex flex-col gap-3'>
          {STEPS.map((step, i) => (
            <li key={step.title} className='flex gap-3'>
              <span className='grid h-6 w-6 shrink-0 place-items-center rounded-full bg-main-accent/15 text-xs font-bold'>
                {i + 1}
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block font-bold'>{step.title}</span>
                <span className={cn('mt-0.5 block text-sm', muted)}>{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className={card}>
        <h3 className='font-bold'>If it does not work</h3>
        <ul className='mt-3 flex flex-col gap-3'>
          {TROUBLE.map((item) => (
            <li key={item.when} className='flex gap-3'>
              <HeroIcon iconName='ExclamationTriangleIcon' className='mt-0.5 h-5 w-5 shrink-0 text-accent-yellow' />
              <span className='min-w-0 flex-1'>
                <span className='block font-bold'>{item.when}</span>
                <span className={cn('mt-0.5 block text-sm', muted)}>{item.then}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
