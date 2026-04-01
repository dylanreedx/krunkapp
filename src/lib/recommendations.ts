const SPOTIFY_API = "https://api.spotify.com/v1";

export interface RecommendedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  spotifyUri: string;
  isRecommendation: true;
}

/**
 * Fetch recommendations from Spotify based on seed tracks.
 * Returns empty array on any failure — never throws.
 */
export async function getRecommendations(
  seedTrackIds: string[],
  accessToken: string,
  limit = 10,
): Promise<RecommendedTrack[]> {
  try {
    if (seedTrackIds.length === 0) return [];

    // Spotify allows max 5 seed tracks
    const seeds = seedTrackIds.slice(0, 5).join(",");

    const url = `${SPOTIFY_API}/recommendations?seed_tracks=${encodeURIComponent(seeds)}&limit=${limit}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      tracks: Array<{
        id: string;
        name: string;
        uri: string;
        artists: Array<{ name: string }>;
        album: {
          name: string;
          images: Array<{ url: string }>;
        };
      }>;
    };

    return (data.tracks ?? []).map((t) => ({
      id: t.id,
      title: t.name,
      artist: (t.artists ?? []).map((a) => a.name).join(", "),
      album: t.album?.name ?? "",
      albumArtUrl: t.album?.images?.[0]?.url ?? "",
      spotifyUri: t.uri,
      isRecommendation: true as const,
    }));
  } catch {
    return [];
  }
}
