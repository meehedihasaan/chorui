-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid not null,
  type text not null check (type in ('like','retweet','reply','follow','mention')),
  tweet_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create unique index notifications_dedup_idx
  on public.notifications (user_id, actor_id, type, coalesce(tweet_id, '00000000-0000-0000-0000-000000000000'::uuid));

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;

create policy "users read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter publication supabase_realtime add table public.notifications;

create or replace function public.handle_reply_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
    join public.profiles p on p.username = m.username
    where p.id <> new.created_by
    on conflict do nothing;
  end if;

  return new;
end $$;

create trigger notify_on_reply
after insert on public.tweets
for each row execute function public.handle_reply_notification();

create or replace function public.handle_like_retweet_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, tweet_id)
  select new.created_by, u, 'like', new.id
  from unnest(new.user_likes) u
  where not (u = any(old.user_likes)) and u <> new.created_by
  on conflict do nothing;

  insert into public.notifications (user_id, actor_id, type, tweet_id)
  select new.created_by, u, 'retweet', new.id
  from unnest(new.user_retweets) u
  where not (u = any(old.user_retweets)) and u <> new.created_by
  on conflict do nothing;

  return new;
end $$;

create trigger notify_on_like_retweet
after update on public.tweets
for each row execute function public.handle_like_retweet_notification();

create or replace function public.handle_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow')
  on conflict do nothing;
  return new;
end $$;

create trigger notify_on_follow
after insert on public.follows
for each row execute function public.handle_follow_notification();

create table public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null,
  user2_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user1_id, user2_id),
  check (user1_id <> user2_id)
);

create table public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id uuid not null,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index dm_messages_conversation_idx on public.dm_messages (conversation_id, created_at);

grant select, insert on public.dm_conversations to authenticated;
grant all on public.dm_conversations to service_role;
grant select, insert, update on public.dm_messages to authenticated;
grant all on public.dm_messages to service_role;

alter table public.dm_conversations enable row level security;
alter table public.dm_messages enable row level security;

create policy "participants read conversations" on public.dm_conversations
  for select to authenticated using (auth.uid() in (user1_id, user2_id));
create policy "participants create conversations" on public.dm_conversations
  for insert to authenticated with check (auth.uid() in (user1_id, user2_id));

create or replace function public.is_conversation_participant(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dm_conversations
    where id = c and (user1_id = auth.uid() or user2_id = auth.uid())
  )
$$;

create policy "participants read messages" on public.dm_messages
  for select to authenticated using (public.is_conversation_participant(conversation_id));
create policy "participants send messages" on public.dm_messages
  for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));
create policy "participants mark messages read" on public.dm_messages
  for update to authenticated using (public.is_conversation_participant(conversation_id));

alter publication supabase_realtime add table public.dm_messages;

create or replace function public.get_conversations()
returns table (
  conversation_id uuid,
  other_id uuid,
  other_name text,
  other_username text,
  other_photo_url text,
  last_text text,
  last_created_at timestamptz,
  unread integer
)
language sql
stable
security definer
set search_path = public
as $$
  with my_convs as (
    select c.id, c.user1_id, c.user2_id, c.created_at
    from public.dm_conversations c
    where c.user1_id = auth.uid() or c.user2_id = auth.uid()
  ),
  last_msg as (
    select distinct on (m.conversation_id)
      m.conversation_id, m.text, m.created_at
    from public.dm_messages m
    order by m.conversation_id, m.created_at desc
  )
  select
    mc.id,
    other.id,
    other.name,
    other.username,
    other.photo_url,
    lm.text,
    lm.created_at,
    (select count(*)::int from public.dm_messages mm
      where mm.conversation_id = mc.id and mm.read = false and mm.sender_id <> auth.uid())
  from my_convs mc
  cross join lateral (
    select case when mc.user1_id = auth.uid() then mc.user2_id else mc.user1_id end as other_id
  ) o
  join public.profiles other on other.id = o.other_id
  left join last_msg lm on lm.conversation_id = mc.id
  order by coalesce(lm.created_at, mc.created_at) desc
$$;

grant execute on function public.get_conversations() to authenticated;
grant execute on function public.is_conversation_participant(uuid) to authenticated;