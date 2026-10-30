/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProfile, mapTweet } from '@lib/firebase/db';
import { useAuth } from '@lib/context/auth-context';
import type { User } from '@lib/types/user';
import type { Tweet } from '@lib/types/tweet';

export type NotificationItem = {
  id: string;
  type: 'like' | 'retweet' | 'reply' | 'follow' | 'mention';
  read: boolean;
  createdAt: string;
  actor: User;
  tweet: Tweet | null;
};

/* The generated table types are stricter than the shim's generic client. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

export function useNotifications(tab: 'all' | 'mentions'): {
  data: NotificationItem[] | null;
  loading: boolean;
} {
  const userId = useAuth().user?.id as string | undefined;

  const query = useQuery({
    enabled: !!userId,
    queryKey: ['notifications', userId, tab],
    queryFn: async () => {
      let builder = client
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (tab === 'mentions')
        builder = builder.in('type', ['mention', 'reply']);

      const { data, error } = await builder;
      if (error) throw error;

      const rows = (data ?? []) as Record<string, unknown>[];

      const actorIds = [...new Set(rows.map((r) => r.actor_id as string))];
      const tweetIds = [
        ...new Set(rows.map((r) => r.tweet_id as string).filter(Boolean))
      ] as string[];

      const actors = new Map<string, User>();
      if (actorIds.length) {
        const { data: profileRows } = await client
          .from('profiles')
          .select('*')
          .in('id', actorIds);
        for (const row of (profileRows ?? []) as Record<string, unknown>[])
          actors.set(row.id as string, mapProfile(row) as User);
      }

      const tweets = new Map<string, Tweet>();
      if (tweetIds.length) {
        const { data: tweetRows } = await client
          .from('tweets')
          .select('*')
          .in('id', tweetIds);
        for (const row of (tweetRows ?? []) as Record<string, unknown>[])
          tweets.set(row.id as string, mapTweet(row) as Tweet);
      }

      return rows.map<NotificationItem>((row) => ({
        id: row.id as string,
        type: row.type as NotificationItem['type'],
        read: Boolean(row.read),
        createdAt: (row.created_at as string) ?? new Date().toISOString(),
        actor: actors.get(row.actor_id as string) as User,
        tweet: row.tweet_id ? (tweets.get(row.tweet_id as string) ?? null) : null
      }));
    }
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = client
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { data: query.data ?? null, loading: query.isPending };
}

export function useUnreadNotifications(): number {
  const userId = useAuth().user?.id as string | undefined;

  const query = useQuery({
    enabled: !!userId,
    queryKey: ['notifications-unread', userId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count } = await client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      return count ?? 0;
    }
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = client
      .channel(`notifications-unread-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['notifications-unread', userId]
          });
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query.data ?? 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await client
    .from('notifications')
    .update({ read: true })
    .match({ user_id: userId, read: false });
}
