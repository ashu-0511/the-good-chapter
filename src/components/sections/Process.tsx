"use client";

import { useRef, useState } from "react";
import { processSteps } from "@/content/process";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Lines } from "@/components/ui/Lines";

/** Minimal line glyphs, one per step. */
const GLYPHS = [
  // brief — a folded note
  <path key="0" d="M8 6h18l6 6v22H8zM26 6v6h6M13 18h14M13 23h14M13 28h8" />,
  // design — compass
  <path key="1" d="M20 6v4M20 10l-8 24M20 10l8 24M14.5 27h11M20 10a3 3 0 1 0 0 .01" />,
  // make — needle & thread
  <path key="2" d="M30 8 12 30M28 7l4 4M12 30c-4 2-6 0-4-3s8-2 10 1 1 7-4 6" />,
  // perfect — loupe with a check
  <path key="3" d="M17 25a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM24 23l9 9M13 16l3 3 6-6" />,
  // share — a gift box with a bow
  <path key="4" d="M8 16h24v6H8zM10 22h20v12H10zM20 16v18M20 16c-3-6-9-6-8-2s8 2 8 2M20 16c3-6 9-6 8-2s-8 2-8 2" />,
];

/** Chapter 04 — the process. A rail draws as you scroll; each step lights up in turn. */
export function Process() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(-1);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const items = gsap.utils.toArray<HTMLElement>("[data-step]", root.current);
      const triggers = items.map((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 62%",
          end: "bottom 62%",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
          onLeaveBack: () => i === 0 && setActive(-1),
        }),
      );
      if (!reduced) {
        gsap.fromTo(
          "[data-rail-fill]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: "[data-steps]", start: "top 62%", end: "bottom 62%", scrub: 0.4 },
          },
        );
      } else {
        gsap.set("[data-rail-fill]", { scaleY: 1 });
      }
      return () => triggers.forEach((t) => t.kill());
    },
    { scope: root },
  );

  const shown = Math.max(0, active);

  return (
    <section
      ref={root}
      id="process"
      data-chapter="process"
      data-nav="light"
      aria-labelledby="process-title"
      className="relative bg-ivory px-gutter py-section"
    >
      <div className="grid-12 gap-y-16">
        <div className="col-span-12 md:col-span-5 md:sticky md:top-28 md:h-fit md:self-start">
          <ChapterLabel id="process" className="mb-8 text-muted md:mb-10" />
          <Lines
            id="process-title"
            lines={["From idea", "to something", "real."]}
            className="font-display text-[clamp(2.4rem,4.9vw,5.6rem)] font-semibold uppercase leading-[0.9] tracking-[-0.05em]"
          />
          <div className="mt-12 hidden items-end gap-3 md:flex" aria-hidden>
            <span className="relative block h-[clamp(5rem,9vw,9rem)] overflow-hidden font-display text-[clamp(5rem,9vw,9rem)] font-semibold leading-none tracking-[-0.06em]">
              <span
                className="block transition-transform duration-700 ease-out-expo"
                style={{ transform: `translateY(${(-shown * 100) / processSteps.length}%)` }}
              >
                {processSteps.map((s) => (
                  <span key={s.n} className="block">
                    {s.n}
                  </span>
                ))}
              </span>
            </span>
            <span className="text-label mb-3 text-muted">/ 05</span>
          </div>
        </div>

        <ol data-steps className="relative col-span-12 md:col-span-6 md:col-start-7">
          <span aria-hidden className="absolute left-[11px] top-3 bottom-3 w-px bg-ink/10 md:left-[15px]">
            <span data-rail-fill className="block h-full w-full origin-top bg-accent" />
          </span>
          {processSteps.map((s, i) => {
            const on = i <= active;
            return (
              <li
                key={s.n}
                data-step
                className={cn(
                  "relative grid grid-cols-[1fr_auto] gap-x-6 border-b border-ink/10 py-10 pl-10 transition-opacity duration-700 last:border-b-0 md:py-14 md:pl-16",
                  on ? "opacity-100" : "opacity-35",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-[3.1rem] size-[23px] rounded-full border transition-colors duration-500 md:top-[4.1rem] md:size-[31px]",
                    on ? "border-accent bg-accent" : "border-ink/20 bg-ivory",
                  )}
                >
                  <span className={cn("absolute inset-[7px] rounded-full md:inset-[10px]", on ? "bg-ivory" : "bg-ink/20")} />
                </span>
                <div>
                  <p className="text-label text-muted">Step {s.n}</p>
                  <h3 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,3.6rem)] font-semibold uppercase leading-[0.92] tracking-[-0.045em]">
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-[38ch] text-lead text-muted">{s.text}</p>
                  <p className="text-label mt-6 text-stone">{s.detail}</p>
                </div>
                <svg
                  viewBox="0 0 40 40"
                  aria-hidden
                  className={cn(
                    "mt-1 size-10 fill-none stroke-current transition-colors duration-500 md:size-14",
                    on ? "text-accent" : "text-ink/30",
                  )}
                  strokeWidth={1.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {GLYPHS[i]}
                </svg>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
