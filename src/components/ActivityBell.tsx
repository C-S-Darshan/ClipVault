'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, MessageSquare, Flame, Check, ExternalLink } from 'lucide-react';
import { UserActivity } from '@/lib/types';

interface ActivityBellProps {
  userId?: string;
}

export const ActivityBell: React.FC<ActivityBellProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read local storage for last read timestamp
    const lastRead = localStorage.getItem('clipvault_activity_last_read') || '0';

    fetch('/api/activity')
      .then((res) => res.json())
      .then((data) => {
        if (data.activities && Array.isArray(data.activities)) {
          setActivities(data.activities);
          // Calculate unread items
          const unread = data.activities.filter(
            (act: UserActivity) => new Date(act.created_at).getTime() > Number(lastRead)
          ).length;
          setUnreadCount(unread);
        }
        setHasFetched(true);
      })
      .catch((err) => {
        console.error('Failed to load activities:', err);
        setHasFetched(true);
      });
  }, [userId]);

  // Click outside listener to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllRead = () => {
    localStorage.setItem('clipvault_activity_last_read', Date.now().toString());
    setUnreadCount(0);
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Activity & Notifications"
        style={{
          position: 'relative',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          background: isOpen ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? '#fff' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              minWidth: '1.15rem',
              height: '1.15rem',
              padding: '0 0.25rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--accent-primary)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.65rem)',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            maxHeight: '440px',
            overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Activity</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Activity List */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
            {activities.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Bell size={24} style={{ opacity: 0.4 }} />
                <span>No recent activity on your clips yet.</span>
              </div>
            ) : (
              activities.map((act) => (
                <Link
                  key={act.id}
                  href={`/clips/${act.clip_id}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Actor Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {act.actor.avatar_url ? (
                      <img
                        src={act.actor.avatar_url}
                        alt={act.actor.name}
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          background: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
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
                        bottom: '-2px',
                        right: '-2px',
                        fontSize: '0.7rem',
                      }}
                    >
                      {act.type === 'comment' ? '💬' : act.emoji || '🔥'}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.35 }}>
                      <strong style={{ color: '#fff' }}>{act.actor.name}</strong>{' '}
                      {act.type === 'comment' ? (
                        <span style={{ color: 'var(--text-muted)' }}>commented on </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>
                          reacted {act.emoji} to{' '}
                        </span>
                      )}
                      <span style={{ color: '#fff', fontWeight: 500 }}>&ldquo;{act.clip_title}&rdquo;</span>
                    </div>

                    {act.type === 'comment' && act.content && (
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-dim)',
                          marginTop: '0.2rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        &ldquo;{act.content}&rdquo;
                      </p>
                    )}

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                      {formatRelativeTime(act.created_at)}
                    </span>
                  </div>

                  {/* Clip Thumbnail Preview */}
                  {act.clip_thumbnail && (
                    <img
                      src={act.clip_thumbnail}
                      alt={act.clip_title}
                      style={{
                        width: '2.5rem',
                        height: '1.4rem',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.65rem 1rem',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <Link
              href="/profile#activity"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-secondary)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>View full activity feed</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
