insert into public.profiles (id, username, name, bio, location, website, verified, created_at, photo_url, cover_photo_url) values
  ('11111111-1111-4111-8111-111111111111', 'ethandavis', 'Ethan Davis', 'Frontend developer. Building for the web.', 'San Francisco, CA', 'https://ethandavis.dev', true, now() - interval '400 days', '/assets/twitter-avatar.jpg', null),
  ('22222222-2222-4222-8222-222222222222', 'sophiawilson', 'Sophia Wilson', 'Designer and coffee enthusiast ☕', 'New York, NY', null, false, now() - interval '380 days', '/assets/twitter-avatar.jpg', null),
  ('33333333-3333-4333-8333-333333333333', 'liamjohnson', 'Liam Johnson', 'Product manager by day, gamer by night.', 'London, UK', null, false, now() - interval '300 days', '/assets/twitter-avatar.jpg', null),
  ('44444444-4444-4444-8444-444444444444', 'oliviabrown', 'Olivia Brown', 'Writing about tech and startups.', 'Austin, TX', null, true, now() - interval '250 days', '/assets/twitter-avatar.jpg', null),
  ('55555555-5555-4555-8555-555555555555', 'noahmiller', 'Noah Miller', 'Runner. Reader. React enjoyer.', 'Chicago, IL', null, false, now() - interval '180 days', '/assets/twitter-avatar.jpg', null);

insert into public.tweets (id, text, created_by, created_at, user_likes, user_retweets, user_replies) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Just shipped a big refactor and the app feels 10x faster. Sometimes the boring work is the best work.', '11111111-1111-4111-8111-111111111111', now() - interval '3 days', '{}', '{}', 2),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Hot take: dark mode is not a feature, it is a lifestyle.', '22222222-2222-4222-8222-222222222222', now() - interval '2 days', '{}', '{}', 0),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'The best products are built by small teams who argue a lot and ship fast.', '33333333-3333-4333-8333-333333333333', now() - interval '36 hours', '{}', '{}', 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Reminder: touch grass today. Even the best code can wait an hour.', '44444444-4444-4444-8444-444444444444', now() - interval '30 hours', '{}', '{}', 0),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'Reading “Designing Data-Intensive Applications” again. It gets better every time.', '55555555-5555-4555-8555-555555555555', now() - interval '25 hours', '{}', '{}', 0),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'Does anyone else keep a “someday” list of side project ideas? Mine is 47 items long and growing.', '22222222-2222-4222-8222-222222222222', now() - interval '20 hours', '{}', '{}', 0),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'Vite cold builds are unreal compared to what we had a few years ago.', '11111111-1111-4111-8111-111111111111', now() - interval '9 hours', '{}', '{}', 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'Migrated a whole app to a new stack this week. Turns out most of the work is deleting code.', '44444444-4444-4444-8444-444444444444', now() - interval '5 hours', '{}', '{}', 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', 'Weekend plan: no laptop, long run, and the new season of that show everyone is talking about.', '55555555-5555-4555-8555-555555555555', now() - interval '2 hours', '{}', '{}', 0),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000010', 'If your team is afraid of refactoring, that is a process problem, not a code problem.', '33333333-3333-4333-8333-333333333333', now() - interval '90 minutes', '{}', '{}', 1),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000011', 'Agreed. Boring refactor plus good tests is the cheat code.', '22222222-2222-4222-8222-222222222222', now() - interval '2 days' + interval '1 hour', array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid], '{}', 0),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000012', '47 items? Amateur numbers. Mine is in the hundreds.', '11111111-1111-4111-8111-111111111111', now() - interval '19 hours', array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid], '{}', 0),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000013', 'This is why I switched to vite for everything. Build times dropped off a cliff.', '55555555-5555-4555-8555-555555555555', now() - interval '8 hours', array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7'::uuid], '{}', 0),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000014', 'Deleting code is the most underrated feature of any migration.', '11111111-1111-4111-8111-111111111111', now() - interval '4 hours', array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'::uuid], '{}', 0),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000015', 'True, and the same applies to legacy systems.', '22222222-2222-4222-8222-222222222222', now() - interval '80 minutes', array['aaaaaaaa-aaaa-4aaa-8aaa-000000000010'::uuid], '{}', 0);

update public.tweets
   set parent_id = case
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000011'::uuid then 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000012'::uuid then 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'::uuid
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000013'::uuid then 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7'::uuid
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000014'::uuid then 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'::uuid
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000015'::uuid then 'aaaaaaaa-aaaa-4aaa-8aaa-000000000010'::uuid
     else parent_id end,
   parent_username = case
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000011'::uuid then 'ethandavis'
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000012'::uuid then 'sophiawilson'
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000013'::uuid then 'ethandavis'
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000014'::uuid then 'oliviabrown'
     when id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000015'::uuid then 'liamjohnson'
     else parent_username end
 where id in (
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000011'::uuid,
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000012'::uuid,
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000013'::uuid,
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000014'::uuid,
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000015'::uuid
 );

update public.profiles p
   set total_tweets = (select count(*) from public.tweets t where t.created_by = p.id);

insert into public.user_stats (user_id, tweets, likes)
select p.id, coalesce(array(select t.id from public.tweets t where t.created_by = p.id), '{}'::uuid[]), '{}'::uuid[]
from public.profiles p;

insert into public.follows (follower_id, following_id)
select a.id, b.id
from public.profiles a
cross join public.profiles b
where a.id <> b.id
  and ((a.username = 'ethandavis' and b.username in ('sophiawilson','liamjohnson','oliviabrown'))
    or (a.username = 'sophiawilson' and b.username in ('ethandavis','oliviabrown'))
    or (a.username = 'liamjohnson' and b.username in ('ethandavis','noahmiller'))
    or (a.username = 'oliviabrown' and b.username in ('ethandavis','sophiawilson','liamjohnson','noahmiller'))
    or (a.username = 'noahmiller' and b.username in ('ethandavis','oliviabrown')));

update public.profiles p
   set following = array(select f.following_id from public.follows f where f.follower_id = p.id),
       followers = array(select f.follower_id from public.follows f where f.following_id = p.id);