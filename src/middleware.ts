import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const code = searchParams.get('code');

  // If a request hits any route with a Supabase auth code (such as the root URL
  // when Supabase falls back to the configured Site URL), forward it to /auth/callback
  // so the session can be created and stored in cookies.
  if (code && pathname !== '/auth/callback') {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('code', code);

    // Keep destination path if user was heading somewhere specific
    const next = searchParams.get('next') || pathname;
    if (next && next !== '/auth/callback') {
      callbackUrl.searchParams.set('next', next);
    }

    return NextResponse.redirect(callbackUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
