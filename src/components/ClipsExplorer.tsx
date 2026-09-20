'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clip, CLIP_CATEGORIES, UserProfile } from '@/lib/types';
import { ClipCard } from './ClipCard';
import {
  Search,
  ArrowDownUp,
  X,
  Inbox,
  Loader2,
  RefreshCw,
  User,
  Gamepad2,
  Filter,
} from 'lucide-react';

interface ClipsExplorerProps {
  initialClips: Clip[];
  initialUsers?: UserProfile[];
  initialGames?: string[];
}

export const ClipsExplorer: React.FC<ClipsExplorerProps> = ({
  initialClips,
  initialUsers = [],
  initialGames = [],
}) => {
  const searchParams = useSearchParams();

  // Read initial filter values from URL if present
  const initialSearch = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialTag = searchParams.get('tag') || '';
  const initialUploader = searchParams.get('uploader') || searchParams.get('uploaderId') || 'All';
  const initialGame = searchParams.get('game') || 'All';
  const initialSort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest';

  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [availableGames, setAvailableGames] = useState<string[]>(initialGames);

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string>(initialCategory);
  const [tag, setTag] = useState<string>(initialTag);
  const [uploader, setUploader] = useState<string>(initialUploader);
  const [game, setGame] = useState<string>(initialGame);
  const [sort, setSort] = useState<'newest' | 'oldest'>(initialSort);

  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(initialClips.length);

  // Track if initial mount has finished to avoid redundant initial API call
  const isFirstMount = useRef(true);

  // If initialUsers was empty, fetch users list on mount for creator dropdown
  useEffect(() => {
    if (users.length === 0) {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          }
        })
        .catch((err) => console.error('Error fetching users:', err));
    }
  }, [users.length]);

  // Debounce search input changes (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch from /api/clips whenever filters change
  useEffect(() => {
    // Skip on first mount if filters match SSR initial data
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchClips() {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
      if (category && category !== 'All') params.set('category', category);
      if (tag) params.set('tag', tag);
      if (uploader && uploader !== 'All') params.set('uploader', uploader);
      if (game && game !== 'All') params.set('game', game);
      if (sort !== 'newest') params.set('sort', sort);

      // Update browser URL query string without full page reloads
      const newQuery = params.toString();
      const newUrl = newQuery ? `/?${newQuery}` : '/';
      window.history.replaceState(null, '', newUrl);

      try {
        const res = await fetch(`/api/clips?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch clips');

        const data = await res.json();
        if (isMounted && data.success) {
          setClips(data.clips || []);
          setTotalCount(data.total ?? data.clips?.length ?? 0);
          if (data.availableGames && Array.isArray(data.availableGames)) {
            setAvailableGames(data.availableGames);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[ClipsExplorer] Error fetching clips:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchClips();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedSearch, category, tag, uploader, game, sort]);

  // Compute unique game list from initial clips + current clips + availableGames prop
  const allGameOptions = Array.from(
    new Set([
      ...availableGames,
      ...clips.map((c) => c.game).filter(Boolean),
      ...initialClips.map((c) => c.game).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b));

  // Determine active creator name for the badge
  const activeCreator = users.find((u) => u.id === uploader);

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
    (category && category !== 'All') ||
    tag ||
    (uploader && uploader !== 'All') ||
    (game && game !== 'All') ||
    sort !== 'newest'
  );

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('All');
    setTag('');
    setUploader('All');
    setGame('All');
    setSort('newest');
  };

  return (
    <div>
      {/* Revamped Filter Control Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '2rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Row 1: Search bar, Uploader Filter, Game Filter & Sort */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
            <Search
              size={17}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Search title, game, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: '2.5rem',
                paddingRight: search ? '2.2rem' : '0.9rem',
                paddingTop: '0.55rem',
                paddingBottom: '0.55rem',
                fontSize: '0.85rem',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  background: 'none',
                  border: 'none',
                  padding: '0.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter by Creator ("Uploaded By") */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'var(--bg-surface)',
              border: `1px solid ${uploader !== 'All' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0 0.75rem',
              height: '2.4rem',
              flex: '0 1 auto',
            }}
          >
            <User size={15} color={uploader !== 'All' ? 'var(--accent-primary)' : 'var(--text-dim)'} />
            <select
              value={uploader}
              onChange={(e) => setUploader(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: uploader !== 'All' ? '#fff' : 'var(--text-main)',
                fontWeight: uploader !== 'All' ? 600 : 400,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                paddingRight: '0.25rem',
              }}
              title="Filter clips by creator"
            >
              <option value="All" style={{ background: 'var(--bg-surface)' }}>
                All Creators
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} style={{ background: 'var(--bg-surface)' }}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Game */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'var(--bg-surface)',
              border: `1px solid ${game !== 'All' ? 'var(--accent-secondary)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0 0.75rem',
              height: '2.4rem',
              flex: '0 1 auto',
            }}
          >
            <Gamepad2 size={15} color={game !== 'All' ? 'var(--accent-secondary)' : 'var(--text-dim)'} />
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: game !== 'All' ? '#fff' : 'var(--text-main)',
                fontWeight: game !== 'All' ? 600 : 400,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                paddingRight: '0.25rem',
              }}
              title="Filter clips by game"
            >
              <option value="All" style={{ background: 'var(--bg-surface)' }}>
                All Games
              </option>
              {allGameOptions.map((g) => (
                <option key={g} value={g} style={{ background: 'var(--bg-surface)' }}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0 0.75rem',
              height: '2.4rem',
              flex: '0 1 auto',
            }}
          >
            <ArrowDownUp size={14} color="var(--text-dim)" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest" style={{ background: 'var(--bg-surface)' }}>
                Newest First
              </option>
              <option value="oldest" style={{ background: 'var(--bg-surface)' }}>
                Oldest First
              </option>
            </select>
          </div>

          {/* Live Status indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" color="var(--accent-primary)" />
                <span>Updating...</span>
              </>
            ) : (
              <span>
                <strong>{totalCount}</strong> {totalCount === 1 ? 'clip' : 'clips'}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => setCategory('All')}
            className="btn btn-sm"
            style={{
              background: category === 'All' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.03)',
              color: category === 'All' ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${category === 'All' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              whiteSpace: 'nowrap',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-full)',
              transition: 'all 0.15s ease',
            }}
          >
            All Categories
          </button>

          {CLIP_CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(isActive ? 'All' : cat)}
                className="btn btn-sm"
                style={{
                  background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  whiteSpace: 'nowrap',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-full)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Row 3: Active Filters Pill Bar (shown only when filters are applied) */}
        {hasActiveFilters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Filter size={11} /> Filters:
            </span>

            {/* Query Badge */}
            {debouncedSearch && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#fff',
                }}
              >
                <span>&quot;{debouncedSearch}&quot;</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setDebouncedSearch('');
                  }}
                  style={{ color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Creator Badge */}
            {uploader !== 'All' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(99, 102, 241, 0.18)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#fff',
                }}
              >
                <User size={12} />
                <span>By: {activeCreator?.name || uploader}</span>
                <button
                  type="button"
                  onClick={() => setUploader('All')}
                  style={{ color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Game Badge */}
            {game !== 'All' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(6, 182, 212, 0.18)',
                  border: '1px solid var(--accent-secondary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#fff',
                }}
              >
                <Gamepad2 size={12} />
                <span>Game: {game}</span>
                <button
                  type="button"
                  onClick={() => setGame('All')}
                  style={{ color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Category Badge */}
            {category !== 'All' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#fff',
                }}
              >
                <span>Category: {category}</span>
                <button
                  type="button"
                  onClick={() => setCategory('All')}
                  style={{ color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Tag Badge */}
            {tag && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#fff',
                }}
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => setTag('')}
                  style={{ color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Sort Badge (if not newest) */}
            {sort !== 'newest' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Sort: Oldest</span>
                <button
                  type="button"
                  onClick={() => setSort('newest')}
                  style={{ color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Reset All Filters button */}
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: 'var(--accent-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                marginLeft: 'auto',
              }}
            >
              <RefreshCw size={11} /> Reset All
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="clips-grid">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={`skeleton-${idx}`}
              className="glass-panel animate-pulse"
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '320px',
              }}
            >
              <div style={{ aspectRatio: '16/9', background: 'rgba(255, 255, 255, 0.04)' }} />
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <div style={{ height: '1.25rem', width: '70%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 4 }} />
                <div style={{ height: '0.85rem', width: '40%', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 4 }} />
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ height: '1.5rem', width: '30%', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12 }} />
                  <div style={{ height: '1.5rem', width: '20%', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rendered Clips Grid */}
      {!isLoading && clips.length > 0 && (
        <div className="clips-grid">
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && clips.length === 0 && (
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
            maxWidth: '520px',
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

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
            No clips found
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', lineHeight: 1.5 }}>
            {hasActiveFilters
              ? 'No clips matched your active filters (creator, game, category, or search term). Try clearing or adjusting them.'
              : 'Your vault is currently empty. Be the first to upload an unlisted YouTube clip!'}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
            >
              <RefreshCw size={14} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
