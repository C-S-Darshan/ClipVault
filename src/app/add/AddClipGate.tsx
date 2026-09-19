'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/config';
import { getAuthRedirectUrl } from '@/lib/supabase/url';
import {
  Lock,
  Clock,
  ArrowLeft,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface AddClipGateProps {
  mode: 'unauthenticated' | 'pending';
  user?: UserProfile;
}

export const AddClipGate: React.FC<AddClipGateProps> = ({ mode, user }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      if (!supabase) {
        setAuthError('Supabase configuration missing.');
        return;
      }
      const redirectUrl = getAuthRedirectUrl('/auth/callback');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          setAuthError(
            'Google provider is not yet enabled in Supabase Authentication > Providers. Sign in using Email below.'
          );
        } else {
          setAuthError(error.message);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initialize Google sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setAuthError(null);
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      if (!supabase) {
        setAuthError('Supabase configuration missing.');
        return;
      }
      const redirectUrl = getAuthRedirectUrl('/auth/callback');
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send login email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data?.isApproved) {
        router.refresh();
      } else {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 600);
      }
    } catch {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <Link
        href="/"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} /> Back to Library
      </Link>

      <div
        className="glass-panel"
        style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {mode === 'unauthenticated' ? (
          <>
            {/* Locked Icon */}
            <div
              style={{
                width: '4.5rem',
                height: '4.5rem',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Lock size={32} />
            </div>

            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Sign In Required
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                ClipVault is a private friend group media vault. You must sign in with an approved account to add YouTube clips.
              </p>
            </div>

            {authError && (
              <div
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  textAlign: 'left',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{authError}</span>
              </div>
            )}

            {magicLinkSent ? (
              <div
                style={{
                  width: '100%',
                  padding: '1.5rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <CheckCircle2 size={36} color="var(--accent-success)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Check your email!</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  We sent a magic sign-in link to <strong>{email}</strong>. Open the link to authenticate and return here.
                </p>
                <button
                  onClick={() => setMagicLinkSent(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem' }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    justifyContent: 'center',
                    fontWeight: 600,
                    gap: '0.75rem',
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
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
                  <span>Sign in with Google</span>
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

                {/* Email Sign In Form */}
                <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ padding: '0.75rem 1rem' }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    <span>Send Magic Sign-In Link</span>
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Pending Approval Icon */}
            <div
              style={{
                width: '4.5rem',
                height: '4.5rem',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-warning)',
              }}
            >
              <Clock size={32} />
            </div>

            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Account Pending Approval
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Welcome, <strong style={{ color: '#fff' }}>{user?.name || 'Friend'}</strong>! Your account has been authenticated, but ClipVault requires admin approval before you can upload clips or participate.
              </p>
            </div>

            {/* User Profile Card */}
            <div
              style={{
                width: '100%',
                maxWidth: '420px',
                padding: '1.25rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textAlign: 'left',
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color: 'var(--accent-warning)',
                    marginTop: '0.35rem',
                    fontWeight: 600,
                  }}
                >
                  <Clock size={12} />
                  <span>Status: Awaiting Admin Approval</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                className="btn btn-secondary"
                style={{ gap: '0.5rem' }}
              >
                <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'Checking...' : 'Check Approval Status'}</span>
              </button>

              <Link href="/" className="btn btn-primary">
                Explore Library
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
