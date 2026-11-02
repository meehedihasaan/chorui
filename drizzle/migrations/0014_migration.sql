CREATE OR REPLACE FUNCTION public.block_banned_writes()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v uuid;
BEGIN
  IF TG_TABLE_NAME = 'tweets' THEN v := NEW.created_by;
  ELSIF TG_TABLE_NAME = 'dm_messages' THEN v := NEW.sender_id;
  ELSE v := NEW.follower_id; END IF;
  IF public.is_banned(v) THEN RAISE EXCEPTION 'This account is suspended'; END IF;
  RETURN NEW;
END $function$;