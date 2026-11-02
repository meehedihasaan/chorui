CREATE TABLE public.user_bans (
  user_id uuid PRIMARY KEY,
  reason text NOT NULL DEFAULT '',
  banned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_bans TO authenticated;
GRANT ALL ON public.user_bans TO service_role;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bans visible to self and admins" ON public.user_bans FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_bans WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.block_banned_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  v := CASE TG_TABLE_NAME WHEN 'tweets' THEN NEW.created_by WHEN 'dm_messages' THEN NEW.sender_id ELSE NEW.follower_id END;
  IF public.is_banned(v) THEN RAISE EXCEPTION 'This account is suspended'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER block_banned_tweets BEFORE INSERT ON public.tweets FOR EACH ROW EXECUTE FUNCTION public.block_banned_writes();
CREATE TRIGGER block_banned_dms BEFORE INSERT ON public.dm_messages FOR EACH ROW EXECUTE FUNCTION public.block_banned_writes();
CREATE TRIGGER block_banned_follows BEFORE INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.block_banned_writes();

CREATE POLICY "admins read reports" ON public.post_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_guard() RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.admin_stats() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  RETURN jsonb_build_object(
    'users', (SELECT count(*) FROM profiles),
    'users_7d', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '7 days'),
    'posts', (SELECT count(*) FROM tweets WHERE parent_id IS NULL),
    'replies', (SELECT count(*) FROM tweets WHERE parent_id IS NOT NULL),
    'posts_24h', (SELECT count(*) FROM tweets WHERE created_at > now() - interval '1 day'),
    'messages', (SELECT count(*) FROM dm_messages),
    'verified', (SELECT count(*) FROM profiles WHERE verified),
    'banned', (SELECT count(*) FROM user_bans),
    'open_reports', (SELECT count(*) FROM post_reports WHERE status = 'pending'),
    'pending_verifications', (SELECT count(*) FROM verification_requests WHERE status = 'pending')
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_users(p_query text DEFAULT '', p_limit int DEFAULT 50, p_offset int DEFAULT 0)
RETURNS TABLE(id uuid, name text, username text, photo_url text, verified boolean, total_tweets int, followers int, created_at timestamptz, is_admin boolean, is_banned boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  RETURN QUERY SELECT p.id, p.name, p.username, p.photo_url, p.verified, p.total_tweets,
    coalesce(array_length(p.followers,1),0), p.created_at,
    public.has_role(p.id,'admin'), public.is_banned(p.id)
  FROM profiles p
  WHERE coalesce(p_query,'') = '' OR p.username ILIKE '%'||p_query||'%' OR p.name ILIKE '%'||p_query||'%'
  ORDER BY p.created_at DESC LIMIT least(p_limit,100) OFFSET p_offset;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_verified(p_user uuid, p_value boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  PERFORM set_config('app.verify_review','on',true);
  UPDATE profiles SET verified = p_value WHERE id = p_user;
  PERFORM set_config('app.verify_review','',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_admin(p_user uuid, p_value boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  IF p_user = auth.uid() AND NOT p_value THEN RAISE EXCEPTION 'You cannot remove your own admin access'; END IF;
  IF p_value THEN INSERT INTO user_roles(user_id, role) VALUES (p_user,'admin') ON CONFLICT DO NOTHING;
  ELSE DELETE FROM user_roles WHERE user_id = p_user AND role = 'admin'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_ban(p_user uuid, p_value boolean, p_reason text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'You cannot suspend yourself'; END IF;
  IF p_value THEN INSERT INTO user_bans(user_id, reason, banned_by) VALUES (p_user, coalesce(p_reason,''), auth.uid())
    ON CONFLICT (user_id) DO UPDATE SET reason = excluded.reason;
  ELSE DELETE FROM user_bans WHERE user_id = p_user; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_post(p_post uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  UPDATE post_reports SET status = 'actioned' WHERE post_id = p_post AND status = 'pending';
  DELETE FROM post_reports WHERE post_id = p_post;
  DELETE FROM tweets WHERE id = p_post;
END $$;

CREATE OR REPLACE FUNCTION public.admin_resolve_report(p_report uuid, p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  IF p_status NOT IN ('dismissed','actioned') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE post_reports SET status = p_status WHERE id = p_report;
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['admin_guard()','admin_stats()','admin_list_users(text,int,int)','admin_set_verified(uuid,boolean)','admin_set_admin(uuid,boolean)','admin_set_ban(uuid,boolean,text)','admin_delete_post(uuid)','admin_resolve_report(uuid,text)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM public, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;