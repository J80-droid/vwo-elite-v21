/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * YouTube Service
 * Extracts video metadata and transcripts from YouTube URLs
 */

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface VideoMetadata {
  title: string;
  description: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
}

interface YouTubeResult {
  videoId: string;
  metadata: VideoMetadata;
  transcript: string;
  segments: TranscriptSegment[];
}

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] || null;
  }
  return null;
}

/**
 * Fetch video metadata using oEmbed (no API key required)
 */
async function fetchVideoMetadata(
  videoId: string,
): Promise<VideoMetadata | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();

    return {
      title: data.title || "Onbekende Video",
      description: "",
      channelTitle: data.author_name || "Onbekend Kanaal",
      thumbnail:
        data.thumbnail_url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: "",
      publishedAt: "",
    };
  } catch (error) {
    console.error("[YouTubeService] Failed to fetch metadata:", error);
    return null;
  }
}

/**
 * Fetch transcript using a CORS proxy or fallback
 * Note: YouTube doesn't provide a public transcript API, so we use workarounds
 */
async function fetchTranscript(
  videoId: string,
): Promise<{ transcript: string; segments: TranscriptSegment[] }> {
  try {
    // Try fetching via a public transcript extraction service
    // This uses the youtube-transcript-api pattern via a proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}`;

    const response = await fetch(proxyUrl);
    const html = await response.text();

    // Extract captions from the page data
    const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);

    if (captionMatch) {
      const captionsData = JSON.parse(`[${captionMatch[1]}]`);
      const nlCaption =
        captionsData.find((c: any) => c.languageCode === "nl") ||
        captionsData.find((c: any) => c.languageCode === "en") ||
        captionsData[0];

      if (nlCaption?.baseUrl) {
        const captionResponse = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(nlCaption.baseUrl)}`,
        );
        const captionXml = await captionResponse.text();

        // Parse the XML transcript
        const segments: TranscriptSegment[] = [];
        const textMatches = captionXml.matchAll(
          /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g,
        );

        for (const match of textMatches) {
          segments.push({
            start: parseFloat(match[1]!),
            duration: parseFloat(match[2]!),
            text: decodeHTMLEntities(match[3]!),
          });
        }

        const transcript = segments.map((s) => s.text).join(" ");
        return { transcript, segments };
      }
    }

    // Fallback: Return empty if no captions found
    return {
      transcript: `[Geen ondertiteling beschikbaar voor video ${videoId}. Bekijk de video op YouTube.]`,
      segments: [],
    };
  } catch (error) {
    console.error("[YouTubeService] Failed to fetch transcript:", error);
    return {
      transcript: `[Kon ondertiteling niet ophalen. Probeer de video handmatig te bekijken.]`,
      segments: [],
    };
  }
}

/**
 * Helper to decode HTML entities in transcript text
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#32;": " ",
    "\n": " ",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }
  return decoded.trim();
}

/**
 * Main function: Extract everything from a YouTube URL
 */
export async function extractYouTubeContent(
  url: string,
): Promise<YouTubeResult | null> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    console.error("[YouTubeService] Invalid YouTube URL:", url);
    return null;
  }

  const [metadata, transcriptData] = await Promise.all([
    fetchVideoMetadata(videoId),
    fetchTranscript(videoId),
  ]);

  if (!metadata) return null;

  return {
    videoId,
    metadata,
    transcript: transcriptData.transcript,
    segments: transcriptData.segments,
  };
}
