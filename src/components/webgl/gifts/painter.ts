/**
 * 2D gift painter.
 *
 * Prints the brand onto gift surfaces (bottle wrap, candle label, foil and
 * box decals) for the WebGL models, and draws the shaded no-WebGL fallback
 * from the same measurements in ./shapes.
 */
import { LOGO, LOGO_CLAY } from "@/components/ui/Logo";
import { fonts, fullColors, luminance, shade, type GarmentColors } from "../garments/painter";
import { BOTTLE, CANDLE, DIARY, GIFTBOX, giftBounds, type GiftKind } from "./shapes";

type Ctx = CanvasRenderingContext2D;
type Fill = string | CanvasGradient;

/* ── Logo ─────────────────────────────────────────────────────── */

let logoPaths: { type: Path2D; good: Path2D } | null = null;

/** Draws the logo centred on (cx, cy), `width` wide, in the current (y-down) transform. */
export function drawLogo(ctx: Ctx, cx: number, cy: number, width: number, type: Fill, good: Fill = type) {
  logoPaths ??= { type: new Path2D(LOGO.type), good: new Path2D(LOGO.good) };
  const s = width / LOGO.width;
  ctx.save();
  ctx.translate(cx - width / 2, cy - (LOGO.height * s) / 2);
  ctx.scale(s, s);
  ctx.fillStyle = type;
  ctx.fill(logoPaths.type, "evenodd");
  ctx.fillStyle = good;
  ctx.fill(logoPaths.good, "evenodd");
  ctx.restore();
}

/** The clay "good" only prints on light surfaces; on dark or coloured ones the logo goes one colour. */
const goodInk = (c: Required<GarmentColors>) => (luminance(c.body) > 0.35 ? LOGO_CLAY : c.accent);

function speckle(ctx: Ctx, w: number, h: number, dot: number, alpha: number, count: number) {
  let seed = 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  ctx.save();
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(rnd() * w, rnd() * h, dot, dot);
  }
  ctx.restore();
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  return c;
}

/* ── Textures for the WebGL models ────────────────────────────── */

/** Powder-coated wrap for the bottle body; the logo runs up the front (u = 0.5). */
export function paintBottleWrap(colors: GarmentColors, size: number) {
  const c = fullColors(colors);
  const U = 2 * Math.PI * BOTTLE.r;
  const V = BOTTLE.bodyTop - BOTTLE.bottom - BOTTLE.foot;
  const cv = canvas(size, size);
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = c.body;
  ctx.fillRect(0, 0, size, size);
  speckle(ctx, size, size, Math.max(1, size / 512), 0.05, size * 6);
  ctx.setTransform(size / U, 0, 0, size / V, 0, 0);
  ctx.translate(U / 2, V * 0.47);
  ctx.rotate(-Math.PI / 2);
  drawLogo(ctx, 0, 0, V * 0.62, c.accent, goodInk(c));
  return cv;
}

/** Wrap-around paper label for the candle. */
export function paintCandleLabel(colors: GarmentColors, width: number) {
  const c = fullColors(colors);
  const U = 2 * Math.PI * (CANDLE.r + 0.004);
  const V = CANDLE.labelH;
  const cv = canvas(width, (width * V) / U);
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = c.trim;
  ctx.fillRect(0, 0, cv.width, cv.height);
  speckle(ctx, cv.width, cv.height, 1, 0.04, width * 2);
  ctx.setTransform(cv.width / U, 0, 0, cv.height / V, 0, 0);
  paintLabelFace(ctx, U / 2, 0, V, c.accent);
  return cv;
}

/** Label artwork centred on x, spanning y0 … y0 + h (y-down units). */
function paintLabelFace(ctx: Ctx, x: number, y0: number, h: number, ink: string) {
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(x - 0.62, y0 + h * 0.1, 1.24, 0.006);
  ctx.fillRect(x - 0.62, y0 + h * 0.9, 1.24, 0.006);
  ctx.globalAlpha = 1;
  drawLogo(ctx, x, y0 + h * 0.43, 0.98, ink, LOGO_CLAY);
  const f = fonts();
  ctx.save();
  ctx.translate(x, y0 + h * 0.76);
  ctx.scale(0.0006, 0.0006);
  ctx.font = `500 60px ${f.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "9px";
  ctx.fillStyle = ink;
  ctx.fillText("NO. 01 — CEDAR, AMBER & SMOKE", 0, 0);
  ctx.restore();
}

/** Transparent logo decal (diary foil, gift box print). */
export function paintLogoDecal(width: number, type: string, good: string = type) {
  const cv = canvas(width, (width * LOGO.height) / LOGO.width);
  drawLogo(cv.getContext("2d")!, cv.width / 2, cv.height / 2, cv.width, type, good);
  return cv;
}

/** Fine page edges for the diary's text block; `vertical` = lines run along v. */
export function paintPageEdge(size: number, vertical: boolean, paper = "#f1ebdd") {
  const cv = canvas(size, size);
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, size, size);
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < size; i += 3) {
    ctx.fillStyle = `rgba(90,80,64,${0.06 + rnd() * 0.1})`;
    if (vertical) ctx.fillRect(i, 0, 1, size);
    else ctx.fillRect(0, i, size, 1);
  }
  return cv;
}

/* ── No-WebGL fallback ────────────────────────────────────────── */

/** y-up scene units → y-down canvas units */
const Y = (y: number) => -y;

/** Horizontal light falloff across a cylinder. */
function cylinderShade(ctx: Ctx, x0: number, x1: number, k = 1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(0,0,0,${0.36 * k})`);
  g.addColorStop(0.16, `rgba(0,0,0,${0.08 * k})`);
  g.addColorStop(0.3, `rgba(255,255,255,${0.24 * k})`);
  g.addColorStop(0.44, `rgba(255,255,255,${0.04 * k})`);
  g.addColorStop(0.78, `rgba(0,0,0,${0.1 * k})`);
  g.addColorStop(1, `rgba(0,0,0,${0.4 * k})`);
  return g;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function paintBottle(ctx: Ctx, c: Required<GarmentColors>) {
  const { r, bottom, bodyTop, neckR, shoulderTop, lidTop, loopR, loopTube } = BOTTLE;
  const lidR = neckR + 0.012;

  // carry loop (behind the lid)
  ctx.beginPath();
  ctx.arc(0, Y(lidTop), loopR, Math.PI, Math.PI * 2);
  ctx.lineWidth = loopTube * 2;
  ctx.strokeStyle = shade(c.trim, 0.06);
  ctx.stroke();

  const body = new Path2D();
  body.moveTo(-r, Y(bodyTop));
  body.lineTo(-r, Y(bottom + 0.08));
  body.quadraticCurveTo(-r, Y(bottom), -r + 0.08, Y(bottom));
  body.lineTo(r - 0.08, Y(bottom));
  body.quadraticCurveTo(r, Y(bottom), r, Y(bottom + 0.08));
  body.lineTo(r, Y(bodyTop));
  body.bezierCurveTo(r, Y(bodyTop + 0.14), neckR + 0.03, Y(shoulderTop - 0.03), neckR, Y(shoulderTop));
  body.lineTo(-neckR, Y(shoulderTop));
  body.bezierCurveTo(-neckR - 0.03, Y(shoulderTop - 0.03), -r, Y(bodyTop + 0.14), -r, Y(bodyTop));
  body.closePath();

  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = c.body;
  ctx.fillRect(-r, Y(shoulderTop), r * 2, shoulderTop - bottom);
  ctx.save();
  ctx.translate(0, Y((bottom + bodyTop) / 2 + 0.03));
  ctx.rotate(-Math.PI / 2);
  drawLogo(ctx, 0, 0, (bodyTop - bottom - BOTTLE.foot) * 0.62, c.accent, goodInk(c));
  ctx.restore();
  ctx.fillStyle = cylinderShade(ctx, -r, r);
  ctx.fillRect(-r, Y(shoulderTop), r * 2, shoulderTop - bottom);
  ctx.restore();

  // lid
  roundRect(ctx, -lidR, Y(lidTop), lidR * 2, lidTop - shoulderTop + 0.01, [0.07, 0.07, 0.01, 0.01]);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c.trim;
  ctx.fillRect(-lidR, Y(lidTop), lidR * 2, lidTop - shoulderTop + 0.01);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let x = -lidR + 0.03; x < lidR; x += 0.045) ctx.fillRect(x, Y(lidTop - 0.08), 0.012, lidTop - shoulderTop - 0.12);
  ctx.fillStyle = cylinderShade(ctx, -lidR, lidR, 1.1);
  ctx.fillRect(-lidR, Y(lidTop), lidR * 2, lidTop - shoulderTop + 0.01);
  ctx.restore();
}

function paintDiary(ctx: Ctx, c: Required<GarmentColors>) {
  const { w, h, bandX, ribbonX, ribbonLen } = DIARY;
  const top = Y(h / 2);
  const bot = Y(-h / 2);

  // ribbon marker
  const rw = 0.075;
  ctx.beginPath();
  ctx.moveTo(ribbonX - rw / 2, bot - 0.1);
  ctx.lineTo(ribbonX + rw / 2, bot - 0.1);
  ctx.lineTo(ribbonX + rw / 2 + 0.02, bot + ribbonLen);
  ctx.lineTo(ribbonX + 0.02, bot + ribbonLen - 0.05);
  ctx.lineTo(ribbonX - rw / 2 + 0.02, bot + ribbonLen);
  ctx.closePath();
  ctx.fillStyle = shade(c.accent, -0.2);
  ctx.fill();

  // page block's fore-edge peeking out on the right
  ctx.beginPath();
  ctx.moveTo(w / 2 - 0.02, top + 0.05);
  ctx.lineTo(w / 2 + 0.07, top + 0.1);
  ctx.lineTo(w / 2 + 0.07, bot - 0.03);
  ctx.lineTo(w / 2 - 0.02, bot - 0.05);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#e9e2d2";
  ctx.fillRect(w / 2 - 0.02, top, 0.1, h);
  ctx.fillStyle = "rgba(90,80,64,0.14)";
  for (let x = w / 2 - 0.02; x < w / 2 + 0.07; x += 0.012) ctx.fillRect(x, top, 0.004, h);
  ctx.restore();

  // cover
  roundRect(ctx, -w / 2, top, w, h, [0.03, 0.06, 0.06, 0.03]);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c.body;
  ctx.fillRect(-w / 2, top, w, h);
  const sheen = ctx.createRadialGradient(-w * 0.25, top + h * 0.2, 0, -w * 0.1, top + h * 0.35, h * 0.9);
  sheen.addColorStop(0, "rgba(255,255,255,0.13)");
  sheen.addColorStop(0.6, "rgba(255,255,255,0.02)");
  sheen.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = sheen;
  ctx.fillRect(-w / 2, top, w, h);
  // hinge groove
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-w / 2 + 0.13, top, 0.014, h);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(-w / 2 + 0.144, top, 0.01, h);
  ctx.restore();

  // foil logo
  const lw = w * 0.6;
  const foil = ctx.createLinearGradient(-lw / 2, 0, lw / 2, 0);
  foil.addColorStop(0, shade(c.trim, -0.15));
  foil.addColorStop(0.45, shade(c.trim, 0.35));
  foil.addColorStop(1, shade(c.trim, -0.1));
  drawLogo(ctx, -0.06, Y(h * 0.18), lw, foil);

  // elastic band
  const bw = 0.056;
  const band = ctx.createLinearGradient(bandX - bw / 2, 0, bandX + bw / 2, 0);
  band.addColorStop(0, shade(c.accent, -0.3));
  band.addColorStop(0.4, c.accent);
  band.addColorStop(1, shade(c.accent, -0.25));
  ctx.fillStyle = band;
  ctx.fillRect(bandX - bw / 2, top - 0.012, bw, h + 0.024);
}

function paintCandle(ctx: Ctx, c: Required<GarmentColors>) {
  const { r, bottom, top, wall, waxY, labelY, labelH, wickH, flameH } = CANDLE;
  const ry = r * 0.17;

  const body = new Path2D();
  body.moveTo(-r, Y(top));
  body.lineTo(-r, Y(bottom));
  body.ellipse(0, Y(bottom), r, ry, 0, Math.PI, 0, true);
  body.lineTo(r, Y(top));
  body.ellipse(0, Y(top), r, ry, 0, 0, Math.PI, false);
  body.closePath();

  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = c.body;
  ctx.fillRect(-r, Y(top) - ry, r * 2, top - bottom + ry * 2);
  // glaze highlight (the paper label covers it)
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(-r * 0.52, Y(top) + ry, r * 0.07, top - bottom - ry * 2);
  // label
  const lt = Y(labelY + labelH / 2);
  const lb = Y(labelY - labelH / 2);
  ctx.beginPath();
  ctx.moveTo(-r, lt);
  ctx.ellipse(0, lt, r, ry, 0, Math.PI, 0, true);
  ctx.lineTo(r, lb);
  ctx.ellipse(0, lb, r, ry, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = c.trim;
  ctx.fill();
  paintLabelFace(ctx, 0, lt + ry * 0.55, labelH, c.accent);
  ctx.fillStyle = cylinderShade(ctx, -r, r, 0.9);
  ctx.fillRect(-r, Y(top) - ry, r * 2, top - bottom + ry * 2);
  ctx.restore();

  // rim, inner wall, wax
  ctx.beginPath();
  ctx.ellipse(0, Y(top), r, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = shade(c.body, 0.14);
  ctx.fill();
  const ir = r - wall;
  const iry = (ry * ir) / r;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, Y(top), ir, iry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = shade(c.body, -0.35);
  ctx.fillRect(-r, Y(top) - ry, r * 2, ry * 4);
  ctx.beginPath();
  ctx.ellipse(0, Y(waxY), ir, iry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#efe6d4";
  ctx.fill();
  ctx.restore();

  // wick + flame
  const fb = waxY + wickH;
  const glow = ctx.createRadialGradient(0, Y(fb + flameH * 0.4), 0, 0, Y(fb + flameH * 0.4), 0.42);
  glow.addColorStop(0, "rgba(255,196,120,0.45)");
  glow.addColorStop(1, "rgba(255,196,120,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-0.45, Y(fb + flameH * 0.4) - 0.45, 0.9, 0.9);
  ctx.beginPath();
  ctx.moveTo(0, Y(waxY));
  ctx.quadraticCurveTo(0.004, Y(waxY + wickH * 0.6), 0.014, Y(fb));
  ctx.lineWidth = 0.022;
  ctx.strokeStyle = "#2b2520";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0.012, Y(fb + flameH));
  ctx.bezierCurveTo(0.03, Y(fb + flameH * 0.62), 0.058, Y(fb + flameH * 0.22), 0.012, Y(fb - 0.02));
  ctx.bezierCurveTo(-0.038, Y(fb + flameH * 0.22), -0.012, Y(fb + flameH * 0.62), 0.012, Y(fb + flameH));
  const flame = ctx.createLinearGradient(0, Y(fb), 0, Y(fb + flameH));
  flame.addColorStop(0, "#fff4df");
  flame.addColorStop(0.45, "#ffd27d");
  flame.addColorStop(1, "#f08a3c");
  ctx.fillStyle = flame;
  ctx.fill();
}

function paintGiftbox(ctx: Ctx, c: Required<GarmentColors>) {
  const { w, d, bottom, baseTop, lidH, lidOver, ribbonW, ribbonX } = GIFTBOX;
  const lidBottom = baseTop - 0.14;
  const lidTop = lidBottom + lidH;
  const lw = w / 2 + lidOver;
  const dp = (d + lidOver * 2) * 0.3; // foreshortened lid depth
  const back = 0.9; // perspective narrowing at the back edge
  const rib = shade(c.trim, 0);

  // base front
  ctx.fillStyle = c.body;
  ctx.fillRect(-w / 2, Y(lidBottom), w, lidBottom - bottom);
  const baseShade = ctx.createLinearGradient(0, Y(lidBottom), 0, Y(bottom));
  baseShade.addColorStop(0, "rgba(0,0,0,0.2)");
  baseShade.addColorStop(0.1, "rgba(0,0,0,0.04)");
  baseShade.addColorStop(1, "rgba(0,0,0,0.1)");
  ctx.fillStyle = baseShade;
  ctx.fillRect(-w / 2, Y(lidBottom), w, lidBottom - bottom);
  drawLogo(ctx, -0.22, Y((bottom + lidBottom) / 2), 1.15, c.accent, LOGO_CLAY);

  // lid top (trapezoid) + front
  ctx.beginPath();
  ctx.moveTo(-lw, Y(lidTop));
  ctx.lineTo(lw, Y(lidTop));
  ctx.lineTo(lw * back, Y(lidTop) - dp);
  ctx.lineTo(-lw * back, Y(lidTop) - dp);
  ctx.closePath();
  ctx.fillStyle = shade(c.body, 0.1);
  ctx.fill();
  ctx.fillStyle = shade(c.body, -0.06);
  ctx.fillRect(-lw, Y(lidTop), lw * 2, lidH);

  // ribbon: down the front, over the lid, and across the top
  const rx = (x: number, t: number) => x * (1 - t * (1 - back)); // x at depth t (0 front … 1 back)
  ctx.fillStyle = rib;
  ctx.fillRect(ribbonX - ribbonW / 2, Y(lidTop), ribbonW, lidTop - bottom);
  ctx.beginPath();
  ctx.moveTo(rx(ribbonX - ribbonW / 2, 0), Y(lidTop));
  ctx.lineTo(rx(ribbonX + ribbonW / 2, 0), Y(lidTop));
  ctx.lineTo(rx(ribbonX + ribbonW / 2, 1), Y(lidTop) - dp);
  ctx.lineTo(rx(ribbonX - ribbonW / 2, 1), Y(lidTop) - dp);
  ctx.closePath();
  ctx.fill();
  const t0 = 0.5 - ribbonW / (d * 2);
  const t1 = 0.5 + ribbonW / (d * 2);
  ctx.beginPath();
  ctx.moveTo(-rx(lw, t0), Y(lidTop) - dp * t0);
  ctx.lineTo(rx(lw, t0), Y(lidTop) - dp * t0);
  ctx.lineTo(rx(lw, t1), Y(lidTop) - dp * t1);
  ctx.lineTo(-rx(lw, t1), Y(lidTop) - dp * t1);
  ctx.closePath();
  ctx.fillStyle = shade(c.trim, 0.08);
  ctx.fill();
  // ribbon shading on the lid front edge
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(ribbonX - ribbonW / 2, Y(lidTop), ribbonW, lidH);

  // bow
  const bx = rx(ribbonX, 0.5);
  const by = Y(lidTop) - dp * 0.5;
  ctx.lineWidth = 0.075;
  ctx.strokeStyle = shade(c.trim, -0.08);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(bx + s * 0.16, by - 0.08, 0.17, 0.1, s * -0.45, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(bx, by - 0.02, 0.075, 0.06, 0, 0, Math.PI * 2);
  ctx.fillStyle = shade(c.trim, -0.15);
  ctx.fill();
}

const painters: Record<GiftKind, (ctx: Ctx, c: Required<GarmentColors>) => void> = {
  bottle: paintBottle,
  diary: paintDiary,
  candle: paintCandle,
  giftbox: paintGiftbox,
};

/** Shaded 2D rendition of a gift with a soft contact shadow, sized to the canvas. */
export function paintGiftFallback(cv: HTMLCanvasElement, kind: GiftKind, colors: GarmentColors, dpr = 1) {
  const cw = cv.clientWidth * dpr;
  const ch = cv.clientHeight * dpr;
  if (!cw || !ch) return;
  cv.width = cw;
  cv.height = ch;
  const ctx = cv.getContext("2d")!;
  const b = giftBounds[kind];
  const s = Math.min(cw / (b.w * 1.3), ch / (b.h * 1.22));
  const ox = cw / 2;
  const oy = ch / 2 + (b.bottom + b.h / 2) * s - ch * 0.02;

  // contact shadow
  ctx.save();
  ctx.filter = `blur(${Math.max(4, Math.round(s * 0.06))}px)`;
  ctx.fillStyle = "rgba(40,32,20,0.26)";
  ctx.beginPath();
  ctx.ellipse(ox, oy - b.bottom * s + s * 0.02, b.w * 0.5 * s, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.setTransform(s, 0, 0, s, ox, oy);
  painters[kind](ctx, fullColors(colors));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
