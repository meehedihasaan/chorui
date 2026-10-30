import { useRouter } from '@lib/router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@lib/context/user-context';
import { isPlural } from '@lib/utils';
import { mapStats } from '@lib/firebase/db';
import { UserName } from './user-name';
import type { Variants } from 'framer-motion';

export const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export function UserHeader(): JSX.Element {
  const { pathname } = useRouter();

  const { user, loading } = useUser();

  const userId = user ? user.id : null;

  const page = ['with_replies', 'media', 'likes', 'following', 'followers'].find(
    (segment) => pathname.endsWith(`/${segment}`)
  );

  const { data: statsData, isPending: statsPending } = useQuery({
    queryKey: ['stats', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId as string)
        .maybeSingle();

      return mapStats(data as Record<string, unknown> | null);
    },
    enabled: !!userId,
    staleTime: 10_000
  });

  const statsLoading = !userId ? false : statsPending && !statsData;

  const { tweets, likes } = statsData ?? {};

  const [totalTweets, totalPhotos, totalLikes] = [
    (user?.totalTweets ?? 0) + (tweets?.length ?? 0),
    user?.totalPhotos,
    likes?.length
  ];

  const isInTweetPage = !page || page === 'with_replies';
  const isInFollowPage = page === 'following' || page === 'followers';

  return (
    <AnimatePresence mode='popLayout'>
      {loading || statsLoading ? (
        <motion.div
          className='-mb-1 inner:animate-pulse inner:rounded-lg
                     inner:bg-light-secondary dark:inner:bg-dark-secondary'
          {...variants}
          key='loading'
        >
          <div className='mb-1 -mt-1 h-5 w-24' />
          <div className='h-4 w-12' />
        </motion.div>
      ) : !user ? (
        <motion.h2 className='text-xl font-bold' {...variants} key='not-found'>
          User
        </motion.h2>
      ) : (
        <motion.div className='-mb-1 truncate' {...variants} key='found'>
          <UserName
            tag='h2'
            name={user.name}
            className='-mt-1 text-xl'
            iconClassName='w-6 h-6'
            verified={user.verified}
          />
          <p className='text-xs text-light-secondary dark:text-dark-secondary'>
            {isInFollowPage
              ? `@${user.username}`
              : isInTweetPage
              ? totalTweets
                ? `${totalTweets} ${`Tweet${isPlural(totalTweets)}`}`
                : 'No Tweet'
              : page === 'media'
              ? totalPhotos
                ? `${totalPhotos} Photo${isPlural(totalPhotos)} & GIF${isPlural(
                    totalPhotos
                  )}`
                : 'No Photo & GIF'
              : totalLikes
              ? `${totalLikes} Like${isPlural(totalLikes)}`
              : 'No Like'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
