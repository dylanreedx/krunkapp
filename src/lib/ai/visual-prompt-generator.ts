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
- Energy: ${songData.albumArtAnalysis.energy}

The cover art you're describing should feel like it belongs in the same visual universe as these album covers. Match the energy level — frenetic scenes get speed lines and motion blur, still scenes get empty space and quiet tension.`
    : "";

  // Random location seed to force variety
  const locations = [
    "a rain-soaked neon intersection at 2am",
    "a rooftop antenna array overlooking a megacity",
    "an abandoned mecha hangar with flickering emergency lights",
    "a flooded subway tunnel reflecting neon signage",
    "a server room with rows of blinking towers",
    "a highway overpass with light trails streaming below",
    "a shrine gate overgrown with cables and moss",
    "a control room with cracked monitors showing static",
    "a canal under a concrete bridge, city glow on the water",
    "a train platform as a bullet train blurs past",
    "construction scaffolding wrapped in translucent tarps at night",
    "a vending machine alley between narrow buildings",
  ];
  const locationSeed = locations[Math.floor(Math.random() * locations.length)];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    temperature: 1,
    messages: [
      {
        role: "user",
        content: `Describe a richly detailed cinematic scene for a music playlist cover image. 4-6 sentences. This will be fed to an image generation model — every detail you describe WILL appear in the image, so be specific and visual.

Playlist:
${songData.titles.map((t, i) => `- "${t}" by ${songData.artists[i] ?? "Unknown"}`).join("\n")}
${artContext}

SET THIS SCENE IN OR NEAR: ${locationSeed}

You must describe THREE layers of the scene:
1. FOREGROUND: An object or structure partially framing the shot — describe its material, texture, wear, and how light hits it
2. MIDGROUND: The main subject/environment — describe specific objects, their materials, lighting, reflections, and spatial relationships
3. BACKGROUND: What's visible behind/above/through — distant structures, sky, atmospheric effects

Rules:
- Name the exact camera angle (fish-eye, extreme low-angle, top-down, forced perspective, Dutch tilt, wide-angle warp, shot through something)
- Name the exact light sources and their colors: what's casting light, what color is it, what surfaces is it reflecting off of, what shadows is it creating
- Describe MATERIALS and SURFACES specifically: "rain-beaded corrugated steel" not "metal", "cracked poured concrete with exposed rebar" not "concrete", "smudged safety glass with condensation trails" not "glass"
- Include environmental atmosphere: rain, fog, steam, dust, heat haze, mist — something in the air
- NO people, no figures, no silhouettes, no hands
- NO text, no words, no letters, no kanji, no readable signage
- Use the album art colors through lighting and reflective surfaces — don't name the colors directly, show them through light sources and reflections
- 4-6 sentences of DENSE visual description. Every sentence adds new visual information.

Return ONLY the scene description.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return (
    textBlock?.text ?? "A rain-slicked rooftop at 4am, city lights bleeding into fog."
  ).trim();
}
