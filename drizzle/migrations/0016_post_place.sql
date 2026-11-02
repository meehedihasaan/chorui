ALTER TABLE public.tweets ADD COLUMN IF NOT EXISTS place jsonb;

CREATE OR REPLACE FUNCTION public.create_tweet(p_text text, p_images jsonb, p_parent_id uuid, p_place jsonb)
 RETURNS tweets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  inserted public.tweets;
  clean_place jsonb := null;
  pname text := left(trim(coalesce(p_place->>'name','')), 120);
  pdesc text := left(trim(coalesce(p_place->>'address','')), 160);
begin
  if pname <> '' then
    clean_place := jsonb_build_object('name', pname, 'address', nullif(pdesc,''));
  end if;
  inserted := public.create_tweet(p_text, p_images, p_parent_id);
  if clean_place is not null then
    update public.tweets set place = clean_place where id = inserted.id returning * into inserted;
  end if;
  return inserted;
end;
$function$;

REVOKE ALL ON FUNCTION public.create_tweet(text, jsonb, uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_tweet(text, jsonb, uuid, jsonb) TO authenticated;