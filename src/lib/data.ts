import fs from 'fs';
import path from 'path';
import { Clip, ClipComment, ClipReactionSummary, UserProfile, UserActivity, ClipFilterOptions } from './types';
import { INITIAL_MOCK_CLIPS, INITIAL_MOCK_COMMENTS, MOCK_USERS, CURRENT_USER } from './mock-data';
import { isSupabaseConfigured } from './auth';
import { createServerSupabaseClient } from './supabase/server';

export type { ClipFilterOptions };

// Persistent file-backed cache for development preview mode
const DEV_CACHE_FILE = path.join(process.cwd(), '.clipvault-dev-data.json');

interface DevStore {
  clips: Clip[];
  comments: Record<string, ClipComment[]>;
}

function loadDevStore(): DevStore {
  try {
    if (fs.existsSync(DEV_CACHE_FILE)) {
      const content = fs.readFileSync(DEV_CACHE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Failed to read dev cache file, initializing defaults:', err);
  }

  const initial: DevStore = {
    clips: [...INITIAL_MOCK_CLIPS],
    comments: { ...INITIAL_MOCK_COMMENTS },
  };

  try {
    fs.writeFileSync(DEV_CACHE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    // Ignore in read-only environments
  }

  return initial;
}

function saveDevStore(store: DevStore) {
  try {
    fs.writeFileSync(DEV_CACHE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save dev cache file:', err);
  }
}

function getDevStore(): DevStore {
  const globalObj = globalThis as unknown as { __clipvault_store?: DevStore };
  if (!globalObj.__clipvault_store) {
    globalObj.__clipvault_store = loadDevStore();
  }
  // Also reload from disk if file was updated by another process/worker
  try {
    if (fs.existsSync(DEV_CACHE_FILE)) {
      const content = fs.readFileSync(DEV_CACHE_FILE, 'utf-8');
      globalObj.__clipvault_store = JSON.parse(content);
    }
  } catch {}

  return globalObj.__clipvault_store || loadDevStore();
}

/**
 * Retrieves clips that the current user is authorized to see.
 * Authorization logic adheres strictly to Section 9 & 19 of specification:
 * - FRIENDS: visible to all approved users
 * - PRIVATE: visible ONLY to uploader
 * - SELECTED: visible to uploader OR users in clip_permissions
 */
export async function getAuthorizedClips(options: ClipFilterOptions = {}): Promise<Clip[]> {
  const {
    search = '',
    category,
    tag,
    uploaderId,
    game,
    sortBy = 'newest',
    currentUserId = CURRENT_USER.id,
  } = options;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      let query = supabase
        .from('clips')
        .select(`
          *,
          uploader:users!uploaded_by(id, name, avatar_url, email),
          clip_tags(tags(name)),
          clip_permissions(user_id),
          comments(count),
          reactions(emoji, user_id)
        `);

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (uploaderId && uploaderId !== 'All') {
        query = query.eq('uploaded_by', uploaderId);
      }

      if (game && game !== 'All') {
        query = query.ilike('game', game);
      }

      if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        let mappedClips: Clip[] = data.map((item: any) => {
          const tags = (item.clip_tags || []).map((ct: any) => ct.tags?.name).filter(Boolean);
          const reactionsMap: Record<string, { count: number; reactedByCurrentUser: boolean }> = {};
          (item.reactions || []).forEach((r: any) => {
            if (!reactionsMap[r.emoji]) {
              reactionsMap[r.emoji] = { count: 0, reactedByCurrentUser: false };
            }
            reactionsMap[r.emoji].count += 1;
            if (r.user_id === currentUserId) {
              reactionsMap[r.emoji].reactedByCurrentUser = true;
            }
          });

          return {
            id: item.id,
            youtube_video_id: item.youtube_video_id,
            youtube_url: item.youtube_url,
            title: item.title,
            description: item.description,
            thumbnail_url: item.thumbnail_url,
            game: item.game,
            category: item.category,
            uploaded_by: item.uploaded_by,
            uploader: item.uploader || {
              id: item.uploaded_by,
              name: 'Unknown',
              email: '',
            },
            visibility: item.visibility,
            tags,
            reactions: Object.entries(reactionsMap).map(([emoji, meta]) => ({
              emoji,
              count: meta.count,
              reactedByCurrentUser: meta.reactedByCurrentUser,
            })),
            comments_count: item.comments?.[0]?.count || 0,
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
        });

        // Search filtering (title & tags)
        if (search.trim()) {
          const q = search.toLowerCase();
          mappedClips = mappedClips.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.game.toLowerCase().includes(q) ||
              c.tags.some((t) => t.toLowerCase().includes(q))
          );
        }

        if (tag) {
          mappedClips = mappedClips.filter((c) =>
            c.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
          );
        }

        return mappedClips;
      }

      if (error) {
        console.error('Supabase clips query error:', error.message);
        return [];
      }

      return [];
    }
  }

  // Memory / Local Preview Mode authorization logic
  const store = getDevStore();
  let filtered = store.clips.filter((clip) => {
    if (clip.visibility === 'FRIENDS') return true;
    if (clip.visibility === 'PRIVATE') return clip.uploaded_by === currentUserId;
    if (clip.visibility === 'SELECTED') {
      return (
        clip.uploaded_by === currentUserId ||
        (clip.allowed_user_ids && clip.allowed_user_ids.includes(currentUserId))
      );
    }
    return false;
  });

  if (category && category !== 'All') {
    filtered = filtered.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  }

  if (uploaderId && uploaderId !== 'All') {
    filtered = filtered.filter((c) => c.uploaded_by === uploaderId);
  }

  if (game && game !== 'All') {
    filtered = filtered.filter((c) => c.game.toLowerCase() === game.toLowerCase());
  }

  if (tag) {
    filtered = filtered.filter((c) =>
      c.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.game.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sorting
  filtered.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  return filtered;
}

/**
 * Retrieves a single clip by ID with authorization verification
 */
export async function getClipById(id: string, currentUserId: string = CURRENT_USER.id): Promise<Clip | null> {
  const clips = await getAuthorizedClips({ currentUserId });
  const clip = clips.find((c) => c.id === id);
  return clip || null;
}

/**
 * Checks whether a YouTube video ID already exists in ClipVault (duplicate prevention - Section 29)
 */
export async function isDuplicateYouTubeVideo(youtubeVideoId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('clips')
        .select('id')
        .eq('youtube_video_id', youtubeVideoId)
        .maybeSingle();
      return Boolean(data);
    }
  }

  const store = getDevStore();
  return store.clips.some((c) => c.youtube_video_id === youtubeVideoId);
}

/**
 * Adds a new clip
 */
export async function createClip(
  clipData: Omit<Clip, 'id' | 'created_at' | 'updated_at' | 'reactions' | 'comments_count' | 'uploader'>,
  user: UserProfile
): Promise<Clip> {
  const isDuplicate = await isDuplicateYouTubeVideo(clipData.youtube_video_id);
  if (isDuplicate) {
    throw new Error('This YouTube video has already been added to ClipVault.');
  }

  const now = new Date().toISOString();
  const newClip: Clip = {
    ...clipData,
    id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    uploaded_by: user.id,
    uploader: {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      email: user.email,
    },
    reactions: [
      { emoji: '😂', count: 0, reactedByCurrentUser: false },
      { emoji: '💀', count: 0, reactedByCurrentUser: false },
      { emoji: '🔥', count: 0, reactedByCurrentUser: false },
      { emoji: '🤡', count: 0, reactedByCurrentUser: false },
    ],
    comments_count: 0,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('clips')
        .insert({
          youtube_video_id: clipData.youtube_video_id,
          youtube_url: clipData.youtube_url,
          title: clipData.title,
          description: clipData.description,
          thumbnail_url: clipData.thumbnail_url,
          game: clipData.game,
          category: clipData.category,
          uploaded_by: user.id,
          visibility: clipData.visibility,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      for (const tagName of clipData.tags) {
        const { data: tagData } = await supabase
          .from('tags')
          .upsert({ name: tagName }, { onConflict: 'name' })
          .select()
          .single();

        if (tagData) {
          await supabase.from('clip_tags').insert({
            clip_id: data.id,
            tag_id: tagData.id,
          });
        }
      }

      if (clipData.visibility === 'SELECTED' && clipData.allowed_user_ids) {
        for (const allowedId of clipData.allowed_user_ids) {
          await supabase.from('clip_permissions').insert({
            clip_id: data.id,
            user_id: allowedId,
          });
        }
      }

      return {
        ...newClip,
        id: data.id,
      };
    }
  }

  // Add to persistent dev store
  const store = getDevStore();
  store.clips.unshift(newClip);
  store.comments[newClip.id] = [];
  saveDevStore(store);

  return newClip;
}

/**
 * Updates an existing clip's metadata (only allowed by uploader)
 */
export async function updateClip(
  clipId: string,
  updates: Partial<Pick<Clip, 'title' | 'description' | 'game' | 'category' | 'tags' | 'visibility' | 'allowed_user_ids'>>,
  userId: string
): Promise<Clip> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) updatePayload.title = updates.title.trim();
      if (updates.description !== undefined) updatePayload.description = (updates.description || '').trim();
      if (updates.game !== undefined) updatePayload.game = updates.game.trim();
      if (updates.category !== undefined) updatePayload.category = updates.category;
      if (updates.visibility !== undefined) updatePayload.visibility = updates.visibility;

      const { error } = await supabase
        .from('clips')
        .update(updatePayload)
        .eq('id', clipId)
        .eq('uploaded_by', userId);

      if (error) {
        throw new Error(error.message);
      }

      if (updates.tags !== undefined) {
        await supabase.from('clip_tags').delete().eq('clip_id', clipId);
        for (const tagName of updates.tags) {
          const { data: tagData } = await supabase
            .from('tags')
            .upsert({ name: tagName.trim() }, { onConflict: 'name' })
            .select()
            .single();

          if (tagData) {
            await supabase.from('clip_tags').insert({
              clip_id: clipId,
              tag_id: tagData.id,
            });
          }
        }
      }

      if (updates.visibility !== undefined || updates.allowed_user_ids !== undefined) {
        await supabase.from('clip_permissions').delete().eq('clip_id', clipId);
        if (updates.visibility === 'SELECTED' && updates.allowed_user_ids) {
          for (const allowedId of updates.allowed_user_ids) {
            await supabase.from('clip_permissions').insert({
              clip_id: clipId,
              user_id: allowedId,
            });
          }
        }
      }

      const updatedClip = await getClipById(clipId, userId);
      if (!updatedClip) throw new Error('Clip not found after update.');
      return updatedClip;
    }
  }

  const store = getDevStore();
  const existingIndex = store.clips.findIndex((c) => c.id === clipId);
  if (existingIndex === -1) {
    throw new Error('Clip not found.');
  }

  const existing = store.clips[existingIndex];
  if (existing.uploaded_by !== userId) {
    throw new Error('Unauthorized: Only the uploader can edit this clip.');
  }

  const updated: Clip = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  store.clips[existingIndex] = updated;
  saveDevStore(store);

  return updated;
}

/**
 * Deletes a clip (only allowed by uploader)
 */
export async function deleteClip(clipId: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from('clips')
        .delete()
        .eq('id', clipId)
        .eq('uploaded_by', userId);

      if (error) {
        throw new Error(error.message);
      }
      return true;
    }
  }

  const store = getDevStore();
  const existingIndex = store.clips.findIndex((c) => c.id === clipId);
  if (existingIndex === -1) {
    return false;
  }

  if (store.clips[existingIndex].uploaded_by !== userId) {
    throw new Error('Unauthorized: Only the uploader can delete this clip.');
  }

  store.clips.splice(existingIndex, 1);
  delete store.comments[clipId];
  saveDevStore(store);

  return true;
}

/**
 * Comments retrieval for a clip
 */
export async function getClipComments(clipId: string): Promise<ClipComment[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          clip_id,
          user_id,
          content,
          created_at,
          updated_at,
          user:users!user_id(name, email, avatar_url)
        `)
        .eq('clip_id', clipId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data.map((c: any) => {
          const commentUser = Array.isArray(c.user) ? c.user[0] : c.user;
          return {
            id: c.id,
            clip_id: c.clip_id,
            user_id: c.user_id,
            content: c.content,
            created_at: c.created_at,
            updated_at: c.updated_at,
            user: commentUser || {
              name: 'Unknown',
              email: '',
            },
          };
        });
      }
    }
  }

  const store = getDevStore();
  return store.comments[clipId] || [];
}

/**
 * Add a comment to a clip
 */
export async function addClipComment(
  clipId: string,
  content: string,
  user: UserProfile
): Promise<ClipComment> {
  if (!content || !content.trim()) {
    throw new Error('Comment content cannot be empty.');
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          clip_id: clipId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`
          id,
          clip_id,
          user_id,
          content,
          created_at,
          updated_at,
          user:users!user_id(name, email, avatar_url)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const commentData = data as any;
      const commentUser = Array.isArray(commentData.user) ? commentData.user[0] : commentData.user;

      return {
        id: commentData.id,
        clip_id: commentData.clip_id,
        user_id: commentData.user_id,
        content: commentData.content,
        created_at: commentData.created_at,
        updated_at: commentData.updated_at,
        user: commentUser || {
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        },
      };
    }
  }

  const newComment: ClipComment = {
    id: `comm-${Date.now()}`,
    clip_id: clipId,
    user_id: user.id,
    user: {
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    },
    content: content.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const store = getDevStore();
  if (!store.comments[clipId]) {
    store.comments[clipId] = [];
  }
  store.comments[clipId].push(newComment);

  const clip = store.clips.find((c) => c.id === clipId);
  if (clip) {
    clip.comments_count = (clip.comments_count || 0) + 1;
  }

  saveDevStore(store);
  return newComment;
}

/**
 * Delete a comment (strictly author-only - Section 21)
 */
export async function deleteClipComment(commentId: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }
      return true;
    }
  }

  const store = getDevStore();
  for (const clipId of Object.keys(store.comments)) {
    const list = store.comments[clipId];
    const targetIdx = list.findIndex((c) => c.id === commentId);
    if (targetIdx !== -1) {
      if (list[targetIdx].user_id !== userId) {
        throw new Error('Unauthorized: You can only delete your own comments.');
      }
      list.splice(targetIdx, 1);
      const clip = store.clips.find((c) => c.id === clipId);
      if (clip && clip.comments_count > 0) {
        clip.comments_count -= 1;
      }
      saveDevStore(store);
      return true;
    }
  }
  return false;
}

/**
 * Toggle an emoji reaction on a clip
 */
export async function toggleClipReaction(
  clipId: string,
  emoji: string,
  userId: string
): Promise<ClipReactionSummary[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('clip_id', clipId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').insert({
          clip_id: clipId,
          user_id: userId,
          emoji,
        });
      }

      const { data: allReactions } = await supabase
        .from('reactions')
        .select('emoji, user_id')
        .eq('clip_id', clipId);

      const map: Record<string, { count: number; reactedByCurrentUser: boolean }> = {};
      (allReactions || []).forEach((r: any) => {
        if (!map[r.emoji]) {
          map[r.emoji] = { count: 0, reactedByCurrentUser: false };
        }
        map[r.emoji].count += 1;
        if (r.user_id === userId) {
          map[r.emoji].reactedByCurrentUser = true;
        }
      });

      const defaultEmojis = ['😂', '💀', '🔥', '🤡'];
      return defaultEmojis.map((e) => ({
        emoji: e,
        count: map[e]?.count || 0,
        reactedByCurrentUser: map[e]?.reactedByCurrentUser || false,
      }));
    }
  }

  const store = getDevStore();
  const clip = store.clips.find((c) => c.id === clipId);
  if (!clip) throw new Error('Clip not found.');

  let summary = clip.reactions.find((r) => r.emoji === emoji);
  if (!summary) {
    summary = { emoji, count: 0, reactedByCurrentUser: false };
    clip.reactions.push(summary);
  }

  if (summary.reactedByCurrentUser) {
    summary.count = Math.max(0, summary.count - 1);
    summary.reactedByCurrentUser = false;
  } else {
    summary.count += 1;
    summary.reactedByCurrentUser = true;
  }

  saveDevStore(store);
  return clip.reactions;
}

/**
 * Retrieves the distinct list of games from clips
 */
export async function getAvailableGames(): Promise<string[]> {
  const clips = await getAuthorizedClips();
  const gameSet = new Set<string>();
  clips.forEach((c) => {
    if (c.game && c.game.trim()) {
      gameSet.add(c.game.trim());
    }
  });
  return Array.from(gameSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Updates a user profile (display name and avatar_url)
 * Synchronizes across clips and comments
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar_url?: string }
): Promise<UserProfile> {
  const cleanName = updates.name?.trim();
  const cleanAvatar = updates.avatar_url?.trim();

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const payload: Record<string, any> = {};
      if (cleanName) payload.name = cleanName;
      if (cleanAvatar !== undefined) payload.avatar_url = cleanAvatar || null;

      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as UserProfile;
    }
  }

  // Local preview dev store
  const store = getDevStore();
  const targetUser = MOCK_USERS.find((u) => u.id === userId) || CURRENT_USER;
  if (cleanName) targetUser.name = cleanName;
  if (cleanAvatar !== undefined) targetUser.avatar_url = cleanAvatar || undefined;

  // Sync uploader metadata across all existing clips and comments in local dev store
  store.clips.forEach((clip) => {
    if (clip.uploaded_by === userId) {
      clip.uploader.name = targetUser.name;
      if (cleanAvatar !== undefined) clip.uploader.avatar_url = targetUser.avatar_url;
    }
  });

  Object.values(store.comments).forEach((commentList) => {
    commentList.forEach((comment) => {
      if (comment.user_id === userId) {
        comment.user.name = targetUser.name;
        if (cleanAvatar !== undefined) comment.user.avatar_url = targetUser.avatar_url;
      }
    });
  });

  saveDevStore(store);
  return targetUser;
}

/**
 * Retrieves vault statistics for a given user
 */
export async function getUserStats(userId: string): Promise<{
  clipsCount: number;
  reactionsReceived: number;
  commentsCount: number;
}> {
  const allClips = await getAuthorizedClips({ currentUserId: userId });
  const userClips = allClips.filter((c) => c.uploaded_by === userId);
  const clipsCount = userClips.length;

  let reactionsReceived = 0;
  userClips.forEach((c) => {
    (c.reactions || []).forEach((r) => {
      reactionsReceived += r.count;
    });
  });

  let commentsCount = 0;
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { count } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      commentsCount = count || 0;
    }
  } else {
    const store = getDevStore();
    Object.values(store.comments).forEach((commList) => {
      commentsCount += commList.filter((c) => c.user_id === userId).length;
    });
  }

  return { clipsCount, reactionsReceived, commentsCount };
}

/**
 * Retrieves activity items (comments & reactions by other users on clips uploaded by this user)
 */
export async function getUserActivities(userId: string): Promise<UserActivity[]> {
  const activities: UserActivity[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      // Find all clips uploaded by this user
      const { data: userClips } = await supabase
        .from('clips')
        .select('id, title, thumbnail_url')
        .eq('uploaded_by', userId);

      if (userClips && userClips.length > 0) {
        const clipMap = new Map(userClips.map((c: any) => [c.id, c]));
        const clipIds = userClips.map((c: any) => c.id);

        // Fetch comments by others on user's clips
        const { data: comments } = await supabase
          .from('comments')
          .select('id, clip_id, user_id, content, created_at, user:users!user_id(id, name, avatar_url, email)')
          .in('clip_id', clipIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        (comments || []).forEach((c: any) => {
          const clip = clipMap.get(c.clip_id);
          const actor = Array.isArray(c.user) ? c.user[0] : c.user;
          if (clip) {
            activities.push({
              id: `act-comm-${c.id}`,
              type: 'comment',
              clip_id: c.clip_id,
              clip_title: clip.title,
              clip_thumbnail: clip.thumbnail_url,
              actor: {
                id: actor?.id || c.user_id,
                name: actor?.name || 'Friend',
                avatar_url: actor?.avatar_url,
                email: actor?.email,
              },
              content: c.content,
              created_at: c.created_at,
            });
          }
        });

        // Fetch reactions by others on user's clips
        const { data: reactions } = await supabase
          .from('reactions')
          .select('id, clip_id, user_id, emoji, created_at, user:users!user_id(id, name, avatar_url, email)')
          .in('clip_id', clipIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        (reactions || []).forEach((r: any) => {
          const clip = clipMap.get(r.clip_id);
          const actor = Array.isArray(r.user) ? r.user[0] : r.user;
          if (clip) {
            activities.push({
              id: `act-react-${r.id}`,
              type: 'reaction',
              clip_id: r.clip_id,
              clip_title: clip.title,
              clip_thumbnail: clip.thumbnail_url,
              actor: {
                id: actor?.id || r.user_id,
                name: actor?.name || 'Friend',
                avatar_url: actor?.avatar_url,
                email: actor?.email,
              },
              emoji: r.emoji,
              created_at: r.created_at,
            });
          }
        });
      }
    }
  } else {
    // Local Preview Dev Store
    const store = getDevStore();
    const userClips = store.clips.filter((c) => c.uploaded_by === userId);

    userClips.forEach((clip) => {
      const clipComments = store.comments[clip.id] || [];
      clipComments.forEach((comm) => {
        if (comm.user_id !== userId) {
          activities.push({
            id: `act-${comm.id}`,
            type: 'comment',
            clip_id: clip.id,
            clip_title: clip.title,
            clip_thumbnail: clip.thumbnail_url,
            actor: {
              id: comm.user_id,
              name: comm.user.name,
              avatar_url: comm.user.avatar_url,
              email: comm.user.email,
            },
            content: comm.content,
            created_at: comm.created_at,
          });
        }
      });

      // Include simulated/historical reactions from friends on user's clips
      clip.reactions.forEach((r, idx) => {
        if (r.count > 0 && !r.reactedByCurrentUser) {
          const friend = MOCK_USERS.find((u) => u.id !== userId) || MOCK_USERS[1];
          activities.push({
            id: `act-react-${clip.id}-${r.emoji}-${idx}`,
            type: 'reaction',
            clip_id: clip.id,
            clip_title: clip.title,
            clip_thumbnail: clip.thumbnail_url,
            actor: {
              id: friend.id,
              name: friend.name,
              avatar_url: friend.avatar_url,
              email: friend.email,
            },
            emoji: r.emoji,
            created_at: clip.created_at,
          });
        }
      });
    });
  }

  // Sort newest first
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return activities;
}

