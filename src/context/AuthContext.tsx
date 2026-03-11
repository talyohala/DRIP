import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { hasSupabaseEnv, supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const LOCAL_USER_KEY = 'drip-auth-user';

const AuthContext = createContext<AuthContextValue | null>(null);

function parseLocalUser() {
  const raw = localStorage.getItem(LOCAL_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setUser(parseLocalUser());
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!hasSupabaseEnv) {
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        user_metadata: { source: 'mock-auth' },
      } as User;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!hasSupabaseEnv) {
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        user_metadata: { source: 'mock-auth' },
      } as User;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!hasSupabaseEnv) {
      localStorage.removeItem(LOCAL_USER_KEY);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [loading, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
