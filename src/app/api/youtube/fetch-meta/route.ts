import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId, fetchYouTubeMetadata } from '@/lib/youtube';
import { isDuplicateYouTubeVideo } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required.' }, { status: 400 });
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid YouTube watch, embed, or short URL.' },
        { status: 400 }
      );
    }

    // Check duplicate
    const isDuplicate = await isDuplicateYouTubeVideo(videoId);
    if (isDuplicate) {
      return NextResponse.json(
        {
          error: 'This YouTube video has already been added to ClipVault.',
          isDuplicate: true,
          videoId,
        },
        { status: 409 }
      );
    }

    // Fetch oEmbed metadata
    const meta = await fetchYouTubeMetadata(videoId);
    if (!meta) {
      return NextResponse.json({ error: 'Could not fetch video metadata from YouTube.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      videoId: meta.videoId,
      title: meta.title,
      thumbnailUrl: meta.thumbnailUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
