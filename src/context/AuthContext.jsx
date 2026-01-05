import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
        // Fallback for local-only mode (legacy key auth support could go here, 
        // but for now we just finish loading)
        setIsLoading(false);
        return;
    }

    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login with Email
  const login = async (email, password) => {
    if (!isSupabaseConfigured) return { error: { message: "Supabase not configured" } };
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Register
  const signup = async (email, password) => {
    if (!isSupabaseConfigured) return { error: { message: "Supabase not configured" } };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Redirect back to the current domain after confirmation
        emailRedirectTo: window.location.origin, 
      }
    });
    return { data, error };
  };

  // Reset Password
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) return { error: { message: "Supabase not configured" } };

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password', // We might need a route for this
    });
    return { data, error };
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (!isSupabaseConfigured) return { error: { message: "Supabase not configured" } };

    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (data?.user) {
      setUser(data.user);
      // Force refresh session to ensure persistence across reloads
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (session) {
        setSession(session);
        setUser(session.user);
      }
    }
    
    return { data, error };
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
        // Local fallback
        setUser(null);
        return;
    }
    await supabase.auth.signOut();
  };

  // Legacy local key login support (optional, for backward compatibility if needed)
  const loginWithKey = (key) => {
     if (key === '20260105') {
         // Mock a user for local mode
         const mockUser = { id: 'local-user', email: 'local@admin.com' };
         setUser(mockUser);
         return true;
     }
     return false;
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
    loginWithKey,
    isLoading,
    isSupabaseConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
