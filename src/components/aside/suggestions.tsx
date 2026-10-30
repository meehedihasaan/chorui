import Link from '@lib/router';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { mapProfile } from '@lib/firebase/db';
import { UserCard } from '@components/user/user-card';
import { Error } from '@components/ui/error';
import { variants } from './aside-trends';
import type { User } from '@lib/types/user';

export function Suggestions(): JSX.Element {
  const { randomSeed, user } = useAuth();

  const { data: suggestionsData, isPending: suggestionsPending } = useQuery({
    queryKey: ['suggestions', user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc('get_suggested_users', {
        p_seed: randomSeed,
        p_limit: 2
      });

      if (error) {
        console.error('suggestions failed', error.message);
        return null;
      }

      return ((rows as Record<string, unknown>[]) ?? [])
        .map((row) => mapProfile(row))
        .filter(Boolean) as User[];
    },
    enabled: !!user,
    staleTime: 60_000
  });

  return (
    <section className='hover-animation rounded-2xl bg-main-sidebar-background'>
      {suggestionsPending ? (
        <Loading className='flex h-52 items-center justify-center p-4' />
      ) : suggestionsData ? (
        <motion.div className='[&>h2]:px-4 [&>h2]:py-3 [&>a:last-child]:px-4 [&>a:last-child]:py-3' {...variants}>
          <h2 className='text-xl font-bold'>Who to follow</h2>
          {suggestionsData.map((userData) => (
            <UserCard {...userData} key={userData.id} />
          ))}
          <Link href='/people'>
            <a
              className='custom-button accent-tab hover-card block w-full rounded-2xl
                         rounded-t-none text-center text-main-accent'
            >
              Show more
            </a>
          </Link>
        </motion.div>
      ) : (
        <Error />
      )}
    </section>
  );
}

import { Loading } from '@components/ui/loading';
