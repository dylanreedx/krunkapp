/**
 * Complete AI pipeline orchestrator.
 * Analyzes album art → generates name + visual prompt in parallel → generates cover art.
 */

import { analyzeAlbumArt } from "./album-art-analyzer";
import { generateQueueName } from "./name-generator";
import { generateVisualPrompt } from "./visual-prompt-generator";
import { generateCoverArt } from "./cover-generator";

interface SongInput {
  title: string;
  artist: string;
  albumArtUrl: string | null;
  audioFeatures?: string | null; // kept for compatibility but not used
}

interface PipelineResult {
  aiName: string;
  coverImageBuffer: Buffer;
}

export async function runAIPipeline(
  songs: SongInput[],
): Promise<PipelineResult> {
  // Step 1: Analyze album art visually (replaces audio features)
  const albumArtUrls = songs
    .map((s) => s.albumArtUrl)
    .filter((url): url is string => url !== null);

  const albumArtAnalysis = await analyzeAlbumArt(albumArtUrls);

  const artists = songs.map((s) => s.artist);
  const titles = songs.map((s) => s.title);

  // Step 2: Generate name and visual prompt in parallel
  const [aiName, sceneDescription] = await Promise.all([
    generateQueueName({ artists, titles, albumArtAnalysis }),
    generateVisualPrompt({ artists, titles, albumArtAnalysis }),
  ]);

  // Step 3: Generate cover art from the visual prompt
  const coverImageBuffer = await generateCoverArt(sceneDescription);

  return { aiName, coverImageBuffer };
}
