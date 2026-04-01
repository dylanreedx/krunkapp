/**
 * AI Pipeline Test Runner
 *
 * Tests album art analysis → name generation → visual prompt with real data.
 * Tracks cost, latency, and iterations for prompt engineering.
 *
 * Usage: npx tsx src/lib/ai/test-pipeline.ts [iterations]
 */

import { analyzeAlbumArt } from "./album-art-analyzer";
import { generateQueueName } from "./name-generator";
import { generateVisualPrompt } from "./visual-prompt-generator";
import { buildImagePrompt } from "./style-prefix";

// Dylan's actual queue data
const REAL_SONGS = [
  {
    title: "dogfood",
    artist: "untiljapan",
    albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273fa532c7710ec476ecfa4a34b",
  },
  {
    title: "Eyelash",
    artist: "Bladee",
    albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273c68b61db6c5e04fa03e815e6",
  },
  {
    title: "holy matrimony",
    artist: "Pure557",
    albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273641ee59853d46be82db557a1",
  },
  {
    title: "MY ELSA",
    artist: "waera, slayr",
    albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273c71d0d268d89895ae68bb639",
  },
];

interface TestResult {
  iteration: number;
  timestamp: string;
  albumArtAnalysis: {
    palette: string;
    mood: string;
    aesthetic: string;
    dominantColors: string;
  };
  queueName: string;
  visualPrompt: string;
  fullImagePromptLength: number;
  latency: {
    albumArtMs: number;
    nameMs: number;
    promptMs: number;
    totalMs: number;
  };
  estimatedCost: string;
}

const results: TestResult[] = [];

async function runIteration(
  iteration: number,
  cachedAnalysis?: TestResult["albumArtAnalysis"],
): Promise<TestResult> {
  const start = Date.now();

  // Step 1: Album art analysis (cache across iterations — art doesn't change)
  let albumArtAnalysis: TestResult["albumArtAnalysis"];
  let albumArtMs: number;

  if (cachedAnalysis) {
    albumArtAnalysis = cachedAnalysis;
    albumArtMs = 0;
    console.log(`  [cached] Album art analysis`);
  } else {
    const artStart = Date.now();
    albumArtAnalysis = await analyzeAlbumArt(REAL_SONGS.map((s) => s.albumArtUrl));
    albumArtMs = Date.now() - artStart;
    console.log(`  Album art (${albumArtMs}ms):`);
    console.log(`    Palette: ${albumArtAnalysis.palette}`);
    console.log(`    Mood: ${albumArtAnalysis.mood}`);
    console.log(`    Aesthetic: ${albumArtAnalysis.aesthetic}`);
    console.log(`    Colors: ${albumArtAnalysis.dominantColors}`);
  }

  const artists = REAL_SONGS.map((s) => s.artist);
  const titles = REAL_SONGS.map((s) => s.title);

  // Step 2: Name generation
  const nameStart = Date.now();
  const queueName = await generateQueueName({ artists, titles, albumArtAnalysis });
  const nameMs = Date.now() - nameStart;
  console.log(`  Name: "${queueName}" (${nameMs}ms)`);

  // Step 3: Visual prompt
  const promptStart = Date.now();
  const visualPrompt = await generateVisualPrompt({ artists, titles, albumArtAnalysis });
  const promptMs = Date.now() - promptStart;
  console.log(`  Scene: "${visualPrompt.slice(0, 120)}..." (${promptMs}ms)`);

  // Step 4: Full image prompt (don't actually generate — just measure)
  const fullPrompt = buildImagePrompt(visualPrompt);

  const totalMs = Date.now() - start;

  // Cost: Haiku ~$0.80/M input, $4/M output
  // Album art analysis with 4 images: ~$0.01
  // Name gen: ~$0.001
  // Prompt gen: ~$0.002
  // Cover gen (gpt-image-1): ~$0.04
  const result: TestResult = {
    iteration,
    timestamp: new Date().toISOString(),
    albumArtAnalysis,
    queueName,
    visualPrompt,
    fullImagePromptLength: fullPrompt.length,
    latency: { albumArtMs, nameMs, promptMs, totalMs },
    estimatedCost: albumArtMs > 0 ? "$0.053" : "$0.043",
  };

  results.push(result);
  return result;
}

async function main() {
  const iterations = parseInt(process.argv[2] ?? "3", 10);

  console.log("╔══════════════════════════════════════╗");
  console.log("║   Krunk AI Pipeline Test Runner      ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`\nSongs: ${REAL_SONGS.map((s) => `"${s.title}" — ${s.artist}`).join(", ")}`);
  console.log(`Iterations: ${iterations}\n`);

  let cachedAnalysis: TestResult["albumArtAnalysis"] | undefined;

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n── Iteration ${i} ──────────────────────`);
    try {
      const result = await runIteration(i, cachedAnalysis);
      // Cache album art analysis after first run
      if (!cachedAnalysis) cachedAnalysis = result.albumArtAnalysis;
    } catch (err) {
      console.error(`  FAILED:`, err instanceof Error ? err.message : err);
    }
  }

  // Summary
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   RESULTS                            ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`\nNames: ${results.map((r) => `"${r.queueName}"`).join(" | ")}`);
  console.log(`\nScenes:`);
  results.forEach((r, i) => console.log(`  ${i + 1}. ${r.visualPrompt.slice(0, 150)}...`));
  console.log(`\nAlbum art analysis (cached after first):`);
  if (results[0]) {
    console.log(`  Palette: ${results[0].albumArtAnalysis.palette}`);
    console.log(`  Mood: ${results[0].albumArtAnalysis.mood}`);
    console.log(`  Aesthetic: ${results[0].albumArtAnalysis.aesthetic}`);
  }
  console.log(`\nAvg latency: ${Math.round(results.reduce((a, r) => a + r.latency.totalMs, 0) / results.length)}ms`);
  console.log(`Total cost est: $${(0.053 + (results.length - 1) * 0.043).toFixed(3)}`);
  console.log(`\n(Cover art generation not included — add ~$0.04/image with gpt-image-1)`);
}

main().catch(console.error);
