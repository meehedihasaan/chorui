/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read: boolean;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

export function useMessages(conversationId: string | undefined): {
  data: MessageRow[];
  loading: boolean;
} {
  const queryClient = useQueryClient();

  const query = useQuery({
    enabled: !!conversationId,
    queryKey: ['messages', conversationId],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await client
        .from('dm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    }
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = client
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ['messages', conversationId]
          });
          void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return {
    data: query.data ?? [],
    loading: conversationId ? query.isPending : false
  };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  const { error } = await client.from('dm_messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    text
  });

  if (error) throw error;
}

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await client
    .from('dm_messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .eq('read', false)
    .neq('sender_id', userId);
}

export async function createConversation(
  meId: string,
  otherId: string
): Promise<string | null> {
  const [user1_id, user2_id] = [meId, otherId].sort();

  const { data: existing } = await client
    .from('dm_conversations')
    .select('id')
    .eq('user1_id', user1_id)
    .eq('user2_id', user2_id)
    .limit(1);

  if (existing?.length) return existing[0].id as string;

  const { data, error } = await client
    .from('dm_conversations')
    .insert({ user1_id, user2_id })
    .select('id')
    .single();

  if (error) {
    console.error('create conversation failed', error.message);
    return null;
  }

  return (data?.id as string) ?? null;
}
