/**
 * Compatibility module: the source app imported its Firebase clients from
 * here. The Lovable Cloud browser client replaces them.
 */
export { supabase } from '@/integrations/supabase/client';
export const storage = { from: (bucket: string) => supabase.storage.from(bucket) };
