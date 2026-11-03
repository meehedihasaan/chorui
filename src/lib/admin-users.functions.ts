import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const input = z.object({
  name: z.string().trim().min(1).max(50),
  username: z.string().regex(/^[A-Za-z0-9_]{3,15}$/, 'Username must be 3-15 letters, numbers or _'),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(['user', 'moderator', 'admin'])
});

/** Admin-only: create a confirmed account with a profile and optional role. */
export const adminCreateUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Forbidden');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: taken } = await supabaseAdmin.from('profiles').select('id').ilike('username', data.username).maybeSingle();
    if (taken) throw new Error('That username is taken');
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true, user_metadata: { full_name: data.name }
    });
    if (error || !created.user) throw new Error(error?.message ?? 'Could not create the account');
    const id = created.user.id;
    const { error: pErr } = await supabaseAdmin.from('profiles').insert({ id, name: data.name, username: data.username });
    if (pErr) { await supabaseAdmin.auth.admin.deleteUser(id); throw new Error(pErr.message); }
    if (data.role !== 'user') await supabaseAdmin.from('user_roles').insert({ user_id: id, role: data.role });
    return { id, username: data.username };
  });
