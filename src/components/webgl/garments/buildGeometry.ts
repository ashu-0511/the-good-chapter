/**
 * "Inflated garment" mesh builder.
 *
 * outline → uniform point cloud (boundary + triangular lattice) → Delaunay
 * → front surface z = h(distance-to-edge) and a mirrored back surface.
 *
 * Normals are analytic (from the height field's gradient), so the front and
 * back meet at the rim with identical, outward-facing normals — a soft,
 * stuffed silhouette with no visible seam and no T-junction cracks.
 */
import Delaunator from "delaunator";
import * as THREE from "three";
import { atlasLayout } from "./painter";
import {
  distanceToOutline,
  getPattern,
  pointInPolygon,
  reliefFor,
  resample,
  type GarmentKind,
  type Pattern,
  type Relief,
  type V2,
} from "./shapes";

const THICK = 0.13; // plateau half-thickness
const RIM = 0.17; // radius of the rounded edge
const DOME = 0.045; // extra loft in wide areas
const DOME_RANGE = 0.55;
const MAX_SLOPE = 40;

type Height = { h: number; hx: number; hy: number };

function profile(d: number): { f: number; df: number } {
  if (d <= 0) return { f: 0, df: MAX_SLOPE };
  if (d < RIM) {
    const t = 1 - d / RIM;
    const s = Math.sqrt(Math.max(1e-6, 1 - t * t));
    return { f: THICK * s, df: Math.min(MAX_SLOPE, (THICK * t) / (RIM * s)) };
  }
  const u = Math.min(1, (d - RIM) / DOME_RANGE);
  return { f: THICK + DOME * (1 - (1 - u) * (1 - u)), df: u < 1 ? (DOME * 2 * (1 - u)) / DOME_RANGE : 0 };
}

/** Soft fabric folds — low amplitude, faded out towards the rim. */
function wrinkle(x: number, y: number, kind: GarmentKind): Height {
  const seed = kind.length * 1.37;
  const a = 0.0085;
  const t1 = 7.1 * x + 2.3 * y + seed;
  const t2 = -3.4 * x + 8.3 * y + seed * 2.1;
  const t3 = 15.0 * x + 1.1 * y + seed * 0.7;
  const drape = Math.max(0, Math.min(1, (-y - 0.35) / 0.7)); // more folds towards the hem
  const h = a * (0.55 * Math.sin(t1) + 0.3 * Math.sin(t2) + 0.35 * drape * Math.sin(t3));
  const hx = a * (0.55 * 7.1 * Math.cos(t1) - 0.3 * 3.4 * Math.cos(t2) + 0.35 * drape * 15 * Math.cos(t3));
  const hy = a * (0.55 * 2.3 * Math.cos(t1) + 0.3 * 8.3 * Math.cos(t2) + 0.35 * drape * 1.1 * Math.cos(t3));
  return { h, hx, hy };
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return { v: t * t * (3 - 2 * t), dv: t > 0 && t < 1 ? (6 * t * (1 - t)) / (e1 - e0) : 0 };
}

function reliefAt(x: number, y: number, reliefs: Relief[]): Height {
  let h = 0,
    hx = 0,
    hy = 0;
  for (const r of reliefs) {
    const inside = pointInPolygon(x, y, r.poly);
    // the smoothstep below is flat once |sd| ≥ soft
    const { d, gx, gy } = distanceToOutline(x, y, r.poly, r.soft);
    const sd = inside ? d : -d; // signed distance, positive inside
    // ∇sd: the outline gradient points from the nearest edge point to (x, y)
    const sgx = inside ? gx : -gx;
    const sgy = inside ? gy : -gy;
    const s = smoothstep(-r.soft * 0.2, r.soft, sd);
    h += r.amount * s.v;
    hx += r.amount * s.dv * sgx;
    hy += r.amount * s.dv * sgy;
  }
  return { h, hx, hy };
}

export type GarmentMesh = {
  geometry: THREE.BufferGeometry;
  pattern: Pattern;
  /** front-surface height at (x, y) — used to seat drawstrings etc. */
  heightAt: (x: number, y: number) => number;
};

function frontHeight(x: number, y: number, p: Pattern, reliefs: Relief[]) {
  // the profile is flat past RIM + DOME_RANGE, so farther distances don't matter
  const { d, gx, gy } = distanceToOutline(x, y, p.outline, RIM + DOME_RANGE);
  const inside = pointInPolygon(x, y, p.outline);
  const dd = inside ? d : 0;
  const { f, df } = profile(dd);
  const rimFade = Math.min(1, dd / RIM);
  const w = wrinkle(x, y, p.kind);
  const r = reliefs.length ? reliefAt(x, y, reliefs) : { h: 0, hx: 0, hy: 0 };
  const base = f + w.h * rimFade;
  const h = Math.max(base + r.h * rimFade, f * 0.35);
  return {
    h,
    back: base,
    // ∇h = f'(d)·∇d + wrinkles + relief
    hx: df * gx + w.hx * rimFade + r.hx * rimFade,
    hy: df * gy + w.hy * rimFade + r.hy * rimFade,
    bx: df * gx + w.hx * rimFade,
    by: df * gy + w.hy * rimFade,
  };
}

const meshCache = new Map<string, GarmentMesh>();

export function buildGarmentMesh(kind: GarmentKind, detail = 1): GarmentMesh {
  const key = `${kind}:${detail}`;
  const hit = meshCache.get(key);
  if (hit) return hit;

  const p = getPattern(kind);
  const L = atlasLayout(p);
  const reliefs = reliefFor(kind);
  const spacing = 0.034 / detail;

  // boundary samples
  const boundary = resample(p.outline, spacing * 0.6);
  const nB = boundary.length;
  const pts: V2[] = [...boundary];

  // triangular lattice interior
  const { minX, maxX, minY, maxY } = p.bbox;
  const rowH = spacing * 0.866;
  let row = 0;
  for (let y = minY + rowH * 0.5; y < maxY; y += rowH, row++) {
    const off = row % 2 ? spacing * 0.5 : 0;
    for (let x = minX + off; x < maxX; x += spacing) {
      if (!pointInPolygon(x, y, p.outline)) continue;
      if (distanceToOutline(x, y, p.outline, spacing * 0.55).d < spacing * 0.55) continue;
      pts.push([x, y]);
    }
  }

  const flat = new Float64Array(pts.length * 2);
  pts.forEach(([x, y], i) => {
    flat[i * 2] = x;
    flat[i * 2 + 1] = y;
  });
  const del = new Delaunator(flat);
  const tris = del.triangles;

  const isBoundaryEdge = (a: number, b: number) =>
    a < nB && b < nB && (Math.abs(a - b) === 1 || Math.abs(a - b) === nB - 1);
  const midInside = (a: number, b: number) =>
    isBoundaryEdge(a, b) || pointInPolygon((pts[a][0] + pts[b][0]) / 2, (pts[a][1] + pts[b][1]) / 2, p.outline);

  const kept: number[] = [];
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t],
      b = tris[t + 1],
      c = tris[t + 2];
    const cx = (pts[a][0] + pts[b][0] + pts[c][0]) / 3;
    const cy = (pts[a][1] + pts[b][1] + pts[c][1]) / 3;
    if (!pointInPolygon(cx, cy, p.outline)) continue;
    if (!midInside(a, b) || !midInside(b, c) || !midInside(c, a)) continue;
    // orient CCW (facing +z)
    const cross = (pts[b][0] - pts[a][0]) * (pts[c][1] - pts[a][1]) - (pts[b][1] - pts[a][1]) * (pts[c][0] - pts[a][0]);
    if (cross > 0) kept.push(a, b, c);
    else kept.push(a, c, b);
  }

  const n = pts.length;
  const pos = new Float32Array(n * 2 * 3);
  const nor = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  const tmp = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const onEdge = i < nB;
    const H = onEdge
      ? (() => {
          // on the rim the distance gradient is undefined — use the inward edge normal
          const prev = pts[(i - 1 + nB) % nB];
          const next = pts[(i + 1) % nB];
          let nx = -(next[1] - prev[1]);
          let ny = next[0] - prev[0];
          const len = Math.hypot(nx, ny) || 1;
          nx /= len;
          ny /= len;
          if (!pointInPolygon(x + nx * 0.01, y + ny * 0.01, p.outline)) {
            nx = -nx;
            ny = -ny;
          }
          return { h: 0, back: 0, hx: MAX_SLOPE * nx, hy: MAX_SLOPE * ny, bx: MAX_SLOPE * nx, by: MAX_SLOPE * ny };
        })()
      : frontHeight(x, y, p, reliefs);

    // front
    pos.set([x, y, H.h], i * 3);
    tmp.set(-H.hx, -H.hy, 1).normalize();
    nor.set([tmp.x, tmp.y, tmp.z], i * 3);
    const [fu, fv] = L.uvFront(x, y);
    uv.set([fu, fv], i * 2);

    // back
    const j = n + i;
    pos.set([x, y, -H.back], j * 3);
    tmp.set(-H.bx, -H.by, -1).normalize();
    nor.set([tmp.x, tmp.y, tmp.z], j * 3);
    const [bu, bv] = L.uvBack(x, y);
    uv.set([bu, bv], j * 2);
  }

  const index = new Uint32Array(kept.length * 2);
  for (let t = 0; t < kept.length; t += 3) {
    index[t] = kept[t];
    index[t + 1] = kept[t + 1];
    index[t + 2] = kept[t + 2];
    // back faces: reversed winding
    index[kept.length + t] = n + kept[t];
    index[kept.length + t + 1] = n + kept[t + 2];
    index[kept.length + t + 2] = n + kept[t + 1];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  const mesh: GarmentMesh = {
    geometry,
    pattern: p,
    heightAt: (x, y) => frontHeight(x, y, p, reliefs).h,
  };
  meshCache.set(key, mesh);
  return mesh;
}
