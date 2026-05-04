/**
 * Generates a holographic chrome MatCap texture for the 2.5D drip pipeline.
 * A MatCap encodes material + lighting on a sphere — cheap to render, looks great.
 * Run: npx --yes tsx --env-file=.env scripts/generate-hero.ts
 */

import OpenAI from "openai";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const OUT_DIR = path.resolve(import.meta.dirname, "../public/landing");

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Generating holographic MatCap (chrome sphere)...");

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt: `A single perfect sphere made of polished holographic chrome iridescent material, centered in the frame against a pure black (#000000) background.

The sphere fills about 80% of the frame. Its surface shows complex thin-film interference: swirling areas of deep blue, bright cyan, teal, green, gold, amber, orange, red-pink, and purple. The colors are vivid, high contrast — very bright specular highlights (near white) next to deep navy darks.

The sphere is lit from the upper right with warm studio lighting. There should be:
- A bright specular highlight in the upper-right quadrant (white/gold)
- Rich color variation across the surface — NOT a simple rainbow gradient
- Deep blue/navy in shadow areas (lower left)
- The iridescent pattern flows organically across the surface like oil on water
- A subtle secondary fill light from the lower left (cool blue tint)

This image will be used as a MatCap texture in Three.js — the sphere must be perfectly centered, perfectly round, and the material must be visible on the entire sphere surface. Black background only.

Style: Cinema 4D / Octane render. Photorealistic chrome holographic material. Studio lighting.`,
    n: 1,
    size: "1024x1024",
  });

  const data = response.data?.[0];
  let rawBuffer: Buffer;

  if (data?.b64_json) {
    rawBuffer = Buffer.from(data.b64_json, "base64");
  } else if (data?.url) {
    const res = await fetch(data.url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    rawBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error("No image data returned");
  }

  // Save as PNG
  await writeFile(
    path.join(OUT_DIR, "holo-matcap.png"),
    await sharp(rawBuffer).png().toBuffer()
  );

  // Save as WebP for production
  const webp = await sharp(rawBuffer).webp({ quality: 92 }).toBuffer();
  await writeFile(path.join(OUT_DIR, "holo-matcap.webp"), webp);

  console.log(`  ✓ holo-matcap.png (1024x1024)`);
  console.log(`  ✓ holo-matcap.webp (${webp.length} bytes)`);
  console.log("\nDone! Use as MatCap in MeshMatcapMaterial or custom shader.");
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
