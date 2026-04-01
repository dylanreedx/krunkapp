import { searchTrackByISRC as spotifySearchByISRC } from "./spotify/client";
import { searchTrackByISRC as appleSearchByISRC } from "./apple-music/client";

type MatchStatus = "matched" | "partial" | "unmatched";

interface SongInput {
  isrcCode: string | null;
  spotifyUri: string | null;
  appleMusicId: string | null;
}

interface ResolveTokens {
  spotifyAccessToken?: string;
  appleMusicDeveloperToken?: string;
}

interface ResolveResult {
  spotifyUri: string | null;
  appleMusicId: string | null;
  matchStatus: MatchStatus;
}

export async function resolveCrossPlatform(
  song: SongInput,
  tokens: ResolveTokens,
): Promise<ResolveResult> {
  let { spotifyUri, appleMusicId } = song;

  // Already have both — nothing to resolve
  if (spotifyUri && appleMusicId) {
    return { spotifyUri, appleMusicId, matchStatus: "matched" };
  }

  // No ISRC means we can't cross-match
  if (!song.isrcCode) {
    return { spotifyUri, appleMusicId, matchStatus: "unmatched" };
  }

  const isrc = song.isrcCode;
  let spotifyResolved = !!spotifyUri;
  let appleResolved = !!appleMusicId;

  // Resolve missing Spotify
  if (!spotifyUri && tokens.spotifyAccessToken) {
    try {
      const track = await spotifySearchByISRC(tokens.spotifyAccessToken, isrc);
      if (track) {
        spotifyUri = track.spotifyUri;
        spotifyResolved = true;
      }
    } catch {
      // Network / API error — treat as unresolved, not crash
    }
  }

  // Resolve missing Apple Music
  if (!appleMusicId && tokens.appleMusicDeveloperToken) {
    try {
      const track = await appleSearchByISRC(
        tokens.appleMusicDeveloperToken,
        isrc,
      );
      if (track) {
        appleMusicId = track.appleMusicId;
        appleResolved = true;
      }
    } catch {
      // Network / API error — treat as unresolved, not crash
    }
  }

  const matchStatus: MatchStatus =
    spotifyResolved && appleResolved
      ? "matched"
      : spotifyResolved || appleResolved
        ? "partial"
        : "unmatched";

  return { spotifyUri, appleMusicId, matchStatus };
}

interface SongWithId extends SongInput {
  id: string;
}

interface ResolveAllResult extends ResolveResult {
  id: string;
}

export async function resolveAllSongs(
  songs: SongWithId[],
  tokens: ResolveTokens,
): Promise<ResolveAllResult[]> {
  const settled = await Promise.allSettled(
    songs.map((song) => resolveCrossPlatform(song, tokens)),
  );

  return settled.map((result, i) => {
    const song = songs[i]!;
    if (result.status === "fulfilled") {
      return { id: song.id, ...result.value };
    }
    // Should not happen (resolveCrossPlatform catches internally),
    // but guard against it anyway
    return {
      id: song.id,
      spotifyUri: song.spotifyUri,
      appleMusicId: song.appleMusicId,
      matchStatus: "partial" as const,
    };
  });
}
