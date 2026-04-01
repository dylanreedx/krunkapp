const SPOTIFY_API = "https://api.spotify.com/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  isrcCode: string;
  spotifyUri: string;
  durationMs: number;
}

export interface AudioFeatures {
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
  key: number;
  mode: number;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class SpotifyApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`Spotify API ${status} ${statusText}`);
    this.name = "SpotifyApiError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function spotifyFetch<T>(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new SpotifyApiError(res.status, res.statusText, body);
  }

  // Some endpoints (PUT 202/204) return no body
  if (res.status === 204 || res.status === 202) return undefined as T;

  return (await res.json()) as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeTrack(raw: any): SpotifyTrack {
  return {
    id: raw.id,
    title: raw.name,
    artist: (raw.artists ?? []).map((a: any) => a.name).join(", "),
    album: raw.album?.name ?? "",
    albumArtUrl: raw.album?.images?.[0]?.url ?? "",
    isrcCode: raw.external_ids?.isrc ?? "",
    spotifyUri: raw.uri,
    durationMs: raw.duration_ms,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getSpotifyTrack(
  accessToken: string,
  trackId: string,
): Promise<SpotifyTrack> {
  const raw = await spotifyFetch<Record<string, unknown>>(
    accessToken,
    `${SPOTIFY_API}/tracks/${encodeURIComponent(trackId)}`,
  );
  return normalizeTrack(raw);
}

export async function getAudioFeatures(
  accessToken: string,
  trackId: string,
): Promise<AudioFeatures> {
  const raw = await spotifyFetch<Record<string, number | undefined>>(
    accessToken,
    `${SPOTIFY_API}/audio-features/${encodeURIComponent(trackId)}`,
  );
  return {
    energy: raw.energy ?? 0,
    valence: raw.valence ?? 0,
    danceability: raw.danceability ?? 0,
    acousticness: raw.acousticness ?? 0,
    instrumentalness: raw.instrumentalness ?? 0,
    tempo: raw.tempo ?? 0,
    key: raw.key ?? 0,
    mode: raw.mode ?? 0,
  };
}

export async function searchTrackByISRC(
  accessToken: string,
  isrc: string,
): Promise<SpotifyTrack | null> {
  const q = encodeURIComponent(`isrc:${isrc}`);
  const raw = await spotifyFetch<{ tracks: { items: unknown[] } }>(
    accessToken,
    `${SPOTIFY_API}/search?q=${q}&type=track&limit=1`,
  );
  const first = raw.tracks?.items?.[0];
  return first ? normalizeTrack(first) : null;
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description?: string,
): Promise<{ id: string; url: string }> {
  const raw = await spotifyFetch<{
    id: string;
    external_urls: { spotify: string };
  }>(
    accessToken,
    `${SPOTIFY_API}/users/${encodeURIComponent(userId)}/playlists`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description ?? "", public: false }),
    },
  );
  return { id: raw.id, url: raw.external_urls.spotify };
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  await spotifyFetch<void>(
    accessToken,
    `${SPOTIFY_API}/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris: trackUris }),
    },
  );
}

export async function uploadPlaylistCover(
  accessToken: string,
  playlistId: string,
  base64Image: string,
): Promise<void> {
  await spotifyFetch<void>(
    accessToken,
    `${SPOTIFY_API}/playlists/${encodeURIComponent(playlistId)}/images`,
    {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: base64Image,
    },
  );
}
