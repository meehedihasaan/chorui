import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@components/ui/button';

export function PhoneForm({ field, onSignedIn, onCancel }: { field: string; onSignedIn?: () => void; onCancel: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const normalized = phone.replace(/[^\d+]/g, '');

  return <form className='space-y-4' onSubmit={async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (!sent) {
        if (!/^\+\d{8,15}$/.test(normalized)) throw new Error('Enter your number with country code, e.g. +8801712345678');
        const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.verifyOtp({ phone: normalized, token: code.trim(), type: 'sms' });
        if (error) throw error;
        onSignedIn?.();
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  }}>
    {!sent ? <label className='block space-y-1 text-sm font-medium'><span>Phone number</span>
      <input type='tel' autoComplete='tel' placeholder='+8801712345678' className={field} required value={phone} onChange={e => setPhone(e.target.value)} /></label>
      : <label className='block space-y-1 text-sm font-medium'><span>Code sent to {normalized}</span>
      <input inputMode='numeric' autoComplete='one-time-code' maxLength={6} className={field} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></label>}
    {error && <p role='alert' className='text-sm text-accent-red'>{error}</p>}
    <Button type='submit' loading={busy} className='w-full rounded-full bg-main-accent py-3 font-bold text-main-accent-foreground'>{sent ? 'Verify and sign in' : 'Send code'}</Button>
    <Button className='w-full py-2' onClick={() => { if (sent) { setSent(false); setCode(''); } else onCancel(); }}>{sent ? 'Change number' : 'Use email instead'}</Button>
  </form>;
}
