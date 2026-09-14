import { createServerSupabaseClient } from './supabase/server';
import { CURRENT_USER, MOCK_USERS } from './mock-data';
import { UserProfile } from './types';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getCurrentUser(): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    return CURRENT_USER;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return CURRENT_USER;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      id: '',
      email: '',
      name: 'Guest',
      avatar_url: undefined,
      is_approved: false,
      created_at: new Date().toISOString(),
    };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    return profile as UserProfile;
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar_url: user.user_metadata?.avatar_url,
    is_approved: false,
    created_at: user.created_at,
  };
}

export async function getAllApprovedUsers(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_USERS;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return MOCK_USERS;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('is_approved', true);

  return (data as UserProfile[]) || MOCK_USERS;
}
