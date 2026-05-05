
import React, { useState, useEffect, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { type AuthContextType, AuthContext } from '@/contexts/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener first
        authSubscription = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;
            
            logger.debug('Auth state changed:', event, session?.user?.id);
            
            // Only update state, no side effects here to prevent loops
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          logger.error('Error getting session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        logger.error('Error in auth initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array to prevent re-initialization

  const signInWithGoogle = async () => {
    logger.debug('Attempting Google sign in...');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      logger.error('Google sign in error:', error);
      toast({
        title: "Sign-in failed",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('Error signing out:', error);
      toast({
        title: "Sign-out failed",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.displayName = 'AuthProvider';
