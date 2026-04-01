const SPOTIFY_TRACK_RE =
  /^(?:https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/|spotify:track:)([a-zA-Z0-9]{22})(?:[?#].*)?$/;

/**
 * Extract a Spotify track ID from a URL or URI.
 * Returns the 22-char track ID, or null if the input isn't a valid Spotify track link.
 */
export function parseSpotifyUrl(url: string): string | null {
  const match = url.trim().match(SPOTIFY_TRACK_RE);
  return match?.[1] ?? null;
}

/**
 * Quick boolean check: is this string a valid Spotify track URL/URI?
 */
export function isSpotifyUrl(url: string): boolean {
  return SPOTIFY_TRACK_RE.test(url.trim());
}
