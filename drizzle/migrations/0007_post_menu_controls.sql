ALTER TABLE public.tweets ADD COLUMN reply_permission text NOT NULL DEFAULT 'everyone' CHECK (reply_permission IN ('everyone','following','mentioned','nobody'));
ALTER TABLE public.tweets ADD COLUMN edited_at timestamptz;
CREATE TABLE public.user_mutes (user_id uuid NOT NULL, target_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,target_id), CHECK(user_id <> target_id));
GRANT SELECT, INSERT, DELETE ON public.user_mutes TO authenticated;
GRANT ALL ON public.user_mutes TO service_role;
ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mutes" ON public.user_mutes FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.user_blocks (user_id uuid NOT NULL, target_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,target_id), CHECK(user_id <> target_id));
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own blocks" ON public.user_blocks FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.post_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id uuid NOT NULL, post_id uuid NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE, reason text NOT NULL CHECK(reason IN ('spam','harassment','hate','violence','misinformation','other')), details text NOT NULL DEFAULT '' CHECK(length(details)<=2000), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(reporter_id,post_id));
GRANT SELECT, INSERT ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports read" ON public.post_reports FOR SELECT TO authenticated USING(reporter_id=auth.uid());
CREATE POLICY "own reports insert" ON public.post_reports FOR INSERT TO authenticated WITH CHECK(reporter_id=auth.uid() AND status='pending' AND EXISTS(SELECT 1 FROM public.tweets t WHERE t.id=post_id AND t.created_by<>auth.uid()));
CREATE FUNCTION public.users_blocked(a uuid,b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_blocks WHERE (user_id=a AND target_id=b) OR (user_id=b AND target_id=a)); $$;
REVOKE ALL ON FUNCTION public.users_blocked(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.users_blocked(uuid,uuid) TO authenticated;
CREATE POLICY "blocked posts hidden" ON public.tweets AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.users_blocked(auth.uid(),created_by));
CREATE POLICY "muted and blocked notifications hidden" ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.users_blocked(auth.uid(),actor_id) AND NOT EXISTS(SELECT 1 FROM public.user_mutes m WHERE m.user_id=auth.uid() AND m.target_id=actor_id));
CREATE FUNCTION public.can_reply_to_post(p_post_id uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.tweets; caller uuid:=auth.uid(); uname text;
BEGIN
IF caller IS NULL THEN RETURN false; END IF;
SELECT * INTO p FROM public.tweets WHERE id=p_post_id;
IF NOT FOUND OR public.users_blocked(caller,p.created_by) THEN RETURN false; END IF;
IF caller=p.created_by THEN RETURN true; END IF;
IF p.reply_permission='everyone' THEN RETURN true; END IF;
IF p.reply_permission='following' THEN RETURN EXISTS(SELECT 1 FROM public.follows WHERE follower_id=p.created_by AND following_id=caller); END IF;
IF p.reply_permission='mentioned' THEN
SELECT username INTO uname FROM public.profiles WHERE id=caller;
RETURN EXISTS(SELECT 1 FROM regexp_matches(coalesce(p.text,''),'@([A-Za-z0-9_]+)','g') AS m WHERE lower(m[1])=lower(uname));
END IF;
RETURN false;
END; $$;
REVOKE ALL ON FUNCTION public.can_reply_to_post(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_reply_to_post(uuid) TO authenticated;
CREATE FUNCTION public.validate_post_controls() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid:=auth.uid(); actor uuid;
BEGIN
IF TG_OP='INSERT' AND NEW.parent_id IS NOT NULL AND NOT public.can_reply_to_post(NEW.parent_id) THEN RAISE EXCEPTION 'Replies are restricted for this post'; END IF;
IF TG_OP='UPDATE' THEN
IF caller IS NOT NULL AND (NEW.text IS DISTINCT FROM OLD.text OR NEW.reply_permission IS DISTINCT FROM OLD.reply_permission) AND caller<>OLD.created_by THEN RAISE EXCEPTION 'Only the author can edit this post'; END IF;
IF NEW.text IS DISTINCT FROM OLD.text THEN
IF length(coalesce(NEW.text,''))>280 OR (length(trim(coalesce(NEW.text,'')))=0 AND coalesce(jsonb_array_length(NEW.images),0)=0) THEN RAISE EXCEPTION 'Post must contain text or a photo, with at most 280 characters'; END IF;
NEW.edited_at:=now();
END IF;
FOR actor IN SELECT unnest(NEW.user_likes) EXCEPT SELECT unnest(OLD.user_likes) LOOP
IF public.users_blocked(actor,NEW.created_by) THEN RAISE EXCEPTION 'This interaction is blocked'; END IF;
END LOOP;
FOR actor IN SELECT unnest(NEW.user_retweets) EXCEPT SELECT unnest(OLD.user_retweets) LOOP
IF public.users_blocked(actor,NEW.created_by) THEN RAISE EXCEPTION 'This interaction is blocked'; END IF;
END LOOP;
END IF;
RETURN NEW;
END; $$;
CREATE TRIGGER validate_post_controls BEFORE INSERT OR UPDATE ON public.tweets FOR EACH ROW EXECUTE FUNCTION public.validate_post_controls();
CREATE FUNCTION public.validate_follow_block() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF public.users_blocked(NEW.follower_id,NEW.following_id) THEN RAISE EXCEPTION 'This account is blocked'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER validate_follow_block BEFORE INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.validate_follow_block();
CREATE FUNCTION public.cleanup_block_follows() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN DELETE FROM public.follows WHERE (follower_id=NEW.user_id AND following_id=NEW.target_id) OR (follower_id=NEW.target_id AND following_id=NEW.user_id); RETURN NEW; END; $$;
CREATE TRIGGER cleanup_block_follows AFTER INSERT ON public.user_blocks FOR EACH ROW EXECUTE FUNCTION public.cleanup_block_follows();
CREATE FUNCTION public.validate_dm_block() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a uuid; b uuid; BEGIN IF TG_TABLE_NAME='dm_conversations' THEN a:=NEW.user1_id; b:=NEW.user2_id; ELSE SELECT user1_id,user2_id INTO a,b FROM public.dm_conversations WHERE id=NEW.conversation_id; END IF; IF public.users_blocked(a,b) THEN RAISE EXCEPTION 'Messages are blocked between these accounts'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER validate_dm_conversation_block BEFORE INSERT ON public.dm_conversations FOR EACH ROW EXECUTE FUNCTION public.validate_dm_block();
CREATE TRIGGER validate_dm_message_block BEFORE INSERT ON public.dm_messages FOR EACH ROW EXECUTE FUNCTION public.validate_dm_block();
CREATE FUNCTION public.get_public_post_activity(p_post_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.tweets; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF; SELECT * INTO p FROM public.tweets WHERE id=p_post_id; IF NOT FOUND OR public.users_blocked(auth.uid(),p.created_by) THEN RAISE EXCEPTION 'Post unavailable'; END IF; RETURN jsonb_build_object('likes',cardinality(p.user_likes),'replies',p.user_replies,'reposts',cardinality(p.user_retweets)); END; $$;
REVOKE ALL ON FUNCTION public.get_public_post_activity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_post_activity(uuid) TO authenticated;