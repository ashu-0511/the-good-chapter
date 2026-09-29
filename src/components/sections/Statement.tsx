"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Marquee } from "@/components/ui/Marquee";

const LINE_1 = ["Merch", "isn't"];
const LINE_2 = ["just", "merch."];

const SUPPORT = [
  "It's the hoodie a team wears on day one.",
  "The bottle on every desk. The diary that holds next year's plans.",
  "The candle that turns a thank-you into a memory.",
  "It's how a brand becomes part of someone's story.",
];

const WORDS = ["Custom", "Personal", "Premium", "Memorable"];

/** Chapter 01 — the belief. Words drift and brighten into place as you scroll. */
export function Statement() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const words = gsap.utils.toArray<HTMLElement>("[data-word]", root.current);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "[data-statement]", start: "top 85%", end: "bottom 55%", scrub: 0.8 },
      });
      tl.from("[data-line='1']", { xPercent: -6, ease: "none" }, 0)
        .from("[data-line='2']", { xPercent: 8, ease: "none" }, 0)
        .from(
          words,
          // opacity + transform only: an animated blur re-rasterises this giant type every frame
          { opacity: 0.08, yPercent: 18, stagger: 0.12, ease: "power2.out", duration: 0.6 },
          0,
        );

      gsap.from("[data-support] > span", {
        opacity: 0,
        y: 22,
        stagger: 0.12,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-support]", start: "top 85%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="belief"
      data-chapter="belief"
      data-nav="light"
      aria-labelledby="belief-title"
      className="relative overflow-hidden bg-ivory pt-[clamp(6rem,14vw,12rem)]"
    >
      <div className="px-gutter">
        <ChapterLabel id="belief" className="text-muted" />

        <h2
          id="belief-title"
          data-statement
          className="mt-10 font-display font-semibold uppercase leading-[0.84] tracking-[-0.06em] md:mt-14"
          style={{ fontSize: "clamp(3.4rem, 14vw, 16rem)" }}
        >
          <span data-line="1" className="block whitespace-nowrap">
            {LINE_1.map((w) => (
              <span key={w}>
                <span data-word className="inline-block">
                  {w}
                </span>{" "}
              </span>
            ))}
          </span>
          <span data-line="2" className="block whitespace-nowrap text-right">
            {LINE_2.map((w, i) => (
              <span key={w}>
                <span data-word className={`inline-block ${i === 0 ? "text-[#b5afa4]" : ""}`}>
                  {w}
                </span>
                {i === 0 ? " " : ""}
              </span>
            ))}
          </span>
        </h2>

        <div className="grid-12 mt-16 md:mt-24">
          <p
            data-support
            className="col-span-12 flex flex-col text-[clamp(1.35rem,2.4vw,2.35rem)] font-medium leading-[1.18] tracking-[-0.025em] md:col-span-7 md:col-start-6"
          >
            {SUPPORT.map((s, i) => (
              <span key={s} className={i === SUPPORT.length - 1 ? "text-ink" : "text-muted"}>
                {s}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="mt-[clamp(6rem,12vw,11rem)] border-y border-ink/10 py-6 md:py-8" aria-label="Custom. Personal. Premium. Memorable.">
        <Marquee speed={38}>
          {WORDS.map((w) => (
            <span key={w} aria-hidden className="flex items-center">
              <span className="px-[0.35em] font-display text-[clamp(2.4rem,6vw,6rem)] font-semibold uppercase leading-none tracking-[-0.05em]">
                {w}
              </span>
              <span className="mx-[0.35em] inline-block size-[clamp(10px,1.2vw,18px)] rounded-full bg-accent" />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
