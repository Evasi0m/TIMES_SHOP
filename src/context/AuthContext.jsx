import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { USE_MOCK_API, GOOGLE_REDIRECT_URL, hasSupabaseConfig } from '../lib/config.js';

const AuthContext = createContext(null);

// When backend/auth isn't configured (mock mode), fall back to a localStorage
// "session" so the customer flow (checkout, account) is fully testable.
const MOCK_AUTH = USE_MOCK_API && !hasSupabaseConfig;
const MOCK_KEY = 'times_shop_mock_user';

function readMockUser() {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (MOCK_AUTH) {
      setUser(readMockUser());
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    async function signIn({ email, password }) {
      if (MOCK_AUTH) {
        const u = { id: 'mock-user', email, app_metadata: { app_role: 'customer' } };
        localStorage.setItem(MOCK_KEY, JSON.stringify(u));
        setUser(u);
        return { user: u };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    }

    async function signUp({ email, password, displayName }) {
      if (MOCK_AUTH) {
        const u = {
          id: 'mock-user',
          email,
          app_metadata: { app_role: 'customer' },
          user_metadata: { display_name: displayName },
        };
        localStorage.setItem(MOCK_KEY, JSON.stringify(u));
        setUser(u);
        return { user: u };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      // With "Confirm email" disabled the session is returned immediately.
      return data;
    }

    async function signInWithGoogle() {
      if (MOCK_AUTH) {
        throw new Error('google_unconfigured');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: GOOGLE_REDIRECT_URL ? { redirectTo: GOOGLE_REDIRECT_URL } : undefined,
      });
      if (error) throw error;
    }

    async function updateProfile({ displayName, phone }) {
      if (MOCK_AUTH) {
        const current = readMockUser() || { id: 'mock-user' };
        const next = {
          ...current,
          user_metadata: { ...current.user_metadata, display_name: displayName, phone },
        };
        localStorage.setItem(MOCK_KEY, JSON.stringify(next));
        setUser(next);
        return next;
      }
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName, phone },
      });
      if (error) throw error;
      setUser(data.user);
      return data.user;
    }

    async function signOut() {
      if (MOCK_AUTH) {
        localStorage.removeItem(MOCK_KEY);
        setUser(null);
        return;
      }
      await supabase.auth.signOut();
    }

    async function getAccessToken() {
      if (MOCK_AUTH) return 'mock-token';
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    }

    return {
      user,
      loading,
      isAuthenticated: Boolean(user),
      role: user?.app_metadata?.app_role ?? null,
      mockAuth: MOCK_AUTH,
      googleEnabled: Boolean(GOOGLE_REDIRECT_URL) && !MOCK_AUTH,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
      getAccessToken,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
