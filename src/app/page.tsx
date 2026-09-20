import React, { Suspense } from 'react';
import Link from 'next/link';
import { getAuthorizedClips, getAvailableGames } from '@/lib/data';
import { getCurrentUser, getAllApprovedUsers } from '@/lib/auth';
import { ClipsExplorer } from '@/components/ClipsExplorer';
import { Sparkles, Plus } from 'lucide-react';

interface HomePageProps {
  searchParams: {
    q?: string;
    category?: string;
    tag?: string;
    uploader?: string;
    game?: string;
    sort?: 'newest' | 'oldest';
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [user, users, games] = await Promise.all([
    getCurrentUser(),
    getAllApprovedUsers(),
    getAvailableGames(),
  ]);

  const clips = await getAuthorizedClips({
    search: searchParams.q,
    category: searchParams.category,
    tag: searchParams.tag,
    uploaderId: searchParams.uploader && searchParams.uploader !== 'All' ? searchParams.uploader : undefined,
    game: searchParams.game && searchParams.game !== 'All' ? searchParams.game : undefined,
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

        <Link href="/add" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> Add Clip
        </Link>
      </div>

      {/* Reactive REST API Clips Explorer */}
      <Suspense fallback={<div className="clips-grid">{[1, 2, 3].map(i => <div key={i} className="glass-panel" style={{ height: 320 }} />)}</div>}>
        <ClipsExplorer
          initialClips={clips}
          initialUsers={users}
          initialGames={games}
        />
      </Suspense>
    </div>
  );
}

