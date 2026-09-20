'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserProfile, Clip, UserActivity } from '@/lib/types';
import { ThemeCustomizer } from '@/components/ThemeCustomizer';
import { ClipCard } from '@/components/ClipCard';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Film,
  Flame,
  MessageSquare,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ExternalLink,
  Camera,
  Activity,
  ArrowRight,
} from 'lucide-react';

const AVATAR_PRESETS = [
  { label: 'Cyber Ninja', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80' },
  { label: 'Pilot', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80' },
  { label: 'Cosmic', url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=160&auto=format&fit=crop&q=80' },
  { label: 'Gamer 1', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=160&auto=format&fit=crop&q=80' },
  { label: 'Gamer 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80' },
  { label: 'Retro', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
];

interface ProfileClientProps {
  initialUser: UserProfile;
  initialStats: {
    clipsCount: number;
    reactionsReceived: number;
    commentsCount: number;
  };
  initialClips: Clip[];
  initialActivities: UserActivity[];
}

export const ProfileClient: React.FC<ProfileClientProps> = ({
  initialUser,
  initialStats,
  initialClips,
  initialActivities,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState<'settings' | 'theme' | 'activity' | 'clips'>('settings');

  // Form state
  const [name, setName] = useState(initialUser.name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const formattedDate = new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('Username cannot be blank.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          avatar_url: avatarUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user);
      if (data.stats) setStats(data.stats);
      setSaveSuccess('Profile successfully updated! Your username is now reflected across the vault.');

      setTimeout(() => {
        setSaveSuccess(null);
      }, 4000);
      router.refresh();
    } catch (err: any) {
      setSaveError(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Profile Header Hero */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow ambient background */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* User Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--accent-primary)',
                  boxShadow: 'var(--shadow-glow)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#fff',
                  border: '3px solid rgba(255,255,255,0.2)',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff' }}>{user.name}</h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  background: user.is_approved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: user.is_approved ? 'var(--accent-success)' : 'var(--accent-warning)',
                  border: `1px solid ${user.is_approved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                }}
              >
                {user.is_approved ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                {user.is_approved ? 'Approved Member' : 'Pending Approval'}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              {user.email || 'Private Account'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              <Calendar size={13} />
              <span>Member since {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Action Link to Add Clip */}
        <Link href="/add" className="btn btn-primary" style={{ zIndex: 1, gap: '0.4rem' }}>
          <Film size={16} /> Upload New Clip
        </Link>
      </div>

      {/* Vault Statistics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Film size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{stats.clipsCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clips Uploaded</div>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-warning)',
            }}
          >
            <Flame size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{stats.reactionsReceived}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reactions Received</div>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-secondary)',
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{stats.commentsCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comments Posted</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '0.65rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={16} /> Profile & Display Name
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          style={{
            padding: '0.65rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeTab === 'theme' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'theme' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={16} /> UI Theme & Colors
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '0.65rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeTab === 'activity' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'activity' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Activity size={16} /> Activity Center ({initialActivities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clips')}
          style={{
            padding: '0.65rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: activeTab === 'clips' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'clips' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Film size={16} /> My Clips ({initialClips.length})
        </button>
      </div>

      {/* Tab 1: Profile Settings Form */}
      {activeTab === 'settings' && (
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '680px',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Edit Profile Details
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Choose how your name and avatar appear to your friends across ClipVault.
          </p>

          {saveSuccess && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#6ee7b7',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Display Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Display Name / Username
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your username"
                className="input-field"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                This name will be displayed on all clips you upload, comments you post, and reaction badges.
              </span>
            </div>

            {/* Avatar URL Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="input-field"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Paste an image URL or choose one of the avatar presets below:
              </span>
            </div>

            {/* Avatar Presets Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Avatar Presets:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {AVATAR_PRESETS.map((preset) => {
                  const isChosen = avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      style={{
                        position: 'relative',
                        width: '3.25rem',
                        height: '3.25rem',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: isChosen ? '3px solid var(--accent-primary)' : '2px solid var(--border-subtle)',
                        boxShadow: isChosen ? 'var(--shadow-glow)' : 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.15s ease',
                      }}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: UI Theme Customizer */}
      {activeTab === 'theme' && (
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '780px',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
              Customize Your Interface
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Personalize your ClipVault experience. Your selected colors and atmosphere are saved to your browser and persist on refresh.
            </p>
          </div>

          <ThemeCustomizer />
        </div>
      )}

      {/* Tab 3: Activity Feed */}
      {activeTab === 'activity' && (
        <div
          id="activity"
          className="glass-panel"
          style={{
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
              Recent Vault Activity
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              See when friends comment or react to the clips you uploaded.
            </p>
          </div>

          {initialActivities.length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: '0.9rem',
              }}
            >
              No activities yet. When your friends react or comment on your clips, they will show up here!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {initialActivities.map((act) => (
                <Link
                  key={act.id}
                  href={`/clips/${act.clip_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    gap: '1rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      {act.actor.avatar_url ? (
                        <img
                          src={act.actor.avatar_url}
                          alt={act.actor.name}
                          style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {act.actor.name.charAt(0)}
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          fontSize: '0.85rem',
                        }}
                      >
                        {act.type === 'comment' ? '💬' : act.emoji}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                        <strong>{act.actor.name}</strong>{' '}
                        {act.type === 'comment' ? 'commented on' : `reacted with ${act.emoji} to`}{' '}
                        <span style={{ color: 'var(--accent-secondary)' }}>&ldquo;{act.clip_title}&rdquo;</span>
                      </div>
                      {act.type === 'comment' && act.content && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          &ldquo;{act.content}&rdquo;
                        </p>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {act.clip_thumbnail && (
                    <img
                      src={act.clip_thumbnail}
                      alt={act.clip_title}
                      style={{
                        width: '4.5rem',
                        height: '2.5rem',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: My Uploaded Clips */}
      {activeTab === 'clips' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              My Uploaded Clips ({initialClips.length})
            </h2>
            <Link href="/add" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
              <Film size={14} /> Upload More
            </Link>
          </div>

          {initialClips.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              You haven&apos;t uploaded any clips yet. Upload your first unlisted YouTube clip!
            </div>
          ) : (
            <div className="clips-grid">
              {initialClips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
