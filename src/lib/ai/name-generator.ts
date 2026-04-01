/**
 * Generates a creative 2-4 word queue name from song metadata + album art analysis.
 * Uses Claude Haiku for speed and cost.
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/env";
import type { AlbumArtAnalysis } from "./album-art-analyzer";

interface SongData {
  artists: string[];
  titles: string[];
  albumArtAnalysis?: AlbumArtAnalysis;
}

export async function generateQueueName(songData: SongData): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const artContext = songData.albumArtAnalysis
    ? `\nVisual palette: ${songData.albumArtAnalysis.palette}\nMood: ${songData.albumArtAnalysis.mood}\nAesthetic: ${songData.albumArtAnalysis.aesthetic}`
    : "";

  // Random seed word to force variety across generations
  const seeds = ["texture", "place", "time", "feeling", "object", "weather", "color", "sound", "motion", "material"];
  const seed = seeds[Math.floor(Math.random() * seeds.length)];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 30,
    temperature: 1,
    messages: [
      {
        role: "user",
        content: `You name weekly music playlists shared between friends. Generate a creative 2-4 word name that captures the VIBE of these songs as a collection.

Songs:
${songData.titles.map((t, i) => `- "${t}" by ${songData.artists[i] ?? "Unknown"}`).join("\n")}
${artContext}

Rules:
- 2-4 words ONLY
- Evocative, not literal — DON'T reference colors from the album art directly (no "neon", "electric blue", etc.)
- Think: what would you TEXT your friend to describe this mix?
- Lean into a ${seed}-based metaphor this time
- Match the energy — underground/experimental = raw, textured. Pop = catchy, bright.
- No generic words: vibes, journey, mood, whispers, void, echo, pulse, ethereal
- Examples of GOOD names: "3AM Glass", "Wet Concrete", "Sugar Crash", "Phantom Thread", "Rust & Honey", "Velvet Drain", "Soft Machine", "Bruised Peach"
- Examples of BAD names: "Neon Blur", "Frozen Whispers", "Ethereal Journey", "Sonic Landscape", "Digital Dreams"

Return ONLY the name. No quotes, no explanation.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return (textBlock?.text ?? "Untitled").trim().replace(/^["']|["']$/g, "");
}
