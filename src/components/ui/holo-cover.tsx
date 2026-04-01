"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type HoloCoverProps = {
  src: string;
  alt?: string;
  size?: number;
  blurred?: boolean;
  interactive?: boolean;
  className?: string;
  onReveal?: () => void;
};

// ---------------------------------------------------------------------------
// GLSL — everything in one shader
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;        // 0..1
  uniform float uTime;
  uniform float uBlur;        // 0 = revealed, 1 = blurred
  uniform float uAspect;

  varying vec2 vUv;

  vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
  }

  // --- Iridescent interference pattern ---
  // Inspired by reactbits iridescence: iterative cosine-sine feedback loop
  // creates complex holographic interference fringes that shift with mouse
  float holoPattern(vec2 uv, vec2 mouse, float time) {
    vec2 p = (uv - 0.5) * 6.0 + mouse * 3.0;
    float d = -time * 0.3;
    float a = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
      a += cos(i - d - a * p.x);
      d += sin(p.y * i + a);
    }
    d += time * 0.3;
    float v = cos(p.x * d) * 0.5 + cos(p.y * a) * 0.5;
    return v * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5);
    float phase = uTime * 0.15;

    // --- Zoom: blurred state pushes in slightly, reveal pulls back ---
    float zoom = 1.0 + uBlur * 0.04;
    uv = center + (uv - center) / zoom;
    uv = clamp(uv, 0.0, 1.0);

    float dist = length(uv - center);

    // --- Wavy distortion (blur state) ---
    // Layered sine interference — organic flowing waves like the reference.
    // Displaces UVs using the gradient of a wave field. Stronger at corners.
    if (uBlur > 0.01) {
      // Corner-weighted intensity: max at corners, zero at center
      vec2 fromCenter = abs(uv - center) * 2.0; // 0 at center, 1 at edges
      float cornerDist = max(fromCenter.x, fromCenter.y);
      float intensity = smoothstep(0.1, 0.9, cornerDist);

      // Wave field: layered sine functions for organic flow
      float t = phase;
      float eps = 0.003;

      // Sample wave field at uv and neighbors to get gradient
      // Wave function inline (3 octaves of interfering sine waves)
      #define WAVE(p) ( \
        sin((p).x * 10.0 + sin((p).y * 7.0 + t) * 2.5) + \
        sin((p).y * 8.0 + sin((p).x * 6.0 + t * 0.7) * 3.0) + \
        sin(((p).x + (p).y) * 6.0 + sin(((p).x - (p).y) * 4.0 + t * 0.5) * 2.0) \
      )

      float waveC = WAVE(uv);
      float waveR = WAVE(uv + vec2(eps, 0.0));
      float waveU = WAVE(uv + vec2(0.0, eps));

      // Gradient → displacement direction (perpendicular to wave ridges)
      vec2 grad = vec2(waveR - waveC, waveU - waveC) / eps;
      vec2 waveDisplace = normalize(grad + 0.001) * length(grad);

      float displaceStr = uBlur * 0.008 * intensity;
      uv += waveDisplace * displaceStr;

      #undef WAVE
    }

    dist = length(uv - center);

    // --- Chromatic aberration (radial — clean center, fringe at edges) ---
    vec2 dir = normalize(uv - center + 0.001) * dist;
    float falloff = smoothstep(0.08, 0.55, dist);
    float caStrength = mix(0.01, 0.04, uBlur) * falloff;

    vec2 uvR = uv + dir * caStrength;
    vec2 uvB = uv - dir * caStrength;

    vec3 color;

    if (uBlur > 0.01) {
      // Soft directional blur along wave flow
      float vBlur = smoothstep(0.0, 0.4, dist);
      float blurRad = uBlur * 0.010 * (0.3 + vBlur * 0.7);

      vec3 acc = vec3(0.0);
      float total = 0.0;
      for (float i = -2.0; i <= 2.0; i += 1.0) {
        float w = 1.0 - abs(i) / 3.0;
        vec2 offH = vec2(blurRad * i, 0.0);
        vec2 offV = vec2(0.0, blurRad * i);
        acc += vec3(
          texture2D(uTexture, uv + dir * caStrength + offH).r,
          texture2D(uTexture, uv + offH).g,
          texture2D(uTexture, uv - dir * caStrength + offH).b
        ) * w;
        acc += vec3(
          texture2D(uTexture, uv + dir * caStrength + offV).r,
          texture2D(uTexture, uv + offV).g,
          texture2D(uTexture, uv - dir * caStrength + offV).b
        ) * w;
        total += w * 2.0;
      }
      color = acc / total;
    } else {
      color = vec3(texture2D(uTexture, uvR).r, texture2D(uTexture, uv).g, texture2D(uTexture, uvB).b);
    }

    // --- Bokeh light leaks at edges (blur state) ---
    if (uBlur > 0.01) {
      vec3 bokehColor = vec3(0.0);
      for (float i = 0.0; i < 8.0; i++) {
        float seed = i * 1.618;
        // Fixed positions (stable, no flickering) with very slow drift
        vec2 bokehPos = vec2(
          fract(sin(seed * 127.1) * 43758.5) * 0.8 + 0.1,
          fract(sin(seed * 311.7) * 43758.5) * 0.8 + 0.1
        );
        // Slow gentle drift
        bokehPos += vec2(sin(uTime * 0.1 + seed), cos(uTime * 0.08 + seed * 2.0)) * 0.03;
        float bokehDist = length(uv - bokehPos);
        float edgeMask = smoothstep(0.15, 0.5, length(bokehPos - center));
        float bokeh = smoothstep(0.07, 0.0, bokehDist) * edgeMask;
        float bHue = fract(seed * 0.37 + uTime * 0.02);
        bokehColor += hsv2rgb(vec3(bHue, 0.4, 1.0)) * bokeh;
      }
      color += bokehColor * uBlur * 0.35;
    }

    // --- Holographic foil pattern ---
    float pattern = holoPattern(uv, uMouse, uTime);

    // Rainbow hue driven by pattern position + mouse angle
    float angle = atan(uv.y - uMouse.y, uv.x - uMouse.x);
    float hue = fract(pattern * 0.5 + angle / 6.283 + uTime * 0.02);
    vec3 rainbow = hsv2rgb(vec3(hue, 0.7, 1.0));

    // Color-dodge blend: image / (1 - overlay * strength)
    float foilIntensity = pattern * mix(0.12, 0.06, uBlur);
    // Stronger near mouse, weaker far away
    float mouseProximity = 1.0 - smoothstep(0.0, 0.6, length(uv - uMouse));
    foilIntensity *= 0.4 + mouseProximity * 0.6;
    vec3 foilColor = rainbow * foilIntensity;
    color = color + foilColor * color; // soft light-style blend: adds to brights, subtle on darks

    // --- Glare (subtle, on top of foil pattern) ---
    float glare = pow(mouseProximity, 4.0) * mix(0.12, 0.05, uBlur);
    color += vec3(glare);

    // --- Film grain ---
    float grain = fract(sin(dot(uv * 500.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.02;

    // --- Holographic border (inner glow, hue shifts with mouse) ---
    float borderDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float borderGlow = smoothstep(0.05, 0.0, borderDist);
    float borderHue = fract((uMouse.x + uMouse.y) * 0.5 + uTime * 0.05);
    vec3 borderColor = hsv2rgb(vec3(borderHue, 0.8, 0.8));
    color += borderColor * borderGlow * mix(0.3, 0.15, uBlur);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Load texture from src (handles data URLs)
// ---------------------------------------------------------------------------

function useImageTexture(src: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      tex.colorSpace = THREE.LinearSRGBColorSpace;
      tex.wrapS = THREE.MirroredRepeatWrapping;
      tex.wrapT = THREE.MirroredRepeatWrapping;
      setTexture((prev) => {
        if (prev) prev.dispose();
        return tex;
      });
    };
    img.src = src;
  }, [src]);

  return texture;
}

// ---------------------------------------------------------------------------
// The shader plane
// ---------------------------------------------------------------------------

function DisableToneMapping() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
    gl.outputColorSpace = THREE.LinearSRGBColorSpace;
  }, [gl]);
  return null;
}

function HoloPlane({
  src,
  mouseRef,
  blurAmount,
}: {
  src: string;
  mouseRef: React.RefObject<{ x: number; y: number }>;
  blurAmount: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const texture = useImageTexture(src);
  const { viewport } = useThree();
  const currentBlur = useRef(blurAmount);
  const blurTarget = useRef(blurAmount);
  const transitionStart = useRef(0);
  const transitionFrom = useRef(blurAmount);
  const transitionDuration = 0.45; // seconds

  // Stable uniforms — created once, updated in useFrame
  const uniforms = useRef({
    uTexture: { value: null as THREE.Texture | null },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uTime: { value: 0 },
    uBlur: { value: blurAmount },
    uAspect: { value: 1 },
  }).current;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Detect target change → start new transition
    if (blurTarget.current !== blurAmount) {
      transitionFrom.current = currentBlur.current;
      transitionStart.current = t;
      blurTarget.current = blurAmount;
    }

    // Ease-out cubic: fast start, smooth deceleration
    const elapsed = t - transitionStart.current;
    const progress = Math.min(elapsed / transitionDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    currentBlur.current = transitionFrom.current + (blurAmount - transitionFrom.current) * eased;

    uniforms.uTime.value = t;
    uniforms.uMouse.value.set(mouseRef.current.x, 1 - mouseRef.current.y);
    uniforms.uBlur.value = currentBlur.current;

    if (texture) {
      uniforms.uTexture.value = texture;
    }
  });

  if (!texture) return null;

  // Set texture immediately on first render too
  if (texture && !uniforms.uTexture.value) {
    uniforms.uTexture.value = texture;
  }

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Tilt via mouse / gyro
// ---------------------------------------------------------------------------

function useMouseAndTilt(
  hitAreaRef: React.RefObject<HTMLDivElement | null>,
  tiltRef: React.RefObject<HTMLDivElement | null>,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>,
  enabled: boolean,
) {
  const tiltTarget = useRef({ rx: 0, ry: 0 });
  const tiltCurrent = useRef({ rx: 0, ry: 0 });
  const raf = useRef(0);

  // Mouse tracking on the hit area (outermost div — never blocked)
  useEffect(() => {
    const el = hitAreaRef.current;
    if (!el || !enabled) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      mouseRef.current = { x, y };
      tiltTarget.current = { rx: (y - 0.5) * -12, ry: (x - 0.5) * 12 };
    };

    const onLeave = () => {
      mouseRef.current = { x: 0.5, y: 0.5 };
      tiltTarget.current = { rx: 0, ry: 0 };
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [hitAreaRef, mouseRef, enabled]);

  // Gyroscope
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("ontouchstart" in window)) return;
    let granted = false;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (!granted) return;
      const beta = Math.max(-30, Math.min(30, e.beta ?? 0));
      const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0));
      mouseRef.current = { x: (gamma + 30) / 60, y: (beta + 30) / 60 };
      tiltTarget.current = { rx: -beta * 0.4, ry: gamma * 0.4 };
    };

    const requestGyro = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        "requestPermission" in DeviceOrientationEvent &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
          .requestPermission === "function"
      ) {
        try {
          const perm = await (
            DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
          ).requestPermission();
          granted = perm === "granted";
        } catch {
          granted = false;
        }
      } else {
        granted = true;
      }
      if (granted) window.addEventListener("deviceorientation", onOrientation);
    };

    void requestGyro();
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [mouseRef, enabled]);

  // Tilt animation on the inner tilt element
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;

    const animate = () => {
      tiltCurrent.current.rx += (tiltTarget.current.rx - tiltCurrent.current.rx) * 0.1;
      tiltCurrent.current.ry += (tiltTarget.current.ry - tiltCurrent.current.ry) * 0.1;
      const { rx, ry } = tiltCurrent.current;

      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      el.style.filter = `drop-shadow(${ry * 0.8}px ${-rx * 0.8 + 8}px 20px rgba(0,0,0,0.2))`;

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [tiltRef]);
}

// ---------------------------------------------------------------------------
// HoloCover
// ---------------------------------------------------------------------------

export function HoloCover({
  src,
  alt,
  size = 340,
  blurred = false,
  interactive = true,
  className,
  onReveal,
}: HoloCoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [isBlurred, setIsBlurred] = useState(blurred);

  useMouseAndTilt(containerRef, tiltRef, mouseRef, interactive);

  const handleClick = useCallback(() => {
    if (!blurred) return;
    setIsBlurred((prev) => {
      if (prev && onReveal) onReveal();
      return !prev;
    });
  }, [blurred, onReveal]);

  const [dpr, setDpr] = useState(1);
  useEffect(() => { setDpr(Math.min(window.devicePixelRatio, 2)); }, []);

  return (
    <div
      ref={containerRef}
      className={cn("outline-none", className)}
      style={{ width: size, height: size, position: "relative" }}
    >
      {/* Tilt wrapper */}
      <div ref={tiltRef} style={{ width: size, height: size, transformStyle: "preserve-3d", willChange: "transform" }}>
        {/* Visual container */}
        <div className="relative h-full w-full overflow-hidden rounded-[24px]">
          <Canvas
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            camera={{ position: [0, 0, 1], fov: 50 }}
            dpr={dpr}
            style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
            events={() => ({ enabled: false, priority: 0, compute: () => {} } as never)}
          >
            <DisableToneMapping />
            <HoloPlane
              src={src}
              mouseRef={mouseRef}
              blurAmount={isBlurred ? 1 : 0}
            />
          </Canvas>

          {/* Tap to peek */}
          {isBlurred && blurred && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
                <span className="font-display text-xs font-bold text-white">Tap to peek</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click target — pointer-events:none lets mousemove pass to containerRef */}
      {blurred && (
        <div
          onClick={handleClick}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
          role="button"
          tabIndex={0}
          aria-label={isBlurred ? "Tap to reveal cover art" : "Tap to hide cover art"}
          className="absolute inset-0 z-20 cursor-pointer outline-none"
        />
      )}
    </div>
  );
}
