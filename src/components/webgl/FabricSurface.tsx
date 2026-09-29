"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { disableWebGL, type Tier } from "@/lib/capabilities";

export type FabricPointer = { x: number; y: number; inside: boolean };

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uVel;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  float aspect() { return uRes.x / uRes.y; }

  // Draped cloth: long vertical folds, softly warped, plus the cursor's push.
  float heightAt(vec2 p) {
    float t = uTime * 0.05;
    vec2 q = vec2(p.x * 1.6, p.y * 0.45);
    float warp = fbm(q * 1.3 + vec2(t, -t * 0.6));
    float folds = sin(p.x * 5.5 + warp * 4.2 + t * 1.4) * 0.5 + sin(p.x * 11.0 - warp * 3.0 + p.y * 1.3 - t) * 0.18;
    float h = folds * 0.55 + fbm(q * 3.0 - t) * 0.35;
    vec2 dm = p - uMouse * vec2(aspect(), 1.0);
    float d = length(dm);
    h += exp(-d * d * 9.0) * 0.8 * uHover;
    h += sin(d * 22.0 - uTime * 3.0) * exp(-d * 4.0) * 0.07 * uVel;
    return h;
  }

  void main() {
    float a = aspect();
    vec2 p = vec2(vUv.x * a, vUv.y);
    float e = 2.0 / uRes.y;
    float h = heightAt(p);
    float hx = heightAt(p + vec2(e, 0.0)) - h;
    float hy = heightAt(p + vec2(0.0, e)) - h;
    vec3 n = normalize(vec3(-hx / e * 0.085, -hy / e * 0.085, 1.0));

    // twill weave micro-structure
    vec2 w = gl_FragCoord.xy / 2.4;
    float tw = sin((w.x + w.y) * 1.7) * 0.5 + 0.5;
    n.xy += (tw - 0.5) * 0.045;
    n = normalize(n);

    vec3 light = vec3(uMouse * vec2(a, 1.0), 0.55);
    vec3 L = normalize(light - vec3(p, h * 0.08));
    float diff = max(dot(n, L), 0.0);
    float sheen = pow(1.0 - max(n.z, 0.0), 2.4);
    float dist = length(p - light.xy);
    float fall = exp(-dist * dist * 1.5);

    vec3 base = vec3(0.078, 0.075, 0.071);
    vec3 warm = vec3(0.78, 0.33, 0.16);
    vec3 col = base * (0.35 + 1.05 * diff);
    col += warm * pow(diff, 2.6) * fall * (0.26 + 0.36 * uHover);
    col += vec3(0.92, 0.86, 0.8) * sheen * 0.1;

    float vig = smoothstep(1.25, 0.15, length((vUv - vec2(0.55, 0.45)) * vec2(1.0, 1.15)));
    col *= mix(0.5, 1.0, vig);
    col += (hash(gl_FragCoord.xy + fract(uTime * 7.0)) - 0.5) * 0.022;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Surface({
  pointer,
  reduced,
  octaves,
}: {
  pointer: RefObject<FabricPointer>;
  reduced: boolean;
  octaves: number;
}) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const smooth = useRef({ x: 0.7, y: 0.6, hover: 0, vel: 0, px: 0, py: 0 });
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.7, 0.6) },
      uHover: { value: 0 },
      uVel: { value: 0 },
    }),
    [],
  );
  const defines = useMemo(() => ({ OCTAVES: octaves }), [octaves]);

  useFrame((state, dt) => {
    const m = material.current;
    if (!m) return;
    const u = m.uniforms;
    const s = smooth.current;
    const t = state.clock.elapsedTime;
    const p = pointer.current;
    // idle: the light drifts slowly on its own; the cursor takes over when present
    const tx = p.inside && !reduced ? p.x : 0.68 + Math.sin(t * 0.21) * 0.16;
    const ty = p.inside && !reduced ? p.y : 0.55 + Math.cos(t * 0.17) * 0.12;
    const k = Math.min(1, dt * 2.2);
    s.x += (tx - s.x) * k;
    s.y += (ty - s.y) * k;
    s.hover += ((p.inside && !reduced ? 1 : 0.15) - s.hover) * Math.min(1, dt * 1.6);
    const speed = Math.hypot(s.x - s.px, s.y - s.py) / Math.max(dt, 1e-3);
    s.vel += (Math.min(1, speed * 0.6) - s.vel) * Math.min(1, dt * 3);
    s.px = s.x;
    s.py = s.y;
    u.uTime.value = reduced ? 12 : t;
    u.uMouse.value.set(s.x, s.y);
    u.uHover.value = s.hover;
    u.uVel.value = reduced ? 0 : s.vel;
    u.uRes.value.set(size.width * dpr, size.height * dpr);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        key={octaves}
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        defines={defines}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function FabricSurface({
  tier,
  reduced,
  active,
  pointer,
}: {
  tier: Exclude<Tier, "none">;
  reduced: boolean;
  active: boolean;
  pointer: RefObject<FabricPointer>;
}) {
  return (
    <Canvas
      dpr={tier === "high" ? [1, 1.5] : tier === "medium" ? 1 : 0.75}
      frameloop={reduced ? "demand" : active ? "always" : "never"}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      flat
      onCreated={({ gl }) =>
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          disableWebGL();
        })
      }
    >
      <Surface pointer={pointer} reduced={reduced} octaves={tier === "high" ? 4 : 3} />
    </Canvas>
  );
}
