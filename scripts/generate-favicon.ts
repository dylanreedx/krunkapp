/**
 * Generates a favicon — just pink background with holographic drips, no K.
 * Run: npx --yes tsx --env-file=.env scripts/generate-favicon.ts
 */

import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../public");

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log("Reading reference image...");
  const refBuffer = await readFile(path.join(PUBLIC_DIR, "brand-source-1024.png"));
  const refPng = await sharp(refBuffer).png().toBuffer();

  console.log("Generating favicon version — drips only, no K...");

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: [await toFile(refPng, "reference.png", { type: "image/png" })],
    prompt: `Take this exact image and REMOVE the letter K entirely. Keep everything else exactly the same — the hot pink wall, the holographic iridescent chrome drips oozing down from the top, the palm frond gobo shadows, the bright lighting. Just remove the K so it's only the pink wall with holographic drips coming down from the top. The drips should still span the full width.`,
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

  // Save 1024 source for inspection
  await writeFile(
    path.join(PUBLIC_DIR, "favicon-source-1024.png"),
    await sharp(rawBuffer).png().toBuffer(),
  );
  console.log("  ✓ favicon-source-1024.png");

  // Favicon at 32x32
  const favicon = await sharp(rawBuffer)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toBuffer();
  await writeFile(path.join(PUBLIC_DIR, "favicon.ico"), favicon);
  console.log(`  ✓ favicon.ico (${favicon.length} bytes)`);

  // Preview at 192
  const preview = await sharp(rawBuffer)
    .resize(192, 192, { fit: "cover" })
    .png()
    .toBuffer();
  await writeFile(path.join(PUBLIC_DIR, "favicon-preview.png"), preview);
  console.log(`  ✓ favicon-preview.png`);

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
