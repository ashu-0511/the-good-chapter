"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { gallery } from "@/content/gallery";
import { media } from "@/content/media";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Lines } from "@/components/ui/Lines";
import { PlaceholderTag } from "@/components/ui/Placeholder";
import { Lightbox } from "./Lightbox";

/**
 * Editorial placement: a loose 12-column composition on desktop,
 * a dense two-column stack on mobile.
 */
const PLACE = [
  { d: "md:col-span-4 md:col-start-1", m: "col-span-1", a: "aspect-[4/5]" },
  { d: "md:col-span-7 md:col-start-6 md:mt-[12vh]", m: "col-span-2", a: "aspect-[3/2]" },
  { d: "md:col-span-4 md:col-start-2 md:-mt-[4vh]", m: "col-span-1", a: "aspect-[4/5]" },
  { d: "md:col-span-5 md:col-start-7 md:mt-[4vh]", m: "col-span-2", a: "aspect-[5/4]" },
  { d: "md:col-span-4 md:col-start-1", m: "col-span-1", a: "aspect-[3/4]" },
  { d: "md:col-span-6 md:col-start-6 md:mt-[10vh]", m: "col-span-2", a: "aspect-[7/5]" },
  { d: "md:col-span-5 md:col-start-2 md:-mt-[6vh]", m: "col-span-1", a: "aspect-[4/3] max-md:aspect-[4/5]" },
  { d: "md:col-span-4 md:col-start-8", m: "col-span-2", a: "aspect-[4/5] max-md:aspect-[3/2]" },
  { d: "md:col-span-6 md:col-start-4 md:mt-[2vh]", m: "col-span-2", a: "aspect-[16/10]" },
];

/** Chapter 05 — the work. */
export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils.toArray<HTMLElement>("[data-parallax]", root.current).forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -7 },
          { yPercent: 7, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: root },
  );

  const close = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      ref={root}
      id="work"
      data-chapter="work"
      data-nav="light"
      aria-labelledby="work-title"
      className="relative bg-paper px-gutter py-section"
    >
      <div className="grid-12 items-end gap-y-8">
        <div className="col-span-12 md:col-span-8">
          <ChapterLabel id="work" className="mb-8 text-muted md:mb-10" />
          <Lines id="work-title" lines={["Made for", "good moments."]} className="text-display-l" />
        </div>
        <div className="col-span-12 md:col-span-4 md:justify-self-end" data-reveal="fade">
          <p className="max-w-[34ch] text-lead text-muted">
            Campus drops, launch-day hoodies, welcome kits, festive gift boxes — a few of the moments we get to be part of.
          </p>
          <PlaceholderTag className="mt-4" />
        </div>
      </div>

      <ul className="mt-16 grid grid-flow-dense grid-cols-2 gap-x-3 gap-y-10 md:mt-24 md:grid-cols-12 md:gap-x-[clamp(12px,2vw,32px)] md:gap-y-14">
        {gallery.map((g, i) => {
          const m = media[g.media];
          const p = PLACE[i];
          return (
            <li key={g.media} className={cn(p.m, p.d)}>
              <button
                type="button"
                onClick={(e) => {
                  lastTrigger.current = e.currentTarget;
                  setOpen(i);
                }}
                data-cursor="view"
                aria-label={`View ${g.title}`}
                className="group block w-full text-left"
              >
                <span data-reveal="clip" className={cn("relative block overflow-hidden rounded-[3px] bg-beige", p.a)}>
                  <span data-parallax className="absolute -inset-y-[8%] inset-x-0 block">
                    <Image
                      src={m.src}
                      alt={m.alt}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.045]"
                      style={{ objectPosition: m.focus }}
                    />
                  </span>
                  <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/10" />
                </span>
                <span className="mt-3.5 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-4">
                  <span className="text-[15px] font-medium tracking-[-0.01em] transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                    {g.title}
                  </span>
                  <span className="text-label text-muted md:text-right">{g.tag}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Lightbox index={open} onClose={close} onIndex={setOpen} />
    </section>
  );
}
