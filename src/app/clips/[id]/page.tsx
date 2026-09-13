import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClipById, getClipComments } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { getYouTubeEmbedUrl } from '@/lib/youtube';
import { ClipInteractions } from '@/components/ClipInteractions';
import {
  ArrowLeft,
  ExternalLink,
  Edit,
  Trash2,
  Lock,
  Users,
  Shield,
  Calendar,
  User,
} from 'lucide-react';
import { ClipDetailActions } from './ClipDetailActions';

interface ClipPageProps {
  params: {
    id: string;
  };
}

export default async function ClipDetailPage({ params }: ClipPageProps) {
  const currentUser = await getCurrentUser();
  const clip = await getClipById(params.id, currentUser.id);

  if (!clip) {
    notFound();
  }

  const comments = await getClipComments(clip.id);
  const embedUrl = getYouTubeEmbedUrl(clip.youtube_video_id);
  const isUploader = clip.uploaded_by === currentUser.id;

  const formattedDate = new Date(clip.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="container" style={{ maxWidth: '980px' }}>
      {/* Top action bar: Back button & YouTube direct link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link href="/" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Library
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isUploader && <ClipDetailActions clipId={clip.id} />}

          <a
            href={clip.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>Open in YouTube</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Embedded YouTube Player */}
      <div
        className="glass-panel"
        style={{
          overflow: 'hidden',
          marginBottom: '2rem',
          background: '#000',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
          <iframe
            src={embedUrl}
            title={clip.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      </div>

      {/* Clip Metadata Block */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span className="badge badge-game">{clip.game}</span>
          <span className="badge badge-category">{clip.category}</span>

          {clip.visibility === 'PRIVATE' && (
            <span className="badge badge-visibility-private">
              <Lock size={11} /> Private (Only you)
            </span>
          )}
          {clip.visibility === 'SELECTED' && (
            <span className="badge badge-visibility-selected">
              <Shield size={11} /> Selected Friends
            </span>
          )}
          {clip.visibility === 'FRIENDS' && (
            <span className="badge badge-visibility-friends">
              <Users size={11} /> Friends
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#fff',
            lineHeight: 1.3,
            marginBottom: '1rem',
          }}
        >
          {clip.title}
        </h1>

        {/* Uploader and Date row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {clip.uploader.avatar_url ? (
              <img
                src={clip.uploader.avatar_url}
                alt={clip.uploader.name}
                style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', objectFit: 'cover' }}
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
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {clip.uploader.name.charAt(0)}
              </div>
            )}
            <span>
              Uploaded by <strong style={{ color: 'var(--text-main)' }}>{clip.uploader.name}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Description */}
        {clip.description && (
          <div style={{ marginTop: '1.25rem' }}>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {clip.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {clip.tags && clip.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '1.5rem' }}>
            {clip.tags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="badge badge-tag" style={{ padding: '0.35rem 0.75rem' }}>
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Emoji Reactions & Discussion */}
      <ClipInteractions
        clipId={clip.id}
        initialReactions={clip.reactions}
        initialComments={comments}
        currentUser={currentUser}
      />
    </div>
  );
}
