import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@lib/context/auth-context';

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => !!(await supabase.rpc('has_role', { _user_id: user!.id, _role: 'admin' })).data
  });
  return !!data;
}
