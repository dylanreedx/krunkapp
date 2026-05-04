/**
 * Fixed AI art style prefix for consistent visual language across all
 * generated queue cover art. Prepended to every image generation prompt.
 */

export const ART_STYLE_PREFIX = `Highly detailed anime-cinematic illustration in the style of MAPPA Studio, Akira (1988), and Neon Genesis Evangelion. Hand-painted quality with meticulous environmental detail. NOT photorealistic. NOT 3D render. NOT simple or flat.

Rendering — treat every surface as an opportunity for detail:
- Thick confident ink outlines on major forms, thinner delicate lines for interior detail — pipes, rivets, panel seams, cracks, wiring, rust patterns, water stains
- Cel-shaded base colors with LAYERED shading: a hard shadow pass, a soft ambient occlusion pass, and selective painted rendering on focal surfaces (wet concrete, scratched metal, cracked glass, oxidized copper)
- Every material has visible texture: brushed steel has directional grain, concrete has aggregate and pitting, glass has refraction and smudges, rubber has scuffing, water has surface tension and distortion of what's beneath it
- Atmospheric depth: volumetric fog, rain, steam, dust motes, or heat haze in the air between foreground and background. The air itself is visible.

Lighting — cinematic, not even. Every frame has a dominant light story:
- One strong key light source casting hard-edged shadows with visible light rays/shafts cutting through atmosphere (Akira motorcycle headlight energy)
- Neon bloom and light bleed: light sources glow beyond their edges, tinting nearby surfaces with colored reflections. Wet surfaces multiply this — puddles, glass, polished metal all carry reflected color
- Rim lighting on edges of objects separating them from deep shadow backgrounds
- At least 3 distinct light colors in every scene creating complex color interactions on surfaces

Camera and composition:
- Dramatic anime camera angles: extreme fish-eye distortion, low-angle looking up through machinery, vertiginous top-down shots, forced perspective down corridors, wide-angle lens warp, canted Dutch angles
- DENSE compositions with clear foreground / midground / background separation. Foreground objects partially frame the shot (pipes, fences, cables, machinery edges)
- NO people, NO figures, NO silhouettes, NO hands — environment and objects ONLY
- NO text, NO words, NO letters, NO kanji, NO readable signage — purely visual

Detail density — this should reward zooming in:
- Visible infrastructure: exposed wiring bundles, junction boxes, cable runs along walls, ventilation ducts, drainage grates, utility meters, valve wheels, circuit breakers
- Environmental storytelling through objects: scattered debris, pooled water, condensation, rust streaks, oil stains, worn paint, peeling surfaces, tangled cables
- Background complexity: distant buildings, layered rooftops, antenna forests, industrial skylines, cloud formations — never an empty or flat background
- Micro-details in focal areas: water droplets on metal, light refracting through glass edges, heat shimmer above vents, sparks frozen mid-arc

Scene:`;

/**
 * Combines the fixed art style prefix with a scene-specific description
 * to produce a complete image generation prompt.
 */
export function buildImagePrompt(sceneDescription: string): string {
  return `${ART_STYLE_PREFIX}\n${sceneDescription.trim()}`;
}
