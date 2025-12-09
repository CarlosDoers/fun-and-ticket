import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isGuide: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  isGuide: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuide, setIsGuide] = useState(false);

  // Use a ref to track the current user ID to avoid stale closures in useEffect
  const userIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        userIdRef.current = session.user.id;
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id;
      
      // If user ID hasn't changed, just update session data without triggering full reload/role check
      if (newUserId === userIdRef.current) {
        setSession(session);
        setUser(session?.user ?? null);
        return;
      }

      // User changed (login, logout, or user switch)
      userIdRef.current = newUserId;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setLoading(true); // Ensure loading is true while checking role
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
        setIsAdmin(false);
        setIsGuide(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      }



      if (data) {
        const adminStatus = data.role === 'admin';
        const guideStatus = data.role === 'guide';

        setIsAdmin(adminStatus);
        setIsGuide(guideStatus);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {

      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // 1. Try to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Exception signing out:', error);
    } finally {
      // 2. Manually clear AsyncStorage keys for Supabase
      try {
        const keys = await AsyncStorage.getAllKeys();
        // Supabase keys usually start with 'sb-' and end with '-auth-token'
        const supabaseKeys = keys.filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (supabaseKeys.length > 0) {
          console.log('Clearing Supabase keys from storage:', supabaseKeys);
          await AsyncStorage.multiRemove(supabaseKeys);
        }
      } catch (storageError) {
        console.error('Error clearing local storage:', storageError);
      }

      // 3. Force clear local state
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setIsGuide(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isAdmin, isGuide, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
