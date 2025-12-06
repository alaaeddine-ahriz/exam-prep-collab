"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signInWithMagicLink as authSignInWithMagicLink,
  signOut as authSignOut,
  getSession,
  onAuthStateChange,
} from "../lib/auth";
import {
  devSignIn,
  devSignUp,
  devSignOut,
  getDevSession,
  isDevMode,
  DevUser,
} from "../lib/auth/devAuth";

// Unified user type that works for both Supabase and dev mode
interface AppUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [devModeActive, setDevModeActive] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // Check if we're in dev mode
      const isDev = isDevMode();
      setDevModeActive(isDev);

      if (isDev) {
        // Dev mode: Check localStorage for dev session
        const devSession = getDevSession();
        if (devSession) {
          setUser({
            id: devSession.user.id,
            email: devSession.user.email,
          });
        }
        setLoading(false);
      } else {
        // Production mode: Use Supabase
        try {
          const { session: currentSession } = await getSession();
          setSession(currentSession);
          if (currentSession?.user) {
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email,
            });
          }
        } catch (error) {
          console.error("Error getting session:", error);
        } finally {
          setLoading(false);
        }

        // Listen for auth changes (Supabase only)
        const { data: { subscription } } = onAuthStateChange((event, newSession) => {
          setSession(newSession);
          if (newSession?.user) {
            setUser({
              id: newSession.user.id,
              email: newSession.user.email,
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (devModeActive) {
      const { session: devSession, error } = devSignUp(email, password);
      if (devSession) {
        setUser({
          id: devSession.user.id,
          email: devSession.user.email,
        });
      }
      return { error };
    }
    
    const { error } = await authSignUp(email, password);
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    if (devModeActive) {
      const { session: devSession, error } = devSignIn(email, password);
      if (devSession) {
        setUser({
          id: devSession.user.id,
          email: devSession.user.email,
        });
      }
      return { error };
    }
    
    const { error } = await authSignIn(email, password);
    return { error: error as Error | null };
  };

  const signInWithMagicLink = async (email: string) => {
    if (devModeActive) {
      // In dev mode, just sign in directly without password
      const { session: devSession, error } = devSignIn(email, "pwdpwd");
      if (devSession) {
        setUser({
          id: devSession.user.id,
          email: devSession.user.email,
        });
      }
      return { error };
    }
    
    const { error } = await authSignInWithMagicLink(email);
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (devModeActive) {
      devSignOut();
    } else {
      await authSignOut();
    }
    setUser(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    isAuthenticated: !!user,
    isDevMode: devModeActive,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

