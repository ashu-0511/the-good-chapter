/**
 * Garment patterns.
 *
 * Every garment is described by a handful of pattern measurements (in scene
 * units, y-up, centred on x = 0). From those we derive one closed outline that
 * is shared by the 3D mesh, the texture painter and the 2D fallback — so every
 * representation of a garment is exactly the same silhouette.
 */

export type GarmentKind = "tee" | "hoodie" | "varsity" | "jacket" | "polo" | "crewneck";
export type V2 = [number, number];

type Collar = "crew" | "v" | "stand" | "polo";

export type Spec = {
  collar: Collar;
  neckW: number; // half-width of the neck opening at the shoulder line
  neckDepth: number; // front neck drop
  topY: number; // side-neck point height
  shoulderX: number;
  shoulderDrop: number;
  sleeveAngle: number; // degrees below horizontal
  sleeveLen: number;
  cuffW: number;
  armpitY: number;
  bodyW: number;
  hemW: number;
  hemY: number;
  ribH?: number; // waistband height (blouson garments)
  ribInset?: number;
  cuffRib?: number; // cuff band length along the sleeve
  hood?: { w: number; top: number };
};

export const specs: Record<GarmentKind, Spec> = {
  tee: {
    collar: "crew",
    neckW: 0.25,
    neckDepth: 0.17,
    topY: 1.02,
    shoulderX: 0.74,
    shoulderDrop: 0.12,
    sleeveAngle: 36,
    sleeveLen: 0.64,
    cuffW: 0.46,
    armpitY: 0.3,
    bodyW: 0.71,
    hemW: 0.73,
    hemY: -1.16,
  },
  hoodie: {
    collar: "crew",
    neckW: 0.22,
    neckDepth: 0.14,
    topY: 0.9,
    shoulderX: 0.68,
    shoulderDrop: 0.12,
    sleeveAngle: 66,
    sleeveLen: 1.4,
    cuffW: 0.29,
    armpitY: 0.16,
    bodyW: 0.67,
    hemW: 0.6,
    hemY: -1.22,
    ribH: 0.15,
    ribInset: 0.05,
    cuffRib: 0.16,
    hood: { w: 0.41, top: 1.42 },
  },
  varsity: {
    collar: "v",
    neckW: 0.22,
    neckDepth: 0.22,
    topY: 0.96,
    shoulderX: 0.71,
    shoulderDrop: 0.1,
    sleeveAngle: 64,
    sleeveLen: 1.36,
    cuffW: 0.3,
    armpitY: 0.2,
    bodyW: 0.71,
    hemW: 0.62,
    hemY: -1.08,
    ribH: 0.17,
    ribInset: 0.07,
    cuffRib: 0.17,
  },
  jacket: {
    collar: "stand",
    neckW: 0.235,
    neckDepth: 0,
    topY: 0.95,
    shoulderX: 0.69,
    shoulderDrop: 0.13,
    sleeveAngle: 67,
    sleeveLen: 1.42,
    cuffW: 0.27,
    armpitY: 0.18,
    bodyW: 0.67,
    hemW: 0.65,
    hemY: -1.14,
    ribH: 0.1,
    ribInset: 0.015,
    cuffRib: 0.09,
  },
  polo: {
    collar: "polo",
    neckW: 0.2,
    neckDepth: 0.1,
    topY: 1.0,
    shoulderX: 0.63,
    shoulderDrop: 0.14,
    sleeveAngle: 46,
    sleeveLen: 0.52,
    cuffW: 0.36,
    armpitY: 0.38,
    bodyW: 0.61,
    hemW: 0.62,
    hemY: -1.1,
  },
  crewneck: {
    collar: "crew",
    neckW: 0.21,
    neckDepth: 0.13,
    topY: 0.94,
    shoulderX: 0.7,
    shoulderDrop: 0.13,
    sleeveAngle: 65,
    sleeveLen: 1.36,
    cuffW: 0.28,
    armpitY: 0.17,
    bodyW: 0.68,
    hemW: 0.6,
    hemY: -1.1,
    ribH: 0.14,
    ribInset: 0.06,
    cuffRib: 0.15,
  },
};

/* ── Geometry helpers ─────────────────────────────────────────── */

const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const mul = (a: V2, s: number): V2 => [a[0] * s, a[1] * s];

function quad(p0: V2, c: V2, p1: V2, n = 10): V2[] {
  const out: V2[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
  return out;
}

function cubic(p0: V2, c1: V2, c2: V2, p1: V2, n = 16): V2[] {
  const out: V2[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([
      a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0],
      a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1],
    ]);
  }
  return out;
}

/** Round every sharp polyline corner with a small quadratic fillet. */
function roundCorners(pts: V2[], r: number): V2[] {
  const n = pts.length;
  const out: V2[] = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la / 2.2, lb / 2.2);
    if (rr < 1e-4) {
      out.push(p);
      continue;
    }
    const ua: V2 = [(p[0] - a[0]) / la, (p[1] - a[1]) / la];
    const ub: V2 = [(b[0] - p[0]) / lb, (b[1] - p[1]) / lb];
    const turn = Math.abs(ua[0] * ub[1] - ua[1] * ub[0]);
    if (turn < 0.08) {
      out.push(p);
      continue;
    }
    const s = add(p, mul(ua, -rr));
    const e = add(p, mul(ub, rr));
    out.push(s, ...quad(s, p, e, 5));
  }
  return out;
}

/** Resample a closed polyline to (roughly) uniform spacing. */
export function resample(pts: V2[], spacing: number): V2[] {
  const n = pts.length;
  const out: V2[] = [];
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len === 0) continue;
    let t = carry;
    while (t < len) {
      const k = t / len;
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      t += spacing;
    }
    carry = t - len;
  }
  return out;
}

/* ── Pattern construction ─────────────────────────────────────── */

export type Keypoints = {
  neckCenter: V2;
  sideNeck: V2;
  shoulder: V2;
  cuffOuter: V2;
  cuffInner: V2;
  armpit: V2;
  hemSide: V2;
  hemY: number;
  sleeveDir: V2;
  sleevePerp: V2;
};

export type Pattern = {
  kind: GarmentKind;
  spec: Spec;
  /** closed outline, CCW-agnostic, full garment */
  outline: V2[];
  k: Keypoints;
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
};

function rightHalf(s: Spec): { pts: V2[]; k: Keypoints } {
  const pts: V2[] = [];
  const neckCenter: V2 = [0, s.topY - s.neckDepth];
  const sideNeck: V2 = [s.neckW, s.topY];

  if (s.hood) {
    const top: V2 = [0, s.hood.top];
    pts.push(top);
    const hoodSide: V2 = [s.hood.w, s.topY + 0.1];
    pts.push(...cubic(top, [s.hood.w * 0.66, s.hood.top], [s.hood.w * 1.04, s.hood.top - 0.24], hoodSide, 18));
    pts.push(...quad(hoodSide, [s.hood.w * 0.98, s.topY - 0.02], [s.hood.w + 0.1, s.topY - 0.03], 8));
  } else if (s.collar === "stand") {
    const ch = 0.11;
    pts.push([0, s.topY + ch * 0.92]);
    pts.push(...quad([0, s.topY + ch * 0.92], [s.neckW * 0.6, s.topY + ch], [s.neckW * 0.96, s.topY + ch * 0.98], 6));
    pts.push([s.neckW * 1.04, s.topY - 0.01]);
  } else if (s.collar === "v") {
    pts.push(neckCenter);
    pts.push(...quad(neckCenter, [s.neckW * 0.62, s.topY - s.neckDepth * 0.62], sideNeck, 12));
  } else {
    pts.push(neckCenter);
    pts.push(...quad(neckCenter, [s.neckW * 0.86, neckCenter[1] + 0.005], sideNeck, 12));
  }

  const shoulder: V2 = [s.shoulderX, s.topY - s.shoulderDrop];
  const last = pts[pts.length - 1];
  pts.push(...quad(last, [(last[0] + shoulder[0]) / 2, s.topY - s.shoulderDrop * 0.38], shoulder, 8));

  const th = (s.sleeveAngle * Math.PI) / 180;
  const dir: V2 = [Math.cos(th), -Math.sin(th)];
  const perp: V2 = [-Math.sin(th), -Math.cos(th)];
  const cuffOuter = add(shoulder, mul(dir, s.sleeveLen));
  const cuffInner = add(cuffOuter, mul(perp, s.cuffW));
  // slight outward bow on the upper sleeve
  const bow = add(add(shoulder, mul(dir, s.sleeveLen * 0.45)), mul(perp, -0.035));
  pts.push(...quad(shoulder, bow, cuffOuter, 10));
  pts.push(cuffInner);

  const armpit: V2 = [s.bodyW, s.armpitY];
  pts.push(armpit);

  const ribH = s.ribH ?? 0;
  const inset = s.ribInset ?? 0;
  const sideBottom: V2 = [s.hemW + inset, s.hemY + ribH];
  pts.push(...quad(armpit, [s.bodyW + 0.012, (s.armpitY + sideBottom[1]) / 2], sideBottom, 12));
  if (ribH > 0) {
    pts.push([s.hemW, s.hemY + ribH * 0.96]);
  }
  const hemSide: V2 = [s.hemW, s.hemY];
  pts.push(hemSide);
  pts.push(...quad(hemSide, [s.hemW * 0.5, s.hemY - 0.012], [0, s.hemY - 0.016], 8));

  return {
    pts,
    k: {
      neckCenter,
      sideNeck,
      shoulder,
      cuffOuter,
      cuffInner,
      armpit,
      hemSide,
      hemY: s.hemY,
      sleeveDir: dir,
      sleevePerp: perp,
    },
  };
}

const cache = new Map<GarmentKind, Pattern>();

export function getPattern(kind: GarmentKind): Pattern {
  const hit = cache.get(kind);
  if (hit) return hit;
  const spec = specs[kind];
  const { pts, k } = rightHalf(spec);
  // mirror: right half runs top-centre → bottom-centre; left half is the reverse, negated
  const left: V2[] = [];
  for (let i = pts.length - 2; i >= 1; i--) left.push([-pts[i][0], pts[i][1]]);
  const raw = [...pts, ...left];
  // drop near-duplicates
  const dedup: V2[] = [];
  for (const p of raw) {
    const q = dedup[dedup.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-4) dedup.push(p);
  }
  const outline = roundCorners(dedup, 0.05);
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of outline) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const pattern: Pattern = { kind, spec, outline, k, bbox: { minX, maxX, minY, maxY } };
  cache.set(kind, pattern);
  return pattern;
}

/** SVG path data for a polyline (used by the 2D painter via Path2D). */
export function toPathData(pts: V2[], close = true) {
  let d = "";
  pts.forEach(([x, y], i) => {
    d += `${i ? "L" : "M"}${x.toFixed(4)} ${y.toFixed(4)}`;
  });
  return close ? d + "Z" : d;
}

/**
 * Edges bucketed into horizontal bands, so polygon queries only visit the
 * edges near the query point instead of the whole outline. Mesh building
 * runs tens of thousands of queries; results are identical to a full scan.
 */
type OutlineIndex = { minY: number; maxY: number; bandH: number; bands: Int32Array[]; seen: Uint32Array; stamp: number };
const outlineIndexes = new WeakMap<V2[], OutlineIndex>();

function outlineIndex(poly: V2[]): OutlineIndex {
  let idx = outlineIndexes.get(poly);
  if (idx) return idx;
  const n = poly.length;
  let minY = Infinity,
    maxY = -Infinity;
  for (const [, y] of poly) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const count = Math.max(8, Math.min(512, n >> 1));
  const bandH = (maxY - minY) / count || 1;
  const lists: number[][] = Array.from({ length: count }, () => []);
  const band = (y: number) => Math.min(count - 1, Math.max(0, Math.floor((y - minY) / bandH)));
  for (let i = 0; i < n; i++) {
    const a = poly[i][1];
    const b = poly[(i + 1) % n][1];
    for (let k = band(Math.min(a, b)), e = band(Math.max(a, b)); k <= e; k++) lists[k].push(i);
  }
  idx = { minY, maxY, bandH, bands: lists.map((l) => Int32Array.from(l)), seen: new Uint32Array(n), stamp: 0 };
  outlineIndexes.set(poly, idx);
  return idx;
}

const bandOf = (idx: OutlineIndex, y: number) => Math.min(idx.bands.length - 1, Math.max(0, Math.floor((y - idx.minY) / idx.bandH)));

export function pointInPolygon(x: number, y: number, poly: V2[]) {
  const idx = outlineIndex(poly);
  if (y < idx.minY || y > idx.maxY) return false;
  const n = poly.length;
  let inside = false;
  // every edge that spans y overlaps y's band
  for (const i of idx.bands[bandOf(idx, y)]) {
    const [xi, yi] = poly[(i + 1) % n];
    const [xj, yj] = poly[i];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Distance from p to a closed polyline + unit gradient (pointing away from the edge).
 * Beyond `maxD` the search stops and returns `maxD` with a zero gradient.
 */
export function distanceToOutline(x: number, y: number, poly: V2[], maxD = Infinity) {
  const idx = outlineIndex(poly);
  const n = poly.length;
  const last = idx.bands.length - 1;
  const home = bandOf(idx, y);
  const stamp = ++idx.stamp;
  let best = maxD * maxD;
  let bx = 0,
    by = 0;
  const visit = (k: number) => {
    for (const i of idx.bands[k]) {
      if (idx.seen[i] === stamp) continue;
      idx.seen[i] = stamp;
      const [ax, ay] = poly[i];
      const [cx, cy] = poly[(i + 1) % n];
      const ex = cx - ax;
      const ey = cy - ay;
      const l2 = ex * ex + ey * ey || 1e-12;
      let t = ((x - ax) * ex + (y - ay) * ey) / l2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + ex * t;
      const py = ay + ey * t;
      const d2 = (x - px) * (x - px) + (y - py) * (y - py);
      if (d2 < best) {
        best = d2;
        bx = px;
        by = py;
      }
    }
  };
  visit(home);
  // widen band by band; an unvisited edge lies wholly outside the visited
  // y-range, so its distance is at least the gap to that range
  for (let r = 1; home - r >= 0 || home + r <= last; r++) {
    const lo = home - r;
    const hi = home + r;
    const gapLo = lo >= 0 ? y - (idx.minY + (lo + 1) * idx.bandH) : Infinity;
    const gapHi = hi <= last ? idx.minY + hi * idx.bandH - y : Infinity;
    const okLo = lo >= 0 && (gapLo <= 0 || gapLo * gapLo < best);
    const okHi = hi <= last && (gapHi <= 0 || gapHi * gapHi < best);
    if (!okLo && !okHi) break;
    if (okLo) visit(lo);
    if (okHi) visit(hi);
  }
  const d = Math.sqrt(best);
  if (d >= maxD) return { d: maxD, gx: 0, gy: 0 };
  const gx = d > 1e-9 ? (x - bx) / d : 0;
  const gy = d > 1e-9 ? (y - by) / d : 0;
  return { d, gx, gy };
}

/** Full front neckline (left side-neck → centre → right side-neck) for rib bands. */
export function neckline(kind: GarmentKind): V2[] {
  const s = specs[kind];
  const c: V2 = [0, s.topY - s.neckDepth];
  const side: V2 = [s.neckW, s.topY];
  let right: V2[];
  if (s.collar === "v") right = [c, ...quad(c, [s.neckW * 0.62, s.topY - s.neckDepth * 0.62], side, 12)];
  else if (s.collar === "stand") right = [[0, s.topY + 0.1], [s.neckW * 0.96, s.topY + 0.108], [s.neckW * 1.04, s.topY - 0.01]];
  else right = [c, ...quad(c, [s.neckW * 0.86, c[1] + 0.005], side, 12)];
  const left = right.slice(1).reverse().map(([x, y]) => [-x, y] as V2);
  return [...left, ...right];
}

/* ── Detail regions shared by painter + mesh (3D relief) ──────── */

export type Relief = { poly: V2[]; amount: number; soft: number };

export function hoodOpening(): V2[] {
  const pts: V2[] = [];
  const top = 1.29;
  const w = 0.215;
  const bottom = 0.72;
  const start: V2 = [-w, 1.03];
  pts.push(start);
  pts.push(...cubic(start, [-w, top + 0.04], [w, top + 0.04], [w, 1.03], 16));
  pts.push(...cubic([w, 1.03], [w, 0.9], [0.07, 0.8], [0, bottom], 12));
  pts.push(...cubic([0, bottom], [-0.07, 0.8], [-w, 0.9], start, 12).slice(0, -1));
  return pts;
}

export function kangarooPocket(): V2[] {
  const pts: V2[] = [];
  const a: V2 = [-0.44, -0.98];
  const b: V2 = [-0.3, -0.42];
  pts.push(a, b);
  pts.push(...quad(b, [0, -0.39], [0.3, -0.42], 10));
  pts.push([0.44, -0.98]);
  return pts;
}

export function poloCollarLeaf(side: 1 | -1): V2[] {
  const s = side;
  return [
    [0.015 * s, 0.9],
    [0.19 * s, 0.995],
    [0.285 * s, 0.965],
    [0.2 * s, 0.7],
  ];
}

export function reliefFor(kind: GarmentKind): Relief[] {
  switch (kind) {
    case "hoodie":
      return [
        { poly: hoodOpening(), amount: -0.085, soft: 0.06 },
        { poly: kangarooPocket(), amount: 0.016, soft: 0.012 },
      ];
    case "polo":
      return [
        { poly: poloCollarLeaf(1), amount: 0.026, soft: 0.012 },
        { poly: poloCollarLeaf(-1), amount: 0.026, soft: 0.012 },
      ];
    case "varsity":
      return [];
    default:
      return [];
  }
}
