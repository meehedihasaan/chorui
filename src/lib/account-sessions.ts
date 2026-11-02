import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
const KEY = 'chorui:tab-accounts';
export type SavedAccount = { id: string; name: string; email: string; access_token: string; refresh_token: string };
export function savedAccounts(): SavedAccount[] {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
export async function rememberAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return savedAccounts();
  return saveAccount(session);
}
function saveAccount(session: Session) {
  const accounts = savedAccounts().filter(a => a.id !== session.user.id);
  accounts.push({ id: session.user.id, name: String(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Account'), email: session.user.email ?? '', access_token: session.access_token, refresh_token: session.refresh_token });
  sessionStorage.setItem(KEY, JSON.stringify(accounts));
  return accounts;
}
export function forgetAccount(id: string) {
  sessionStorage.setItem(KEY, JSON.stringify(savedAccounts().filter(a => a.id !== id)));
}
export async function switchAccount(account: SavedAccount) {
  await rememberAccount();
  const { data, error } = await supabase.auth.setSession({ access_token: account.access_token, refresh_token: account.refresh_token });
  if (error || !data.session) { forgetAccount(account.id); throw new Error('This account needs to sign in again.'); }
  saveAccount(data.session);
}