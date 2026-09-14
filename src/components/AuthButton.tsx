'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, ShieldAlert, LogOut, Loader2, Mail, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthButtonProps {
  user: UserProfile;
  hasCloudConfig: boolean;
  initialSupabaseUrl?: string;
  initialSupabaseAnonKey?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  user,
  hasCloudConfig,
  initialSupabaseUrl,
  initialSupabaseAnonKey,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      if (initialSupabaseUrl) (window as any).__SUPABASE_URL = initialSupabaseUrl;
      if (initialSupabaseAnonKey) (window as any).__SUPABASE_ANON_KEY = initialSupabaseAnonKey;
    }
  }, [initialSupabaseUrl, initialSupabaseAnonKey]);

  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const supabase = createClient(initialSupabaseUrl, initialSupabaseAnonKey);
      if (!supabase) {
        setAuthError('Supabase credentials not found. Please verify your Project URL and API Key.');
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          setAuthError(
            'Google provider is not enabled yet in your Supabase dashboard. Sign in using Email below, or enable Google under Authentication > Providers in Supabase.'
          );
        } else {
          setAuthError(error.message);
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setAuthError(null);
    try {
      const supabase = createClient(initialSupabaseUrl, initialSupabaseAnonKey);
      if (!supabase) {
        setAuthError('Supabase credentials not found. Please verify your Project URL and API Key.');
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send login email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient(initialSupabaseUrl, initialSupabaseAnonKey);
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if user is actually authenticated
  const isRealUser = Boolean(
    user &&
    user.id &&
    user.id !== '' &&
    user.id !== 'user-darshan-1' &&
    user.name !== 'Guest'
  );

  // If user is authenticated in Supabase
  if (isRealUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.35rem 0.75rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</span>
            <span
              style={{
                fontSize: '0.65rem',
                color: user.is_approved ? 'var(--accent-success)' : 'var(--accent-warning)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              {user.is_approved ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
              {user.is_approved ? 'Approved Member' : 'Pending Approval'}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isLoading}
          title="Sign Out"
          className="btn btn-secondary"
          style={{
            padding: '0.45rem 0.65rem',
            fontSize: '0.75rem',
            borderRadius: 'var(--radius-full)',
            gap: '0.35rem',
          }}
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
          <span>Sign Out</span>
        </button>
      </div>
    );
  }

  // Not signed in
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-primary"
        style={{
          padding: '0.5rem 1.15rem',
          fontSize: '0.85rem',
          borderRadius: 'var(--radius-full)',
          gap: '0.5rem',
        }}
      >
        <span>Sign In</span>
      </button>

      {/* Auth Modal via React Portal to document.body */}
      {showModal &&
        mounted &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999,
              padding: '1.5rem',
              boxSizing: 'border-box',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <div
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '420px',
                maxHeight: '88vh',
                overflowY: 'auto',
                background: '#0d111a',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
                margin: 'auto',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={20} />
              </button>

              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                  Sign in to ClipVault
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Access private gaming clips, discussions, and reactions.
                </p>
              </div>

              {authError && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>{authError}</span>
                </div>
              )}

              {magicLinkSent ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <CheckCircle2 size={42} color="var(--accent-success)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Check your inbox!</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    We sent a magic sign-in link to <strong>{email}</strong>. Click the link in the email to sign in.
                  </p>
                  <button
                    onClick={() => setMagicLinkSent(false)}
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <>
                  {/* Google Sign In */}
                  <button
                    onClick={handleSignInWithGoogle}
                    disabled={isLoading}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.7 7.3 9.1 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.8c2.2-2 3.7-5 3.7-8.7z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.9 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L2.2 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.8c-1.1.7-2.5 1.2-4.3 1.2-2.9 0-5.3-2-6.1-4.7L2.2 16.5C4 20.1 7.7 23 12 23z"
                        />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: 'var(--text-dim)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                    <span>OR WITH EMAIL</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                  </div>

                  {/* Email Magic Link Form */}
                  <form onSubmit={handleSignInWithEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Email address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        style={{ padding: '0.65rem 0.85rem' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                      }}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                      <span>Send Magic Link</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
