"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Drip shape mask — simple teardrop for debug, will be full strip later
// ---------------------------------------------------------------------------

const DROPLET_SIZE = 512;

function generateTextures() {
  // --- Mask: draw droplet shape ---
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = DROPLET_SIZE;
  maskCanvas.height = DROPLET_SIZE;
  const mCtx = maskCanvas.getContext("2d")!;
  mCtx.fillStyle = "white";
  // Top pool
  mCtx.beginPath();
  mCtx.ellipse(256, 70, 200, 55, 0, 0, Math.PI * 2);
  mCtx.fill();
  // Drip body
  mCtx.beginPath();
  mCtx.moveTo(130, 70);
  mCtx.bezierCurveTo(100, 250, 160, 380, 256, 430);
  mCtx.bezierCurveTo(352, 380, 412, 250, 382, 70);
  mCtx.closePath();
  mCtx.fill();

  // --- Height: blur the mask for convex height field ---
  const hCanvas = document.createElement("canvas");
  hCanvas.width = DROPLET_SIZE;
  hCanvas.height = DROPLET_SIZE;
  const hCtx = hCanvas.getContext("2d")!;
  // Heavy blur = soft rounded height
  hCtx.filter = "blur(30px)";
  hCtx.drawImage(maskCanvas, 0, 0);
  // Second pass for extra softness
  hCtx.filter = "blur(18px)";
  hCtx.drawImage(hCanvas, 0, 0);
  hCtx.filter = "none";

  // Create textures with correct settings for non-color data
  const maskTex = new THREE.CanvasTexture(maskCanvas);
  maskTex.colorSpace = THREE.NoColorSpace;
  maskTex.minFilter = THREE.LinearFilter;
  maskTex.magFilter = THREE.LinearFilter;
  maskTex.wrapS = THREE.ClampToEdgeWrapping;
  maskTex.wrapT = THREE.ClampToEdgeWrapping;

  const heightTex = new THREE.CanvasTexture(hCanvas);
  heightTex.colorSpace = THREE.NoColorSpace;
  heightTex.minFilter = THREE.LinearFilter;
  heightTex.magFilter = THREE.LinearFilter;
  heightTex.wrapS = THREE.ClampToEdgeWrapping;
  heightTex.wrapT = THREE.ClampToEdgeWrapping;

  return { maskTex, heightTex };
}

// ---------------------------------------------------------------------------
// Texture loader
// ---------------------------------------------------------------------------

function useImageTexture(src: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.needsUpdate = true;
      t.colorSpace = THREE.LinearSRGBColorSpace;
      t.wrapS = THREE.MirroredRepeatWrapping;
      t.wrapT = THREE.MirroredRepeatWrapping;
      setTex(t);
    };
    img.src = src;
  }, [src]);
  return tex;
}

// ---------------------------------------------------------------------------
// GLSL — HoloCover-inspired shader adapted for shaped surface
// Base = holographic texture, distorted by height-derived normals
// + holoPattern, chromatic aberration, glare — same as cover filter
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;  // holographic material texture
  uniform sampler2D uMask;     // drip alpha mask
  uniform sampler2D uHeight;   // blurred height for normals
  uniform vec2 uMouse;
  uniform float uTime;
  uniform int uMode;           // 0=height, 1=normals, 2=base, 3=full

  varying vec2 vUv;

  vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
  }

  // HoloCover interference — exact same function
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

  // Derive normal from height map via finite differences
  vec3 heightNormal(vec2 uv) {
    float texel = 1.0 / 512.0;
    float hL = texture2D(uHeight, uv - vec2(texel, 0.0)).r;
    float hR = texture2D(uHeight, uv + vec2(texel, 0.0)).r;
    float hD = texture2D(uHeight, uv - vec2(0.0, texel)).r;
    float hU = texture2D(uHeight, uv + vec2(0.0, texel)).r;
    return normalize(vec3(hL - hR, hD - hU, 0.15));
  }

  void main() {
    float mask = texture2D(uMask, vUv).r;
    if (mask < 0.05) discard;

    float h = texture2D(uHeight, vUv).r;
    vec3 N = heightNormal(vUv);

    // --- Debug modes ---
    if (uMode == 0) {
      gl_FragColor = vec4(vec3(h), mask);
      return;
    }
    if (uMode == 1) {
      gl_FragColor = vec4(N * 0.5 + 0.5, mask);
      return;
    }

    // --- Normal-based UV distortion (parallax) ---
    // The normal pushes the texture sample, making the pattern follow curvature
    vec2 distortedUv = vUv + N.xy * 0.08;

    if (uMode == 2) {
      // Base texture with normal distortion only
      vec3 base = texture2D(uTexture, distortedUv).rgb;
      gl_FragColor = vec4(base, mask);
      return;
    }

    // --- Mode 3: Full HoloCover-style treatment ---

    vec2 center = vec2(0.5);
    float dist = length(vUv - center);

    // Chromatic aberration (same as cover filter)
    vec2 dir = normalize(vUv - center + 0.001) * dist;
    float falloff = smoothstep(0.08, 0.55, dist);
    float caStrength = 0.015 * falloff;
    // Also offset CA by normals for curvature-following aberration
    vec2 caOffset = N.xy * 0.02;

    vec3 color = vec3(
      texture2D(uTexture, distortedUv + dir * caStrength + caOffset).r,
      texture2D(uTexture, distortedUv + caOffset * 0.5).g,
      texture2D(uTexture, distortedUv - dir * caStrength).b
    );

    // Holographic foil pattern — use NORMALS to drive hue, not just UV
    // This is the key: pattern follows curvature because N changes across surface
    vec2 holoUv = vUv + N.xy * 0.15; // normal-distorted pattern space
    float pattern = holoPattern(holoUv, uMouse, uTime);

    float angle = atan(N.y, N.x) + atan(vUv.y - uMouse.y, vUv.x - uMouse.x);
    float hue = fract(pattern * 0.5 + angle / 6.283 + uTime * 0.02);
    vec3 rainbow = hsv2rgb(vec3(hue, 0.7, 1.0));

    // Color-dodge blend (same as cover filter)
    float mouseProx = 1.0 - smoothstep(0.0, 0.6, length(vUv - uMouse));
    float foilIntensity = pattern * 0.10 * (0.4 + mouseProx * 0.6);
    color = color + rainbow * foilIntensity * color;

    // Glare — follows mouse, textured by pattern
    float glareBase = pow(mouseProx, 3.5) * 0.12;
    float glareTexture = pattern * 0.5 + 0.5;
    float glare = glareBase * glareTexture;
    vec3 glareColor = mix(vec3(1.0), rainbow, 0.4);
    color += glareColor * glare;

    // Fresnel-like edge brightening from normals
    float edgeFactor = 1.0 - abs(N.z) * 3.0;
    edgeFactor = clamp(edgeFactor, 0.0, 1.0);
    color += color * edgeFactor * 0.25;

    // Film grain
    float grain = fract(sin(dot(vUv * 500.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.015;

    gl_FragColor = vec4(color, mask);
  }
`;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function Setup() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
    gl.outputColorSpace = THREE.LinearSRGBColorSpace;
  }, [gl]);
  return null;
}

// ---------------------------------------------------------------------------
// Droplet mesh
// ---------------------------------------------------------------------------

function Droplet({
  mouseRef,
  mode,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>;
  mode: number;
}) {
  const holoTexture = useImageTexture("/landing/holo-texture-square.webp");
  const { maskTex, heightTex } = useMemo(() => generateTextures(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture: { value: null },
          uMask: { value: maskTex },
          uHeight: { value: heightTex },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uTime: { value: 0 },
          uMode: { value: mode },
        },
        transparent: true,
        toneMapped: false,
      }),
    [maskTex, heightTex, mode]
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime!.value = clock.getElapsedTime();
    material.uniforms.uMode!.value = mode;
    (material.uniforms.uMouse!.value as THREE.Vector2).set(
      mouseRef.current.x,
      1 - mouseRef.current.y
    );
    if (holoTexture) material.uniforms.uTexture!.value = holoTexture;
  });

  return (
    <mesh material={material}>
      <planeGeometry args={[2, 2.5]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Exported: 4 debug views
// ---------------------------------------------------------------------------

export function LandingScene({ className }: { className?: string }) {
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, 2));
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mouseRef.current = {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const onMouseLeave = useCallback(() => {
    mouseRef.current = { x: 0.5, y: 0.5 };
  }, []);

  return (
    <div
      className={className}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={dpr}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Setup />
        {/* Height | Normals | Base texture | Full shader */}
        <group position={[-3.6, 0, 0]}>
          <Droplet mouseRef={mouseRef} mode={0} />
        </group>
        <group position={[-1.2, 0, 0]}>
          <Droplet mouseRef={mouseRef} mode={1} />
        </group>
        <group position={[1.2, 0, 0]}>
          <Droplet mouseRef={mouseRef} mode={2} />
        </group>
        <group position={[3.6, 0, 0]}>
          <Droplet mouseRef={mouseRef} mode={3} />
        </group>
      </Canvas>
    </div>
  );
}
