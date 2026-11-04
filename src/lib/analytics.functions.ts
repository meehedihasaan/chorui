import { supabase } from '@/integrations/supabase/client';
import type { PostAnalytics } from './analytics';

/** Runs in the browser with the signed-in session (RLS/RPC checks ownership), so it works on any host, e.g. Vercel. */
export async function getAnalytics({ data }: { data: { postId?: string } }): Promise<PostAnalytics[]> {
  const { data: result, error } = await supabase.rpc('get_post_analytics', { p_post_id: data.postId ?? undefined });
  if (error) throw new Error('Could not load analytics.');
  return (result as unknown as { posts: PostAnalytics[] }).posts;
}
