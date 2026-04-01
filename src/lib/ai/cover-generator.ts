/**
 * Generates cover art using OpenAI image generation,
 * combining the art style prefix with a scene description.
 * Outputs optimized WebP at 512x512 (~50-150KB vs 2MB+ PNG).
 */

import OpenAI from "openai";
import sharp from "sharp";
import { env } from "@/env";
import { buildImagePrompt } from "./style-prefix";

export async function generateCoverArt(
  sceneDescription: string,
): Promise<Buffer> {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const prompt = buildImagePrompt(sceneDescription);

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
    const imageResponse = await fetch(data.url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    rawBuffer = Buffer.from(await imageResponse.arrayBuffer());
  } else {
    throw new Error("No image data returned from OpenAI");
  }

  // Resize to 512x512 and convert to WebP for web efficiency
  const optimized = await sharp(rawBuffer)
    .resize(512, 512, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();

  return optimized;
}

/**
 * Generates a tiny blurred preview placeholder (32x32 WebP, ~1-2KB).
 * Used for instant loading before the full cover loads.
 */
export async function generateBlurPreview(
  coverBuffer: Buffer,
): Promise<string> {
  const tiny = await sharp(coverBuffer)
    .resize(32, 32, { fit: "cover" })
    .blur(2)
    .webp({ quality: 40 })
    .toBuffer();

  return `data:image/webp;base64,${tiny.toString("base64")}`;
}
