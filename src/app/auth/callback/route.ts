import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updatePublicUserProfileAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  // Extract reverse-proxy host & protocol headers if behind Vercel or load balancer
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  let baseUrl = origin;
  if (forwardedHost && !forwardedHost.includes('localhost')) {
    baseUrl = `${forwardedProto}://${forwardedHost}`;
  } else if (process.env.NEXT_PUBLIC_SITE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  } else if (process.env.NODE_ENV === 'production' || baseUrl.includes('localhost')) {
    baseUrl = 'https://clip-vault-seven.vercel.app';
  }

  const safeNext = next.startsWith('/') ? next : `/${next}`;

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Retrieve authenticated user metadata
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const customName = user.user_metadata?.custom_display_name;
          const customAvatar = user.user_metadata?.custom_avatar_url;

          // If user previously customized name or avatar, restore it to public.users table
          if (customName || customAvatar) {
            await updatePublicUserProfileAdmin(user.id, {
              name: customName || undefined,
              avatar_url: customAvatar || undefined,
            });
          }
        }

        return NextResponse.redirect(`${baseUrl}${safeNext}`);
      }
      console.error('[Auth Callback] Failed to exchange code for session:', error.message);
    }
  }

  return NextResponse.redirect(`${baseUrl}/?error=auth-failed`);
}

