"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// GLSL Shaders
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
  uniform vec2 uMouse;       // 0..1 normalized mouse position
  uniform float uTime;
  uniform float uBlur;       // 0.0 = sharp, 1.0 = fully blurred
  uniform float uIntensity;  // overall effect intensity

  varying vec2 vUv;

  // --- Helpers ---

  // HSV to RGB
  vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
  }

  // Simple hash for sparkle
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Sparkle noise
  float sparkle(vec2 uv, float time) {
    vec2 grid = floor(uv * 80.0);
    float h = hash(grid);
    float twinkle = sin(time * 3.0 + h * 6.283) * 0.5 + 0.5;
    twinkle = pow(twinkle, 12.0); // sharp sparkle peaks
    return twinkle * step(0.92, h); // only ~8% of cells sparkle
  }

  void main() {
    vec2 uv = vUv;

    // --- Chromatic aberration ---
    // Offset R/G/B channels based on mouse distance from center
    vec2 dir = uv - uMouse;
    float dist = length(dir);
    float aberration = dist * 0.012 * uIntensity;

    float r = texture2D(uTexture, uv + dir * aberration).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - dir * aberration).b;
    vec3 color = vec3(r, g, b);

    // --- Blur (when in preview mode) ---
    if (uBlur > 0.01) {
      vec3 blurred = vec3(0.0);
      float total = 0.0;
      float radius = uBlur * 0.02;
      for (float x = -3.0; x <= 3.0; x += 1.0) {
        for (float y = -3.0; y <= 3.0; y += 1.0) {
          vec2 offset = vec2(x, y) * radius;
          float weight = 1.0 - length(vec2(x, y)) / 4.24;
          blurred += texture2D(uTexture, uv + offset).rgb * weight;
          total += weight;
        }
      }
      color = mix(color, blurred / total, uBlur);
    }

    // --- Iridescent rainbow foil ---
    // Angle between UV and mouse position determines hue
    float angle = atan(dir.y, dir.x);
    float hue = fract(angle / 6.283 + uTime * 0.05 + dist * 0.8);
    vec3 rainbow = hsv2rgb(vec3(hue, 0.6, 1.0));

    // Apply with color-dodge-like blend
    float foilStrength = 0.08 * uIntensity * (1.0 - uBlur);
    color = color + rainbow * foilStrength * (1.0 + dist * 2.0);

    // --- Glare / light spot ---
    float glare = 1.0 - smoothstep(0.0, 0.5, length(uv - uMouse));
    glare = pow(glare, 3.0) * 0.2 * uIntensity * (1.0 - uBlur);
    color += vec3(glare);

    // --- Sparkle / glitter ---
    float spark = sparkle(uv + uMouse * 0.1, uTime);
    vec3 sparkColor = hsv2rgb(vec3(fract(hash(floor(uv * 80.0)) + uTime * 0.1), 0.3, 1.0));
    color += spark * sparkColor * 0.5 * uIntensity * (1.0 - uBlur);

    // --- Film grain ---
    float grain = (hash(uv * 500.0 + uTime) - 0.5) * 0.04 * uIntensity;
    color += grain;

    // --- Scanlines (very subtle) ---
    float scanline = sin(uv.y * 400.0 + uTime * 2.0) * 0.015 * uIntensity * (1.0 - uBlur);
    color -= scanline;

    // --- Vignette ---
    float vignette = 1.0 - smoothstep(0.4, 0.75, length(uv - 0.5));
    color *= mix(1.0, vignette, 0.15);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Three.js Scene (the holographic plane)
// ---------------------------------------------------------------------------

function HoloPlane({
  src,
  mouseRef,
  blurAmount,
  intensity,
}: {
  src: string;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  blurAmount: number;
  intensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const texture = useTexture(src);
  const { viewport } = useThree();

  // Fit plane to viewport
  const scale = Math.min(viewport.width, viewport.height);

  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime!.value = clock.getElapsedTime();
    (u.uMouse!.value as THREE.Vector2).set(mouseRef.current.x, mouseRef.current.y);
    u.uBlur!.value = THREE.MathUtils.lerp(u.uBlur!.value as number, blurAmount, 0.08);
    u.uIntensity!.value = THREE.MathUtils.lerp(u.uIntensity!.value as number, intensity, 0.08);
  });

  return (
    <mesh ref={meshRef} scale={[scale, scale, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTexture: { value: texture },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uTime: { value: 0 },
          uBlur: { value: blurAmount },
          uIntensity: { value: intensity },
        }}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Tilt wrapper (CSS 3D transform driven by mouse/gyro)
// ---------------------------------------------------------------------------

function useTilt(
  containerRef: React.RefObject<HTMLDivElement | null>,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>,
  enabled: boolean,
) {
  const tiltRef = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef<number>(0);

  // Mouse tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, 1 - y)) };
      tiltRef.current = {
        rx: (y - 0.5) * -15, // degrees
        ry: (x - 0.5) * 15,
      };
    };

    const onLeave = () => {
      mouseRef.current = { x: 0.5, y: 0.5 };
      tiltRef.current = { rx: 0, ry: 0 };
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [containerRef, mouseRef, enabled]);

  // Gyroscope for mobile
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let hasPermission = false;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (!hasPermission) return;
      const beta = Math.max(-30, Math.min(30, e.beta ?? 0)); // front-back tilt
      const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0)); // left-right tilt
      mouseRef.current = {
        x: (gamma + 30) / 60,
        y: (beta + 30) / 60,
      };
      tiltRef.current = {
        rx: -beta * 0.4,
        ry: gamma * 0.4,
      };
    };

    // Request permission on iOS
    const requestGyro = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        "requestPermission" in DeviceOrientationEvent &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission === "function"
      ) {
        try {
          const perm = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
          hasPermission = perm === "granted";
        } catch {
          hasPermission = false;
        }
      } else {
        hasPermission = true; // Android doesn't need permission
      }

      if (hasPermission) {
        window.addEventListener("deviceorientation", onOrientation);
      }
    };

    // Only request on touch devices
    if ("ontouchstart" in window) {
      void requestGyro();
    }

    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [mouseRef, enabled]);

  // Smooth animation loop for CSS transform
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let currentRx = 0;
    let currentRy = 0;

    const animate = () => {
      currentRx += (tiltRef.current.rx - currentRx) * 0.1;
      currentRy += (tiltRef.current.ry - currentRy) * 0.1;

      el.style.transform = `perspective(800px) rotateX(${currentRx}deg) rotateY(${currentRy}deg)`;

      // Dynamic shadow based on tilt
      const shadowX = currentRy * 0.8;
      const shadowY = -currentRx * 0.8 + 8;
      el.style.boxShadow = `${shadowX}px ${shadowY}px 30px rgba(0,0,0,0.15), 0 0 ${Math.abs(currentRx) + Math.abs(currentRy)}px rgba(255,45,120,0.1)`;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [containerRef]);

  return tiltRef;
}

// ---------------------------------------------------------------------------
// Fallback (no WebGL) — graceful degradation
// ---------------------------------------------------------------------------

function StaticCover({
  src,
  blurred,
  interactive,
}: {
  src: string;
  blurred: boolean;
  interactive: boolean;
}) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const handleLeave = () => setMouse({ x: 0.5, y: 0.5 });

  const gradAngle = Math.atan2(mouse.y - 0.5, mouse.x - 0.5) * (180 / Math.PI);
  const glareX = mouse.x * 100;
  const glareY = mouse.y * 100;

  // Border holo color shifts with mouse
  const borderHue = ((mouse.x + mouse.y) * 180) % 360;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {/* Base image */}
      <img
        src={src}
        alt=""
        className={cn(
          "h-full w-full object-cover transition-all duration-700",
          blurred && "blur-[6px] scale-[1.1] saturate-[1.4] brightness-[0.8]",
        )}
        draggable={false}
      />

      {/* === Effects — always on, even when blurred === */}

      {/* Rainbow foil overlay */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-color-dodge transition-all duration-300"
        style={{
          opacity: blurred ? 0.06 : 0.1,
          background: `linear-gradient(${gradAngle + 45}deg,
            rgba(255,50,50,0.6), rgba(255,180,0,0.6), rgba(255,255,50,0.6),
            rgba(50,255,100,0.6), rgba(50,200,255,0.6), rgba(180,50,255,0.6),
            rgba(255,50,120,0.6))`,
        }}
      />

      {/* Glare spot — follows mouse */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay transition-all duration-200"
        style={{
          background: `radial-gradient(ellipse at ${glareX}% ${glareY}%, rgba(255,255,255,${blurred ? 0.15 : 0.3}) 0%, transparent 55%)`,
        }}
      />

      {/* Heavy vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Shimmer sweep — slow, subtle */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: blurred ? 0.04 : 0.08,
          background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.6) 48%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 52%, transparent 70%)",
          backgroundSize: "300% 300%",
          animation: "holo-shimmer 8s ease-in-out infinite",
        }}
      />

      {/* Inner holo border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[21px] transition-all duration-300"
        style={{
          boxShadow: `inset 0 0 0 2px hsla(${borderHue}, 80%, 65%, ${blurred ? 0.3 : 0.5}), inset 0 0 15px 2px hsla(${borderHue}, 80%, 65%, ${blurred ? 0.1 : 0.2})`,
        }}
      />

      <style>{`
        @keyframes holo-shimmer {
          0% { background-position: 200% 200%; }
          50% { background-position: -50% -50%; }
          100% { background-position: 200% 200%; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main HoloCover component
// ---------------------------------------------------------------------------

export type HoloCoverProps = {
  src: string;
  alt?: string;
  size?: number;
  blurred?: boolean;
  interactive?: boolean;
  className?: string;
  onReveal?: () => void;
};

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
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [isBlurred, setIsBlurred] = useState(blurred);
  const [supportsWebGL, setSupportsWebGL] = useState(true);

  // Check WebGL support + data URL detection
  const isDataUrl = src.startsWith("data:");

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setSupportsWebGL(!!gl && !isDataUrl); // data URLs don't work well with Three.js TextureLoader
    } catch {
      setSupportsWebGL(false);
    }
  }, [isDataUrl]);

  useTilt(containerRef, mouseRef, interactive);

  const handleClick = useCallback(() => {
    if (blurred) {
      setIsBlurred((prev) => {
        if (prev && onReveal) onReveal();
        return !prev;
      });
    }
  }, [blurred, onReveal]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      role={blurred ? "button" : undefined}
      tabIndex={blurred ? 0 : undefined}
      aria-label={blurred ? (isBlurred ? "Tap to reveal cover art" : "Tap to hide cover art") : alt}
      onKeyDown={blurred ? (e) => { if (e.key === "Enter" || e.key === " ") handleClick(); } : undefined}
      className={cn(
        "relative overflow-hidden rounded-[24px] border-[3px]",
        blurred && "cursor-pointer",
        interactive && "transition-all duration-300",
        className,
      )}
      data-holo-border
      style={{
        width: size,
        height: size,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {supportsWebGL ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-pink" />
            </div>
          }
        >
          <Canvas
            gl={{ antialias: true, alpha: false }}
            camera={{ position: [0, 0, 1], fov: 50 }}
            style={{ width: "100%", height: "100%" }}
            dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
          >
            <HoloPlane
              src={src}
              mouseRef={mouseRef}
              blurAmount={isBlurred ? 1 : 0}
              intensity={isBlurred ? 0.2 : 1}
            />
          </Canvas>
        </Suspense>
      ) : (
        <StaticCover src={src} blurred={isBlurred} interactive={interactive} />
      )}

      {/* "Tap to reveal" hint when blurred */}
      {isBlurred && blurred && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
            <span className="font-display text-xs font-bold text-white">
              Tap to peek
            </span>
          </div>
        </div>
      )}

      {/* Reveal shimmer border animation */}
      {!isBlurred && interactive && (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[21px]"
          style={{
            background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
            backgroundSize: "200% 200%",
            animation: "shimmer-border 3s ease-in-out infinite",
          }}
        />
      )}

      <style>{`
        @keyframes shimmer-border {
          0%, 100% { background-position: 200% 200%; }
          50% { background-position: 0% 0%; }
        }
        [data-holo-border] {
          border-color: transparent;
          background-clip: padding-box;
          position: relative;
        }
        [data-holo-border]::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 27px;
          background: linear-gradient(
            var(--holo-angle, 135deg),
            #ff2d78, #ff6b35, #ffd700, #00ff88, #00ccff, #a855f7, #ff2d78
          );
          z-index: -1;
          animation: holo-border-rotate 6s linear infinite;
          background-size: 300% 300%;
        }
        @keyframes holo-border-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
