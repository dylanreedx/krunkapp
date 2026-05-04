/**
 * Edits the brand image with specific tweaks using gpt-image-1 image reference.
 * Run: npx --yes tsx --env-file=.env scripts/edit-brand.ts
 */

import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../public");
const REF_IMAGE = path.join(PUBLIC_DIR, "brand-edited-1024.png");

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log("Reading reference image...");
  const refBuffer = await readFile(REF_IMAGE);
  const refPng = await sharp(refBuffer).png().toBuffer();

  console.log("Editing with tweaks...");

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: [await toFile(refPng, "reference.png", { type: "image/png" })],
    prompt: `Take this exact image and make this ONE change — keep the solid dry K shape, the full-width drips, the floating position, the pink wall, the palm gobo shadows, the bright beach house room ALL the same:

TWO changes:

1. The holographic refractions on the K and drips need to be DEEPER and more saturated. Right now the colors are too washed out and pale. The rainbow refractions should have rich, deep, vivid color — strong saturated blues, deep purples, vibrant oranges, intense greens, bold yellows. Like looking into a deep pool of swirling color, not a faded surface sheen. More contrast between the bright specular highlights and the deep saturated rainbow colors in the holographic material.

2. Remove ALL bevels/outlines/inset lines on the K. The K should be a single solid shape with smooth rounded corners — like border-radius on the web. Not inflated or puffy like a balloon. Just a clean solid block K with gently rounded edges. No layered beveled edges, no border strokes, no inset detail lines. The holographic material covers the entire K uniformly as one smooth surface.`,
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

  const editedPath = path.join(PUBLIC_DIR, "brand-edited-1024.png");
  await writeFile(editedPath, await sharp(rawBuffer).png().toBuffer());
  console.log(`  ✓ brand-edited-1024.png (${rawBuffer.length} bytes)`);

  console.log("\nDone! Check public/brand-edited-1024.png");
}

main().catch((err) => {
  console.error("Edit failed:", err);
  process.exit(1);
});
