import { createClient } from "@supabase/supabase-js";
import { env } from "../config";

/**
 * Supabase client for authentication
 * This client is used for auth operations regardless of the data provider
 */
let authClient: ReturnType<typeof createClient> | null = null;

export function getAuthClient() {
  if (!authClient) {
    // Auth always uses Supabase, even in development
    const supabaseUrl = env.supabase.url;
    const supabaseAnonKey = env.supabase.anonKey;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase configuration required for authentication. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }

    authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return authClient;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  const client = getAuthClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const client = getAuthClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign in with magic link (passwordless)
 */
export async function signInWithMagicLink(email: string) {
  const client = getAuthClient();
  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
  const client = getAuthClient();
  const { error } = await client.auth.signOut();
  return { error };
}

/**
 * Get current session
 */
export async function getSession() {
  const client = getAuthClient();
  const { data, error } = await client.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get current user
 */
export async function getUser() {
  const client = getAuthClient();
  const { data, error } = await client.auth.getUser();
  return { user: data.user, error };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = getAuthClient();
  return client.auth.onAuthStateChange(callback);
}

