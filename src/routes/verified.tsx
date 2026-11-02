import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { useRouter } from '@lib/router';
import { MainLayout } from '@components/layout/main-layout';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import { AdminReview } from '@components/admin/verification-review';

export const Route = createFileRoute('/verified')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Get verified / Chorui' },
      { name: 'description', content: 'Apply for the blue verified badge on Chorui.' },
      { property: 'og:title', content: 'Get verified / Chorui' },
      { property: 'og:description', content: 'Apply for the blue verified badge on Chorui.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' }
    ]
  }),
  component: VerifiedPage
});

const CATEGORIES = ['Public figure', 'Creator', 'Journalist', 'Business / brand', 'Government', 'Organisation', 'Other'];

type Request = {
  id: string;
  user_id: string;
  full_name: string;
  category: string;
  reason: string;
  link: string;
  id_photo_path: string;
  status: string;
  created_at: string;
};

function VerifiedPage() {
  return (
    <ProtectedLayout>
      <MainLayout>
        <HomeLayout>
          <VerifiedContent />
        </HomeLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}

const inputCls =
  'w-full rounded-md border border-light-line-reply bg-transparent px-3 py-2 outline-none focus:border-main-accent dark:border-dark-line-reply';

function VerifiedContent() {
  const { user } = useAuth();
  const { back } = useRouter();
  const userId = user?.id as string;

  const isAdmin = useQuery({
    queryKey: ['is-admin', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      return !!data;
    }
  });

  const mine = useQuery({
    queryKey: ['my-verification', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      return (data?.[0] as Request | undefined) ?? null;
    }
  });

  return (
    <MainContainer>
      <MainHeader title='Get verified' useActionButton action={back} />
      {mine.isPending ? (
        <Loading />
      ) : user?.verified ? (
        <div className='flex flex-col items-center gap-3 p-8 text-center'>
          <HeroIcon iconName='CheckBadgeIcon' solid className='h-14 w-14 text-accent-blue' />
          <h2 className='text-xl font-bold'>You're verified</h2>
          <p className='text-light-secondary dark:text-dark-secondary'>The blue badge shows next to your name.</p>
        </div>
      ) : mine.data?.status === 'pending' ? (
        <div className='p-8 text-center'>
          <h2 className='text-xl font-bold'>Application under review</h2>
          <p className='mt-2 text-light-secondary dark:text-dark-secondary'>
            Sent {new Date(mine.data.created_at).toLocaleDateString()}. We'll update your badge once it's approved.
          </p>
        </div>
      ) : (
        <ApplyForm rejected={mine.data?.status === 'rejected'} />
      )}
      {isAdmin.data && <AdminReview />}
    </MainContainer>
  );
}

function ApplyForm({ rejected }: { rejected: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [reason, setReason] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const validLink = /^https?:\/\/\S+\.\S+/.test(link.trim());
  const canSubmit = fullName.trim().length >= 2 && reason.trim().length >= 10 && validLink && !!file && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !canSubmit) return;
    if (file.size > 5 * 1024 * 1024) return void toast.error('ID photo must be under 5 MB');
    setBusy(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from('verification-ids').upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return void toast.error('Could not upload ID photo');
    }
    const { error } = await supabase.from('verification_requests').insert({
      user_id: user.id,
      full_name: fullName.trim(),
      category,
      reason: reason.trim(),
      link: link.trim(),
      id_photo_path: path
    });
    setBusy(false);
    if (error) return void toast.error('Could not send application');
    toast.success('Application sent');
    void qc.invalidateQueries({ queryKey: ['my-verification'] });
  };

  return (
    <form onSubmit={submit} className='flex flex-col gap-4 p-5'>
      <div className='flex items-center gap-3'>
        <HeroIcon iconName='CheckBadgeIcon' solid className='h-10 w-10 text-accent-blue' />
        <div>
          <h2 className='text-xl font-bold'>Apply for the blue badge</h2>
          <p className='text-sm text-light-secondary dark:text-dark-secondary'>
            Every application is reviewed by the Chorui team.
          </p>
        </div>
      </div>
      {rejected && (
        <p role='alert' className='rounded-md bg-accent-red/10 p-3 text-sm text-accent-red'>
          Your last application wasn't approved. You can apply again.
        </p>
      )}
      <label className='flex flex-col gap-1 text-sm font-bold'>
        Full legal name
        <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
      </label>
      <label className='flex flex-col gap-1 text-sm font-bold'>
        Category
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className='bg-main-background'>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className='flex flex-col gap-1 text-sm font-bold'>
        Why should you be verified?
        <textarea className={inputCls} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={600} />
      </label>
      <label className='flex flex-col gap-1 text-sm font-bold'>
        Website or social link
        <input className={inputCls} placeholder='https://' value={link} onChange={(e) => setLink(e.target.value)} />
        {link && !validLink && <span className='font-normal text-accent-red'>Enter a full link starting with https://</span>}
      </label>
      <label className='flex flex-col gap-1 text-sm font-bold'>
        Photo of your ID
        <input type='file' accept='image/*' onChange={(e) => setFile(e.target.files?.[0] ?? null)} className='text-sm font-normal' />
        <span className='font-normal text-light-secondary dark:text-dark-secondary'>
          Only reviewers can see this. Max 5 MB.
        </span>
      </label>
      <button
        type='submit'
        disabled={!canSubmit}
        className='rounded-full bg-light-primary py-3 font-bold text-main-background disabled:opacity-50 dark:bg-light-border'
      >
        {busy ? 'Sending…' : 'Submit application'}
      </button>
    </form>
  );
}
