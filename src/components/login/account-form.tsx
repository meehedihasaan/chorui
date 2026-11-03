import { useState } from 'react';
import { useAuth } from '@lib/context/auth-context';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { ChoruiLogo } from '@components/ui/chorui-logo';
import { PhoneForm } from './phone-form';

function strength(p: string): number {
  let n = 0;
  if (p.length >= 8) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/\d/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) n++;
  return n;
}

const typoDomains: Record<string, string> = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.co': 'gmail.com', 'yaho.com': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com' };

function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Wrong email or password. Please try again.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'This email already has an account — sign in instead.';
  if (m.includes('not confirmed')) return 'Please confirm your email first. Check your inbox for the link.';
  if (m.includes('pwned') || m.includes('weak')) return 'That password is too easy to guess. Try a longer one.';
  return msg;
}

export function AccountForm({ onSignedIn }: { onSignedIn?: () => void }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [usePhone, setUsePhone] = useState(false);
  const signup = mode === 'signup';
  const score = strength(password);
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const suggestion = typoDomains[domain] ? `${email.split('@')[0]}@${typoDomains[domain]}` : '';
  const [caps, setCaps] = useState(false);
  const field = 'w-full rounded-md border border-light-border bg-main-background px-4 py-3 text-light-primary outline-none focus:ring-2 focus:ring-main-accent dark:border-dark-border dark:text-dark-primary';
  const changeMode = () => { setMode(signup ? 'signin' : 'signup'); setStep(1); setError(''); setConfirmed(false); };
  return <div className='mx-auto w-full max-w-sm space-y-6'>
    <ChoruiLogo className='h-12 w-12' />
    <div><h1 className='text-3xl font-bold'>{signup ? 'Create your Chorui account' : 'Sign in to Chorui'}</h1>
      {signup && !confirmed && <p className='mt-2 text-sm text-light-secondary dark:text-dark-secondary'>Step {step} of 2</p>}</div>
    {confirmed ? <div role='status' className='space-y-4'><h2 className='text-xl font-bold'>Check your email</h2><p>We sent a confirmation link to {email}.</p><Button className={field} onClick={changeMode}>Back to sign in</Button></div> : <>
      <div className='grid gap-3'>
        {!usePhone && <Button className={`${field} flex items-center justify-center gap-2 font-bold`} onClick={() => setUsePhone(true)}><HeroIcon className='h-5 w-5' iconName='DevicePhoneMobileIcon' />Continue with phone</Button>}
      </div>
      <div className='flex items-center gap-3 text-sm text-light-secondary dark:text-dark-secondary'><i className='flex-1 border-t border-light-border dark:border-dark-border' />or<i className='flex-1 border-t border-light-border dark:border-dark-border' /></div>
      {usePhone ? <PhoneForm field={field} onSignedIn={onSignedIn} onCancel={() => setUsePhone(false)} /> : <>
      <form className='space-y-4' onSubmit={async e => {
        e.preventDefault(); setError('');
        if (signup && step === 1) { setStep(2); return; }
        if (signup && score < 2) { setError('Use at least 8 characters with a mix of letters and numbers.'); return; }
        setBusy(true);
        try {
          if (signup) { await signUpWithEmail(email.trim(), password, name); setConfirmed(true); }
          else { await signInWithEmail(email.trim(), password); onSignedIn?.(); }
        } catch (err) { setError(friendly(err instanceof Error ? err.message : 'Please try again.')); }
        finally { setBusy(false); }
      }}>
        {signup && step === 1 && <label className='block space-y-1 text-sm font-medium'><span>Name</span><input className={field} autoComplete='name' value={name} maxLength={50} required onChange={e => setName(e.target.value)} /></label>}
        {(step === 1 || !signup) && <label className='block space-y-1 text-sm font-medium'><span>Email</span><input type='email' autoComplete='email' className={field} required value={email} onChange={e => setEmail(e.target.value)} />{suggestion && <button type='button' className='text-xs text-main-accent underline' onClick={() => setEmail(suggestion)}>Did you mean {suggestion}?</button>}</label>}
        {(step === 2 || !signup) && <>
          {signup && <p className='break-words text-sm text-light-secondary dark:text-dark-secondary'>{name} · {email}</p>}
          <label className='block space-y-1 text-sm font-medium'><span>Password</span><div className='relative'><input type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} required minLength={6} className={`${field} pr-12`} value={password} onKeyUp={e => setCaps(e.getModifierState('CapsLock'))} onChange={e => setPassword(e.target.value)} /><Button aria-label={visible ? 'Hide password' : 'Show password'} title={visible ? 'Hide password' : 'Show password'} className='absolute right-2 top-2 p-2' onClick={() => setVisible(!visible)}><HeroIcon className='h-5 w-5' iconName={visible ? 'EyeSlashIcon' : 'EyeIcon'} /></Button></div>
            {caps && <span className='block text-xs text-accent-orange'>Caps Lock is on</span>}
            {signup && password && <span className='block space-y-1'><span className='flex gap-1'>{[0, 1, 2, 3].map(i => <i key={i} className={`h-1 flex-1 rounded-full ${i < score ? (score < 2 ? 'bg-accent-red' : score < 3 ? 'bg-accent-orange' : 'bg-accent-green') : 'bg-light-border dark:bg-dark-border'}`} />)}</span><span className='block text-xs text-light-secondary dark:text-dark-secondary'>{['Too short', 'Weak', 'Okay', 'Good', 'Strong'][score]} password</span></span>}
          </label>
        </>}
        {error && <p role='alert' className='text-sm text-accent-red'>{error}</p>}
        <Button type='submit' loading={busy} className='w-full rounded-full bg-main-accent py-3 font-bold text-main-accent-foreground'>{signup ? step === 1 ? 'Next' : 'Create account' : 'Sign in'}</Button>
        {signup && step === 2 && <Button className='w-full py-2' onClick={() => setStep(1)}>Back</Button>}
      </form>
      <Button className='w-full py-2 font-bold text-main-accent' onClick={changeMode}>{signup ? 'Already have an account? Sign in' : 'Create a new account'}</Button>
      </>}
    </>}
  </div>;
}