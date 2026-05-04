/**
 * Creates a favicon from just the top-left drip area of the brand image.
 * Captures the holographic drip + pink background.
 */

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../public");

async function main() {
  const source = await readFile(path.join(PUBLIC_DIR, "brand-source-1024.png"));

  // Crop the top portion — the drip edge over pink
  const cropped = await sharp(source)
    .extract({ left: 150, top: 0, width: 700, height: 700 })
    .resize(32, 32, { fit: "cover" })
    .png()
    .toBuffer();

  await writeFile(path.join(PUBLIC_DIR, "favicon.ico"), cropped);
  console.log(`✓ favicon.ico (${cropped.length} bytes)`);

  // Also make a 192 version to preview
  const preview = await sharp(source)
    .extract({ left: 150, top: 0, width: 700, height: 700 })
    .resize(192, 192, { fit: "cover" })
    .png()
    .toBuffer();

  await writeFile(path.join(PUBLIC_DIR, "favicon-preview.png"), preview);
  console.log(`✓ favicon-preview.png (${preview.length} bytes) — for preview`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
