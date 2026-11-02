CREATE FUNCTION public.username_taken(p_username text) RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(p_username)); $$;

GRANT EXECUTE ON FUNCTION public.username_taken(text) TO anon, authenticated, service_role;

CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

CREATE FUNCTION public.sync_username_references() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NEW.username IS DISTINCT FROM OLD.username THEN UPDATE public.tweets SET parent_username = NEW.username WHERE parent_username = OLD.username; END IF; RETURN NEW; END; $$;

CREATE TRIGGER sync_username_references AFTER UPDATE OF username ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_username_references();