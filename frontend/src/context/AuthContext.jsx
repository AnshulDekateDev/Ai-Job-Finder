import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authApi } from '../api';

const AuthContext = createContext(null);

function mapSupabaseUser(sbUser) {
  if (!sbUser) return null;
  const fullName = sbUser.user_metadata?.full_name 
    || sbUser.user_metadata?.name 
    || (sbUser.email ? sbUser.email.split('@')[0].replace(/[._-]/g, ' ') : 'Job Seeker');
  return {
    userId: sbUser.id,
    id: sbUser.id,
    email: sbUser.email,
    fullName: fullName
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Restoration
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          setSession(session);
          const u = mapSupabaseUser(session.user);
          setUser(u);
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(u));
        } else {
          // Check local stored session as fallback
          const localToken = localStorage.getItem('token');
          const localUser = localStorage.getItem('user');
          if (localToken && localUser) {
            try { setUser(JSON.parse(localUser)); } catch (e) { localStorage.clear(); }
          }
        }
        setLoading(false);
      }).catch(() => {
        if (mounted) setLoading(false);
      });

      // 2. Real-time Supabase Auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!mounted) return;
        if (newSession?.user) {
          setSession(newSession);
          const u = mapSupabaseUser(newSession.user);
          setUser(u);
          localStorage.setItem('token', newSession.access_token);
          localStorage.setItem('user', JSON.stringify(u));
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription?.unsubscribe();
      };
    } else {
      // Offline / Local Development Fallback
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);

      const handleUnauthorized = () => {
        setUser(null);
        setSession(null);
      };

      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => {
        mounted = false;
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      };
    }
  }, []);

  // Supabase Registration
  const signUp = async (email, password, fullName) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        const u = mapSupabaseUser(data.user);
        setUser(u);
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(u));
      }
      return data;
    } else {
      // Local fallback
      const res = await authApi.register(email, password, fullName);
      const { token, userId } = res.data;
      const userData = { userId, email, fullName };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  // Supabase Login
  const signIn = async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        const u = mapSupabaseUser(data.user);
        setUser(u);
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(u));
      }
      return data;
    } else {
      // Local fallback
      const res = await authApi.login(email, password);
      const { token, userId, fullName } = res.data;
      const userData = { userId, email, fullName };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  // Supabase Logout
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSession(null);
  };

  // Password Reset Request
  const resetPasswordForEmail = async (email) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#reset-password`
      });
      if (error) throw error;
      return data;
    } else {
      const res = await authApi.forgotPassword(email);
      return res.data;
    }
  };

  // Update Password
  const updatePassword = async (newPassword) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return data;
    }
  };

  // Google OAuth
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase configuration missing in frontend (.env)');
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPasswordForEmail,
      updatePassword,
      signInWithGoogle,
      isSupabaseConfigured,
      // Backward-compatibility aliases
      login: signIn,
      register: signUp,
      logout: signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
