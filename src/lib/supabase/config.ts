export function getSupabaseUrl(): string {
  const windowObj = typeof window !== 'undefined' ? (window as any) : {};
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    windowObj.__SUPABASE_URL ||
    ''
  );
}

export function getSupabaseAnonKey(): string {
  const windowObj = typeof window !== 'undefined' ? (window as any) : {};
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    windowObj.__SUPABASE_ANON_KEY ||
    ''
  );
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    !url.includes('placeholder') &&
    !key.includes('your-anon-key') &&
    url.startsWith('https://')
  );
}
