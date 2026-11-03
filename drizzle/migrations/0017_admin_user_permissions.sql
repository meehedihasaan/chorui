DROP FUNCTION IF EXISTS public.admin_list_users(text, integer, integer);
CREATE FUNCTION public.admin_list_users(p_query text DEFAULT '', p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, name text, username text, photo_url text, verified boolean, total_tweets integer, followers integer, created_at timestamptz, is_admin boolean, is_banned boolean, is_moderator boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.admin_guard();
  RETURN QUERY SELECT p.id, p.name, p.username, p.photo_url, p.verified, p.total_tweets,
    coalesce(array_length(p.followers,1),0), p.created_at,
    public.has_role(p.id,'admin'), public.is_banned(p.id), public.has_role(p.id,'moderator')
  FROM profiles p
  WHERE coalesce(p_query,'') = '' OR p.username ILIKE '%'||p_query||'%' OR p.name ILIKE '%'||p_query||'%'
  ORDER BY p.created_at DESC LIMIT least(p_limit,100) OFFSET p_offset;
END $$;
REVOKE ALL ON FUNCTION public.admin_list_users(text,integer,integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_moderator(p_user uuid, p_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.admin_guard();
  IF p_value THEN INSERT INTO user_roles(user_id, role) VALUES (p_user,'moderator') ON CONFLICT DO NOTHING;
  ELSE DELETE FROM user_roles WHERE user_id = p_user AND role = 'moderator'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_moderator(uuid,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_moderator(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_profile(p_user uuid, p_name text, p_username text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.admin_guard();
  IF length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Name must be 1-50 characters'; END IF;
  IF coalesce(p_username,'') !~ '^[A-Za-z0-9_]{3,15}$' THEN RAISE EXCEPTION 'Username must be 3-15 letters, numbers or _'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE lower(username)=lower(p_username) AND id <> p_user) THEN RAISE EXCEPTION 'That username is taken'; END IF;
  UPDATE profiles SET name = trim(p_name), username = p_username, updated_at = now() WHERE id = p_user;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_profile(uuid,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid,text,text) TO authenticated;