import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import { setAccountRestriction } from '@lib/post-controls.functions';
import { Button } from '@components/ui/button';

export function RestrictedAccounts() {
  const queryClient = useQueryClient();
  const change = useServerFn(setAccountRestriction);
  const query = useQuery({ queryKey: ['restricted-accounts'], queryFn: async () => {
    const [mutes, blocks] = await Promise.all([supabase.from('user_mutes').select('target_id'), supabase.from('user_blocks').select('target_id')]);
    if (mutes.error || blocks.error) throw new Error('Could not load accounts.');
    const rows = [...(mutes.data ?? []).map(r => ({ id: r.target_id, kind: 'mute' as const })), ...(blocks.data ?? []).map(r => ({ id: r.target_id, kind: 'block' as const }))];
    if (!rows.length) return [];
    const { data } = await supabase.from('profiles').select('id,username,name').in('id', rows.map(r => r.id));
    return rows.map(r => ({ ...r, username: data?.find(p => p.id === r.id)?.username ?? 'account' }));
  } });
  return <section className='px-4 py-5'><h2 className='mb-4 text-xl font-bold'>Muted and blocked accounts</h2>
    {query.isPending ? <p>Loading accounts…</p> : query.error ? <p role='alert'>Could not load accounts.</p> : !query.data?.length ? <p className='text-sm text-light-secondary dark:text-dark-secondary'>No muted or blocked accounts.</p> : query.data.map(row => <div key={`${row.kind}-${row.id}`} className='flex items-center justify-between gap-3 border-b border-light-border py-3 dark:border-dark-border'><span className='min-w-0 truncate'>@{row.username}</span><Button className='shrink-0 border border-light-border px-3 py-2 font-bold dark:border-dark-border' onClick={async () => { try { await change({ data: { targetId: row.id, kind: row.kind, enabled: false } }); await queryClient.invalidateQueries(); toast.success(row.kind === 'block' ? 'Account unblocked.' : 'Account unmuted.'); } catch { toast.error('Could not update account.'); } }}>{row.kind === 'block' ? 'Unblock' : 'Unmute'}</Button></div>)}
  </section>;
}