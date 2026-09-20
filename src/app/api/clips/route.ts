import { NextRequest, NextResponse } from 'next/server';
import { createClip, getAuthorizedClips, getAvailableGames } from '@/lib/data';
import { getCurrentUser, isUserLoggedIn, isUserApproved } from '@/lib/auth';
import { extractYouTubeVideoId, getCanonicalYouTubeUrl } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const uploaderId = searchParams.get('uploader') || searchParams.get('uploaderId') || undefined;
    const game = searchParams.get('game') || undefined;
    const sortParam = searchParams.get('sort');
    const sortBy = sortParam === 'oldest' ? 'oldest' : 'newest';

    const [clips, availableGames] = await Promise.all([
      getAuthorizedClips({
        search: search || undefined,
        category: category && category !== 'All' ? category : undefined,
        tag: tag || undefined,
        uploaderId: uploaderId && uploaderId !== 'All' ? uploaderId : undefined,
        game: game && game !== 'All' ? game : undefined,
        sortBy,
        currentUserId: user.id,
      }),
      getAvailableGames(),
    ]);

    return NextResponse.json({
      success: true,
      clips,
      total: clips.length,
      availableGames,
      filters: {
        search: search || null,
        category: category || 'All',
        tag: tag || null,
        uploaderId: uploaderId || 'All',
        game: game || 'All',
        sort: sortBy,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!isUserLoggedIn(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: You must sign in to upload clips to ClipVault.' },
        { status: 401 }
      );
    }

    if (!isUserApproved(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Your account is pending admin approval before you can upload clips.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      url,
      title,
      description,
      thumbnailUrl,
      game,
      category,
      tags = [],
      visibility = 'FRIENDS',
      allowedUserIds = [],
    } = body;

    if (!url || !title || !game || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: url, title, game, and category are required.' },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL provided.' }, { status: 400 });
    }

    const canonicalUrl = getCanonicalYouTubeUrl(videoId);

    const clip = await createClip(
      {
        youtube_video_id: videoId,
        youtube_url: canonicalUrl,
        title: title.trim(),
        description: (description || '').trim(),
        thumbnail_url: thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        game: game.trim(),
        category,
        uploaded_by: user.id,
        visibility,
        allowed_user_ids: visibility === 'SELECTED' ? allowedUserIds : undefined,
        tags: tags.map((t: string) => t.trim()).filter(Boolean),
      },
      user
    );

    return NextResponse.json({ success: true, clip }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save clip' }, { status: 400 });
  }
}
