/**
 * Fabric material + shared textures.
 * Geometry and textures are cached for the page's lifetime and shared across
 * canvases (three keeps GPU copies per renderer); materials are per-canvas
 * because each renderer has its own PMREM environment.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { atlasLayout, fullColors, luminance, paintAtlas, shade, type GarmentColors } from "./painter";
import { getPattern, type GarmentKind } from "./shapes";

/* ── Knit normal map (jersey wales + loops) ───────────────────── */

let knitCanvas: HTMLCanvasElement | null = null;

function knitNormalCanvas() {
  if (knitCanvas) return knitCanvas;
  const S = 128;
  const height = new Float32Array(S * S);
  const wale = 8; // px per knit column
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const col = (x % wale) / wale; // 0..1 across a wale
      const rowPhase = ((y + (Math.floor(x / wale) % 2) * 3) % 6) / 6;
      const v = Math.abs(col - 0.5) * 2; // V-shaped loop profile
      const loop = 1 - Math.abs(v - (1 - rowPhase)) * 1.6;
      height[y * S + x] = 0.55 * Math.cos((col - 0.5) * Math.PI) + 0.45 * Math.max(0, loop);
    }
  }
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const strength = 2.2;
  const h = (x: number, y: number) => height[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  knitCanvas = c;
  return c;
}

/* ── Texture cache ────────────────────────────────────────────── */

const albedoCache = new Map<string, THREE.CanvasTexture>();
const normalCache = new Map<string, THREE.CanvasTexture>();

function colorKey(c: GarmentColors) {
  return `${c.body}|${c.trim ?? ""}|${c.accent ?? ""}`;
}

export function getAlbedo(kind: GarmentKind, colors: GarmentColors, size: number) {
  const key = `${kind}:${colorKey(colors)}:${size}`;
  let tex = albedoCache.get(key);
  if (!tex) {
    tex = new THREE.CanvasTexture(paintAtlas(kind, colors, size));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    albedoCache.set(key, tex);
  }
  return tex;
}

/** Knit normal map, tiled so each garment gets roughly the same stitch size. */
export function getKnitNormal(kind: GarmentKind) {
  let tex = normalCache.get(kind);
  if (!tex) {
    const L = atlasLayout(getPattern(kind));
    tex = new THREE.CanvasTexture(knitNormalCanvas());
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const tile = 0.16; // garment units per texture tile
    tex.repeat.set(L.W / (L.rw * 0.5) / tile, L.H / L.rh / tile);
    tex.anisotropy = 4;
    normalCache.set(kind, tex);
  }
  return tex;
}

/* ── One shader program for every lit surface ─────────────────
 * Fabric, steel, paper, ceramic and ribbon are all MeshPhysicalMaterials with
 * the same feature set (map, normal map, sheen, env map), so each renderer
 * compiles ONE program for all of them. Shader compiles are the most
 * expensive part of a first render (hundreds of ms each on ANGLE/Metal), so
 * surfaces may only differ in uniforms — never in which features are on.
 */

let whitePixel: THREE.DataTexture | null = null;
let flatNormal: THREE.DataTexture | null = null;

function pixel(rgb: [number, number, number], srgb: boolean) {
  const t = new THREE.DataTexture(new Uint8Array([...rgb, 255]), 1, 1);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** 1×1 white, for untextured surfaces (keeps `map` on without changing the colour). */
export function getWhitePixel() {
  return (whitePixel ??= pixel([255, 255, 255], true));
}

export type SurfaceParams = {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  normalScale?: number;
  roughness: number;
  metalness?: number;
  sheen?: number;
  sheenColor?: THREE.ColorRepresentation;
  sheenRoughness?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  envMap: THREE.Texture | null;
  envMapIntensity?: number;
  /** decals: blended over the surface they sit on */
  transparent?: boolean;
};

export function makeSurface(p: SurfaceParams) {
  const ns = p.normalScale ?? 1;
  return new THREE.MeshPhysicalMaterial({
    color: p.color ?? 0xffffff,
    map: p.map ?? getWhitePixel(),
    normalMap: p.normalMap ?? (flatNormal ??= pixel([128, 128, 255], false)),
    normalScale: new THREE.Vector2(ns, ns),
    roughness: p.roughness,
    metalness: p.metalness ?? 0,
    // sheen is a shader define, not a uniform: keep it on (≈0) everywhere
    sheen: Math.max(p.sheen ?? 0, 1e-4),
    sheenColor: new THREE.Color(p.sheenColor ?? 0x000000),
    sheenRoughness: p.sheenRoughness ?? 0.5,
    emissive: new THREE.Color(p.emissive ?? 0x000000),
    emissiveIntensity: p.emissiveIntensity ?? 1,
    envMap: p.envMap,
    envMapIntensity: p.envMapIntensity ?? 1,
    transparent: !!p.transparent,
    depthWrite: !p.transparent,
    polygonOffset: !!p.transparent,
    polygonOffsetFactor: p.transparent ? -2 : 0,
  });
}

export function makeFabricMaterial(
  kind: GarmentKind,
  colors: GarmentColors,
  opts: { size: number; envMap: THREE.Texture | null },
) {
  const c = fullColors(colors);
  const lum = luminance(c.body);
  return makeSurface({
    map: getAlbedo(kind, colors, opts.size),
    normalMap: getKnitNormal(kind),
    normalScale: 0.55,
    roughness: 0.92,
    sheen: 0.85,
    sheenRoughness: 0.55,
    sheenColor: shade(c.body, lum < 0.1 ? 0.22 : 0.12),
    envMap: opts.envMap,
    envMapIntensity: lum < 0.1 ? 0.85 : 0.5,
  });
}

/* ── Studio environment (no network, per renderer) ────────────── */

const envCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

export function getStudioEnv(gl: THREE.WebGLRenderer) {
  let env = envCache.get(gl);
  if (!env) {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    // 128px is plenty for soft studio reflections on fabric and matte goods (4× cheaper than the default 256)
    env = pmrem.fromScene(room, 0.035, 0.1, 100, { size: 128 }).texture;
    room.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      (m.material as THREE.Material | undefined)?.dispose?.();
    });
    pmrem.dispose();
    envCache.set(gl, env);
  }
  return env;
}

/* ── Soft blob shadow ─────────────────────────────────────────── */

let shadowTex: THREE.CanvasTexture | null = null;

export function getShadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(38,30,18,0.55)");
  g.addColorStop(0.45, "rgba(38,30,18,0.22)");
  g.addColorStop(1, "rgba(38,30,18,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  return shadowTex;
}
