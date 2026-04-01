/**
 * Generates a cinematic scene description for cover art generation.
 * Uses album art visual analysis + song metadata to create a scene
 * that matches the queue's vibe.
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/env";
import type { AlbumArtAnalysis } from "./album-art-analyzer";

interface SongData {
  artists: string[];
  titles: string[];
  albumArtAnalysis?: AlbumArtAnalysis;
}

export async function generateVisualPrompt(
  songData: SongData,
): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const artContext = songData.albumArtAnalysis
    ? `
The album covers have this visual language:
- Color palette: ${songData.albumArtAnalysis.palette}
- Mood: ${songData.albumArtAnalysis.mood}
- Aesthetic: ${songData.albumArtAnalysis.aesthetic}
- Dominant colors: ${songData.albumArtAnalysis.dominantColors}

The cover art you're describing should feel like it belongs in the same visual universe as these album covers.`
    : "";

  // Random location seed to force variety
  const locations = [
    "the back seat of a car at night",
    "a convenience store at 3am",
    "a rooftop swimming pool at dusk",
    "a half-empty parking garage",
    "a bedroom window looking out at rain",
    "a laundromat with flickering lights",
    "an overgrown tennis court",
    "a subway platform after the last train",
    "a gas station in the middle of nowhere",
    "a bathroom mirror with steam on it",
    "a fire escape overlooking an alley",
    "a skatepark at golden hour",
  ];
  const locationSeed = locations[Math.floor(Math.random() * locations.length)];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 250,
    temperature: 1,
    messages: [
      {
        role: "user",
        content: `Describe a cinematic scene for a music playlist cover image. 2-3 sentences. This will be an image generation prompt.

Playlist:
${songData.titles.map((t, i) => `- "${t}" by ${songData.artists[i] ?? "Unknown"}`).join("\n")}
${artContext}

SET THIS SCENE IN OR NEAR: ${locationSeed}

Rules:
- Describe OBJECTS, TEXTURES, ENVIRONMENT — absolutely NO people, no figures, no silhouettes, no "someone"
- Focus on small tactile details: condensation on glass, crumpled paper, light refracting, wet surfaces, tangled wires, scattered objects
- Unusual camera angle: extreme macro, bird's eye straight down, Dutch tilt, shot through dirty glass or chain-link
- Mention a post-processing effect: chromatic aberration, halftone dots, light leak, heavy grain, split toning, glitch artifacts
- Use the album art colors through objects and light — don't name colors directly
- This is ALBUM ART not a movie scene. Think: Kid A, Blonde, WLR covers — abstract, textural, no clear subject
- 2-3 sentences MAX. Specific details, not poetic descriptions.

Return ONLY the scene description.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return (
    textBlock?.text ?? "A rain-slicked rooftop at 4am, city lights bleeding into fog."
  ).trim();
}
