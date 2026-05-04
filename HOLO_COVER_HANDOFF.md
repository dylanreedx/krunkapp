# HoloCover — Handoff Document for Next Session

## Current State
The HoloCover component at `src/components/ui/holo-cover.tsx` is broken. It needs a complete rewrite. DO NOT build on the current code.

## What Was Tried (All Failed)

### Attempt 1: CSS layers with Pokemon Cards CSS technique
- 3 `<img>` elements with SVG `feColorMatrix` filters for R/G/B channel isolation
- `mix-blend-mode: screen` to combine
- Pokemon-style shine layer: `repeating-linear-gradient` at 110deg, `color-dodge` blend
- **Result**: Chromatic aberration worked (images 28/29 looked good). But CSS couldn't do a real holographic inner border. SVG `mask-composite` for border didn't render. `box-shadow: inset` for inner glow was invisible. Scanlines were too visible and static.

### Attempt 2: React Three Fiber + GLSL shader
- Custom GLSL fragment shader with chromatic aberration, blur, rainbow foil, sparkle, vignette
- `useTexture` from drei to load image
- **Result**: `useTexture` can't load data URLs (our covers are base64). White/broken image. Manually loading via `new Image()` + `THREE.Texture` also had issues.

### Attempt 3: react-holo-card-effect npm package
- `bun add react-holo-card-effect`
- Drop-in `<HoloCard url={src} width={size} height={size} />`
- **Result**: The holo effect itself looked decent (image 39). BUT the package creates its own container with its own border, blocking direct interaction with the cover. The falling star sparkles looked cheap. No control over the blur state.

### Attempt 4: Canvas2D single element
- Single `<canvas>` with manual `drawImage` calls
- Sinusoidal wave displacement for blur (drawing image in horizontal strips)
- Chromatic aberration via drawing image 3x offset with `screen` composite
- Rainbow border via `roundRect` clip with conic gradient
- **Result**: Horizontal scanlines were too visible and scanned upward (image 44). Wave displacement didn't match the reference. Holo effect was flat and unimpressive (image 45). Rainbow border was the wrong colors/style.

## What Actually Looked Good

### Images 28/29 (CSS version, commit 3b3d9c0):
- The chromatic aberration from 3 channel-split `<img>` elements WORKED
- The Pokemon-style shine layer (`repeating-linear-gradient`, `color-dodge`) looked correct
- 3D tilt via CSS `perspective` + `rotateX/Y` was smooth
- The image was ALWAYS dominant — effects were seasoning, not replacing

### Image 39 (react-holo-card-effect):
- The holo shimmer itself was good — proper Pokemon card feel
- Interactive tilt was responsive
- Glare following mouse was natural

## What the User Wants (Their Exact Words)

### REVEALED state:
- "Like a pokemon card with a cool pattern/texture, hover effect/tilt creating the 3d/distorted view effect. A grungy, interactive pokemon card"
- The IMAGE must always be dominant and clearly visible
- Subtle rainbow shimmer that shifts with mouse/tilt — not overwhelming
- Chromatic aberration at edges (RGB color split), NOT dark vignette
- Grungy texture (but NOT visible horizontal scanlines)
- 3D tilt on mouse movement, gyroscope on mobile
- Thin holographic border that shifts color — inner glow, not outer

### BLURRED state:
- "Looking through an unfocused up close camera with broken glass and light shining through creating the chromatic aberration"
- Wavy sinusoidal distortion (reference: diagonal wave pattern image, NOT water/turbulence)
- The waves should be diagonal, medium frequency, slowly animated
- Chromatic color split visible (RGB edges) — the "broken glass" feel
- NOT gaussian blur — should feel textured/physical
- Tilt should still work when blurred

### Things they DON'T want:
- No falling stars/sparkles
- No dark vignette (chromatic tints at edges OK)
- No visible horizontal scanlines
- No random rainbow rays across the image
- No SVG turbulence (looks like water)
- No heavy gradients replacing the image
- No wrapper containers intercepting mouse events

## Technical Constraints

### Cover image is a data URL
The current cover image is stored as `data:image/webp;base64,...` (97KB). ANY solution must handle data URLs. This broke:
- Three.js `useTexture` → can't load data URLs
- Some CORS-related loading issues

Once Vercel Blob is configured properly, covers will be real URLs. But the component must work with both.

### Architecture requirements:
- `"use client"` React component
- Props: `src`, `size`, `blurred`, `interactive`, `onReveal`, `className`
- Mouse tracking drives effects + CSS 3D tilt
- Mobile gyroscope support
- Click/tap toggles blur state
- No hydration mismatches (no `Math.random()` in initial render)
- 60fps, no jank

## Files That Use HoloCover
- `src/app/queue/[id]/_components/queue-cover.tsx` — published queue view (revealed, interactive)
- `src/app/queue/[id]/_components/draft-preview.tsx` — draft anticipation view (blurred, interactive)
- `src/app/queue/[id]/edit/_components/queue-editor.tsx` — editor preview (blurred, small 110px)

## Reference Links
- Pokemon Cards CSS: https://github.com/simeydotme/pokemon-cards-css
- Live demo: https://poke-holo.simey.me/
- react-holo-card-effect: https://github.com/van123helsing/react-holo-card-effect
- Radiant shaders: https://radiant-shaders.com/
- Paper shaders: https://shaders.paper.design/

## Dylan's Exact Words & Vision

### On the revealed state:
- "like a pokemon card with a cool pattern/texture, hover effect/tilt creating the 3d/distorted view effect. A grungy, interactive pokemon card"
- "i want more of the chromatic aberration as the vignette (not darker) but as the 'broken glass' bokeh effect, warping the cover image almost"
- "i want more vignetted" (but NOT dark — chromatic color tints)
- "i dont dig the stars falling" — no sparkle particles
- "holo borders like pokemon cards have" — thin, color-shifting, responsive to mouse

### On the blur state:
- "looking through an unfocused up close camera with broken glass and light shining through creating the chromatic aberration"
- "wavy distortion" — like the diagonal wave pattern reference image (NOT water, NOT gaussian)
- "the blur is too uniform/gaussian we need some cool texture/shading"
- Showed reference image of diagonal sinusoidal waves — "maybe we can have it animate slightly"
- "i want the tilt on the blurred state too"

### On what sucks:
- "it just looks like random rainbow rays are moving across the cover" — the rainbow overlay was too prominent
- "the shimmer texture/animation is too frequent and bare" — too fast, too uniform
- "i dont see any inner holo border" — repeated multiple times, never got it right
- "the blur doesn't look great, there is a static opaque box that i see containing" — wrapper div visible
- "we are interacting within a container? i want to interact with the cover itself"
- "NO STOP PUSHING" "it looks like shit"

### Key aesthetic references:
- Pokemon TCG holographic cards: https://poke-holo.simey.me/
- The diagonal wave pattern (for blur distortion) — NOT water turbulence
- "out of focused glass or CD in light" — for the chromatic blur effect
- "hologram toys/sheets/textures from the early 2000s" — the physical iridescent feel

### Terms to use:
- "Grungy" not clean
- "Chromatic aberration" not color split
- "Holographic" not rainbow
- "Interactive" — mouse AND gyroscope
- "Impressed" / "impressionable" — this needs to be the signature feature
- "Collector" energy — like a trading card you want to hold and tilt

## Recommended Approach for Next Session
The CSS approach (attempt 1) got closest. The key insight from the Pokemon Cards CSS source:
1. `.card__shine` layer: `repeating-linear-gradient` at 110deg with rainbow colors, `background-size: 400% 400%`, `mix-blend-mode: color-dodge`. Background position driven by mouse CSS variables.
2. `.card__shine::after`: `radial-gradient` from pointer, `mix-blend-mode: luminosity`, `contrast(4)`.
3. `.card__glare` layer: `radial-gradient` from pointer, `mix-blend-mode: overlay`.
4. The border should be a simple CSS `border-image` or `background` on a wrapper with padding.

The issue with attempt 1 was only the border and inner glow. Those can probably be solved with:
- `border-image: conic-gradient(...)` for the outer holographic border
- A dedicated inner `<div>` with `box-shadow: inset` for the glow (needs to be tested more carefully with proper z-index)

For the blur state, consider:
- CSS `backdrop-filter` or SVG `feDisplacementMap` with a custom displacement map (not `feTurbulence`)
- OR pre-process the image on a hidden canvas and display the result as a regular `<img>` — the wave displacement code was close but the strip-drawing approach was flawed

## What to Revert
Before starting next session, revert holo-cover.tsx to a simple placeholder that just shows the image:
```tsx
export function HoloCover({ src, size = 340, className }) {
  return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 24, objectFit: 'cover' }} className={className} />;
}
```
Then build up from there incrementally, checking each visual layer one at a time.
