import { YouTubeMetadata } from './types';

/**
 * Extracts the canonical 11-character YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex matching common YouTube patterns
  const pattern = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(pattern);

  return match ? match[1] : null;
}

/**
 * Returns canonical watch URL
 */
export function getCanonicalYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Returns embedded player URL with privacy and performance parameters
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Returns default high-resolution thumbnail URL for a video ID
 */
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Fetches YouTube video metadata using YouTube's oEmbed endpoint.
 * Works for public and unlisted videos (with embedding enabled) without requiring an API key.
 */
export async function fetchYouTubeMetadata(videoIdOrUrl: string): Promise<YouTubeMetadata | null> {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) return null;

  const canonicalUrl = getCanonicalYouTubeUrl(videoId);
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

  try {
    const res = await fetch(oEmbedUrl, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        videoId,
        title: data.title || `Clip ${videoId}`,
        thumbnailUrl: data.thumbnail_url || getYouTubeThumbnailUrl(videoId),
        authorName: data.author_name,
        authorUrl: data.author_url,
      };
    }
  } catch (error) {
    console.warn(`oEmbed fetch failed for video ${videoId}, falling back to defaults`, error);
  }

  // Fallback if oEmbed is unreachable or throttled
  return {
    videoId,
    title: `YouTube Clip (${videoId})`,
    thumbnailUrl: getYouTubeThumbnailUrl(videoId),
  };
}
