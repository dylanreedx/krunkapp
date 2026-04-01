/**
 * Analyzes album art images using Claude Vision to extract visual mood,
 * color palette, and aesthetic descriptors. This replaces the deprecated
 * Spotify audio features as a signal for cover art generation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/env";

export interface AlbumArtAnalysis {
  palette: string;       // "dark muted tones with electric blue accents"
  mood: string;          // "ethereal, melancholic, digital"
  aesthetic: string;     // "minimalist, glitchy, cloud rap"
  dominantColors: string; // "charcoal, deep blue, white"
}

/**
 * Fetches album art images and asks Claude Vision to describe the visual
 * palette, mood, and aesthetic across all covers as a cohesive collection.
 */
export async function analyzeAlbumArt(
  albumArtUrls: string[],
): Promise<AlbumArtAnalysis> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Filter to valid URLs and limit to 4 (Claude vision limit is generous but keep it efficient)
  const urls = albumArtUrls.filter(Boolean).slice(0, 4);

  if (urls.length === 0) {
    return {
      palette: "monochrome with subtle color accents",
      mood: "atmospheric, introspective",
      aesthetic: "minimalist, modern",
      dominantColors: "black, white, gray",
    };
  }

  // Build image content blocks
  const imageBlocks: Anthropic.ImageBlockParam[] = urls.map((url) => ({
    type: "image" as const,
    source: { type: "url" as const, url },
  }));

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `These are album covers from a music playlist. Analyze them as a collection and respond in EXACTLY this format (one line each, no labels):

COLOR PALETTE: [describe the overall color palette across all covers, e.g. "dark moody tones with neon pink and electric blue accents"]
MOOD: [3-4 mood words, e.g. "ethereal, melancholic, digital, intimate"]
AESTHETIC: [2-3 aesthetic descriptors, e.g. "hyperpop, lo-fi digital, cloud rap"]
DOMINANT COLORS: [3-4 specific colors, e.g. "charcoal, lavender, electric pink, white"]`,
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  const lines = text.split("\n").filter(Boolean);

  const extract = (prefix: string): string => {
    const line = lines.find((l) => l.toUpperCase().startsWith(prefix.toUpperCase()));
    return line?.replace(/^[^:]+:\s*/i, "").trim() ?? "";
  };

  return {
    palette: extract("COLOR PALETTE") || "atmospheric tones",
    mood: extract("MOOD") || "atmospheric, introspective",
    aesthetic: extract("AESTHETIC") || "modern, electronic",
    dominantColors: extract("DOMINANT COLORS") || "black, white",
  };
}
