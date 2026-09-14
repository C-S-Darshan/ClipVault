'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clip, CLIP_CATEGORIES, ClipCategory, ClipVisibility } from '@/lib/types';
import {
  Tag as TagIcon,
  Users,
  Shield,
  Lock,
  Plus,
  X,
  AlertCircle,
  Save,
  Loader2,
} from 'lucide-react';

const COMMON_GAMES = [
  'F1 24',
  'Counter-Strike 2',
  'Grand Theft Auto V',
  'Valorant',
  'Discord IRL',
  'Rocket League',
  'Apex Legends',
  'Minecraft',
];

const MOCK_FRIENDS = [
  { id: 'user-rahul-2', name: 'Rahul' },
  { id: 'user-akash-3', name: 'Akash' },
];

interface EditClipFormProps {
  clip: Clip;
}

export const EditClipForm: React.FC<EditClipFormProps> = ({ clip }) => {
  const router = useRouter();

  const [title, setTitle] = useState(clip.title);
  const [description, setDescription] = useState(clip.description || '');

  const [game, setGame] = useState(
    COMMON_GAMES.includes(clip.game) ? clip.game : '__custom__'
  );
  const [customGame, setCustomGame] = useState(
    COMMON_GAMES.includes(clip.game) ? '' : clip.game
  );
  const [isCustomGame, setIsCustomGame] = useState(!COMMON_GAMES.includes(clip.game));

  const [category, setCategory] = useState<ClipCategory>(clip.category);

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(clip.tags || []);

  const [visibility, setVisibility] = useState<ClipVisibility>(clip.visibility);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(clip.allowed_user_ids || []);
  const [availableFriends, setAvailableFriends] = useState<{ id: string; name: string }[]>(MOCK_FRIENDS);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users && data.users.length > 0) {
          setAvailableFriends(data.users.map((u: any) => ({ id: u.id, name: u.name })));
        }
      })
      .catch(() => {});
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleSelectedUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeGame = isCustomGame ? customGame.trim() : game;

    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!activeGame) {
      setError('Game is required.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/clips/${clip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          game: activeGame,
          category,
          tags,
          visibility,
          allowed_user_ids: visibility === 'SELECTED' ? selectedUserIds : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update clip.');
        setIsSaving(false);
        return;
      }

      router.push(`/clips/${clip.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error updating clip.');
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Clip Title <span style={{ color: 'var(--accent-primary)' }}>*</span>
        </label>
        <input
          type="text"
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Description
        </label>
        <textarea
          className="textarea-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Game and Category row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Game <span style={{ color: 'var(--accent-primary)' }}>*</span>
          </label>
          {!isCustomGame ? (
            <select
              className="select-field"
              value={game}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomGame(true);
                } else {
                  setGame(e.target.value);
                }
              }}
            >
              {COMMON_GAMES.map((g) => (
                <option key={g} value={g} style={{ background: 'var(--bg-surface)' }}>
                  {g}
                </option>
              ))}
              <option value="__custom__" style={{ background: 'var(--bg-surface)' }}>
                + Custom game...
              </option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                value={customGame}
                onChange={(e) => setCustomGame(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setIsCustomGame(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Category <span style={{ color: 'var(--accent-primary)' }}>*</span>
          </label>
          <select
            className="select-field"
            value={category}
            onChange={(e) => setCategory(e.target.value as ClipCategory)}
          >
            {CLIP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} style={{ background: 'var(--bg-surface)' }}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Tags
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <TagIcon
              size={15}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
          <button type="button" onClick={handleAddTag} className="btn btn-secondary">
            <Plus size={16} /> Add Tag
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              className="badge badge-tag"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.65rem' }}
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                style={{ display: 'flex', color: 'var(--text-dim)' }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div
        style={{
          padding: '1.25rem',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Visibility Settings
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: visibility === 'FRIENDS' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="visibility"
              value="FRIENDS"
              checked={visibility === 'FRIENDS'}
              onChange={() => setVisibility('FRIENDS')}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              <Users size={15} color="var(--accent-success)" />
              <span>Friends</span>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: visibility === 'SELECTED' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="visibility"
              value="SELECTED"
              checked={visibility === 'SELECTED'}
              onChange={() => setVisibility('SELECTED')}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              <Shield size={15} color="var(--accent-warning)" />
              <span>Selected Users</span>
            </div>
          </label>

          {visibility === 'SELECTED' && (
            <div
              style={{
                marginLeft: '2rem',
                padding: '0.75rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                Permitted users:
              </span>
              {availableFriends.map((f) => (
                <label
                  key={f.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(f.id)}
                    onChange={() => toggleSelectedUser(f.id)}
                  />
                  <span>{f.name}</span>
                </label>
              ))}
            </div>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: visibility === 'PRIVATE' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="visibility"
              value="PRIVATE"
              checked={visibility === 'PRIVATE'}
              onChange={() => setVisibility('PRIVATE')}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              <Lock size={15} color="var(--accent-danger)" />
              <span>Private</span>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="btn btn-primary"
        style={{ padding: '0.85rem', fontSize: '1rem' }}
      >
        {isSaving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Saving Changes...</span>
          </>
        ) : (
          <>
            <Save size={18} />
            <span>Save Changes</span>
          </>
        )}
      </button>
    </form>
  );
};
