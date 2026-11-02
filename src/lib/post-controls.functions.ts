import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { editPostSchema, reportSchema, replyPermissions } from './post-controls';

export const editPost = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(editPostSchema).handler(async ({ context, data }) => {
    const { data: post, error } = await context.supabase.from('tweets').update({ text: data.text.trim(), updated_at: new Date().toISOString() }).eq('id', data.postId).eq('created_by', context.userId).select('id').single();
    if (error || !post) throw new Error('Could not save this post.');
    return { ok: true };
  });
export const setReplyPermission = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ postId: z.string().uuid(), permission: z.enum(replyPermissions) })).handler(async ({ context, data }) => {
    const { data: post, error } = await context.supabase.from('tweets').update({ reply_permission: data.permission }).eq('id', data.postId).eq('created_by', context.userId).select('id').single();
    if (error || !post) throw new Error('Could not update reply permissions.');
    return { ok: true };
  });
export const setAccountRestriction = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ targetId: z.string().uuid(), kind: z.enum(['mute', 'block']), enabled: z.boolean() })).handler(async ({ context, data }) => {
    if (context.userId === data.targetId) throw new Error('You cannot restrict your own account.');
    const table = data.kind === 'mute' ? 'user_mutes' : 'user_blocks';
    const result = data.enabled
      ? await context.supabase.from(table).upsert({ user_id: context.userId, target_id: data.targetId }, { onConflict: 'user_id,target_id', ignoreDuplicates: true })
      : await context.supabase.from(table).delete().eq('user_id', context.userId).eq('target_id', data.targetId);
    if (result.error) throw new Error('Could not update this account.');
    return { ok: true };
  });
export const submitPostReport = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(reportSchema).handler(async ({ context, data }) => {
    const { error } = await context.supabase.from('post_reports').insert({ reporter_id: context.userId, post_id: data.postId, reason: data.reason, details: data.details });
    if (error?.code === '23505') return { duplicate: true };
    if (error) throw new Error('Could not submit the report.');
    return { duplicate: false };
  });
export const getPublicActivity = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ postId: z.string().uuid() })).handler(async ({ context, data }) => {
    const { data: activity, error } = await context.supabase.rpc('get_public_post_activity', { p_post_id: data.postId });
    if (error) throw new Error('Could not load post activity.');
    return activity as { likes: number; replies: number; reposts: number };
  });