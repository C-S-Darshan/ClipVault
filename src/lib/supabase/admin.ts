import { getSupabaseUrl } from './config';

export function getAdminSecretKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/**
 * Updates a user's metadata in Supabase Auth via the Admin API.
 * This ensures custom display name and avatar survive OAuth logins and token refreshes.
 */
export async function updateAuthUserMetadata(
  userId: string,
  metadata: {
    custom_display_name?: string;
    custom_avatar_url?: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
  }
): Promise<boolean> {
  const url = getSupabaseUrl();
  const secretKey = getAdminSecretKey();

  if (!url || !secretKey) {
    return false;
  }

  try {
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_metadata: metadata,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('[Admin] Failed to update user metadata in Supabase Auth:', err);
    return false;
  }
}

/**
 * Updates public.users row with admin privileges (bypassing RLS).
 */
export async function updatePublicUserProfileAdmin(
  userId: string,
  data: { name?: string; avatar_url?: string | null }
): Promise<boolean> {
  const url = getSupabaseUrl();
  const secretKey = getAdminSecretKey();

  if (!url || !secretKey) {
    return false;
  }

  try {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url;

    const res = await fetch(`${url}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('[Admin] Failed to update public.users with admin key:', err);
    return false;
  }
}
