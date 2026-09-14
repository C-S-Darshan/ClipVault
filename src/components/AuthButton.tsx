'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, ShieldAlert, LogOut, Loader2 } from 'lucide-react';

interface AuthButtonProps {
  user: UserProfile;
  hasCloudConfig: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ user, hasCloudConfig }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        alert(`Authentication error: ${error.message}`);
      }
    } catch (err: any) {
      alert(`Sign in failed: ${err?.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
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

  // If local preview mode, show preview member badge
  if (!hasCloudConfig) {
    return (
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
            {user.name.charAt(0)}
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
            <ShieldCheck size={10} />
            {user.is_approved ? 'Approved Member' : 'Pending Approval'}
          </span>
        </div>
      </div>
    );
  }

  // If Supabase is configured and user is signed in
  if (user.id) {
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
    <button
      onClick={handleSignInWithGoogle}
      disabled={isLoading}
      className="btn btn-primary"
      style={{
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        borderRadius: 'var(--radius-full)',
        gap: '0.5rem',
      }}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>Sign in with Google</span>
    </button>
  );
};
