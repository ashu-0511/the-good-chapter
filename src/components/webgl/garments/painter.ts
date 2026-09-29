/**
 * 2D garment painter.
 *
 * Draws the printed / sewn surface of each garment (ribs, seams, stitching,
 * pockets, zips, prints, embroidery) in garment units onto a canvas. The same
 * painting is used as the WebGL albedo atlas and — with some baked shading —
 * as the no-WebGL fallback image.
 */
import {
  getPattern,
  hoodOpening,
  kangarooPocket,
  neckline,
  poloCollarLeaf,
  toPathData,
  type GarmentKind,
  type Pattern,
  type V2,
} from "./shapes";

export type GarmentColors = { body: string; trim?: string; accent?: string };

/* ── Atlas layout: [front | back] side by side ────────────────── */

export function atlasLayout(p: Pattern) {
  const { minX, maxX, minY, maxY } = p.bbox;
  const pad = 0.04;
  const x0 = minX - pad;
  const x1 = maxX + pad;
  const y0 = minY - pad;
  const y1 = maxY + pad;
  const W = x1 - x0;
  const H = y1 - y0;
  const m = Math.max(W, H);
  // region size as a fraction of the half-atlas (a square of side S)
  const rw = W / m;
  const rh = H / m;
  return {
    x0,
    x1,
    y0,
    y1,
    W,
    H,
    rw,
    rh,
    uvFront(x: number, y: number): [number, number] {
      return [((x - x0) / W) * rw * 0.5, 1 - ((y1 - y) / H) * rh];
    },
    uvBack(x: number, y: number): [number, number] {
      return [0.5 + ((x1 - x) / W) * rw * 0.5, 1 - ((y1 - y) / H) * rh];
    },
  };
}

/* ── Color helpers ────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  const f = (c: number) => Math.round(c + (t - c) * k);
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* ── Font resolution (next/font exposes families as CSS vars) ─── */

let fontCache: { display: string; mono: string } | null = null;
export function fonts() {
  if (fontCache) return fontCache;
  const cs = typeof document !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const display = cs?.getPropertyValue("--font-inter-tight").trim() || "'Helvetica Neue', Arial, sans-serif";
  const mono = cs?.getPropertyValue("--font-geist-mono").trim() || "ui-monospace, monospace";
  fontCache = { display, mono };
  return fontCache;
}

/* ── Drawing primitives (garment units, y-up) ─────────────────── */

type Ctx = CanvasRenderingContext2D;

function poly(ctx: Ctx, pts: V2[], close = true) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
}

function line(ctx: Ctx, pts: V2[], color: string, width: number, dash?: number[]) {
  ctx.save();
  poly(ctx, pts, false);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

const mirror = (pts: V2[]): V2[] => pts.map(([x, y]) => [-x, y]);
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const mul = (a: V2, s: number): V2 => [a[0] * s, a[1] * s];
const lerp = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Rib band: filled polygon with fine parallel ribs running along `dir`. */
function rib(ctx: Ctx, pts: V2[], fill: string, ribColor: string, dir: V2, spacing = 0.016) {
  ctx.save();
  poly(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();
  const n: V2 = [-dir[1], dir[0]];
  const c = pts.reduce<V2>((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  ctx.strokeStyle = ribColor;
  ctx.lineWidth = spacing * 0.32;
  for (let i = -60; i <= 60; i++) {
    const o = add(c, mul(n, i * spacing));
    ctx.beginPath();
    ctx.moveTo(o[0] - dir[0] * 2, o[1] - dir[1] * 2);
    ctx.lineTo(o[0] + dir[0] * 2, o[1] + dir[1] * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Text drawn upright in y-up garment space. `size` = cap height-ish in units. */
function text(
  ctx: Ctx,
  str: string,
  x: number,
  y: number,
  size: number,
  opts: { weight?: number; color: string; mono?: boolean; tracking?: number; align?: CanvasTextAlign; stroke?: { color: string; width: number } },
) {
  const f = fonts();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, -size / 100);
  ctx.font = `${opts.weight ?? 700} 100px ${opts.mono ? f.mono : f.display}`;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${(opts.tracking ?? 0) * 100}px`;
  if (opts.stroke) {
    ctx.lineJoin = "round";
    ctx.strokeStyle = opts.stroke.color;
    ctx.lineWidth = (opts.stroke.width / size) * 100;
    ctx.strokeText(str, 0, 0);
  }
  ctx.fillStyle = opts.color;
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

/** Embroidery look: thread shadow + highlight around filled lettering. */
function embroider(ctx: Ctx, str: string, x: number, y: number, size: number, color: string, weight = 700, tracking = 0.02) {
  text(ctx, str, x, y - size * 0.035, size, { weight, color: "rgba(0,0,0,0.35)", tracking });
  text(ctx, str, x, y, size, { weight, color, tracking });
  ctx.save();
  ctx.globalAlpha = 0.28;
  text(ctx, str, x, y + size * 0.02, size, { weight, color: "#ffffff", tracking });
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.92;
  text(ctx, str, x, y, size * 0.985, { weight, color, tracking });
  ctx.restore();
}

function snap(ctx: Ctx, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x - r * 0.3, y + r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "#f2eee6");
  g.addColorStop(0.55, "#b9b2a4");
  g.addColorStop(1, "#6d685f");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(60,55,50,0.5)";
  ctx.lineWidth = r * 0.12;
  ctx.stroke();
}

/* ── Shared garment construction details ─────────────────────── */

function sleeveBand(p: Pattern, len: number, extend = 0.06): V2[] {
  const { cuffOuter, cuffInner, sleeveDir: d, sleevePerp: n } = p.k;
  const o = add(cuffOuter, mul(n, -extend));
  const i = add(cuffInner, mul(n, extend));
  return [add(o, mul(d, 0.08)), add(i, mul(d, 0.08)), add(i, mul(d, -len)), add(o, mul(d, -len))];
}

function hemBand(p: Pattern, h: number): V2[] {
  const y = p.k.hemY;
  return [
    [-2, y - 0.1],
    [2, y - 0.1],
    [2, y + h],
    [-2, y + h],
  ];
}

function setInSeams(ctx: Ctx, p: Pattern, color: string, w: number) {
  const { sideNeck, shoulder, armpit } = p.k;
  const mid = lerp(shoulder, armpit, 0.5);
  const arm: V2[] = [shoulder, add(mid, [-0.045, 0]), armpit];
  for (const m of [false, true]) {
    const f = (pts: V2[]) => (m ? mirror(pts) : pts);
    line(ctx, f([sideNeck, shoulder]), color, w);
    line(ctx, f(smooth(arm)), color, w);
  }
}

function smooth(pts: V2[]): V2[] {
  if (pts.length !== 3) return pts;
  const [a, c, b] = pts;
  const out: V2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}

function cuffStitch(ctx: Ctx, p: Pattern, offset: number, color: string, w: number) {
  const { cuffOuter, cuffInner, sleeveDir: d } = p.k;
  const a = add(cuffOuter, mul(d, -offset));
  const b = add(cuffInner, mul(d, -offset));
  line(ctx, [a, b], color, w, [w * 3, w * 2.2]);
  line(ctx, mirror([a, b]), color, w, [w * 3, w * 2.2]);
}

function speckle(ctx: Ctx, p: Pattern, color: string, alpha: number, count = 2200) {
  const { minX, maxX, minY, maxY } = p.bbox;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const x = minX + rnd() * (maxX - minX);
    const y = minY + rnd() * (maxY - minY);
    ctx.fillRect(x, y, 0.006 + rnd() * 0.01, 0.0035);
  }
  ctx.restore();
}

/* ── Per-garment front details ────────────────────────────────── */

function paintDetails(ctx: Ctx, p: Pattern, c: Required<GarmentColors>, side: "front" | "back") {
  const dark = luminance(c.body) < 0.08;
  const seamC = dark ? shade(c.body, 0.14) : shade(c.body, -0.14);
  const stitchC = dark ? shade(c.body, 0.26) : shade(c.body, -0.22);
  const ribFill = shade(c.body, dark ? 0.035 : -0.05);
  const ribLine = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
  const k = p.k;
  const sd = k.sleeveDir;
  const cuffRibDir: V2 = sd;
  const ribH = p.spec.ribH ?? 0;

  switch (p.kind) {
    case "tee": {
      setInSeams(ctx, p, seamC, 0.0045);
      cuffStitch(ctx, p, 0.05, stitchC, 0.004);
      const hy = k.hemY + 0.05;
      line(ctx, [[-1, hy], [1, hy]], stitchC, 0.004, [0.012, 0.009]);
      line(ctx, [[-1, hy + 0.016], [1, hy + 0.016]], stitchC, 0.004, [0.012, 0.009]);
      // neck rib
      const nl = neckline("tee");
      line(ctx, nl, ribFill, 0.11);
      line(ctx, nl.map(([x, y]) => [x, y - 0.058] as V2), stitchC, 0.004, [0.012, 0.009]);
      if (side === "front") {
        text(ctx, "THE GOOD", 0, 0.5, 0.085, { weight: 700, color: c.accent, tracking: -0.02 });
        text(ctx, "CHAPTER", 0, 0.415, 0.085, { weight: 700, color: c.accent, tracking: -0.02 });
        text(ctx, "®", 0.205, 0.45, 0.03, { weight: 600, color: c.accent });
      } else {
        text(ctx, "THE GOOD CHAPTER", 0, 0.78, 0.035, { weight: 600, color: c.accent, mono: true, tracking: 0.1 });
      }
      break;
    }

    case "hoodie": {
      setInSeams(ctx, p, seamC, 0.005);
      rib(ctx, hemBand(p, ribH), ribFill, ribLine, [0, 1]);
      for (const m of [1, -1]) {
        const band = sleeveBand(p, p.spec.cuffRib ?? 0.15).map(([x, y]) => [x * m, y] as V2);
        rib(ctx, band, ribFill, ribLine, [cuffRibDir[0] * m, cuffRibDir[1]]);
      }
      line(ctx, [[-1, k.hemY + ribH + 0.004], [1, k.hemY + ribH + 0.004]], seamC, 0.005);
      if (side === "front") {
        // hood opening + lining
        const hood = hoodOpening();
        ctx.save();
        poly(ctx, hood);
        const g = ctx.createLinearGradient(0, 1.3, 0, 0.72);
        g.addColorStop(0, shade(c.body, -0.55));
        g.addColorStop(1, shade(c.body, -0.25));
        ctx.fillStyle = dark ? "#0b0b0a" : g;
        ctx.fill();
        ctx.restore();
        line(ctx, [...hood, hood[0]], shade(c.body, dark ? 0.1 : 0.08), 0.034);
        line(ctx, [...hood, hood[0]].map(([x, y]) => [x * 1.13, (y - 1.0) * 1.1 + 1.0] as V2), stitchC, 0.004, [0.012, 0.009]);
        line(ctx, [[0, 1.42], [0, 1.3]], seamC, 0.005);
        // eyelets
        for (const x of [-0.09, 0.09]) {
          ctx.beginPath();
          ctx.arc(x, 0.8, 0.017, 0, Math.PI * 2);
          ctx.fillStyle = "#c9c2b4";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, 0.8, 0.009, 0, Math.PI * 2);
          ctx.fillStyle = "#1a1917";
          ctx.fill();
        }
        // kangaroo pocket
        const pk = kangarooPocket();
        line(ctx, pk, seamC, 0.005);
        line(ctx, [pk[0], pk[1]], shade(c.body, dark ? 0.18 : -0.2), 0.012);
        line(ctx, [pk[pk.length - 1], pk[pk.length - 2]], shade(c.body, dark ? 0.18 : -0.2), 0.012);
        line(ctx, pk.slice(1, -1).map(([x, y]) => [x, y - 0.03] as V2), stitchC, 0.004, [0.012, 0.009]);
        embroider(ctx, "THE GOOD CHAPTER", 0, -0.05, 0.068, c.accent, 700, -0.01);
      } else {
        line(ctx, [[0, 1.42], [0, 0.9]], seamC, 0.005);
      }
      break;
    }

    case "varsity": {
      // contrast sleeves
      ctx.save();
      for (const m of [1, -1]) {
        const { shoulder, armpit } = k;
        const s = (pt: V2): V2 => [pt[0] * m, pt[1]];
        poly(ctx, [s([shoulder[0], shoulder[1] + 0.4]), s([3, 2]), s([3, -3]), s([armpit[0], -3]), s(armpit), s(lerp(shoulder, armpit, 0.5)), s(shoulder)]);
        ctx.fillStyle = c.trim;
        ctx.fill();
      }
      ctx.restore();
      setInSeams(ctx, p, "rgba(0,0,0,0.28)", 0.006);
      // striped rib collar
      const nl = neckline("varsity");
      line(ctx, nl, c.accent, 0.16);
      line(ctx, nl, c.trim, 0.11);
      line(ctx, nl, c.accent, 0.085);
      line(ctx, nl, c.body, 0.06);
      line(ctx, nl, c.accent, 0.035);
      // striped waistband + cuffs
      const hb = hemBand(p, ribH);
      rib(ctx, hb, c.accent, "rgba(255,255,255,0.06)", [0, 1]);
      for (const [y, col] of [
        [k.hemY + ribH * 0.62, c.trim],
        [k.hemY + ribH * 0.4, c.body],
      ] as const) {
        line(ctx, [[-1, y], [1, y]], col, ribH * 0.12);
      }
      for (const m of [1, -1]) {
        const len = p.spec.cuffRib ?? 0.16;
        const band = sleeveBand(p, len).map(([x, y]) => [x * m, y] as V2);
        rib(ctx, band, c.accent, "rgba(255,255,255,0.06)", [sd[0] * m, sd[1]]);
        for (const [t, col] of [
          [0.55, c.trim],
          [0.75, c.body],
        ] as const) {
          const a = add(k.cuffOuter, mul(sd, -len * t));
          const b = add(k.cuffInner, mul(sd, -len * t));
          const ext = mul(k.sleevePerp, 0.08);
          line(ctx, [add(a, mul(ext, -1)), add(b, ext)].map(([x, y]) => [x * m, y] as V2), col, len * 0.1);
        }
      }
      // placket + snaps
      line(ctx, [[0, k.neckCenter[1] - 0.02], [0, k.hemY + ribH]], "rgba(0,0,0,0.3)", 0.006);
      if (side === "front") {
        for (const y of [0.6, 0.3, 0.0, -0.3, -0.6]) snap(ctx, 0, y, 0.03);
        // chenille letter
        const lx = 0.36;
        const ly = 0.36;
        text(ctx, "G", lx, ly, 0.42, { weight: 800, color: c.trim, stroke: { color: c.accent, width: 0.05 } });
        ctx.save();
        ctx.globalAlpha = 0.22;
        speckleRect(ctx, lx - 0.16, ly - 0.2, 0.32, 0.4, "#ffffff");
        ctx.restore();
        text(ctx, "G", lx, ly, 0.42, { weight: 800, color: "rgba(0,0,0,0)", stroke: { color: shade(c.trim, -0.12), width: 0.006 } });
        // leather welt pockets
        for (const m of [1, -1]) {
          line(ctx, [[0.3 * m, -0.44], [0.44 * m, -0.74]], c.trim, 0.035);
        }
      } else {
        text(ctx, "GOOD", 0, 0.45, 0.26, { weight: 800, color: c.trim, stroke: { color: c.accent, width: 0.03 } });
      }
      break;
    }

    case "jacket": {
      setInSeams(ctx, p, seamC, 0.005);
      rib(ctx, hemBand(p, ribH), shade(c.body, dark ? 0.03 : -0.04), ribLine, [0, 1], 0.02);
      line(ctx, [[-1, k.hemY + ribH], [1, k.hemY + ribH]], seamC, 0.005);
      for (const m of [1, -1]) {
        const band = sleeveBand(p, p.spec.cuffRib ?? 0.09).map(([x, y]) => [x * m, y] as V2);
        rib(ctx, band, shade(c.body, dark ? 0.03 : -0.04), ribLine, [sd[0] * m, sd[1]], 0.02);
      }
      // stand collar
      ctx.save();
      poly(ctx, [[-1, k.sideNeck[1] - 0.005], [1, k.sideNeck[1] - 0.005], [1, 2], [-1, 2]]);
      ctx.fillStyle = shade(c.body, dark ? 0.045 : -0.05);
      ctx.fill();
      ctx.restore();
      line(ctx, [[-0.3, k.sideNeck[1] - 0.005], [0.3, k.sideNeck[1] - 0.005]], seamC, 0.005);
      if (side === "front") {
        // zip
        const top = k.sideNeck[1] + 0.1;
        const bottom = k.hemY - 0.02;
        ctx.fillStyle = shade(c.body, -0.35);
        ctx.fillRect(-0.02, bottom, 0.04, top - bottom);
        ctx.fillStyle = shade(c.body, dark ? 0.2 : -0.5);
        for (let y = bottom; y < top; y += 0.012) ctx.fillRect(-0.012, y, 0.024, 0.005);
        line(ctx, [[-0.028, bottom], [-0.028, top]], stitchC, 0.004, [0.012, 0.009]);
        line(ctx, [[0.028, bottom], [0.028, top]], stitchC, 0.004, [0.012, 0.009]);
        // zip puller in accent
        ctx.fillStyle = c.accent;
        roundRect(ctx, -0.018, top - 0.16, 0.036, 0.1, 0.012);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, top - 0.045, 0.016, 0, Math.PI * 2);
        ctx.strokeStyle = "#9d978c";
        ctx.lineWidth = 0.006;
        ctx.stroke();
        // chest zip pocket
        line(ctx, [[0.18, 0.46], [0.46, 0.5]], shade(c.body, -0.4), 0.018);
        ctx.fillStyle = c.accent;
        roundRect(ctx, 0.175, 0.39, 0.024, 0.06, 0.008);
        ctx.fill();
        // welt pockets
        for (const m of [1, -1]) line(ctx, [[0.3 * m, -0.46], [0.46 * m, -0.72]], shade(c.body, -0.35), 0.014);
        // tonal logo
        text(ctx, "THE GOOD CHAPTER", -0.33, 0.5, 0.032, { weight: 700, color: shade(c.body, dark ? 0.32 : -0.3), tracking: 0.04 });
      }
      break;
    }

    case "polo": {
      setInSeams(ctx, p, seamC, 0.0045);
      // sleeve bands with tipping
      for (const m of [1, -1]) {
        const band = sleeveBand(p, 0.08).map(([x, y]) => [x * m, y] as V2);
        rib(ctx, band, ribFill, ribLine, [sd[0] * m, sd[1]]);
        for (const t of [0.35, 0.6]) {
          const a = add(k.cuffOuter, mul(sd, -0.08 * t));
          const b = add(k.cuffInner, mul(sd, -0.08 * t));
          const ext = mul(k.sleevePerp, 0.08);
          line(ctx, [add(a, mul(ext, -1)), add(b, ext)].map(([x, y]) => [x * m, y] as V2), c.trim, 0.009);
        }
      }
      const hy = k.hemY + 0.05;
      line(ctx, [[-1, hy], [1, hy]], stitchC, 0.004, [0.012, 0.009]);
      // collar band
      line(ctx, neckline("polo"), ribFill, 0.06);
      if (side === "front") {
        // placket
        ctx.save();
        poly(ctx, [[-0.058, 0.36], [0.058, 0.36], [0.058, 0.9], [-0.058, 0.9]]);
        ctx.fillStyle = shade(c.body, dark ? 0.02 : -0.03);
        ctx.fill();
        ctx.restore();
        line(ctx, [[-0.058, 0.9], [-0.058, 0.36], [0.058, 0.36], [0.058, 0.9]], seamC, 0.004);
        for (const y of [0.8, 0.64, 0.48]) {
          ctx.beginPath();
          ctx.arc(0, y, 0.02, 0, Math.PI * 2);
          ctx.fillStyle = shade(c.body, 0.35);
          ctx.fill();
          ctx.strokeStyle = shade(c.body, -0.2);
          ctx.lineWidth = 0.003;
          ctx.stroke();
        }
        // collar leaves with tipping
        for (const m of [1, -1] as const) {
          const leaf = poloCollarLeaf(m);
          ctx.save();
          poly(ctx, leaf);
          ctx.fillStyle = shade(c.body, 0.05);
          ctx.fill();
          ctx.clip();
          const [a, b, cc, d] = leaf;
          const mid: V2 = [(a[0] + b[0] + cc[0] + d[0]) / 4, (a[1] + b[1] + cc[1] + d[1]) / 4];
          for (const t of [0.14, 0.26]) {
            line(ctx, [lerp(b, mid, t), lerp(cc, mid, t), lerp(d, mid, t)], c.trim, 0.009);
          }
          ctx.restore();
          line(ctx, [...leaf, a], seamC, 0.004);
        }
        embroider(ctx, "G", 0.34, 0.5, 0.1, c.accent, 800);
      }
      break;
    }

    case "crewneck": {
      speckle(ctx, p, dark ? "#ffffff" : "#000000", dark ? 0.05 : 0.06, 5000);
      setInSeams(ctx, p, seamC, 0.005);
      rib(ctx, hemBand(p, ribH), ribFill, ribLine, [0, 1]);
      line(ctx, [[-1, k.hemY + ribH + 0.003], [1, k.hemY + ribH + 0.003]], seamC, 0.005);
      for (const m of [1, -1]) {
        const band = sleeveBand(p, p.spec.cuffRib ?? 0.15).map(([x, y]) => [x * m, y] as V2);
        rib(ctx, band, ribFill, ribLine, [cuffRibDir[0] * m, cuffRibDir[1]]);
      }
      const nl = neckline("crewneck");
      line(ctx, nl, ribFill, 0.14);
      line(ctx, nl.map(([x, y]) => [x, y - 0.074] as V2), stitchC, 0.004, [0.012, 0.009]);
      if (side === "front") {
        // vintage V-insert
        const cy = k.neckCenter[1] - 0.075;
        ctx.save();
        poly(ctx, [[-0.07, cy], [0.07, cy], [0, cy - 0.13]]);
        ctx.fillStyle = ribFill;
        ctx.fill();
        ctx.restore();
        embroider(ctx, "GOOD", 0, 0.34, 0.24, c.accent, 800, -0.03);
        text(ctx, "— CHAPTER 01 —", 0, 0.16, 0.042, { weight: 500, color: shade(c.accent, -0.05), mono: true, tracking: 0.12 });
      }
      break;
    }
  }
}

function speckleRect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) ctx.fillRect(x + rnd() * w, y + rnd() * h, 0.004, 0.004);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fullColors(c: GarmentColors): Required<GarmentColors> {
  return { body: c.body, trim: c.trim ?? shade(c.body, -0.08), accent: c.accent ?? "#c8552b" };
}

/** Paint one side of the garment into a pixel rect (with y-up garment transform). */
export function paintSide(
  ctx: Ctx,
  kind: GarmentKind,
  colors: GarmentColors,
  side: "front" | "back",
  rect: { x: number; y: number; w: number; h: number },
  /** clip to the silhouette (2D fallback) instead of bleeding colour for texture filtering */
  cutout = false,
) {
  const p = getPattern(kind);
  const L = atlasLayout(p);
  const c = fullColors(colors);
  const sx = rect.w / L.W;
  const sy = rect.h / L.H;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (side === "front") ctx.setTransform(sx, 0, 0, -sy, rect.x - L.x0 * sx, rect.y + L.y1 * sy);
  else ctx.setTransform(-sx, 0, 0, -sy, rect.x + L.x1 * sx, rect.y + L.y1 * sy);

  const outline = new Path2D(toPathData(p.outline));
  if (cutout) ctx.clip(outline);
  // bleed body colour everywhere so texture filtering never pulls in black
  ctx.fillStyle = c.body;
  ctx.fillRect(L.x0 - 1, L.y0 - 1, L.W + 2, L.H + 2);
  ctx.save();
  ctx.clip(outline);
  paintDetails(ctx, p, c, side);
  ctx.restore();
  ctx.restore();
}

/** Front + back albedo atlas. */
export function paintAtlas(kind: GarmentKind, colors: GarmentColors, size: number) {
  const p = getPattern(kind);
  const L = atlasLayout(p);
  const canvas = document.createElement("canvas");
  canvas.width = size * 2;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const w = Math.round(L.rw * size);
  const h = Math.round(L.rh * size);
  paintSide(ctx, kind, colors, "front", { x: 0, y: 0, w, h });
  paintSide(ctx, kind, colors, "back", { x: size, y: 0, w, h });
  return canvas;
}

/**
 * No-WebGL fallback: the painted front with baked "pillow" shading and a soft
 * contact shadow, drawn into an existing canvas.
 */
export function paintFallback(canvas: HTMLCanvasElement, kind: GarmentKind, colors: GarmentColors, dpr = 1) {
  const p = getPattern(kind);
  const L = atlasLayout(p);
  const cw = canvas.clientWidth * dpr;
  const ch = canvas.clientHeight * dpr;
  if (!cw || !ch) return;
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.min(cw / (L.W * 1.08), ch / (L.H * 1.14));
  const w = L.W * scale;
  const h = L.H * scale;
  const x = (cw - w) / 2;
  const y = (ch - h) / 2 - h * 0.03;

  // contact shadow
  ctx.save();
  ctx.filter = `blur(${Math.round(18 * (scale / 200))}px)`;
  ctx.fillStyle = "rgba(40,32,20,0.22)";
  ctx.beginPath();
  ctx.ellipse(cw / 2, y + h * 1.0, w * 0.34, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  paintSide(ctx, kind, colors, "front", { x, y, w, h }, true);

  // pillow shading clipped to the outline
  ctx.save();
  const sx = w / L.W;
  const sy = h / L.H;
  ctx.setTransform(sx, 0, 0, -sy, x - L.x0 * sx, y + L.y1 * sy);
  const outline = new Path2D(toPathData(p.outline));
  ctx.clip(outline);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // rim darkening
  ctx.save();
  ctx.setTransform(sx, 0, 0, -sy, x - L.x0 * sx, y + L.y1 * sy);
  ctx.filter = `blur(${Math.max(4, Math.round(0.05 * sx))}px)`;
  ctx.strokeStyle = "rgba(0,0,0,0.38)";
  ctx.lineWidth = 0.1;
  ctx.stroke(outline);
  ctx.restore();
  // key light
  const g = ctx.createRadialGradient(x + w * 0.38, y + h * 0.28, 0, x + w * 0.5, y + h * 0.45, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(255,255,255,0.20)");
  g.addColorStop(0.5, "rgba(255,255,255,0.04)");
  g.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
