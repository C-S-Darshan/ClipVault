export type ClipVisibility = 'FRIENDS' | 'SELECTED' | 'PRIVATE';

export const CLIP_CATEGORIES = [
  'Stupid/Funny',
  'Cool Moment',
  'Gaming',
  'IRL',
  'Voice/Discord',
  'Fail',
  'Clutch',
] as const;

export type ClipCategory = (typeof CLIP_CATEGORIES)[number] | string;

export const DEFAULT_REACTION_EMOJIS = ['😂', '💀', '🔥', '🤡'] as const;
export type ReactionEmoji = (typeof DEFAULT_REACTION_EMOJIS)[number];

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_approved: boolean;
  created_at: string;
}

export interface ClipTag {
  id: string;
  name: string;
}

export interface ClipReactionSummary {
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
}

export interface ClipComment {
  id: string;
  clip_id: string;
  user_id: string;
  user: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Clip {
  id: string;
  youtube_video_id: string;
  youtube_url: string;
  title: string;
  description?: string;
  thumbnail_url: string;
  game: string;
  category: ClipCategory;
  uploaded_by: string;
  uploader: {
    id: string;
    name: string;
    avatar_url?: string;
    email: string;
  };
  visibility: ClipVisibility;
  allowed_user_ids?: string[];
  tags: string[];
  reactions: ClipReactionSummary[];
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  authorName?: string;
  authorUrl?: string;
}

export interface ClipFilterOptions {
  search?: string;
  category?: string;
  tag?: string;
  uploaderId?: string;
  game?: string;
  sortBy?: 'newest' | 'oldest';
  currentUserId?: string;
}

export interface UserActivity {
  id: string;
  type: 'comment' | 'reaction';
  clip_id: string;
  clip_title: string;
  clip_thumbnail: string;
  actor: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
  content?: string;
  emoji?: string;
  created_at: string;
}

export interface ThemeSettings {
  accentColor: string;
  accentGlow: string;
  bgMain: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  bgSurfaceGlass: string;
}

