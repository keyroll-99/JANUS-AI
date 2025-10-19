import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './config';
import type { Database } from './database.types';

/**
 * Supabase client instance with anonymous key
 * Use this for client-facing operations that respect Row Level Security (RLS)
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side doesn't need session persistence
      detectSessionInUrl: false,
    },
  }
);

/**
 * Supabase admin client with service role key
 * Use this for server-side operations that need to bypass Row Level Security (RLS)
 * WARNING: Only use this for trusted server-side operations!
 */
export const supabaseAdmin: SupabaseClient<Database> =
  createClient<Database>(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

export default supabase;
