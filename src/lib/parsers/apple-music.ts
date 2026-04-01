const APPLE_MUSIC_HOST = "music.apple.com";

/**
 * Parse an Apple Music song URL into its song ID and storefront.
 *
 * Supported formats:
 *   /us/album/song-name/1234567890?i=9876543210  (song via album, `i` param is song ID)
 *   /us/song/song-name/9876543210                (direct song link, last segment is song ID)
 */
export function parseAppleMusicUrl(
  url: string,
): { songId: string; storefront: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (parsed.hostname !== APPLE_MUSIC_HOST) return null;

  // path segments: ["", storefront, "album"|"song", slug, id]
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 3) return null;

  const [storefront, kind] = segments;

  if (kind === "album") {
    const songId = parsed.searchParams.get("i");
    if (!songId || !/^\d+$/.test(songId)) return null;
    return { songId, storefront: storefront! };
  }

  if (kind === "song") {
    const songId = segments[segments.length - 1];
    if (!songId || !/^\d+$/.test(songId)) return null;
    return { songId, storefront: storefront! };
  }

  return null;
}

/**
 * Quick boolean check: is this string a valid Apple Music song URL?
 */
export function isAppleMusicUrl(url: string): boolean {
  return parseAppleMusicUrl(url) !== null;
}
