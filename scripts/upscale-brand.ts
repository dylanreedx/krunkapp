/**
 * Upscales the chosen brand image using gpt-image-1 with image reference.
 * Run: npx --yes tsx --env-file=.env scripts/upscale-brand.ts
 */

import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../public");
const REF_IMAGE = path.join(PUBLIC_DIR, "brand-source-1024.png");

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log("Reading reference image...");
  const refBuffer = await readFile(REF_IMAGE);
  // Convert to PNG for the API
  const refPng = await sharp(refBuffer).png().toBuffer();

  console.log("Upscaling via gpt-image-1 with image reference...");

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: [await toFile(refPng, "reference.png", { type: "image/png" })],
    prompt: `Recreate this exact image at higher quality and resolution. Keep EVERYTHING the same — the bold chrome holographic iridescent K, the hot pink wall background, the holographic drips oozing from the top, the palm frond gobo shadows, the bright beach lighting. Do not change the composition, colors, materials, or style. Just make it sharper, more detailed, higher fidelity. Same exact scene, same exact look.`,
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

  console.log(`Upscaled image: ${rawBuffer.length} bytes`);

  // Save the full 1024x1024 source
  const sourcePath = path.join(PUBLIC_DIR, "brand-source-1024.png");
  await writeFile(sourcePath, await sharp(rawBuffer).png().toBuffer());
  console.log(`  ✓ brand-source-1024.png`);

  // Derive all asset sizes
  const ogImage = await sharp(rawBuffer)
    .resize(630, 630, { fit: "cover" })
    .extend({
      left: 285,
      right: 285,
      background: { r: 255, g: 45, b: 120, alpha: 1 },
    })
    .png()
    .toBuffer();

  const icon512 = await sharp(rawBuffer).resize(512, 512, { fit: "cover" }).png().toBuffer();
  const icon192 = await sharp(rawBuffer).resize(192, 192, { fit: "cover" }).png().toBuffer();
  const appleTouchIcon = await sharp(rawBuffer).resize(180, 180, { fit: "cover" }).png().toBuffer();
  const favicon = await sharp(rawBuffer).resize(32, 32, { fit: "cover" }).png().toBuffer();

  const assets = [
    { name: "og-image.png", buffer: ogImage },
    { name: "icon-512.png", buffer: icon512 },
    { name: "icon-192.png", buffer: icon192 },
    { name: "apple-touch-icon.png", buffer: appleTouchIcon },
    { name: "favicon.ico", buffer: favicon },
  ];

  for (const { name, buffer } of assets) {
    const dest = path.join(PUBLIC_DIR, name);
    await writeFile(dest, buffer);
    console.log(`  ✓ ${name} (${buffer.length} bytes)`);
  }

  console.log("\nDone! All assets generated from upscaled brand image.");
}

main().catch((err) => {
  console.error("Upscale failed:", err);
  process.exit(1);
});
