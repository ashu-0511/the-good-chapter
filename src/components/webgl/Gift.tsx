"use client";

import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type Ref } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { LOGO, LOGO_CLAY } from "@/components/ui/Logo";
import { getWhitePixel, makeSurface } from "./garments/material";
import { fullColors, shade, type GarmentColors } from "./garments/painter";
import { paintBottleWrap, paintCandleLabel, paintLogoDecal, paintPageEdge } from "./gifts/painter";
import { BOTTLE, CANDLE, DIARY, GIFTBOX, type GiftKind } from "./gifts/shapes";

type Props = ThreeElements["group"] & {
  kind: GiftKind;
  colors: GarmentColors;
  envMap: THREE.Texture | null;
  texSize?: number;
  reduced?: boolean;
  ref?: Ref<THREE.Group>;
};

const V = (x: number, y: number) => new THREE.Vector2(x, y);
const LOGO_ASPECT = LOGO.height / LOGO.width;

/* ── Shared textures (page lifetime, like the garment atlases) ── */

const texCache = new Map<string, THREE.Texture>();

function tex(key: string, paint: () => HTMLCanvasElement | THREE.Texture) {
  let t = texCache.get(key);
  if (!t) {
    const out = paint();
    t = out instanceof THREE.Texture ? out : new THREE.CanvasTexture(out);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    texCache.set(key, t);
  }
  return t;
}

function glowTexture() {
  return tex("glow", () => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return c;
  });
}

/* ── Geometry (built once per kind) ───────────────────────────── */

function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 8) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return V(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  });
}

const geoCache = new Map<GiftKind, Record<string, THREE.BufferGeometry>>();

function geometries(kind: GiftKind) {
  let g = geoCache.get(kind);
  if (g) return g;
  switch (kind) {
    case "bottle": {
      const { r, bottom, foot, bodyTop, neckR, shoulderTop, lidTop, loopR, loopTube } = BOTTLE;
      const lidR = neckR + 0.012;
      const shoulder = new THREE.CubicBezierCurve(V(r, bodyTop), V(r, bodyTop + 0.14), V(neckR + 0.03, shoulderTop - 0.03), V(neckR, shoulderTop));
      g = {
        wrap: new THREE.CylinderGeometry(r, r, bodyTop - bottom - foot, 72, 1, true, Math.PI).translate(0, (bodyTop + bottom + foot) / 2, 0),
        foot: new THREE.LatheGeometry([V(0, bottom), ...arc(r - foot, bottom + foot, foot, -Math.PI / 2, 0)], 72),
        shoulder: new THREE.LatheGeometry(shoulder.getPoints(16), 72),
        lid: new THREE.LatheGeometry(
          [V(lidR, shoulderTop - 0.01), V(lidR, lidTop - 0.07), ...arc(lidR - 0.07, lidTop - 0.07, 0.07, 0, Math.PI / 2), V(0, lidTop)],
          48,
        ),
        loop: new THREE.TorusGeometry(loopR, loopTube, 12, 32, Math.PI).translate(0, lidTop - 0.02, 0),
      };
      break;
    }
    case "diary": {
      const { w, h, d, board, bandX, ribbonX, ribbonLen } = DIARY;
      const lw = w * 0.6;
      g = {
        pages: new THREE.BoxGeometry(w - 0.07, h - 0.07, d - board * 2 + 0.006).translate(0.025, 0, 0),
        front: new RoundedBoxGeometry(w, h, board, 2, 0.015).translate(0, 0, d / 2 - board / 2),
        back: new RoundedBoxGeometry(w, h, board, 2, 0.015).translate(0, 0, -d / 2 + board / 2),
        spine: new RoundedBoxGeometry(0.09, h, d, 3, 0.04).translate(-w / 2 + 0.045, 0, 0),
        band: new THREE.BoxGeometry(0.052, h + 0.016, d + 0.016).translate(bandX, 0, 0),
        ribbon: new THREE.BoxGeometry(0.075, ribbonLen, 0.006).translate(ribbonX, -h / 2 - ribbonLen / 2 + 0.06, 0),
        foil: new THREE.PlaneGeometry(lw, lw * LOGO_ASPECT).translate(-0.06, h * 0.18, d / 2 + 0.003),
      };
      break;
    }
    case "candle": {
      const { r, bottom, top, wall, waxY, labelY, labelH, wickH, flameH } = CANDLE;
      const flame = Array.from({ length: 17 }, (_, i) => {
        const t = i / 16;
        return V(0.05 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (1 - t * 0.25), t * flameH);
      });
      g = {
        vessel: new THREE.LatheGeometry(
          [
            V(0, bottom),
            ...arc(r - 0.06, bottom + 0.06, 0.06, -Math.PI / 2, 0),
            V(r, top - 0.03),
            ...arc(r - wall / 2, top - 0.03, wall / 2, 0, Math.PI),
            V(r - wall, waxY),
          ],
          96,
        ),
        label: new THREE.CylinderGeometry(r + 0.004, r + 0.004, labelH, 96, 1, true, Math.PI).translate(0, labelY, 0),
        wax: new THREE.CircleGeometry(r - wall + 0.002, 64).rotateX(-Math.PI / 2).translate(0, waxY, 0),
        wick: new THREE.CylinderGeometry(0.011, 0.013, wickH, 8).translate(0, waxY + wickH / 2, 0),
        flame: new THREE.LatheGeometry(flame, 24),
        glow: new THREE.PlaneGeometry(0.62, 0.62),
      };
      break;
    }
    case "giftbox": {
      const { w, d, bottom, baseTop, lidH, lidOver: lo, ribbonW, ribbonX } = GIFTBOX;
      const lidBottom = baseTop - 0.14;
      const baseH = lidBottom - bottom + 0.004;
      const baseY = (lidBottom + bottom) / 2 - 0.002;
      const lidY = lidBottom + lidH / 2 + 0.002;
      const lw = 1.15;
      g = {
        base: new RoundedBoxGeometry(w, baseTop - bottom, d, 2, 0.015).translate(0, (baseTop + bottom) / 2, 0),
        lid: new RoundedBoxGeometry(w + lo * 2, lidH, d + lo * 2, 2, 0.02).translate(0, lidBottom + lidH / 2, 0),
        ribbonA: new THREE.BoxGeometry(ribbonW, baseH, d + 0.01).translate(ribbonX, baseY, 0),
        ribbonALid: new THREE.BoxGeometry(ribbonW, lidH + 0.008, d + lo * 2 + 0.01).translate(ribbonX, lidY, 0),
        ribbonB: new THREE.BoxGeometry(w + 0.01, baseH, ribbonW).translate(0, baseY, 0),
        ribbonBLid: new THREE.BoxGeometry(w + lo * 2 + 0.01, lidH + 0.008, ribbonW).translate(0, lidY, 0),
        loop: new THREE.TorusGeometry(0.16, 0.038, 12, 40).scale(1, 0.62, 1),
        knot: new THREE.SphereGeometry(0.075, 20, 14).scale(1, 0.8, 0.9),
        logo: new THREE.PlaneGeometry(lw, lw * LOGO_ASPECT).translate(-0.22, (bottom + lidBottom) / 2, d / 2 + 0.002),
      };
      break;
    }
  }
  geoCache.set(kind, g);
  return g;
}

/* ── Materials (per canvas: each renderer has its own env) ────── */

/** `key` captures everything `make` reads besides the env map. */
function useMaterials<T extends Record<string, THREE.Material>>(make: () => T, key: string, envMap: THREE.Texture | null) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mats = useMemo(() => make(), [key, envMap]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

type PartProps = { colors: Required<GarmentColors>; envMap: THREE.Texture | null; texSize: number; reduced: boolean };

function Bottle({ colors: c, envMap, texSize }: PartProps) {
  const g = geometries("bottle");
  const m = useMaterials(() => {
    const coat = { roughness: 0.4, metalness: 0.12, envMap, envMapIntensity: 0.9 };
    return {
      wrap: makeSurface({ ...coat, map: tex(`bottle:${c.body}:${c.accent}:${texSize}`, () => paintBottleWrap(c, texSize)) }),
      body: makeSurface({ ...coat, color: c.body }),
      lid: makeSurface({ color: c.trim, roughness: 0.32, metalness: 0.35, envMap }),
    };
  }, `${c.body}|${c.trim}|${c.accent}|${texSize}`, envMap);
  return (
    <>
      <mesh geometry={g.wrap} material={m.wrap} />
      <mesh geometry={g.foot} material={m.body} />
      <mesh geometry={g.shoulder} material={m.body} />
      <mesh geometry={g.lid} material={m.lid} />
      <mesh geometry={g.loop} material={m.lid} />
    </>
  );
}

function Diary({ colors: c, envMap, texSize }: PartProps) {
  const g = geometries("diary");
  const m = useMaterials(() => {
    const page = (map?: THREE.Texture) => makeSurface({ map, color: map ? 0xffffff : "#f1ebdd", roughness: 0.9, envMap, envMapIntensity: 0.5 });
    return {
      cover: makeSurface({
        color: c.body,
        roughness: 0.6,
        sheen: 0.45,
        sheenColor: shade(c.body, 0.3),
        envMap,
        envMapIntensity: 0.7,
      }),
      plainPage: page(),
      edgeV: page(tex("pages:v", () => paintPageEdge(256, true))),
      edgeH: page(tex("pages:h", () => paintPageEdge(256, false))),
      band: makeSurface({ color: c.accent, roughness: 0.7, envMap, envMapIntensity: 0.6 }),
      ribbon: makeSurface({ color: shade(c.accent, -0.2), roughness: 0.55, envMap }),
      foil: makeSurface({
        map: tex(`decal:white:${texSize}`, () => paintLogoDecal(texSize, "#ffffff")),
        color: c.trim,
        metalness: 0.9,
        roughness: 0.28,
        transparent: true,
        envMap,
        envMapIntensity: 1.3,
      }),
    };
  }, `${c.body}|${c.trim}|${c.accent}|${texSize}`, envMap);
  // box faces: +x, -x, +y, -y, +z, -z — page lines on the fore-edge, head and tail
  const pageFaces = useMemo(() => [m.edgeV, m.plainPage, m.edgeH, m.edgeH, m.plainPage, m.plainPage], [m]);
  return (
    <>
      <mesh geometry={g.pages} material={pageFaces} />
      <mesh geometry={g.front} material={m.cover} />
      <mesh geometry={g.back} material={m.cover} />
      <mesh geometry={g.spine} material={m.cover} />
      <mesh geometry={g.band} material={m.band} />
      <mesh geometry={g.ribbon} material={m.ribbon} />
      <mesh geometry={g.foil} material={m.foil} />
    </>
  );
}

function Candle({ colors: c, envMap, texSize, reduced }: PartProps) {
  const g = geometries("candle");
  const flame = useRef<THREE.Group>(null);
  const m = useMaterials(
    () => ({
      vessel: makeSurface({ color: c.body, roughness: 0.22, envMap }),
      label: makeSurface({
        map: tex(`label:${c.trim}:${c.accent}:${texSize}`, () => paintCandleLabel(c, texSize * 2)),
        roughness: 0.85,
        envMap,
        envMapIntensity: 0.5,
      }),
      wax: makeSurface({ color: "#efe6d4", emissive: "#ffb46a", emissiveIntensity: 0.12, roughness: 0.55, envMap, envMapIntensity: 0.6 }),
      wick: makeSurface({ color: "#2b2520", roughness: 0.9, envMap }),
      // unlit + mapped, like the blob shadow, so it shares that tiny program
      flame: new THREE.MeshBasicMaterial({ map: getWhitePixel(), color: "#ffd9a0", toneMapped: false, transparent: true, opacity: 0.95 }),
      glow: new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: "#ffb870",
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        toneMapped: false,
      }),
    }),
    `${c.body}|${c.trim}|${c.accent}|${texSize}`,
    envMap,
  );

  useFrame(({ clock }) => {
    if (reduced || !flame.current) return;
    const t = clock.elapsedTime;
    const n = Math.sin(t * 9.1) * 0.5 + Math.sin(t * 14.3 + 1.7) * 0.3 + Math.sin(t * 23.9) * 0.2;
    flame.current.scale.set(1 - n * 0.05, 1 + n * 0.1, 1 - n * 0.05);
    flame.current.rotation.z = Math.sin(t * 3.1) * 0.05;
  });

  const { waxY, wickH, flameH } = CANDLE;
  return (
    <>
      <mesh geometry={g.vessel} material={m.vessel} />
      <mesh geometry={g.label} material={m.label} />
      <mesh geometry={g.wax} material={m.wax} />
      <mesh geometry={g.wick} material={m.wick} rotation-z={-0.08} />
      <group ref={flame} position={[0.01, waxY + wickH - 0.025, 0]}>
        <mesh geometry={g.flame} material={m.flame} />
        <mesh geometry={g.glow} material={m.glow} position={[0, flameH * 0.45, 0.02]} />
      </group>
    </>
  );
}

function Giftbox({ colors: c, envMap, texSize }: PartProps) {
  const g = geometries("giftbox");
  const m = useMaterials(
    () => ({
      box: makeSurface({ color: c.body, roughness: 0.8, envMap, envMapIntensity: 0.6 }),
      ribbon: makeSurface({ color: c.trim, roughness: 0.34, sheen: 1, sheenColor: shade(c.trim, 0.4), sheenRoughness: 0.3, envMap, envMapIntensity: 0.8 }),
      logo: makeSurface({
        map: tex(`decal:${c.accent}:${texSize}`, () => paintLogoDecal(texSize, c.accent, LOGO_CLAY)),
        roughness: 0.6,
        transparent: true,
        envMap,
        envMapIntensity: 0.6,
      }),
    }),
    `${c.body}|${c.trim}|${c.accent}|${texSize}`,
    envMap,
  );
  const { ribbonX, baseTop, lidH } = GIFTBOX;
  const lidTop = baseTop - 0.14 + lidH;
  return (
    <>
      <mesh geometry={g.base} material={m.box} />
      <mesh geometry={g.lid} material={m.box} />
      <mesh geometry={g.ribbonA} material={m.ribbon} />
      <mesh geometry={g.ribbonALid} material={m.ribbon} />
      <mesh geometry={g.ribbonB} material={m.ribbon} />
      <mesh geometry={g.ribbonBLid} material={m.ribbon} />
      <mesh geometry={g.logo} material={m.logo} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={g.loop} material={m.ribbon} position={[ribbonX + s * 0.15, lidTop + 0.15, 0]} rotation={[0.2, s * 0.45, s * -0.4]} />
      ))}
      <mesh geometry={g.knot} material={m.ribbon} position={[ribbonX, lidTop + 0.06, 0]} />
    </>
  );
}

const parts: Record<GiftKind, (p: PartProps) => React.ReactNode> = {
  bottle: Bottle,
  diary: Diary,
  candle: Candle,
  giftbox: Giftbox,
};

export function Gift({ kind, colors, envMap, texSize = 1024, reduced = false, ref, ...group }: Props) {
  const Part = parts[kind];
  return (
    <group ref={ref} {...group}>
      <Part colors={fullColors(colors)} envMap={envMap} texSize={texSize} reduced={reduced} />
    </group>
  );
}
