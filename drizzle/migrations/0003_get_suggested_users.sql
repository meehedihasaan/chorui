create or replace function public.get_suggested_users(p_seed text, p_limit integer)
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where (auth.uid() is null or id <> auth.uid())
    and not exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid() and f.following_id = profiles.id
    )
  order by md5(id::text || p_seed)
  limit greatest(p_limit, 1);
$$;

grant execute on function public.get_suggested_users(text, integer) to anon, authenticated;