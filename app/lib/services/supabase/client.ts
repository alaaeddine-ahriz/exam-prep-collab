import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../config";

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client singleton
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!env.supabase.url || !env.supabase.anonKey) {
      throw new Error(
        "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    supabaseClient = createClient(env.supabase.url, env.supabase.anonKey);
  }
  return supabaseClient;
}

/**
 * Close the Supabase client (for cleanup)
 */
export function closeSupabaseClient(): void {
  // Supabase JS client doesn't need explicit closing
  supabaseClient = null;
}

