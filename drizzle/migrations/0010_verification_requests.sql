DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','moderator','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  category text NOT NULL,
  reason text NOT NULL DEFAULT '',
  link text NOT NULL,
  id_photo_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
GRANT SELECT, INSERT ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own requests read" ON public.verification_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own requests insert" ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending'
    AND NOT EXISTS (SELECT 1 FROM public.verification_requests r WHERE r.user_id = auth.uid() AND r.status = 'pending'));
CREATE INDEX verification_requests_user_idx ON public.verification_requests(user_id);

-- users cannot grant themselves the badge
CREATE OR REPLACE FUNCTION public.protect_verified_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified
     AND coalesce(current_setting('app.verify_review', true), '') <> 'on'
     AND current_user NOT IN ('postgres','service_role','supabase_admin') THEN
    NEW.verified := OLD.verified;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_verified_flag BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_verified_flag();

CREATE OR REPLACE FUNCTION public.review_verification(p_request_id uuid, p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.verification_requests
    SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END, reviewed_at = now()
    WHERE id = p_request_id AND status = 'pending' RETURNING user_id INTO v_user;
  IF v_user IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF p_approve THEN
    PERFORM set_config('app.verify_review', 'on', true);
    UPDATE public.profiles SET verified = true WHERE id = v_user;
    PERFORM set_config('app.verify_review', '', true);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_verification(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.review_verification(uuid, boolean) TO authenticated;

-- ID photo storage (bucket created separately): owner uploads into own folder; owner & admins read
CREATE POLICY "verification ids upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-ids' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "verification ids read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-ids' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));