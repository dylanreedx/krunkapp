/**
 * Generates 4 brand icon variants for comparison.
 * Run: npx --yes tsx --env-file=.env scripts/generate-brand-variants.ts
 */

import OpenAI from "openai";
import sharp from "sharp";
import { writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../public");

const BASE_PROMPT = `High-quality 3D render, Cinema 4D / Blender / Octane style. Photorealistic materials, soft studio lighting.

BACKGROUND: Full hot pink (#ff2d78) wall everywhere. No floor, no ground plane. Bright, saturated, no dark areas at all. Just a solid pink wall.

CENTER: A bold thick letter K in polished chrome holographic iridescent material — the K is clean, not dripping, solid and pristine. Rainbow mirror surface catching bright sunlight. The K is large and pushed close to camera, dominating the foreground. The K FLOATS 2-3 inches in front of the pink wall, casting a soft shadow on the wall behind it.

DRIPS: Behind the K, thick iridescent holographic foil liquid is dripping and oozing down from the top of the frame, spreading across the FULL WIDTH of the wall edge to edge. Like thick melted chrome syrup or holographic icing sliding down a wall. The drips are 3D, glossy, chunky, catching rainbow refractions. They flow down the pink background behind the clean K.

Bright, summer, premium, collectible. No other text besides the K.`;

const variants: Record<string, string> = {
  "variant-v2-a": `${BASE_PROMPT}

LIGHTING: Blazing midday sun on a beach. Think 12pm, no clouds, direct overhead tropical sunlight flooding the scene. Everything is bright and warm. Strong palm tree frond shadows cast as gobo patterns across the scene — crisp leaf silhouettes on the pink wall, on the drips, dappled light on the K. Bright airy beach house with huge windows. The room feels open, airy, sunlit. Blown-out highlights.`,

  "variant-v2-b": `${BASE_PROMPT}

LIGHTING: Bright beach house interior flooded with natural noon sunlight from large open windows. Warm, overexposed, airy — like a white-walled gallery in the tropics. Palm frond gobo shadows cast softly across the pink wall and drips. The K catches bright specular highlights. Everything feels sun-drenched and warm. Brighter than you'd expect — almost overexposed.`,

  "variant-v2-c": `${BASE_PROMPT}

LIGHTING: Direct tropical noon sun pouring in from above and to the right. Harsh bright beach lighting — strong shadows, blown-out highlights, intense warmth. Palm tree frond shadows (gobo) fall across the wall, the drips, and the floating K. Like the scene is sitting on a patio in direct Caribbean sunlight at midday. Extremely bright and airy.`,

  "variant-v2-d": `${BASE_PROMPT}

LIGHTING: Golden-warm beach house sunlight flooding the entire scene. Natural light from floor-to-ceiling windows. The room is bright, open, tropical. Soft palm leaf shadows cast as gobo patterns across the pink wall and the chrome drips. Sun catches the floating K's chrome surface creating prismatic highlights. Warm, inviting, premium summer energy. Bright and airy throughout — no dark corners.`,
};

async function generateVariant(
  client: OpenAI,
  name: string,
  prompt: string,
): Promise<void> {
  console.log(`Generating ${name}...`);

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const data = response.data?.[0];
  let rawBuffer: Buffer;

  if (data?.b64_json) {
    rawBuffer = Buffer.from(data.b64_json, "base64");
  } else if (data?.url) {
    const res = await fetch(data.url);
    if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`);
    rawBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error(`No image data for ${name}`);
  }

  const icon = await sharp(rawBuffer)
    .resize(192, 192, { fit: "cover" })
    .png()
    .toBuffer();

  const dest = path.join(PUBLIC_DIR, `${name}.png`);
  await writeFile(dest, icon);
  console.log(`  ✓ ${name}.png (${icon.length} bytes)`);
}

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  await Promise.all(
    Object.entries(variants).map(([name, prompt]) =>
      generateVariant(client, name, prompt),
    ),
  );

  console.log("\nDone! Check public/variant-*.png");
}

main().catch((err) => {
  console.error("Variant generation failed:", err);
  process.exit(1);
});
