import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from './config';

export function createClient(customUrl?: string, customKey?: string) {
  const supabaseUrl = customUrl || getSupabaseUrl();
  const supabaseAnonKey = customKey || getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
