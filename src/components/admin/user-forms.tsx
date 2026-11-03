import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminCreateUser } from '@lib/admin-users.functions';

const field = 'w-full rounded-lg border border-light-line-reply bg-transparent px-3 py-2 text-sm outline-none focus:border-main-accent dark:border-dark-line-reply';
const primary = 'rounded-full bg-main-accent px-4 py-1.5 text-sm font-bold text-main-accent-foreground disabled:opacity-50';
const plain = 'rounded-full border border-light-line-reply px-4 py-1.5 text-sm font-bold dark:border-dark-line-reply';

export function AddUserForm(): JSX.Element {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateUser);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', role: 'user' as 'user' | 'moderator' | 'admin' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (!open) return <button className={`${primary} mb-3`} onClick={() => setOpen(true)}>+ Add user</button>;
  return (
    <form
      className='mb-4 grid gap-2 rounded-2xl border border-light-border p-3 dark:border-dark-border'
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        try {
          const r = await create({ data: f });
          toast.success(`Created @${r.username}`);
          setF({ name: '', username: '', email: '', password: '', role: 'user' }); setOpen(false);
          void qc.invalidateQueries({ queryKey: ['admin'] });
        } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not create user'); }
        finally { setBusy(false); }
      }}
    >
      <p className='font-bold'>Add a new user</p>
      <input className={field} placeholder='Name' required maxLength={50} value={f.name} onChange={set('name')} />
      <input className={field} placeholder='Username (3-15 letters, numbers, _)' required pattern='[A-Za-z0-9_]{3,15}' value={f.username} onChange={set('username')} />
      <input className={field} type='email' placeholder='Email' required value={f.email} onChange={set('email')} />
      <input className={field} type='text' placeholder='Password (8+ characters)' required minLength={8} value={f.password} onChange={set('password')} />
      <select className={field} value={f.role} onChange={set('role')}>
        <option value='user'>Regular user</option>
        <option value='moderator'>Moderator</option>
        <option value='admin'>Admin</option>
      </select>
      <div className='flex gap-2'>
        <button type='submit' className={primary} disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button>
        <button type='button' className={plain} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

export function EditUserForm({ user, onDone }: { user: { id: string; name: string; username: string }; onDone: () => void }): JSX.Element {
  const qc = useQueryClient();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className='grid gap-2'
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        const { error } = await supabase.rpc('admin_update_profile', { p_user: user.id, p_name: name, p_username: username });
        setBusy(false);
        if (error) return toast.error(error.message);
        toast.success('Profile updated');
        void qc.invalidateQueries();
        onDone();
      }}
    >
      <input className={field} aria-label='Name' required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
      <input className={field} aria-label='Username' required pattern='[A-Za-z0-9_]{3,15}' value={username} onChange={(e) => setUsername(e.target.value)} />
      <div className='flex gap-2'>
        <button type='submit' className={primary} disabled={busy}>Save</button>
        <button type='button' className={plain} onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}
