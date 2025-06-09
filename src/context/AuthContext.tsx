import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'auditor' | 'reviewer';
  fullName: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ data: any, error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    const checkUser = async () => {
      try {
        const { user } = await getCurrentUser();
        
        if (user) {
          setUser({
            id: user.id,
            email: user.email || '',
            role: (user.user_metadata?.role as 'admin' | 'auditor' | 'reviewer') || 'auditor',
            fullName: user.user_metadata?.full_name || '',
          });
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as 'admin' | 'auditor' | 'reviewer') || 'auditor',
            fullName: session.user.user_metadata?.full_name || '',
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        role: (data.user.user_metadata?.role as 'admin' | 'auditor' | 'reviewer') || 'auditor',
        fullName: data.user.user_metadata?.full_name || '',
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};