CREATE TABLE public.post_views (
  post_id uuid NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, viewer_id)
);
GRANT SELECT, INSERT ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewers record their own views" ON public.post_views FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tweets WHERE id = post_id AND created_by <> auth.uid()));
CREATE POLICY "Authors read post views" ON public.post_views FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.tweets WHERE id = post_id AND created_by = auth.uid()));
CREATE INDEX post_views_viewed_at_idx ON public.post_views(viewed_at);
CREATE OR REPLACE FUNCTION public.get_post_analytics(p_post_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_post_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.tweets WHERE id = p_post_id AND created_by = auth.uid()) THEN RAISE EXCEPTION 'Only the author can view analytics'; END IF;
  SELECT jsonb_build_object('posts', COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'text', t.text, 'createdAt', t.created_at,
    'likes', cardinality(t.user_likes), 'reposts', cardinality(t.user_retweets), 'replies', t.user_replies,
    'views', (SELECT count(*) FROM public.post_views v WHERE v.post_id = t.id),
    'bookmarks', (SELECT count(*) FROM public.bookmarks b WHERE b.tweet_id = t.id)
  ) ORDER BY t.created_at DESC), '[]'::jsonb)) INTO result
  FROM public.tweets t WHERE t.created_by = auth.uid() AND (p_post_id IS NULL OR t.id = p_post_id);
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_post_analytics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_post_analytics(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.record_post_view(p_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  INSERT INTO public.post_views(post_id, viewer_id)
  SELECT id, auth.uid() FROM public.tweets WHERE id = p_post_id AND created_by <> auth.uid()
  ON CONFLICT (post_id, viewer_id) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.record_post_view(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_post_view(uuid) TO authenticated;