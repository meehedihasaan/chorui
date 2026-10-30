import { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { usersCollection } from '@lib/firebase/collections';
import {
  checkUsernameAvailability,
  onProfileUpdated
} from '@lib/firebase/utils';
import { getRandomInt, getRandomId } from '@lib/random';
import { mapProfile } from '@lib/firebase/db';
import type { ReactNode } from 'react';
import type { User } from '@lib/types/user';
import type { Bookmark } from '@lib/types/bookmark';
import type { RawRowAlias } from '@lib/hooks/db-types';

type AuthContext = {
  user: User | null;
  error: Error | null;
  loading: boolean;
  isAdmin: boolean;
  randomSeed: string;
  userBookmarks: Bookmark[] | null;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithLovable: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContext | null>(null);

type AuthContextProviderProps = {
  children: ReactNode;
};

async function generateAvailableUsername(baseName: string): Promise<string> {
  const normalizeName = baseName.replace(/\s/g, '').toLowerCase() || 'user';
  const randomInt = getRandomInt(1, 10_000);
  const randomUsername = `${normalizeName.slice(0, 20)}${randomInt}`;
  const isUsernameAvailable = await checkUsernameAvailability(randomUsername);
  return isUsernameAvailable ? randomUsername : generateAvailableUsername(baseName);
}

async function ensureProfile(
  uid: string,
  fallbackName: string,
  photoURL: string | null
): Promise<User | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (data) return mapProfile(data as RawRowAlias);

  const username = await generateAvailableUsername(fallbackName || 'user');
  const displayName = fallbackName || username;

  const { error } = await supabase.from('profiles').insert({
    id: uid,
    name: displayName,
    username,
    photo_url: photoURL ?? '/assets/twitter-avatar.jpg'
  });

  if (error) {
    console.error('profile creation failed', error.message);
    return null;
  }

  const { data: created } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  return mapProfile(created as RawRowAlias);
}

export function AuthContextProvider({
  children
}: AuthContextProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [userBookmarks, setUserBookmarks] = useState<Bookmark[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const manageUser = async (uid: string, fallbackName: string, photoURL: string | null): Promise<void> => {
    const profile = await ensureProfile(uid, fallbackName, photoURL);

    if (profile) setUser(profile);

    setLoading(false);
  };

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void manageUser(
          session.user.id,
          (session.user.user_metadata?.name as string) ??
            (session.user.email?.split('@')[0] as string) ??
            'user',
          (session.user.user_metadata?.avatar_url as string) ?? null
        );
      } else setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserBookmarks(null);
        setLoading(false);
      } else if (
        (event === 'SIGNED_IN' || event === 'USER_UPDATED') &&
        session?.user
      ) {
        setLoading(true);
        void manageUser(
          session.user.id,
          (session.user.user_metadata?.name as string) ??
            (session.user.email?.split('@')[0] as string) ??
            'user',
          (session.user.user_metadata?.avatar_url as string) ?? null
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const { id } = user;

    const fetchBookmarks = async (): Promise<void> => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', id);

      setUserBookmarks(
        ((data as RawRowAlias[]) ?? []).map((row) => ({
          id: row.tweet_id as string,
          createdAt: (row.created_at as string) ?? ''
        }))
      );
    };

    void fetchBookmarks();

    return onProfileUpdated(() => {
      void supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          const profile = mapProfile(data as RawRowAlias);
          if (profile) setUser(profile);
        });
    });
  }, [user?.id]);

  const signInWithOAuth = async (
    provider: 'google' | 'lovable'
  ): Promise<void> => {
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin
      });

      if (result.error) setError(new Error(result.error.message ?? 'Sign in failed'));

      if (result.redirected) return;
    } catch (oauthError) {
      setError(oauthError as Error);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    await signInWithOAuth('google');
  };

  const signInWithLovable = async (): Promise<void> => {
    await signInWithOAuth('lovable');
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) setError(signInError);
    } catch (signInError) {
      setError(signInError as Error);
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });

      if (signUpError) setError(signUpError);
      else setError(new Error('Check your email to confirm your account.'));
    } catch (signUpError) {
      setError(signUpError as Error);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      setError(signOutError as Error);
    }
  };

  const isAdmin = user ? user.username === 'ccrsxx' : false;
  const randomSeed = useMemo(getRandomId, [user?.id]);

  const value: AuthContext = {
    user,
    error,
    loading,
    isAdmin,
    randomSeed,
    userBookmarks,
    signOut,
    signInWithGoogle,
    signInWithLovable,
    signInWithEmail,
    signUpWithEmail
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContext {
  const context = useContext(AuthContext);

  if (!context)
    throw new Error('useAuth must be used within an AuthContextProvider');

  return context;
}

export type { usersCollection };
