import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { PostAnalytics } from './analytics';
export const getAnalytics = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { postId?: string }) => input)
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase.rpc('get_post_analytics', { p_post_id: data.postId ?? undefined });
    if (error) throw new Error('Could not load analytics.');
    return (result as unknown as { posts: PostAnalytics[] }).posts;
  });