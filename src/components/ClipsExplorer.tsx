'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clip, CLIP_CATEGORIES, ClipCategory } from '@/lib/types';
import { ClipCard } from './ClipCard';
import {
  Search,
  ArrowDownUp,
  X,
  Sparkles,
  Inbox,
  Film,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ClipsExplorerProps {
  initialClips: Clip[];
}

export const ClipsExplorer: React.FC<ClipsExplorerProps> = ({ initialClips }) => {
  const searchParams = useSearchParams();

  // Read initial filter values from URL if present
  const initialSearch = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialTag = searchParams.get('tag') || '';
  const initialSort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest';

  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string>(initialCategory);
  const [tag, setTag] = useState<string>(initialTag);
  const [sort, setSort] = useState<'newest' | 'oldest'>(initialSort);

  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(initialClips.length);

  // Track if initial mount has finished to avoid redundant initial API call
  const isFirstMount = useRef(true);

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
      if (sort !== 'newest') params.set('sort', sort);

      // Update browser URL query string without page reloads
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
  }, [debouncedSearch, category, tag, sort]);

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('All');
    setTag('');
    setSort('newest');
  };

  return (
    <div>
      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Top row: Search input, Sort selector & Loading Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '480px' }}>
            <Search
              size={18}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Search clips by title, game, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.75rem', paddingRight: search ? '2.5rem' : '1rem' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  background: 'none',
                  border: 'none',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Right Controls: Tag Pill, Sort selector, and Live Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Active Tag pill */}
            {tag && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  color: '#fff',
                }}
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => setTag('')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Sort Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0 0.75rem',
              }}
            >
              <ArrowDownUp size={15} color="var(--text-dim)" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  padding: '0.65rem 0',
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

            {/* Status indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                padding: '0.4rem 0.6rem',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" color="var(--accent-primary)" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>{totalCount} {totalCount === 1 ? 'clip' : 'clips'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => setCategory('All')}
            className="btn btn-sm"
            style={{
              background: category === 'All' ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: category === 'All' ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${category === 'All' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              whiteSpace: 'nowrap',
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
                  background: isActive ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
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

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
            No clips found
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px' }}>
            {search || category !== 'All' || tag
              ? 'No clips matched your active search or filter criteria. Try adjusting your keywords or clearing filters.'
              : 'Your vault is currently empty. Be the first to upload an unlisted YouTube clip!'}
          </p>

          {(search || category !== 'All' || tag) && (
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
