import { ImageResponse } from "next/og";
import { LOGO, LOGO_CLAY } from "@/components/ui/Logo";
import { site } from "@/content/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

/** Inter Tight for the card, fetched at build time; falls back to the default face offline. */
async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter+Tight:wght@${weight}`).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const semibold = await loadFont(600);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f1ea",
          color: "#151514",
          padding: "64px 72px",
          fontFamily: semibold ? "Inter Tight" : "sans-serif",
        }}
      >
        <svg width="280" height={(280 * LOGO.height) / LOGO.width} viewBox={`0 0 ${LOGO.width} ${LOGO.height}`}>
          <path d={LOGO.type} fill="#151514" fillRule="evenodd" />
          <path d={LOGO.good} fill={LOGO_CLAY} fillRule="evenodd" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 112, lineHeight: 0.88, letterSpacing: "-0.055em" }}>
          <span>WORN. SIPPED.</span>
          <span>WRITTEN. LIT.</span>
          <span style={{ display: "flex" }}>
            REMEMBERED<span style={{ color: "#c8552b" }}>.</span>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#5f5d58" }}>
          <span>Custom merchandise &amp; corporate gifting.</span>
          <span>thegoodchapter.in</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: semibold ? [{ name: "Inter Tight", data: semibold, weight: 600, style: "normal" }] : undefined,
    },
  );
}
