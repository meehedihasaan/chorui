create table public.profiles (
  id uuid primary key,
  username text not null unique,
  name text not null default '',
  bio text,
  website text,
  location text,
  theme text,
  accent text,
  photo_url text not null default '/assets/twitter-avatar.jpg',
  verified boolean not null default false,
  following uuid[] not null default '{}',
  followers uuid[] not null default '{}',
  total_tweets integer not null default 0,
  total_photos integer not null default 0,
  pinned_tweet uuid,
  cover_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.tweets (
  id uuid primary key default gen_random_uuid(),
  text text,
  images jsonb,
  parent_id uuid references public.tweets(id) on delete set null,
  parent_username text,
  user_likes uuid[] not null default '{}',
  user_retweets uuid[] not null default '{}',
  user_replies integer not null default 0,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index tweets_created_at_idx on public.tweets (created_at desc);
create index tweets_parent_idx on public.tweets (parent_id);
create index tweets_created_by_idx on public.tweets (created_by);

create table public.user_stats (
  user_id uuid primary key,
  likes uuid[] not null default '{}',
  tweets uuid[] not null default '{}',
  updated_at timestamptz
);

create table public.bookmarks (
  user_id uuid not null,
  tweet_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tweet_id)
);
create index bookmarks_tweet_idx on public.bookmarks (tweet_id);
create index bookmarks_created_idx on public.bookmarks (user_id, created_at desc);

create table public.follows (
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- Grants
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.tweets to anon, authenticated;
grant insert, update, delete on public.tweets to authenticated;
grant all on public.tweets to service_role;
grant select on public.user_stats to anon, authenticated;
grant insert, update on public.user_stats to authenticated;
grant all on public.user_stats to service_role;
grant select on public.bookmarks to authenticated;
grant insert, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;

alter table public.profiles enable row level security;
alter table public.tweets enable row level security;
alter table public.user_stats enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;

create policy "profiles are readable by everyone" on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "tweets are readable by everyone" on public.tweets for select using (true);
create policy "users insert own tweets" on public.tweets for insert to authenticated with check (created_by = auth.uid());
create policy "users update own tweets" on public.tweets for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "users delete own tweets" on public.tweets for delete to authenticated using (created_by = auth.uid());

create policy "stats readable by everyone" on public.user_stats for select using (true);
create policy "users manage own stats" on public.user_stats for insert to authenticated with check (user_id = auth.uid());
create policy "users update own stats" on public.user_stats for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users read own bookmarks" on public.bookmarks for select to authenticated using (user_id = auth.uid());
create policy "users manage own bookmarks" on public.bookmarks for insert to authenticated with check (user_id = auth.uid());
create policy "users delete own bookmarks" on public.bookmarks for delete to authenticated using (user_id = auth.uid());

create policy "follows readable by everyone" on public.follows for select using (true);
create policy "users follow as self" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "users unfollow as self" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- Keep denormalized following/followers arrays in sync
create or replace function public.sync_follow_arrays()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following = array_append(following, new.following_id), updated_at = now() where id = new.follower_id;
    update public.profiles set followers = array_append(followers, new.follower_id), updated_at = now() where id = new.following_id;
  else
    update public.profiles set following = array_remove(following, old.following_id), updated_at = now() where id = old.follower_id;
    update public.profiles set followers = array_remove(followers, old.follower_id), updated_at = now() where id = old.following_id;
  end if;
  return null;
end;
$$;

create trigger follows_sync
after insert or delete on public.follows
for each row execute function public.sync_follow_arrays();

-- Cleanup on tweet delete (replaces the source's normalize-stats cloud function)
create or replace function public.cleanup_deleted_tweet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  removed public.tweets;
begin
  removed := old;
  delete from public.bookmarks where tweet_id = removed.id;
  update public.user_stats
     set likes = array_remove(likes, removed.id),
         tweets = array_remove(tweets, removed.id),
         updated_at = now()
   where removed.id = any(likes) or removed.id = any(tweets);
  update public.profiles
     set total_tweets = greatest(total_tweets - 1, 0),
         total_photos = greatest(total_photos - coalesce(jsonb_array_length(removed.images), 0), 0),
         pinned_tweet = case when pinned_tweet = removed.id then null else pinned_tweet end,
         updated_at = now()
   where id = removed.created_by;
  return null;
end;
$$;

create trigger tweets_cleanup
after delete on public.tweets
for each row execute function public.cleanup_deleted_tweet();

-- Tweet mutations as security definer RPCs (likes/retweets/replies touch rows owned by others)
create or replace function public.create_tweet(p_text text, p_images jsonb, p_parent_id uuid)
returns public.tweets
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  parent record;
  inserted public.tweets;
  image_count integer := coalesce(jsonb_array_length(p_images), 0);
begin
  if caller is null then raise exception 'not authenticated'; end if;
  if p_parent_id is not null then
    select id, created_by into parent from public.tweets where id = p_parent_id;
    if parent.id is null then raise exception 'parent tweet not found'; end if;
    update public.tweets set user_replies = user_replies + 1 where id = parent.id;
  end if;
  insert into public.tweets (text, images, parent_id, parent_username, created_by)
  values (
    p_text,
    p_images,
    p_parent_id,
    case when p_parent_id is null then null else (select username from public.profiles where id = (select created_by from public.tweets where id = p_parent_id)) end,
    caller
  )
  returning * into inserted;
  update public.profiles
     set total_tweets = total_tweets + 1,
         total_photos = total_photos + image_count,
         updated_at = now()
   where id = caller;
  insert into public.user_stats (user_id, tweets, updated_at)
  values (caller, array[inserted.id], now())
  on conflict (user_id) do update
    set tweets = array_append(user_stats.tweets, inserted.id), updated_at = now();
  return inserted;
end;
$$;

create or replace function public.manage_like(p_tweet_id uuid, p_like boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'not authenticated'; end if;
  update public.tweets
     set user_likes = case when p_like then array_append(user_likes, caller) else array_remove(user_likes, caller) end,
         updated_at = now()
   where id = p_tweet_id;
  insert into public.user_stats (user_id, likes, updated_at)
  values (caller, case when p_like then array[p_tweet_id] else '{}'::uuid[] end, now())
  on conflict (user_id) do update
    set likes = case when p_like then array_append(user_stats.likes, p_tweet_id) else array_remove(user_stats.likes, p_tweet_id) end,
        updated_at = now();
end;
$$;

create or replace function public.manage_retweet(p_tweet_id uuid, p_retweet boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'not authenticated'; end if;
  update public.tweets
     set user_retweets = case when p_retweet then array_append(user_retweets, caller) else array_remove(user_retweets, caller) end,
         updated_at = now()
   where id = p_tweet_id;
  insert into public.user_stats (user_id, tweets, updated_at)
  values (caller, case when p_retweet then array[p_tweet_id] else '{}'::uuid[] end, now())
  on conflict (user_id) do update
    set tweets = case when p_retweet then array_append(user_stats.tweets, p_tweet_id) else array_remove(user_stats.tweets, p_tweet_id) end,
        updated_at = now();
end;
$$;

create or replace function public.manage_reply(p_tweet_id uuid, p_increment boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tweets
     set user_replies = greatest(user_replies + case when p_increment then 1 else -1 end, 0),
         updated_at = now()
   where id = p_tweet_id;
end;
$$;

grant execute on function public.create_tweet(text, jsonb, uuid) to authenticated;
grant execute on function public.manage_like(uuid, boolean) to authenticated;
grant execute on function public.manage_retweet(uuid, boolean) to authenticated;
grant execute on function public.manage_reply(uuid, boolean) to authenticated;
grant execute on function public.sync_follow_arrays() to authenticated;
