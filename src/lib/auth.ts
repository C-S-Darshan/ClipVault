import { createServerSupabaseClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';
import { CURRENT_USER, MOCK_USERS } from './mock-data';
import { UserProfile } from './types';

export { isSupabaseConfigured };

export function isUserLoggedIn(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (!user.id || user.id === '' || user.name === 'Guest') return false;
  return true;
}

export function isUserApproved(user: UserProfile | null | undefined): boolean {
  if (!isUserLoggedIn(user)) return false;
  return Boolean(user?.is_approved);
}

export const GUEST_USER: UserProfile = {
  id: '',
  email: '',
  name: 'Guest',
  avatar_url: undefined,
  is_approved: false,
  created_at: new Date().toISOString(),
};

export async function getCurrentUser(): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    return CURRENT_USER;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return GUEST_USER;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return GUEST_USER;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const customName = user.user_metadata?.custom_display_name;
  const customAvatar = user.user_metadata?.custom_avatar_url;

  if (profile) {
    return {
      ...profile,
      name: customName || profile.name,
      avatar_url: customAvatar !== undefined && customAvatar !== null ? customAvatar : profile.avatar_url,
    } as UserProfile;
  }

  return {
    id: user.id,
    email: user.email || '',
    name: customName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar_url: customAvatar !== undefined && customAvatar !== null ? customAvatar : user.user_metadata?.avatar_url,
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
