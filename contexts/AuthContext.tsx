"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  onAuthStateChanged,
  getUserRole,
  handleGoogleRedirect,
} from '@/lib/auth';
import { UserRole, AuthContextType } from '@/lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for redirect result on mount
    handleGoogleRedirect();

    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Set session cookie for middleware
        document.cookie = `session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`; // 30 days

        // Fetch user role from Firestore
        try {
          const role = await getUserRole(firebaseUser.uid);
          setUserRole(role);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default role
        }
      } else {
        // Remove session cookie
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string): Promise<void> => {
    await authSignUp(email, password, displayName);
    // Auth state change will be handled by the listener
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    await authSignIn(email, password);
    // Auth state change will be handled by the listener
  };

  const signInWithGoogle = async (): Promise<void> => {
    await authSignInWithGoogle();
    // Auth state change will be handled by the listener
  };

  const signOut = async (): Promise<void> => {
    await authSignOut();
    setUserRole(null);
  };

  const value: AuthContextType = {
    user,
    userRole,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


