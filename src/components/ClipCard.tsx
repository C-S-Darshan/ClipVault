import React from 'react';
import Link from 'next/link';
import { Clip } from '@/lib/types';
import { Play, MessageSquare, Lock, Users, Shield } from 'lucide-react';

interface ClipCardProps {
  clip: Clip;
}

export const ClipCard: React.FC<ClipCardProps> = ({ clip }) => {
  const formattedDate = new Date(clip.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const totalReactions = clip.reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <Link href={`/clips/${clip.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <article className="glass-panel clip-card">
        {/* Thumbnail Box */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            backgroundColor: '#000',
            overflow: 'hidden',
          }}
        >
          <img
            src={clip.thumbnail_url}
            alt={clip.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
          />

          {/* Dark gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(16, 20, 30, 0.8) 0%, transparent 50%)',
            }}
          />

          {/* Hover Play Icon */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.9,
            }}
          >
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.9)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
                transition: 'transform 0.2s',
              }}
            >
              <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
            </div>
          </div>

          {/* Visibility pill (top-right) */}
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
            {clip.visibility === 'PRIVATE' && (
              <span className="badge badge-visibility-private">
                <Lock size={10} /> Private
              </span>
            )}
            {clip.visibility === 'SELECTED' && (
              <span className="badge badge-visibility-selected">
                <Shield size={10} /> Selected
              </span>
            )}
            {clip.visibility === 'FRIENDS' && (
              <span className="badge badge-visibility-friends">
                <Users size={10} /> Friends
              </span>
            )}
          </div>

          {/* Game badge (bottom-left) */}
          <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.35rem' }}>
            <span className="badge badge-game">{clip.game}</span>
            <span className="badge badge-category">{clip.category}</span>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              lineHeight: 1.4,
              color: 'var(--text-main)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {clip.title}
          </h3>

          {/* Tags list */}
          {clip.tags && clip.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {clip.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="badge badge-tag">
                  #{tag}
                </span>
              ))}
              {clip.tags.length > 4 && (
                <span className="badge badge-tag" style={{ color: 'var(--text-dim)' }}>
                  +{clip.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Card Footer: Uploader, Date, Comments & Reactions */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {clip.uploader.avatar_url ? (
                <img
                  src={clip.uploader.avatar_url}
                  alt={clip.uploader.name}
                  style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {clip.uploader.name.charAt(0)}
                </div>
              )}
              <span>{clip.uploader.name}</span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span style={{ color: 'var(--text-dim)' }}>{formattedDate}</span>
            </div>

            {/* Reactions summary & comments count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {totalReactions > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.2rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}
                >
                  {clip.reactions
                    .filter((r) => r.count > 0)
                    .slice(0, 3)
                    .map((r) => (
                      <span key={r.emoji}>{r.emoji}</span>
                    ))}
                  <span style={{ marginLeft: 2, fontWeight: 600, color: 'var(--text-main)' }}>
                    {totalReactions}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                }}
              >
                <MessageSquare size={13} />
                <span>{clip.comments_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};
