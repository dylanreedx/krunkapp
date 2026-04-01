import {
  createPlaylist as spotifyCreate,
  addTracksToPlaylist as spotifyAddTracks,
  uploadPlaylistCover,
} from "@/lib/spotify/client";
import {
  createPlaylist as appleMusicCreate,
  addTracksToPlaylist as appleMusicAddTracks,
} from "@/lib/apple-music/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpotifyPlaylistParams {
  accessToken: string;
  userId: string;
  name: string;
  description?: string;
  trackUris: string[];
  coverImageBase64?: string;
}

interface AppleMusicPlaylistParams {
  developerToken: string;
  userToken: string;
  name: string;
  description?: string;
  songIds: string[];
}

export interface RecipientInfo {
  userId: string;
  platformPreference: "spotify" | "apple_music";
  spotifyAccessToken?: string;
  appleMusicUserToken?: string;
  appleMusicDeveloperToken?: string;
  spotifyUserId?: string;
}

interface SongIds {
  spotifyUri: string | null;
  appleMusicId: string | null;
}

interface PlaylistResult {
  platformPlaylistId: string;
  platformPlaylistUrl: string | null;
}

interface RecipientPlaylistResult {
  userId: string;
  platformPlaylistId: string;
  platformPlaylistUrl: string | null;
}

// ---------------------------------------------------------------------------
// 1. Spotify playlist creator
// ---------------------------------------------------------------------------

export async function createSpotifyPlaylist(
  params: SpotifyPlaylistParams,
): Promise<{ playlistId: string; playlistUrl: string }> {
  const { accessToken, userId, name, description, trackUris, coverImageBase64 } =
    params;

  const playlist = await spotifyCreate(accessToken, userId, name, description);

  if (trackUris.length > 0) {
    // Spotify allows max 100 tracks per request
    for (let i = 0; i < trackUris.length; i += 100) {
      await spotifyAddTracks(accessToken, playlist.id, trackUris.slice(i, i + 100));
    }
  }

  if (coverImageBase64) {
    await uploadPlaylistCover(accessToken, playlist.id, coverImageBase64);
  }

  return { playlistId: playlist.id, playlistUrl: playlist.url };
}

// ---------------------------------------------------------------------------
// 2. Apple Music playlist creator
// ---------------------------------------------------------------------------

export async function createAppleMusicPlaylist(
  params: AppleMusicPlaylistParams,
): Promise<{ playlistId: string }> {
  const { developerToken, userToken, name, description, songIds } = params;

  const playlist = await appleMusicCreate(userToken, developerToken, name, description);

  if (songIds.length > 0) {
    await appleMusicAddTracks(userToken, developerToken, playlist.id, songIds);
  }

  return { playlistId: playlist.id };
}

// ---------------------------------------------------------------------------
// 3. Create playlist for a single recipient
// ---------------------------------------------------------------------------

export async function createPlaylistForRecipient(params: {
  recipient: RecipientInfo;
  queueName: string;
  songs: SongIds[];
  coverImageBase64?: string;
}): Promise<PlaylistResult> {
  const { recipient, queueName, songs, coverImageBase64 } = params;
  const playlistName = `krunk: ${queueName}`;
  const description = `Queued for you on krunk`;

  if (recipient.platformPreference === "spotify") {
    if (!recipient.spotifyAccessToken || !recipient.spotifyUserId) {
      throw new Error(
        `Spotify credentials missing for user ${recipient.userId}`,
      );
    }

    const trackUris = songs
      .map((s) => s.spotifyUri)
      .filter((uri): uri is string => uri !== null);

    if (trackUris.length === 0) {
      throw new Error(
        `No Spotify-compatible tracks for user ${recipient.userId}`,
      );
    }

    const result = await createSpotifyPlaylist({
      accessToken: recipient.spotifyAccessToken,
      userId: recipient.spotifyUserId,
      name: playlistName,
      description,
      trackUris,
      coverImageBase64,
    });

    return {
      platformPlaylistId: result.playlistId,
      platformPlaylistUrl: result.playlistUrl,
    };
  }

  // Apple Music
  if (!recipient.appleMusicUserToken || !recipient.appleMusicDeveloperToken) {
    throw new Error(
      `Apple Music credentials missing for user ${recipient.userId}`,
    );
  }

  const songIds = songs
    .map((s) => s.appleMusicId)
    .filter((id): id is string => id !== null);

  if (songIds.length === 0) {
    throw new Error(
      `No Apple Music-compatible tracks for user ${recipient.userId}`,
    );
  }

  const result = await createAppleMusicPlaylist({
    developerToken: recipient.appleMusicDeveloperToken,
    userToken: recipient.appleMusicUserToken,
    name: playlistName,
    description,
    songIds,
  });

  return {
    platformPlaylistId: result.playlistId,
    platformPlaylistUrl: null,
  };
}

// ---------------------------------------------------------------------------
// 4. Create playlists for all recipients in parallel
// ---------------------------------------------------------------------------

export async function createPlaylistsForAllRecipients(params: {
  recipients: RecipientInfo[];
  queueName: string;
  songs: SongIds[];
  coverImageBase64?: string;
}): Promise<RecipientPlaylistResult[]> {
  const { recipients, queueName, songs, coverImageBase64 } = params;

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      createPlaylistForRecipient({ recipient, queueName, songs, coverImageBase64 }),
    ),
  );

  const successful: RecipientPlaylistResult[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    const recipient = recipients[i]!;

    if (result.status === "fulfilled") {
      successful.push({
        userId: recipient.userId,
        platformPlaylistId: result.value.platformPlaylistId,
        platformPlaylistUrl: result.value.platformPlaylistUrl,
      });
    } else {
      console.error(
        `Failed to create playlist for user ${recipient.userId}:`,
        result.reason,
      );
    }
  }

  return successful;
}
