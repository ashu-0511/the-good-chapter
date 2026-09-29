"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { disableWebGL, tierConfig, type Tier } from "@/lib/capabilities";
import { products } from "@/content/products";
import { scrollToTarget } from "@/components/providers/SmoothScroll";
import { setCursor } from "@/components/ui/cursorBus";
import { BlobShadow } from "./Garment";
import { getStudioEnv } from "./garments/material";
import { GARMENT_H, modelBounds, type ProductKind } from "./models";
import { ProductModel } from "./ProductModel";
import { useCompiledReveal } from "./useCompiledReveal";

export type HeroPointer = { x: number; y: number };

type Item = {
  kind: ProductKind;
  productId: string;
  label: string;
  colors: { body: string; trim?: string; accent?: string };
  /** position as fractions of the visible half-extent at that depth */
  xf: number;
  yf: number;
  z: number;
  /** size as a fraction of the visible height, measured against a garment */
  hf: number;
  yaw: number;
  phase: number;
};

const FOV = 28;
const CAM_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

const byKind = (k: ProductKind) => products.find((p) => p.kind === k)!;

const HERO_COLORS: Partial<Record<ProductKind, Item["colors"]>> = {
  hoodie: { body: "#1c1c1a", trim: "#141413", accent: "#c8552b" },
  bottle: { body: "#c8552b", trim: "#1d1d1b", accent: "#f4f1ea" },
};

/** Worn, sipped, written, lit — one of each, mirroring the headline. */
function item(kind: ProductKind, xf: number, yf: number, z: number, hf: number, yaw: number, phase: number): Item {
  const p = byKind(kind);
  return { kind, productId: p.id, label: p.name, colors: HERO_COLORS[kind] ?? p.colors, xf, yf, z, hf, yaw, phase };
}

function layout(aspect: number, count: number): Item[] {
  if (aspect >= 1) {
    // narrower landscape screens get a smaller cluster pushed further right
    const k = Math.min(1, Math.max(0.7, 0.62 + (aspect - 1) * 0.65));
    const dx = (1 - k) * 0.3;
    const all = [
      item("bottle", 0.34 + dx, 0.4, -2.6, 0.36 * k, 0.3, 0.4),
      item("hoodie", 0.6 + dx, 0.0, 0.4, 0.46 * k, -0.18, 1.7),
      item("candle", 0.86 + dx * 0.5, -0.52, -0.9, 0.36 * k, -0.28, 4.1),
      item("diary", 0.87 + dx * 0.5, 0.4, -1.8, 0.36 * k, -0.42, 2.9),
    ];
    return all.slice(0, count);
  }
  return [
    item("bottle", -0.6, 0.47, -2.2, 0.2, 0.3, 0.4),
    item("hoodie", 0.04, 0.42, 0.5, 0.29, -0.12, 1.7),
    item("diary", 0.62, 0.6, -1.6, 0.2, -0.38, 2.9),
  ];
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function Scene({
  tier,
  reduced,
  pointer,
  progress,
  onReady,
}: {
  tier: Exclude<Tier, "none">;
  reduced: boolean;
  pointer: RefObject<HeroPointer>;
  progress: RefObject<number>;
  onReady: () => void;
}) {
  const { gl, size, camera } = useThree();
  const env = useMemo(() => getStudioEnv(gl), [gl]);
  const cfg = tierConfig[tier];
  const aspect = size.width / Math.max(1, size.height);
  const items = useMemo(() => layout(aspect, cfg.heroCount), [aspect, cfg.heroCount]);

  const root = useRef<THREE.Group>(null);
  const ready = useCompiledReveal(root);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const shadows = useRef<(THREE.Mesh | null)[]>([]);
  const light = useRef<THREE.PointLight>(null);
  const hovered = useRef<number>(-1);
  const lift = useRef<number[]>([]);
  const start = useRef<number | null>(null);
  const smooth = useRef({ x: 0, y: 0, p: 0 });

  // fade the canvas in once the shaders are ready, not before
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [ready, onReady]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (start.current === null) {
      if (!ready) return;
      start.current = t;
    }
    const since = t - start.current;
    const s = smooth.current;
    const k = Math.min(1, dt * 3);
    const px = reduced ? 0 : pointer.current.x;
    const py = reduced ? 0 : pointer.current.y;
    s.x += (px - s.x) * k;
    s.y += (py - s.y) * k;
    s.p += ((reduced ? 0 : progress.current) - s.p) * Math.min(1, dt * 6);

    const desktop = aspect >= 1;
    camera.position.set(s.x * 0.45, s.y * 0.25 - s.p * 0.6, CAM_Z + s.p * 1.4);
    camera.lookAt(desktop ? 0.25 : 0, -s.p * 0.4, 0);

    if (light.current) light.current.position.set(s.x * 6 + 1, s.y * 3.5 + 1.5, 4.5);

    items.forEach((it, i) => {
      const g = groups.current[i];
      if (!g) return;
      const b = modelBounds(it.kind);
      const halfH = (CAM_Z - it.z) * TAN;
      const halfW = halfH * aspect;
      const scale = (it.hf * 2 * halfH) / GARMENT_H;
      const enter = reduced ? 1 : easeOutExpo(Math.max(0, (since - 0.15 - i * 0.12) / 1.8));
      lift.current[i] = THREE.MathUtils.damp(lift.current[i] ?? 0, hovered.current === i ? 1 : 0, 6, dt);
      const L = lift.current[i];
      const bob = reduced ? 0 : Math.sin(t * 0.55 + it.phase) * 0.07;
      const spread = 1 + s.p * 0.22;

      g.position.set(
        it.xf * halfW * spread,
        it.yf * halfH - b.cy * scale + bob + (1 - enter) * -1.6 + s.p * (1.2 + i * 0.25) + L * 0.08,
        it.z + L * 0.35,
      );
      g.scale.setScalar(scale * (0.92 + 0.08 * enter) * (1 + L * 0.03));
      g.rotation.set(
        (reduced ? 0 : Math.sin(t * 0.4 + it.phase) * 0.035) - s.y * 0.08 + s.p * 0.15,
        it.yaw + (reduced ? 0 : Math.sin(t * 0.23 + it.phase) * 0.2) + s.x * 0.22 + (1 - enter) * 0.6,
        (reduced ? 0 : Math.sin(t * 0.31 + it.phase * 2) * 0.03) - s.x * 0.03,
      );

      const sh = shadows.current[i];
      if (sh) {
        const floorY = it.yf * halfH + (b.bottom - b.cy - 0.24) * scale;
        sh.position.set(g.position.x, floorY, it.z - 0.2);
        const w = scale * Math.max(1.1, b.w * 0.68) * (1 - bob * 0.8);
        sh.scale.set(w, w * 0.9, 1);
        (sh.material as THREE.MeshBasicMaterial).opacity = (0.34 - bob * 1.2 - L * 0.1) * enter * (1 - s.p);
      }
    });
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[-4, 6, 6]} intensity={1.25} color="#fff1e0" />
      <directionalLight position={[6, 1, -5]} intensity={0.7} color="#e8edf2" />
      <pointLight ref={light} intensity={9} color="#ffe2c9" distance={0} decay={2} />
      <group ref={root}>
        {items.map((it, i) => (
          <group key={`${it.kind}-${i}`}>
            <ProductModel
              ref={(g) => {
                groups.current[i] = g;
              }}
              kind={it.kind}
              colors={it.colors}
              envMap={env}
              detail={cfg.detail}
              texSize={cfg.tex}
              reduced={reduced}
              onPointerOver={(e) => {
                e.stopPropagation();
                hovered.current = i;
                setCursor({ label: it.label, variant: "view" });
              }}
              onPointerOut={() => {
                if (hovered.current === i) hovered.current = -1;
                setCursor(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCursor(null);
                scrollToTarget(`#product-${it.productId}`);
              }}
            />
            <BlobShadow ref={(m) => void (shadows.current[i] = m)} />
          </group>
        ))}
      </group>
    </>
  );
}

export default function HeroScene({
  tier,
  reduced,
  active,
  pointer,
  progress,
  onReady,
}: {
  tier: Exclude<Tier, "none">;
  reduced: boolean;
  active: boolean;
  pointer: RefObject<HeroPointer>;
  progress: RefObject<number>;
  onReady: () => void;
}) {
  const [dpr, setDpr] = useState<[number, number]>(tierConfig[tier].dpr);

  return (
    <Canvas
      dpr={dpr}
      frameloop={reduced ? "demand" : active ? "always" : "never"}
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.02;
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          disableWebGL();
        });
      }}
      onPointerMissed={() => setCursor(null)}
    >
      <Scene tier={tier} reduced={reduced} pointer={pointer} progress={progress} onReady={onReady} />
      <FpsGuard onSlow={() => setDpr(([lo]) => [lo, Math.max(1, lo)])} />
    </Canvas>
  );
}

/** Drops DPR to 1 if the first seconds render below ~40fps. */
function FpsGuard({ onSlow }: { onSlow: () => void }) {
  const stats = useRef({ n: 0, t: 0, done: false });
  useFrame((_, dt) => {
    const f = stats.current;
    if (f.done) return;
    f.n++;
    f.t += dt;
    if (f.t > 2.5) {
      f.done = true;
      if (f.n / f.t < 40) onSlow();
    }
  });
  return null;
}
