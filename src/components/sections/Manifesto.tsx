"use client";

import Image from "next/image";
import { useRef } from "react";
import { media } from "@/content/media";
import { qualities } from "@/content/qualities";
import { gsap, useGSAP } from "@/lib/gsap";
import { ChapterLabel } from "@/components/ui/Chapter";

const HEAD = "Good merch does more than carry a logo.";
const CARRIES = ["It carries belonging.", "It carries identity.", "It carries the memory of a moment."];

/** Chapter 08 — the why. The manifesto lights up word by word as you read. */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        "[data-mw]",
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: "[data-manifesto]", start: "top 78%", end: "bottom 45%", scrub: 0.5 },
        },
      );
      gsap.utils.toArray<HTMLElement>("[data-carry]", root.current).forEach((el, i) => {
        gsap.from(el, {
          xPercent: i % 2 ? 6 : -6,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 95%", end: "top 60%", scrub: 0.6 },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="about"
      data-chapter="about"
      data-nav="light"
      aria-labelledby="about-title"
      className="relative bg-ivory px-gutter py-section"
    >
      <ChapterLabel id="about" className="mb-10 text-muted md:mb-14" />
      <h2
        id="about-title"
        data-manifesto
        className="max-w-[16ch] font-display text-[clamp(2.8rem,7.4vw,8.6rem)] font-semibold uppercase leading-[0.88] tracking-[-0.055em]"
      >
        {HEAD.split(" ").map((w, i) => (
          <span key={i}>
            <span data-mw className="inline-block">
              {w}
            </span>{" "}
          </span>
        ))}
      </h2>

      <div className="mt-20 space-y-2 md:mt-28">
        {CARRIES.map((c, i) => (
          <p
            key={c}
            data-carry
            className={`font-display text-[clamp(1.8rem,4.2vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.045em] ${
              i === 1 ? "md:pl-[16%]" : i === 2 ? "md:pl-[32%]" : ""
            }`}
          >
            <span className="text-stone">It carries </span>
            {c.slice("It carries ".length)}
          </p>
        ))}
      </div>

      <p className="mt-20 flex items-center gap-4 text-lead md:mt-28" data-reveal="fade">
        <span aria-hidden className="h-px w-12 bg-accent" />
        That&apos;s why we obsess over the details.
      </p>

      <ul className="mt-14 grid grid-cols-2 gap-x-[clamp(12px,2vw,32px)] gap-y-12 lg:grid-cols-4">
        {qualities.map((q, i) => {
          const m = media[q.media];
          return (
            <li key={q.title} className={i % 2 ? "lg:mt-16" : ""}>
              <div data-reveal="clip" className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-beige">
                <Image
                  src={m.src}
                  alt={m.alt}
                  fill
                  sizes="(min-width: 1024px) 24vw, 48vw"
                  className="object-cover"
                  style={{ objectPosition: m.focus }}
                />
              </div>
              <div className="mt-5 border-t border-ink/15 pt-4" data-reveal="fade">
                <p className="text-label text-muted">{q.n}</p>
                <h3 className="mt-2 font-display text-[clamp(1.6rem,2.4vw,2.3rem)] font-semibold uppercase tracking-[-0.04em]">
                  {q.title}
                </h3>
                <p className="mt-1.5 text-[15px] text-muted">{q.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
