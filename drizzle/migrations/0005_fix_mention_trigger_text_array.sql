CREATE OR REPLACE FUNCTION public.handle_reply_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  parent_author uuid;
begin
  if new.parent_id is not null then
    select created_by into parent_author from public.tweets where id = new.parent_id;
    if parent_author is not null and parent_author <> new.created_by then
      insert into public.notifications (user_id, actor_id, type, tweet_id)
      values (parent_author, new.created_by, 'reply', new.id)
      on conflict do nothing;
    end if;
  end if;

  if new.text is not null then
    insert into public.notifications (user_id, actor_id, type, tweet_id)
    select p.id, new.created_by, 'mention', new.id
    from regexp_matches(new.text, '@([A-Za-z0-9_]+)', 'g') as m(username)
    join public.profiles p on p.username = (m.username)[1]
    where p.id <> new.created_by
    on conflict do nothing;
  end if;

  return new;
end;
$function$;