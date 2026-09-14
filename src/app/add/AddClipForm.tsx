'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CLIP_CATEGORIES, ClipCategory, ClipVisibility, UserProfile } from '@/lib/types';
import {
  ArrowLeft,
  Sparkles,
  Link as LinkIcon,
  Tag as TagIcon,
  Users,
  Shield,
  Lock,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
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

interface AddClipFormProps {
  user: UserProfile;
}

export const AddClipForm: React.FC<AddClipFormProps> = ({ user }) => {
  const router = useRouter();

  // Form states
  const [url, setUrl] = useState('');
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [videoId, setVideoId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [game, setGame] = useState('F1 24');
  const [customGame, setCustomGame] = useState('');
  const [isCustomGame, setIsCustomGame] = useState(false);

  const [category, setCategory] = useState<ClipCategory>('Stupid/Funny');

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['F1', 'Funny']);

  const [visibility, setVisibility] = useState<ClipVisibility>('FRIENDS');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch YouTube Metadata
  const handleFetchMetadata = async (targetUrl?: string) => {
    const urlToFetch = targetUrl || url;
    if (!urlToFetch.trim()) return;

    setIsFetchingMeta(true);
    setMetaError(null);

    try {
      const res = await fetch('/api/youtube/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMetaError(data.error || 'Failed to fetch YouTube details.');
        return;
      }

      setVideoId(data.videoId);
      setThumbnailUrl(data.thumbnailUrl);
      if (!title) {
        setTitle(data.title);
      }
    } catch (err: any) {
      setMetaError('Network error while fetching YouTube video info.');
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleUrlBlur = () => {
    if (url && !videoId) {
      handleFetchMetadata();
    }
  };

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
    setSubmitError(null);

    const activeGame = isCustomGame ? customGame.trim() : game;

    if (!url.trim()) {
      setSubmitError('YouTube URL is required.');
      return;
    }
    if (!title.trim()) {
      setSubmitError('Clip title is required.');
      return;
    }
    if (!activeGame) {
      setSubmitError('Please select or specify a game.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title,
          description,
          thumbnailUrl,
          game: activeGame,
          category,
          tags,
          visibility,
          allowedUserIds: visibility === 'SELECTED' ? selectedUserIds : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to save clip.');
        setIsSubmitting(false);
        return;
      }

      // Success -> navigate to new clip or homepage
      router.push(`/clips/${data.clip.id}`);
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while saving.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      {/* Back button */}
      <Link
        href="/"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} /> Back to Library
      </Link>

      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Add YouTube Clip
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Paste your YouTube unlisted video URL. ClipVault will automatically resolve the metadata and configure access rules.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* YouTube URL input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              YouTube Unlisted URL <span style={{ color: 'var(--accent-primary)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <LinkIcon
                  size={16}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => handleFetchMetadata()}
                disabled={isFetchingMeta || !url}
                className="btn btn-secondary"
                style={{ flexShrink: 0 }}
              >
                {isFetchingMeta ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Fetch Video</span>
              </button>
            </div>

            {metaError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem',
                }}
              >
                <AlertCircle size={14} />
                <span>{metaError}</span>
              </div>
            )}
          </div>

          {/* Thumbnail & Video Preview Box */}
          {thumbnailUrl && (
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#000',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
              }}
            >
              <div style={{ width: '100%', aspectRatio: '16/9', maxHeight: '240px', overflow: 'hidden' }}>
                <img
                  src={thumbnailUrl}
                  alt="YouTube Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CheckCircle2 size={12} color="var(--accent-success)" />
                <span>ID: {videoId}</span>
              </div>
            </div>
          )}

          {/* Title input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Clip Title <span style={{ color: 'var(--accent-primary)' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Insane 1v4 clutch on Mirage 💀"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Description <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="textarea-field"
              placeholder="Add some funny context, who was in call, or what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Game and Category row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Game */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Game <span style={{ color: 'var(--accent-primary)' }}>*</span>
              </label>
              {!isCustomGame ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                      + Add custom game...
                    </option>
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter game title..."
                    value={customGame}
                    onChange={(e) => setCustomGame(e.target.value)}
                    autoFocus
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

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Primary Category <span style={{ color: 'var(--accent-primary)' }}>*</span>
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
              Tags <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(press Enter to add)</span>
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
                  placeholder="e.g. Crash, Singapore, Rahul, 1v4..."
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

            {/* Tag Pills */}
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

          {/* Visibility Section */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Clip Visibility & Access Control
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Friends */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
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
                  style={{ marginTop: '0.2rem' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Users size={15} color="var(--accent-success)" />
                    <span>Friends (Default)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    All approved members in your friend group can discover and watch this clip.
                  </div>
                </div>
              </label>

              {/* Selected */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
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
                  style={{ marginTop: '0.2rem' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Shield size={15} color="var(--accent-warning)" />
                    <span>Selected Users</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Only you and specifically chosen approved members can see this clip in ClipVault.
                  </div>
                </div>
              </label>

              {/* Selected users picker */}
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
                    Select permitted friends:
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

              {/* Private */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
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
                  style={{ marginTop: '0.2rem' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Lock size={15} color="var(--accent-danger)" />
                    <span>Private</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Only you will be able to see and watch this clip.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
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
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving to ClipVault...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Save Clip to Vault</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
