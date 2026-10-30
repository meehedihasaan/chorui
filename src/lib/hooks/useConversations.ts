import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ConversationRow = {
  conversation_id: string;
  other_id: string;
  other_name: string;
  other_username: string;
  other_photo_url: string | null;
  last_text: string | null;
  last_created_at: string | null;
  unread: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

export function useConversations(): {
  data: ConversationRow[] | null;
  loading: boolean;
} {
  const query = useQuery({
    queryKey: ['conversations'],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await client.rpc('get_conversations');
      if (error) {
        console.error('get_conversations failed', error.message);
        throw error;
      }
      return (data ?? []) as ConversationRow[];
    }
  });

  return { data: query.data ?? null, loading: query.isPending };
}
