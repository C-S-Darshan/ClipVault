import React, { Suspense } from 'react';
import Link from 'next/link';
import { getAuthorizedClips } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { ClipCard } from '@/components/ClipCard';
import { FilterBar } from '@/components/FilterBar';
import { Film, Plus, Sparkles, Inbox } from 'lucide-react';

interface HomePageProps {
  searchParams: {
    q?: string;
    category?: string;
    tag?: string;
    sort?: 'newest' | 'oldest';
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();
  const clips = await getAuthorizedClips({
    search: searchParams.q,
    category: searchParams.category,
    tag: searchParams.tag,
    sortBy: searchParams.sort,
    currentUserId: user.id,
  });

  return (
    <div className="container">
      {/* Hero / Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--accent-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <Sparkles size={13} /> Private Group Vault
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            Recently Added
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Unlisted clips organized, discussed, and authorized for your friend circle.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar with Suspense for URL query params */}
      <Suspense fallback={<div style={{ height: '4rem' }} />}>
        <FilterBar />
      </Suspense>

      {/* Clips Grid or Empty State */}
      {clips.length > 0 ? (
        <div className="clips-grid">
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            maxWidth: '500px',
            margin: '2rem auto',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Inbox size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
              No clips found
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {searchParams.q || searchParams.category || searchParams.tag
                ? 'No clips matched your active search or filters. Try resetting the filters.'
                : 'Your vault is currently empty. Upload your first unlisted clip to get started!'}
            </p>
          </div>
          <Link href="/add" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <Plus size={16} />
            <span>Add a Clip</span>
          </Link>
        </div>
      )}
    </div>
  );
}
