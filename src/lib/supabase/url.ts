/**
 * Resolves the appropriate base URL for the current environment.
 * Handles client-side window.location, Vercel deployments, and environment variables.
 */
export function getSiteUrl(): string {
  // If running in browser, window.location.origin is always the exact current domain
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Explicit environment variable takes precedence
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    let url = process.env.NEXT_PUBLIC_SITE_URL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }

  // Vercel auto-provided domain (e.g. your-app.vercel.app)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`.replace(/\/+$/, '');
  }

  // Production fallback
  if (process.env.NODE_ENV === 'production') {
    return 'https://clip-vault-seven.vercel.app';
  }

  // Default local development fallback
  return 'http://localhost:3000';
}

/**
 * Returns the full callback URL for OAuth / magic link authentication
 */
export function getAuthRedirectUrl(path: string = '/auth/callback'): string {
  const base = getSiteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
