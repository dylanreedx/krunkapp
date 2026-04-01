type DeepLink = { appLink: string; webLink: string };

export function generateSpotifyDeepLink(spotifyUri: string): DeepLink {
  // Extract track ID from URI format "spotify:track:xxx" or pass through raw ID
  const trackId = spotifyUri.startsWith("spotify:")
    ? spotifyUri.split(":").pop()!
    : spotifyUri;

  return {
    appLink: `spotify:track:${trackId}`,
    webLink: `https://open.spotify.com/track/${trackId}`,
  };
}

export function generateAppleMusicDeepLink(
  appleMusicId: string,
  storefront = "us",
): DeepLink {
  const url = `https://music.apple.com/${storefront}/song/${appleMusicId}`;
  return { appLink: url, webLink: url };
}

export function getPlatformLink(
  song: { spotifyUri?: string | null; appleMusicId?: string | null },
  platform: "spotify" | "apple_music",
): DeepLink | null {
  if (platform === "spotify") {
    return song.spotifyUri ? generateSpotifyDeepLink(song.spotifyUri) : null;
  }
  return song.appleMusicId
    ? generateAppleMusicDeepLink(song.appleMusicId)
    : null;
}
