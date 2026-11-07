import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loading } from '@components/ui/loading';

type Request = { id: string; user_id: string; full_name: string; category: string; reason: string; link: string; id_photo_path: string; status: string; created_at: string };

export function AdminReview() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['verification-review'],
    queryFn: async () => {
      const { data } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      const rows = (data ?? []) as Request[];
      return Promise.all(
        rows.map(async (r) => {
          const { data: signed } = await supabase.storage.from('verification-ids').createSignedUrl(r.id_photo_path, 600);
          const { data: p } = await supabase.from('profiles').select('username').eq('id', r.user_id).maybeSingle();
          return { ...r, photo: signed?.signedUrl ?? null, username: p?.username ?? '' };
        })
      );
    }
  });

  const review = async (id: string, approve: boolean) => {
    const { error } = await supabase.rpc('review_verification', { p_request_id: id, p_approve: approve });
    if (error) return void toast.error('Could not update application');
    toast.success(approve ? 'Badge approved' : 'Application rejected');
    void qc.invalidateQueries();
  };

  return (
    <section className='border-t-8 border-light-border dark:border-dark-border'>
      <h2 className='p-5 pb-2 text-xl font-bold'>Pending applications</h2>
      {list.isPending ? (
        <Loading />
      ) : !list.data?.length ? (
        <p className='p-5 text-light-secondary dark:text-dark-secondary'>Nothing to review.</p>
      ) : (
        <div className='divide-y divide-light-border dark:divide-dark-border'>
          {list.data.map((r) => (
            <div key={r.id} className='flex flex-col gap-2 p-5'>
              <p className='font-bold'>
                {r.full_name} <span className='font-normal text-light-secondary dark:text-dark-secondary'>@{r.username}</span>
              </p>
              <p className='text-sm'>{r.category}</p>
              <p className='whitespace-pre-line text-sm'>{r.reason}</p>
              <a href={r.link} target='_blank' rel='noreferrer noopener' className='break-all text-sm text-accent-blue hover:underline'>
                {r.link}
              </a>
              {r.photo && (
                <a href={r.photo} target='_blank' rel='noreferrer noopener'>
                  <img src={r.photo} alt={`ID for ${r.full_name}`} className='max-h-56 rounded-lg object-contain' />
                </a>
              )}
              <div className='flex gap-2'>
                <button onClick={() => review(r.id, true)} className='btn-solid px-4 py-1.5'>
                  Approve
                </button>
                <button onClick={() => review(r.id, false)} className='btn-mint px-4 py-1.5'>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
