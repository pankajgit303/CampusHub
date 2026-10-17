import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { supabase } from '../lib/supabase';
type Profile = Database['public']['Tables']['profiles']['Row'];
const AuthContext = createContext<{
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}>({ session: null, profile: null, loading: true, error: '', refresh: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function loadProfile(id: string) {
    const result = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setProfile(result.data);
    setError(
      result.error?.message ||
        (!result.data
          ? 'Your account is inactive or its profile is unavailable. Contact your college administrator.'
          : ''),
    );
    setLoading(false);
  }
  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      if (!next) {
        setProfile(null);
        setLoading(false);
      } else {
        setLoading(true);
        setTimeout(() => {
          if (active) void loadProfile(next.user.id);
        }, 0);
      }
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (!data.session) setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        error,
        refresh: async () => {
          if (session) await loadProfile(session.user.id);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
