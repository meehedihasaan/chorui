import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import { editPost, setReplyPermission, submitPostReport, getPublicActivity } from '@lib/post-controls.functions';
import { Button } from '@components/ui/button';
import { Modal } from '@components/modal/modal';

export type PostControlMode = 'edit' | 'replies' | 'report' | 'activity';
export function PostControlDialog({ mode, postId, hasImages, close }: { mode: PostControlMode; postId: string; hasImages: boolean; close: () => void }) {
  const queryClient = useQueryClient();
  const saveEdit = useServerFn(editPost);
  const savePermission = useServerFn(setReplyPermission);
  const report = useServerFn(submitPostReport);
  const activity = useServerFn(getPublicActivity);
  const [text, setText] = useState<string | null>(null);
  const [permission, setPermission] = useState<'everyone' | 'following' | 'mentioned' | 'nobody' | null>(null);
  const [reason, setReason] = useState<'spam' | 'harassment' | 'hate' | 'violence' | 'misinformation' | 'other'>('spam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const post = useQuery({ queryKey: ['post-controls', postId], queryFn: async () => {
    const { data, error } = await supabase.from('tweets').select('text,reply_permission').eq('id', postId).single();
    if (error) throw error;
    return data;
  }, enabled: mode === 'edit' || mode === 'replies' });
  const counts = useQuery({ queryKey: ['public-activity', postId], queryFn: () => activity({ data: { postId } }), enabled: mode === 'activity' });
  const field = 'w-full rounded-md border border-light-border bg-main-background p-3 text-light-primary dark:border-dark-border dark:text-dark-primary';
  const titles = { edit: 'Edit Post', replies: 'Change who can reply', report: 'Report post', activity: 'Post activity' };
  return <Modal open closeModal={close} modalClassName='w-full max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto rounded-lg bg-main-background p-5'>
    <form className='space-y-5 text-light-primary dark:text-dark-primary' onSubmit={async e => {
      e.preventDefault(); if (busy) return; setBusy(true); setError('');
      try {
        if (mode === 'edit') await saveEdit({ data: { postId, text: text ?? post.data?.text ?? '', hasImages } });
        if (mode === 'replies') await savePermission({ data: { postId, permission: permission ?? post.data?.reply_permission as 'everyone' ?? 'everyone' } });
        if (mode === 'report') { const result = await report({ data: { postId, reason, details } }); toast.success(result.duplicate ? 'You already reported this post.' : 'Report submitted.'); }
        else toast.success(mode === 'edit' ? 'Post updated.' : 'Reply permissions updated.');
        await queryClient.invalidateQueries(); window.dispatchEvent(new Event('app:data-changed')); close();
      } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
    }}>
      <Dialog.Title className='text-xl font-bold'>{titles[mode]}</Dialog.Title>
      {(mode === 'edit' || mode === 'replies') && post.isPending ? <p>Loading post…</p> : null}
      {post.error && (mode === 'edit' || mode === 'replies') && <p role='alert'>Could not load the post.</p>}
      {mode === 'edit' && post.data && <label className='block space-y-2'><span>Post text</span><textarea aria-label='Post text' className={`${field} min-h-36 resize-y`} maxLength={280} value={text ?? post.data.text ?? ''} onChange={e => setText(e.target.value)} /><span className='block text-right text-sm text-light-secondary dark:text-dark-secondary'>{(text ?? post.data.text ?? '').length}/280</span></label>}
      {mode === 'replies' && post.data && <fieldset className='space-y-3'><legend className='mb-3 text-sm text-light-secondary dark:text-dark-secondary'>The author can always reply.</legend>{([['everyone', 'Everyone'], ['following', 'People you follow'], ['mentioned', 'Only people mentioned'], ['nobody', 'Only you']] as const).map(([value, label]) => <label key={value} className='flex items-center gap-3 py-2'><input type='radio' name='permission' value={value} checked={(permission ?? post.data?.reply_permission) === value} onChange={() => setPermission(value)} />{label}</label>)}</fieldset>}
      {mode === 'report' && <><label className='block space-y-2'><span>Reason</span><select className={field} value={reason} onChange={e => setReason(e.target.value as typeof reason)}><option value='spam'>Spam</option><option value='harassment'>Harassment</option><option value='hate'>Hateful content</option><option value='violence'>Violence or threats</option><option value='misinformation'>Misinformation</option><option value='other'>Other</option></select></label><label className='block space-y-2'><span>Additional details (optional)</span><textarea className={field} maxLength={2000} value={details} onChange={e => setDetails(e.target.value)} /></label></>}
      {mode === 'activity' && (counts.isPending ? <p>Loading activity…</p> : counts.error ? <p role='alert'>Could not load activity.</p> : <><div className='grid grid-cols-3 gap-3'>{Object.entries(counts.data ?? {}).map(([key, value]) => <div key={key}><p className='text-sm capitalize text-light-secondary dark:text-dark-secondary'>{key}</p><p className='text-2xl font-bold'>{value}</p></div>)}</div><p className='text-sm text-light-secondary dark:text-dark-secondary'>Views and private analytics are only available to the author.</p></>)}
      {error && <p role='alert' className='text-sm text-accent-red'>{error}</p>}
      <div className='flex justify-end gap-3'><Button onClick={close} disabled={busy} className='border border-light-border px-4 py-2 dark:border-dark-border'>{mode === 'activity' ? 'Close' : 'Cancel'}</Button>{mode !== 'activity' && <Button type='submit' loading={busy} disabled={(mode === 'edit' || mode === 'replies') && !post.data} className='bg-main-accent px-4 py-2 font-bold text-main-accent-foreground'>{mode === 'report' ? 'Submit report' : 'Save'}</Button>}</div>
    </form>
  </Modal>;
}