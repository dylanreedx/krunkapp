import OpenAI from "openai";
import { buildImagePrompt } from "../src/lib/ai/style-prefix.js";
import { writeFileSync } from "fs";

const scene = process.argv[2] ?? "A bird's-eye view of a rooftop pool at dusk where rippling water reflects fragmented neon light from surrounding buildings, with a submerged chrome laptop resting on the pool floor casting distorted light patterns upward. Heavy chromatic aberration warps the edges of the frame while halftone dots dissolve the corners into abstraction, and scattered dead leaves float on the water surface catching the last traces of pink and blue light.";

async function main() {
  const prompt = buildImagePrompt(scene);
  console.log("Generating with gpt-image-1...");
  console.log("Prompt:", prompt.length, "chars\n");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const start = Date.now();

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const data = response.data?.[0];

  if (data?.b64_json) {
    const buf = Buffer.from(data.b64_json, "base64");
    writeFileSync("./mockups/test-cover.png", buf);
    console.log("Saved to mockups/test-cover.png");
    console.log(`Size: ${(buf.length / 1024).toFixed(0)}KB`);
  } else if (data?.url) {
    const img = await fetch(data.url);
    const buf = Buffer.from(await img.arrayBuffer());
    writeFileSync("./mockups/test-cover.png", buf);
    console.log("Saved to mockups/test-cover.png");
    console.log(`Size: ${(buf.length / 1024).toFixed(0)}KB`);
  } else {
    console.log("No image data:", JSON.stringify(response).slice(0, 500));
  }

  console.log(`Time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch(console.error);
