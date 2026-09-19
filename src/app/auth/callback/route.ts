import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  // Extract reverse-proxy host & protocol headers if behind Vercel or load balancer
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  let baseUrl = origin;
  if (forwardedHost) {
    baseUrl = `${forwardedProto}://${forwardedHost}`;
  } else if (process.env.NEXT_PUBLIC_SITE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }

  const safeNext = next.startsWith('/') ? next : `/${next}`;

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${baseUrl}${safeNext}`);
      }
      console.error('[Auth Callback] Failed to exchange code for session:', error.message);
    }
  }

  return NextResponse.redirect(`${baseUrl}/?error=auth-failed`);
}

