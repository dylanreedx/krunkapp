/**
 * Fixed AI art style prefix for consistent visual language across all
 * generated queue cover art. Prepended to every image generation prompt.
 */

export const ART_STYLE_PREFIX = `Abstract cinematic digital art. NOT a photograph. NOT photorealistic.

Visual style:
- Mixed media collage aesthetic — layered textures, torn edges, overlapping elements
- Extreme or unusual camera angles: bird's eye, worm's eye, Dutch tilt, macro close-ups of textures
- Heavy post-processing: chromatic aberration, film grain, halftone dots, light leaks, lens distortion, glitch artifacts
- Color grading pushed to extremes — crushed blacks, blown highlights, split toning
- Depth created through layering and overlap, not perspective

Composition rules:
- NO dominant human figures. NO people as the focal point. If a person appears, they are tiny, obscured, or just a silhouette fragment at the edge
- Focus on OBJECTS, TEXTURES, ENVIRONMENTS — a crumpled receipt, wet pavement reflection, tangled headphone wires, condensation on glass, light through blinds
- Asymmetric composition. Off-center subjects. Negative space used intentionally.
- Think album art, not movie poster. Think Radiohead covers, not Netflix thumbnails.

Texture and medium:
- Mix of sharp and soft — some elements crisp, others dissolved or blurred
- Visible grain, noise, or printing artifacts as intentional texture
- Could look like it was printed on rough paper, or like a scan of a collaged photo

Scene:`;

/**
 * Combines the fixed art style prefix with a scene-specific description
 * to produce a complete image generation prompt.
 */
export function buildImagePrompt(sceneDescription: string): string {
  return `${ART_STYLE_PREFIX}\n${sceneDescription.trim()}`;
}
