import { NextRequest, NextResponse } from 'next/server';
import { createClip, getAuthorizedClips } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { extractYouTubeVideoId, getCanonicalYouTubeUrl } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const clips = await getAuthorizedClips({ currentUserId: user.id });
    return NextResponse.json({ clips });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
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
