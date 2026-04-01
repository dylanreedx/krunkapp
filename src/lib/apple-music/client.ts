const APPLE_MUSIC_API_BASE = "https://api.music.apple.com/v1";
const DEFAULT_STOREFRONT = "us";

export interface AppleMusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  isrcCode: string | null;
  appleMusicId: string;
}

export class AppleMusicApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public responseBody?: unknown,
  ) {
    super(message);
    this.name = "AppleMusicApiError";
  }
}

interface AppleMusicSongAttributes {
  name: string;
  artistName: string;
  albumName: string;
  artwork: { url: string; width: number; height: number };
  isrc?: string;
}

interface AppleMusicSongResource {
  id: string;
  type: "songs";
  attributes: AppleMusicSongAttributes;
}

interface AppleMusicResponse {
  data: AppleMusicSongResource[];
}

function normalizeTrack(song: AppleMusicSongResource): AppleMusicTrack {
  const { attributes } = song;
  return {
    id: song.id,
    title: attributes.name,
    artist: attributes.artistName,
    album: attributes.albumName,
    albumArtUrl: attributes.artwork.url
      .replace("{w}", String(attributes.artwork.width))
      .replace("{h}", String(attributes.artwork.height)),
    isrcCode: attributes.isrc ?? null,
    appleMusicId: song.id,
  };
}

async function appleRequest(
  url: string,
  developerToken: string,
  options: {
    userToken?: string;
    method?: string;
    body?: unknown;
  } = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${developerToken}`,
    "Content-Type": "application/json",
  };
  if (options.userToken) {
    headers["Music-User-Token"] = options.userToken;
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => null);
    throw new AppleMusicApiError(
      `Apple Music API ${res.status}: ${res.statusText}`,
      res.status,
      body,
    );
  }

  if (res.status === 204) return null;
  return res.json() as Promise<unknown>;
}

export async function getAppleMusicTrack(
  developerToken: string,
  userToken: string,
  songId: string,
  storefront = DEFAULT_STOREFRONT,
): Promise<AppleMusicTrack> {
  const url = `${APPLE_MUSIC_API_BASE}/catalog/${storefront}/songs/${songId}`;
  const data = (await appleRequest(url, developerToken, {
    userToken,
  })) as AppleMusicResponse;

  const song = data.data[0];
  if (!song) {
    throw new AppleMusicApiError(`Song not found: ${songId}`, 404);
  }
  return normalizeTrack(song);
}

export async function searchTrackByISRC(
  developerToken: string,
  isrc: string,
  storefront = DEFAULT_STOREFRONT,
): Promise<AppleMusicTrack | null> {
  const url = `${APPLE_MUSIC_API_BASE}/catalog/${storefront}/songs?filter[isrc]=${encodeURIComponent(isrc)}`;
  const data = (await appleRequest(url, developerToken)) as AppleMusicResponse;

  const song = data.data[0];
  return song ? normalizeTrack(song) : null;
}

export async function createPlaylist(
  userToken: string,
  developerToken: string,
  name: string,
  description?: string,
): Promise<{ id: string }> {
  const url = `${APPLE_MUSIC_API_BASE}/me/library/playlists`;
  const body = {
    attributes: {
      name,
      ...(description && { description }),
    },
  };
  const data = (await appleRequest(url, developerToken, {
    userToken,
    method: "POST",
    body,
  })) as { data: [{ id: string }] };

  return { id: data.data[0]!.id };
}

export async function addTracksToPlaylist(
  userToken: string,
  developerToken: string,
  playlistId: string,
  songIds: string[],
): Promise<void> {
  const url = `${APPLE_MUSIC_API_BASE}/me/library/playlists/${playlistId}/tracks`;
  const body = {
    data: songIds.map((id) => ({
      id,
      type: "songs" as const,
    })),
  };
  await appleRequest(url, developerToken, {
    userToken,
    method: "POST",
    body,
  });
}
