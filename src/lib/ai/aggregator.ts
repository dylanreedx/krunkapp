/**
 * Aggregates audio features from a list of songs into averages
 * and collects artist/title metadata for downstream AI prompts.
 */

interface AudioFeatures {
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
}

interface SongInput {
  audioFeatures: string | null;
  artist: string;
  title: string;
}

interface AggregatedResult {
  averages: AudioFeatures;
  artists: string[];
  titles: string[];
}

export function aggregateAudioFeatures(songs: SongInput[]): AggregatedResult {
  const parsed: AudioFeatures[] = [];

  for (const song of songs) {
    if (!song.audioFeatures) continue;
    try {
      const features = JSON.parse(song.audioFeatures) as Partial<AudioFeatures>;
      parsed.push({
        energy: features.energy ?? 0,
        valence: features.valence ?? 0,
        danceability: features.danceability ?? 0,
        acousticness: features.acousticness ?? 0,
        instrumentalness: features.instrumentalness ?? 0,
        tempo: features.tempo ?? 0,
      });
    } catch {
      // Skip malformed JSON
    }
  }

  const count = parsed.length || 1; // avoid division by zero

  const averages: AudioFeatures = {
    energy: parsed.reduce((sum, f) => sum + f.energy, 0) / count,
    valence: parsed.reduce((sum, f) => sum + f.valence, 0) / count,
    danceability: parsed.reduce((sum, f) => sum + f.danceability, 0) / count,
    acousticness: parsed.reduce((sum, f) => sum + f.acousticness, 0) / count,
    instrumentalness:
      parsed.reduce((sum, f) => sum + f.instrumentalness, 0) / count,
    tempo: parsed.reduce((sum, f) => sum + f.tempo, 0) / count,
  };

  const artists = Array.from(new Set(songs.map((s) => s.artist)));
  const titles = songs.map((s) => s.title);

  return { averages, artists, titles };
}
