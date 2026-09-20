-- ==============================================================================
-- ClipVault Database Schema & Security Policies (Supabase / PostgreSQL)
-- Authoritative definition based on Master Project Specification
-- ==============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Synchronized with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to automatically create a profile in public.users when a user signs up via Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url, is_approved)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'custom_display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'custom_avatar_url', NEW.raw_user_meta_data->>'avatar_url'),
        FALSE -- New users start unapproved; owner/admin approves them manually
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        name = COALESCE(public.users.name, EXCLUDED.name),
        avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Clips Table
CREATE TABLE IF NOT EXISTS public.clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_video_id TEXT UNIQUE NOT NULL,
    youtube_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT NOT NULL,
    game TEXT NOT NULL,
    category TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    visibility TEXT NOT NULL CHECK (visibility IN ('FRIENDS', 'SELECTED', 'PRIVATE')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for feed sorting and fast video lookup
CREATE INDEX IF NOT EXISTS idx_clips_youtube_id ON public.clips(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON public.clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_uploader ON public.clips(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_clips_category ON public.clips(category);
CREATE INDEX IF NOT EXISTS idx_clips_game ON public.clips(game);

-- 3. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- 4. Clip-Tags Join Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.clip_tags (
    clip_id UUID NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (clip_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_clip_tags_clip ON public.clip_tags(clip_id);
CREATE INDEX IF NOT EXISTS idx_clip_tags_tag ON public.clip_tags(tag_id);

-- 5. Clip Permissions (for 'SELECTED' visibility)
CREATE TABLE IF NOT EXISTS public.clip_permissions (
    clip_id UUID NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (clip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clip_permissions_user ON public.clip_permissions(user_id);

-- 6. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_clip ON public.comments(clip_id, created_at ASC);

-- 7. Reactions Table (Multi-emoji)
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL, -- e.g. '😂', '💀', '🔥', '🤡'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_clip_reaction UNIQUE (clip_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_clip ON public.reactions(clip_id);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- Ensures backend-enforced access control (Section 27 of spec)
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clip_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clip_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current authenticated user is approved
CREATE OR REPLACE FUNCTION public.is_current_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_approved = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: Check if user has permission for a specific clip (SECURITY DEFINER prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_clip_permission(check_clip_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.clip_permissions
        WHERE clip_id = check_clip_id
        AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Users policies
DROP POLICY IF EXISTS "Approved users can view user profiles" ON public.users;
CREATE POLICY "Approved users can view user profiles"
    ON public.users FOR SELECT
    USING (public.is_current_user_approved() OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile name/avatar" ON public.users;
CREATE POLICY "Users can update their own profile name/avatar"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Clips policies
-- Can read clip if:
-- 1. User is approved AND
-- 2. (visibility = FRIENDS OR uploader OR in clip_permissions via SECURITY DEFINER function)
DROP POLICY IF EXISTS "Authorized users can view permitted clips" ON public.clips;
CREATE POLICY "Authorized users can view permitted clips"
    ON public.clips FOR SELECT
    USING (
        public.is_current_user_approved() AND (
            visibility = 'FRIENDS'
            OR uploaded_by = auth.uid()
            OR (visibility = 'SELECTED' AND public.has_clip_permission(id, auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Approved users can insert their own clips" ON public.clips;
CREATE POLICY "Approved users can insert their own clips"
    ON public.clips FOR INSERT
    WITH CHECK (
        public.is_current_user_approved() AND uploaded_by = auth.uid()
    );

DROP POLICY IF EXISTS "Uploaders can update their own clips" ON public.clips;
CREATE POLICY "Uploaders can update their own clips"
    ON public.clips FOR UPDATE
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Uploaders can delete their own clips" ON public.clips;
CREATE POLICY "Uploaders can delete their own clips"
    ON public.clips FOR DELETE
    USING (uploaded_by = auth.uid());

-- Tags & Clip Tags policies
DROP POLICY IF EXISTS "Approved users can view tags" ON public.tags;
CREATE POLICY "Approved users can view tags"
    ON public.tags FOR SELECT
    USING (public.is_current_user_approved());

DROP POLICY IF EXISTS "Approved users can insert tags" ON public.tags;
CREATE POLICY "Approved users can insert tags"
    ON public.tags FOR INSERT
    WITH CHECK (public.is_current_user_approved());

DROP POLICY IF EXISTS "Approved users can view clip_tags" ON public.clip_tags;
CREATE POLICY "Approved users can view clip_tags"
    ON public.clip_tags FOR SELECT
    USING (public.is_current_user_approved());

DROP POLICY IF EXISTS "Uploaders can link tags to their clips" ON public.clip_tags;
CREATE POLICY "Uploaders can link tags to their clips"
    ON public.clip_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = clip_id AND clips.uploaded_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Uploaders can unlink tags from their clips" ON public.clip_tags;
CREATE POLICY "Uploaders can unlink tags from their clips"
    ON public.clip_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = clip_id AND clips.uploaded_by = auth.uid()
        )
    );

-- Clip Permissions policies (Split into SELECT, INSERT, DELETE to prevent recursion)
DROP POLICY IF EXISTS "Approved users can view clip permissions" ON public.clip_permissions;
CREATE POLICY "Approved users can view clip permissions"
    ON public.clip_permissions FOR SELECT
    USING (public.is_current_user_approved());

DROP POLICY IF EXISTS "Uploaders can manage clip permissions" ON public.clip_permissions;
DROP POLICY IF EXISTS "Uploaders can insert clip permissions" ON public.clip_permissions;
CREATE POLICY "Uploaders can insert clip permissions"
    ON public.clip_permissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = clip_id AND clips.uploaded_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Uploaders can delete clip permissions" ON public.clip_permissions;
CREATE POLICY "Uploaders can delete clip permissions"
    ON public.clip_permissions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = clip_id AND clips.uploaded_by = auth.uid()
        )
    );

-- Comments policies
DROP POLICY IF EXISTS "Users who can view a clip can read comments" ON public.comments;
CREATE POLICY "Users who can view a clip can read comments"
    ON public.comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = comments.clip_id
        )
    );

DROP POLICY IF EXISTS "Approved users can post comments on accessible clips" ON public.comments;
CREATE POLICY "Approved users can post comments on accessible clips"
    ON public.comments FOR INSERT
    WITH CHECK (
        public.is_current_user_approved()
        AND user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = comments.clip_id
        )
    );

DROP POLICY IF EXISTS "Users can only delete their own comments" ON public.comments;
CREATE POLICY "Users can only delete their own comments"
    ON public.comments FOR DELETE
    USING (user_id = auth.uid());

-- Reactions policies
DROP POLICY IF EXISTS "Users who can view a clip can read reactions" ON public.reactions;
CREATE POLICY "Users who can view a clip can read reactions"
    ON public.reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = reactions.clip_id
        )
    );

DROP POLICY IF EXISTS "Approved users can add reactions to accessible clips" ON public.reactions;
CREATE POLICY "Approved users can add reactions to accessible clips"
    ON public.reactions FOR INSERT
    WITH CHECK (
        public.is_current_user_approved()
        AND user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.clips
            WHERE clips.id = reactions.clip_id
        )
    );

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.reactions;
CREATE POLICY "Users can remove their own reactions"
    ON public.reactions FOR DELETE
    USING (user_id = auth.uid());

