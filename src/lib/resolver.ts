import { parseSpotifyUrl, isSpotifyUrl } from "./parsers/spotify";
import { parseAppleMusicUrl, isAppleMusicUrl } from "./parsers/apple-music";
import {
  getSpotifyTrack,
  getAudioFeatures,
  type AudioFeatures,
} from "./spotify/client";
import { getAppleMusicTrack } from "./apple-music/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SongMetadata {
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  isrcCode: string;
  spotifyUri: string | null;
  appleMusicId: string | null;
  audioFeatures: AudioFeatures | null;
  sourcePlatform: "spotify" | "apple_music";
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export async function resolveSongUrl(
  url: string,
  spotifyAccessToken: string,
  appleMusicTokens?: { developerToken: string; userToken: string },
): Promise<SongMetadata> {
  if (isSpotifyUrl(url)) {
    const trackId = parseSpotifyUrl(url);
    if (!trackId) throw new Error(`Failed to parse Spotify track ID from: ${url}`);

    const track = await getSpotifyTrack(spotifyAccessToken, trackId);

    // Audio features endpoint is deprecated for new Spotify apps (post Nov 2024)
    let features: AudioFeatures | null = null;
    try {
      features = await getAudioFeatures(spotifyAccessToken, trackId);
    } catch {
      // Silently skip — audio features are nice-to-have, not required
    }

    return {
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArtUrl: track.albumArtUrl,
      isrcCode: track.isrcCode,
      spotifyUri: track.spotifyUri,
      appleMusicId: null,
      audioFeatures: features,
      sourcePlatform: "spotify",
    };
  }

  if (isAppleMusicUrl(url)) {
    if (!appleMusicTokens) {
      throw new Error("Apple Music tokens required to resolve an Apple Music URL");
    }

    const parsed = parseAppleMusicUrl(url);
    if (!parsed) throw new Error(`Failed to parse Apple Music URL: ${url}`);

    const track = await getAppleMusicTrack(
      appleMusicTokens.developerToken,
      appleMusicTokens.userToken,
      parsed.songId,
      parsed.storefront,
    );

    return {
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArtUrl: track.albumArtUrl,
      isrcCode: track.isrcCode ?? "",
      spotifyUri: null,
      appleMusicId: track.appleMusicId,
      audioFeatures: null,
      sourcePlatform: "apple_music",
    };
  }

  throw new Error(`Unrecognized music URL format: ${url}`);
}
