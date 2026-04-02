/**
 * Generates brand assets (OG image, favicons, PWA icons) using OpenAI image generation + sharp.
 * Run: pnpm generate:assets
 */

import OpenAI from "openai";
import sharp from "sharp";
import { writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../public");

const BRAND_PROMPT = `A bold, stylized letter "K" as a brand icon on a solid dark background (#0a0a0a). The K is rendered in flat hot pink (#ff2d78) with sharp geometric edges — modern, confident, chunky weight.

Behind and around the K, a vertical stack of 5 thin rounded rectangles — like a queue of album art cards or playlist slots stacked on top of each other with even spacing. The stack cards are pure white (#ffffff) with slight offset, creating a layered deck/queue effect. The K sits in front of or integrated with this stack.

Style: modern flat graphic design. Solid fills only — no gradients, no shadows, no 3D. Clean vector look. High contrast pink and white on near-black. No other text, no other letters besides the K. No people.

Generous negative space around the composition. Must read clearly at 32x32 pixels — the K shape and stacked cards should be distinct even tiny.`;

async function main() {
  console.log("Generating brand image via OpenAI gpt-image-1...");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt: BRAND_PROMPT,
    n: 1,
    size: "1024x1024",
  });

  const data = response.data?.[0];
  let rawBuffer: Buffer;

  if (data?.b64_json) {
    rawBuffer = Buffer.from(data.b64_json, "base64");
  } else if (data?.url) {
    const res = await fetch(data.url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    rawBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error("No image data returned from OpenAI");
  }

  console.log(`Source image: ${rawBuffer.length} bytes`);

  // OG image: 1200x630 — extend the 1024x1024 onto a 1200x630 dark canvas
  const ogImage = await sharp(rawBuffer)
    .resize(630, 630, { fit: "cover" })
    .extend({
      left: 285,
      right: 285,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .png()
    .toBuffer();

  // Icon sizes from the square source
  const icon512 = await sharp(rawBuffer)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toBuffer();

  const icon192 = await sharp(rawBuffer)
    .resize(192, 192, { fit: "cover" })
    .png()
    .toBuffer();

  const appleTouchIcon = await sharp(rawBuffer)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toBuffer();

  const favicon = await sharp(rawBuffer)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toBuffer();

  // Write all assets
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

  console.log("\nDone! All brand assets generated in public/");
}

main().catch((err) => {
  console.error("Asset generation failed:", err);
  process.exit(1);
});
