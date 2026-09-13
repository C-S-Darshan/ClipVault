'use client';

import React, { useState } from 'react';
import { ClipComment, ClipReactionSummary, DEFAULT_REACTION_EMOJIS, UserProfile } from '@/lib/types';
import { MessageSquare, Trash2, Send, Loader2 } from 'lucide-react';

interface ClipInteractionsProps {
  clipId: string;
  initialReactions: ClipReactionSummary[];
  initialComments: ClipComment[];
  currentUser: UserProfile;
}

export const ClipInteractions: React.FC<ClipInteractionsProps> = ({
  clipId,
  initialReactions,
  initialComments,
  currentUser,
}) => {
  const [reactions, setReactions] = useState<ClipReactionSummary[]>(initialReactions);
  const [comments, setComments] = useState<ClipComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isTogglingReaction, setIsTogglingReaction] = useState<string | null>(null);

  // Toggle reaction
  const handleToggleReaction = async (emoji: string) => {
    if (isTogglingReaction) return;
    setIsTogglingReaction(emoji);

    // Optimistic UI update
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        return prev.map((r) =>
          r.emoji === emoji
            ? {
                ...r,
                count: r.reactedByCurrentUser ? Math.max(0, r.count - 1) : r.count + 1,
                reactedByCurrentUser: !r.reactedByCurrentUser,
              }
            : r
        );
      } else {
        return [...prev, { emoji, count: 1, reactedByCurrentUser: true }];
      }
    });

    try {
      const res = await fetch(`/api/clips/${clipId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (data.reactions) {
        setReactions(data.reactions);
      }
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    } finally {
      setIsTogglingReaction(null);
    }
  };

  // Post comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPostingComment) return;

    setIsPostingComment(true);
    const contentToPost = newComment.trim();

    try {
      const res = await fetch(`/api/clips/${clipId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToPost }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete comment (author only)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/clips/${clipId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Reactions Section */}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
          REACTIONS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {DEFAULT_REACTION_EMOJIS.map((emoji) => {
            const summary = reactions.find((r) => r.emoji === emoji);
            const count = summary?.count || 0;
            const hasReacted = summary?.reactedByCurrentUser || false;

            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggleReaction(emoji)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '1rem',
                  background: hasReacted ? 'rgba(99, 102, 241, 0.25)' : 'var(--bg-surface-elevated)',
                  border: hasReacted ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  color: hasReacted ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: hasReacted ? 'var(--shadow-glow)' : 'none',
                }}
              >
                <span>{emoji}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discussion / Comments Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Discussion ({comments.length})
          </h2>
        </div>

        {/* Comment input form */}
        <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          <textarea
            className="textarea-field"
            placeholder="Write a comment or quote a timestamp..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isPostingComment || !newComment.trim()}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.5rem 1rem' }}
            >
              {isPostingComment ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Comment</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Comments Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {comments.length > 0 ? (
            comments.map((c) => {
              const isAuthor = c.user_id === currentUser.id;
              const formattedCommentDate = new Date(c.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    padding: '1rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {c.user?.avatar_url ? (
                    <img
                      src={c.user.avatar_url}
                      alt={c.user.name}
                      style={{ width: '2rem', height: '2rem', borderRadius: '50%', objectFit: 'cover' }}
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
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {c.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
                          {c.user?.name || 'User'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {formattedCommentDate}
                        </span>
                      </div>

                      {/* Author-only delete button */}
                      {isAuthor && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          title="Delete your comment"
                          style={{
                            color: 'var(--text-dim)',
                            padding: '0.2rem',
                            display: 'flex',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-danger)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              No comments yet. Start the conversation!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
