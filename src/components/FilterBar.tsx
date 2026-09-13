'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CLIP_CATEGORIES } from '@/lib/types';
import { Search, ArrowDownUp, X } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || 'All';
  const currentTag = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'All') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ q: e.target.value || null });
  };

  const handleCategoryClick = (category: string) => {
    updateFilters({ category: category === currentCategory ? null : category });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sort: e.target.value });
  };

  const clearTag = () => {
    updateFilters({ tag: null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
      {/* Top row: Search input & Sort selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
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
            value={currentSearch}
            onChange={handleSearchChange}
            style={{ paddingLeft: '2.75rem' }}
          />
          {currentSearch && (
            <button
              onClick={() => updateFilters({ q: null })}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                padding: '0.25rem',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort & active tag pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentTag && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                color: '#fff',
              }}
            >
              <span>Tag: #{currentTag}</span>
              <button onClick={clearTag} style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
                <X size={14} />
              </button>
            </div>
          )}

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
              value={currentSort}
              onChange={handleSortChange}
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
        </div>
      </div>

      {/* Category Pills Row */}
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
          onClick={() => handleCategoryClick('All')}
          className="btn btn-sm"
          style={{
            background: currentCategory === 'All' ? 'var(--accent-primary)' : 'var(--bg-surface)',
            color: currentCategory === 'All' ? '#fff' : 'var(--text-muted)',
            border: '1px solid ' + (currentCategory === 'All' ? 'var(--accent-primary)' : 'var(--border-subtle)'),
            whiteSpace: 'nowrap',
          }}
        >
          All Categories
        </button>

        {CLIP_CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="btn btn-sm"
              style={{
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: '1px solid ' + (isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'),
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
  );
};
