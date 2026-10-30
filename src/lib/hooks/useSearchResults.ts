import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProfile, mapTweet } from '@lib/firebase/db';
import type { User } from '@lib/types/user';
import type { Tweet } from '@lib/types/tweet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

export type SearchResults = {
  tweets: (Tweet & { user: User })[] | null;
  people: User[] | null;
  loading: boolean;
};

export function useSearchResults(term: string): SearchResults {
  const q = term.trim();

  const query = useQuery({
    enabled: q.length > 0,
    queryKey: ['search', q],
    queryFn: async () => {
      const [tweetsRes, peopleRes] = await Promise.all([
        client
          .from('tweets')
          .select('*')
          .ilike('text', `%${q}%`)
          .order('created_at', { ascending: false })
          .limit(25),
        client
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
          .limit(10)
      ]);

      if (tweetsRes.error) console.error('tweet search failed', tweetsRes.error.message);
      if (peopleRes.error) console.error('people search failed', peopleRes.error.message);

      const tweetRows = (tweetsRes.data ?? []) as Record<string, unknown>[];
      const tweetAuthors = [...new Set(tweetRows.map((r) => r.created_by as string))];

      const users = new Map<string, User>();
      if (tweetAuthors.length) {
        const { data: authorRows } = await client
          .from('profiles')
          .select('*')
          .in('id', tweetAuthors);
        for (const row of (authorRows ?? []) as Record<string, unknown>[])
          users.set(row.id as string, mapProfile(row) as User);
      }

      return {
        tweets: tweetRows
          .map((row) => {
            const tweet = mapTweet(row) as Tweet;
            return { ...tweet, user: users.get(tweet.createdBy) as User };
          })
          .filter((tweet) => !!tweet.user),
        people: ((peopleRes.data ?? []) as Record<string, unknown>[]).map(
          (row) => mapProfile(row) as User
        )
      };
    }
  });

  return {
    tweets: query.data?.tweets ?? null,
    people: query.data?.people ?? null,
    loading: query.isPending
  };
}
