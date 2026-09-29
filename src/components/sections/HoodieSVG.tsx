"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getPattern, hoodOpening, kangarooPocket, type V2 } from "@/components/webgl/garments/shapes";

/*
 * Tech-pack hoodie for the customization story. Built from the same pattern
 * data as the 3D garments. Every layer is tagged with data-l so the scroll
 * timeline in <Customization> can choreograph it.
 */

export const STAGE = { w: 600, h: 700, cx: 300, cy: 320, k: 185 };
export const CREST: V2 = [0.34, 0.42];
const S = ([x, y]: V2): V2 => [STAGE.cx + x * STAGE.k, STAGE.cy - y * STAGE.k];
const d = (pts: V2[], close = true) =>
  pts.map((p, i) => `${i ? "L" : "M"}${S(p)[0].toFixed(1)} ${S(p)[1].toFixed(1)}`).join("") + (close ? "Z" : "");

export const COLORWAYS = ["#d9cfbd", "#efe9dd", "#3b3b38", "#c8552b"];

let noiseUrl: string | null = null;

/** Knit/noise swatch generated once on the client and cached for the page. */
function getNoiseUrl() {
  if (noiseUrl) return noiseUrl;
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(96, 96);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const x = (i / 4) % 96;
    const rib = x % 4 < 1 ? 26 : 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
    img.data[i + 3] = rnd() * 60 + rib;
  }
  ctx.putImageData(img, 0, 0);
  noiseUrl = c.toDataURL();
  return noiseUrl;
}

const noop = () => () => {};
function useNoiseTexture() {
  return useSyncExternalStore(noop, getNoiseUrl, () => null);
}

export function HoodieSVG({ className }: { className?: string }) {
  const p = getPattern("hoodie");
  const noise = useNoiseTexture();

  const g = useMemo(() => {
    const k = p.k;
    const outline = d(p.outline);
    const hood = d(hoodOpening());
    const pocket = d(kangarooPocket(), false);
    const band = (m: 1 | -1) => {
      const dir = k.sleeveDir;
      const n = k.sleevePerp;
      const o: V2 = [k.cuffOuter[0] - n[0] * 0.06, k.cuffOuter[1] - n[1] * 0.06];
      const i: V2 = [k.cuffInner[0] + n[0] * 0.06, k.cuffInner[1] + n[1] * 0.06];
      const L = 0.16;
      const pts: V2[] = [
        [o[0] + dir[0] * 0.08, o[1] + dir[1] * 0.08],
        [i[0] + dir[0] * 0.08, i[1] + dir[1] * 0.08],
        [i[0] - dir[0] * L, i[1] - dir[1] * L],
        [o[0] - dir[0] * L, o[1] - dir[1] * L],
      ];
      return d(pts.map(([x, y]) => [x * m, y] as V2));
    };
    const hemTop = -1.22 + 0.15;
    const [, hy] = S([0, hemTop]);
    const [sx0, sy0] = S(k.shoulder);
    const [ax, ay] = S(k.armpit);
    const [lsx] = S([-k.shoulder[0], 0]);
    const [lax] = S([-k.armpit[0], 0]);
    return {
      outline,
      hood,
      pocket,
      cuffR: band(1),
      cuffL: band(-1),
      hemY: hy,
      seams: `M${sx0} ${sy0}Q${ax - 10} ${(sy0 + ay) / 2} ${ax} ${ay}M${lsx} ${sy0}Q${lax + 10} ${(sy0 + ay) / 2} ${lax} ${ay}`,
      shoulder: S(k.shoulder),
      shoulderL: S([-k.shoulder[0], k.shoulder[1]]),
      cuffOuterL: S([-k.cuffOuter[0], k.cuffOuter[1]]),
      cuffInnerR: S(k.cuffInner),
      hemR: S([0.6, -1.0]),
    };
  }, [p]);

  const [crx, cry] = S(CREST);
  const [chestL] = S([-0.67, 0]);
  const [chestR] = S([0.67, 0]);
  const [, chestY] = S([0, 0.12]);
  const [, hpsY] = S([0, 0.9]);
  const [, hemY] = S([0, -1.236]);

  return (
    <svg viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} className={className} overflow="visible" aria-hidden>
      <defs>
        <clipPath id="hd-clip">
          <path d={g.outline} />
        </clipPath>
        <radialGradient id="hd-spot" cx="50%" cy="46%" r="55%">
          <stop offset="0" stopColor="#c8552b" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#c8552b" stopOpacity="0.05" />
          <stop offset="1" stopColor="#c8552b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hd-light" cx="36%" cy="22%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        <pattern id="hd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="#f4f1ea" fillOpacity="0.16" />
        </pattern>
        <pattern id="hd-rib" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="1.2" height="5" fill="#000" fillOpacity="0.16" />
        </pattern>
        {noise && (
          <pattern id="hd-knit" width="96" height="96" patternUnits="userSpaceOnUse">
            <image href={noise} width="96" height="96" />
          </pattern>
        )}
        <pattern id="hd-satin" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <rect width="1.4" height="3" fill="#fff" fillOpacity="0.35" />
        </pattern>
        <filter id="hd-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <linearGradient id="hd-kraft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c49a6c" />
          <stop offset="1" stopColor="#a67c50" />
        </linearGradient>
      </defs>

      {/* stage */}
      <ellipse cx="300" cy="330" rx="330" ry="330" fill="url(#hd-spot)" />
      <rect data-l="grid" x="-200" y="-100" width="1000" height="900" fill="url(#hd-grid)" />

      {/* packaging — back of the box sits behind the garment */}
      <g data-l="box-back" opacity="0">
        <path d="M150 478 L450 478 L474 500 L126 500 Z" fill="#7a5a38" />
      </g>

      <g data-l="cam">
        {/* ground shadow */}
        <ellipse data-l="shadow" cx="300" cy="590" rx="170" ry="14" fill="#000" opacity="0.35" filter="url(#hd-soft)" />

        {/* fabric body */}
        <g data-l="fabric" opacity="0">
          <path data-l="fill" d={g.outline} fill={COLORWAYS[0]} />
          <g clipPath="url(#hd-clip)">
            {noise && <rect data-l="knit" x="0" y="0" width="600" height="700" fill="url(#hd-knit)" opacity="0.55" />}
            <path d={g.cuffR} fill="url(#hd-rib)" />
            <path d={g.cuffL} fill="url(#hd-rib)" />
            <rect x="0" y={g.hemY} width="600" height="80" fill="url(#hd-rib)" />
            <path d={g.hood} fill="#000" fillOpacity="0.55" />
            <rect width="600" height="700" fill="url(#hd-light)" />
            <path d={g.outline} fill="none" stroke="#000" strokeOpacity="0.45" strokeWidth="22" filter="url(#hd-soft)" />
          </g>
        </g>

        {/* technical line drawing */}
        <g data-l="lines" fill="none" stroke="#f4f1ea" strokeWidth="1.3" strokeLinejoin="round">
          <path data-l="outline" d={g.outline} />
          <g data-l="construction" strokeOpacity="0.55">
            <path d={g.hood} />
            <path d={g.pocket} strokeDasharray="4 4" />
            <path d={g.seams} />
            <line x1="0" x2="600" y1={g.hemY} y2={g.hemY} clipPath="url(#hd-clip)" />
            <path d={g.cuffR} clipPath="url(#hd-clip)" />
            <path d={g.cuffL} clipPath="url(#hd-clip)" />
            <line x1="300" x2="300" y1={S([0, 1.29])[1]} y2={S([0, 1.42])[1]} />
          </g>
        </g>

        {/* drawstrings */}
        <g data-l="strings" stroke="#f4f1ea" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M283.4 172 Q282 230 281 283" />
          <path d="M316.6 172 Q318 230 319 283" />
          <rect x="278" y="281" width="6" height="14" rx="2" fill="#c8552b" stroke="none" />
          <rect x="316" y="281" width="6" height="14" rx="2" fill="#c8552b" stroke="none" />
        </g>

        {/* PRINT — squeegee wipe reveals the chest print */}
        <clipPath id="hd-wipe">
          <rect data-l="wipe" x="150" y="300" width="0" height="60" />
        </clipPath>
        <g data-l="print">
          <text
            x="300"
            y={S([0, -0.03])[1]}
            textAnchor="middle"
            clipPath="url(#hd-wipe)"
            fill="#f4f1ea"
            style={{ font: "700 19px var(--font-inter-tight)", letterSpacing: "-0.02em" }}
          >
            THE GOOD CHAPTER
          </text>
          <rect data-l="squeegee" x="146" y="306" width="5" height="46" rx="2" fill="#f4f1ea" opacity="0" />
        </g>

        {/* EMBROIDERY — stitched crest on the left chest */}
        <g data-l="crest">
          <circle
            data-l="crest-ring"
            cx={crx}
            cy={cry}
            r="21"
            fill="none"
            stroke="#f4f1ea"
            strokeWidth="2.2"
            strokeDasharray="132"
            strokeDashoffset="132"
          />
          <g data-l="crest-fill" opacity="0">
            <circle cx={crx} cy={cry} r="18" fill="#151514" />
            <circle cx={crx} cy={cry} r="18" fill="url(#hd-satin)" />
            <text x={crx} y={cry + 7.5} textAnchor="middle" fill="#f4f1ea" style={{ font: "800 21px var(--font-inter-tight)" }}>
              G
            </text>
            <circle cx={crx} cy={cry} r="15.5" fill="none" stroke="#f4f1ea" strokeWidth="0.8" strokeDasharray="2 2" />
          </g>
        </g>

        {/* FINISH — sleeve hit, woven label, hang tag */}
        <g data-l="finish" opacity="0">
          <text
            transform={`translate(${S([-1.02, 0.02]).join(" ")}) rotate(-66)`}
            textAnchor="middle"
            fill="#f4f1ea"
            style={{ font: "500 10px var(--font-geist-mono)", letterSpacing: "0.22em" }}
          >
            CHAPTER 01
          </text>
          <g transform={`translate(${g.hemR[0] + 22} ${g.hemR[1]})`}>
            <rect x="0" y="-8" width="22" height="16" fill="#f4f1ea" />
            <text x="11" y="3" textAnchor="middle" fill="#151514" style={{ font: "700 6px var(--font-inter-tight)" }}>
              TGC
            </text>
          </g>
          <g transform={`translate(${g.cuffInnerR[0] - 6} ${g.cuffInnerR[1] + 6})`}>
            <g data-l="tag" transform="rotate(0)">
              <path d="M0 0 Q6 14 18 26" stroke="#f4f1ea" strokeWidth="0.8" fill="none" />
              <g transform="translate(10 24) rotate(-12)">
                <rect x="0" y="0" width="30" height="46" rx="2" fill="#d9c3a0" />
                <circle cx="15" cy="7" r="2.2" fill="#151514" />
                <path d="M11 17h8v12l-4-3.2-4 3.2z" fill="#c8552b" />
                <text x="15" y="38" textAnchor="middle" fill="#151514" style={{ font: "600 4.6px var(--font-geist-mono)", letterSpacing: "0.1em" }}>
                  GOOD
                </text>
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* packaging — front of the box overlaps the folded hem */}
      <g data-l="box" opacity="0">
        <path d="M126 500 L474 500 L474 676 L126 676 Z" fill="url(#hd-kraft)" />
        <path d="M126 500 L474 500" stroke="#8a6440" strokeWidth="2" />
        <path d="M150 478 Q200 470 240 486 Q300 470 360 486 Q410 470 450 478 L474 500 L126 500 Z" fill="#f4f1ea" opacity="0.92" />
        <g transform="translate(300 590)">
          <path d="M-6 -30h12v22l-6-5-6 5z" fill="#c8552b" />
          <text y="12" textAnchor="middle" fill="#3b2a18" style={{ font: "700 13px var(--font-inter-tight)", letterSpacing: "-0.01em" }}>
            THE GOOD CHAPTER
          </text>
          <text y="28" textAnchor="middle" fill="#3b2a18" opacity="0.7" style={{ font: "500 7px var(--font-geist-mono)", letterSpacing: "0.2em" }}>
            MADE FOR MOMENTS WORTH REMEMBERING
          </text>
        </g>
      </g>

      {/* ── callouts ─────────────────────────────────────────── */}
      <g fill="#f4f1ea" style={{ font: "500 10px var(--font-geist-mono)", letterSpacing: "0.12em" }}>
        <g data-l="measure" stroke="#f4f1ea" strokeWidth="0.9">
          <line x1={chestL} x2={chestR} y1={chestY} y2={chestY} strokeDasharray="3 3" />
          <line x1={chestL} x2={chestL} y1={chestY - 6} y2={chestY + 6} />
          <line x1={chestR} x2={chestR} y1={chestY - 6} y2={chestY + 6} />
          <text x="300" y={chestY + 18} textAnchor="middle" stroke="none">
            A — CHEST
          </text>
          <line x1="578" x2="578" y1={hpsY} y2={hemY} strokeDasharray="3 3" />
          <line x1="572" x2="584" y1={hpsY} y2={hpsY} />
          <line x1="572" x2="584" y1={hemY} y2={hemY} />
          <text transform={`translate(592 ${(hpsY + hemY) / 2}) rotate(90)`} textAnchor="middle" stroke="none">
            B — LENGTH
          </text>
          <line
            x1={g.shoulderL[0] - 14}
            y1={g.shoulderL[1] - 8}
            x2={g.cuffOuterL[0] - 16}
            y2={g.cuffOuterL[1] - 6}
            strokeDasharray="3 3"
          />
          <text x={g.cuffOuterL[0] - 30} y={g.cuffOuterL[1] + 22} stroke="none">
            C — SLEEVE
          </text>
        </g>

        <g data-l="swatch" opacity="0">
          <line x1="410" y1="232" x2="490" y2="150" stroke="#f4f1ea" strokeWidth="0.9" />
          <circle cx="520" cy="130" r="40" fill={COLORWAYS[0]} stroke="#f4f1ea" strokeWidth="1" />
          {noise && <circle cx="520" cy="130" r="40" fill="url(#hd-knit)" />}
          <text x="520" y="192" textAnchor="middle">
            BRUSHED FLEECE
          </text>
        </g>

        <g data-l="chips" opacity="0">
          {COLORWAYS.map((c, i) => (
            <circle key={c} cx={246 + i * 36} cy="640" r="11" fill={c} stroke="#f4f1ea" strokeOpacity="0.25" />
          ))}
          <circle data-l="chip-ring" cx="246" cy="640" r="16" fill="none" stroke="#f4f1ea" strokeWidth="1.2" />
        </g>

        <g data-l="print-note" opacity="0">
          <line x1="416" y1="336" x2="470" y2="380" stroke="#f4f1ea" strokeWidth="0.9" />
          <text x="476" y="392">
            SCREEN PRINT
          </text>
          <text x="476" y="406" opacity="0.6">
            2-COLOUR · PLASTISOL
          </text>
        </g>

        <g data-l="loupe" opacity="0">
          <line x1={crx + 18} y1={cry - 14} x2="470" y2="140" stroke="#f4f1ea" strokeWidth="0.9" />
          <circle cx="510" cy="112" r="54" fill="#151514" stroke="#f4f1ea" strokeWidth="1.2" />
          <g clipPath="url(#hd-loupe)">
            <circle cx="510" cy="112" r="46" fill="#1d1d1b" />
            <circle cx="510" cy="112" r="46" fill="url(#hd-satin)" />
            <circle cx="510" cy="112" r="40" fill="none" stroke="#f4f1ea" strokeWidth="1.4" strokeDasharray="4 3" />
            <text x="510" y="131" textAnchor="middle" fill="#f4f1ea" style={{ font: "800 54px var(--font-inter-tight)", letterSpacing: 0 }}>
              G
            </text>
          </g>
          <clipPath id="hd-loupe">
            <circle cx="510" cy="112" r="53" />
          </clipPath>
          <text x="510" y="186" textAnchor="middle">
            SATIN STITCH · 1:8
          </text>
        </g>
      </g>
    </svg>
  );
}
