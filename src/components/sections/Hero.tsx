"use client";

import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { HeroVisual } from "./HeroVisual";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  return (
    <section
      ref={ref}
      id="top"
      data-nav="light"
      data-intro
      aria-labelledby="hero-title"
      className="studio-sweep relative isolate h-[100svh] min-h-[640px] overflow-hidden"
    >
      <HeroVisual sectionRef={ref} />

      <div className="pointer-events-none relative z-10 flex h-full flex-col px-gutter pb-6 pt-24 md:pb-8 md:pt-28">
        <p className="text-label fade-rise flex items-center gap-3" style={{ ["--i" as string]: -4 }}>
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          The Good Chapter<span className="-ml-2.5 align-super text-[8px]">®</span>
          <span aria-hidden className="hidden h-px w-8 bg-current opacity-30 sm:block" />
          <span className="hidden opacity-60 sm:inline">Merchandise &amp; gifting studio</span>
        </p>

        <h1
          id="hero-title"
          className="mt-auto font-display font-semibold uppercase leading-[0.84] tracking-[-0.055em] text-ink"
          style={{ fontSize: "clamp(2.6rem, min(9vw, 14svh), 10.5rem)" }}
        >
          <span className="line-mask" style={{ ["--i" as string]: 0 }}>
            <span>Worn. Sipped.</span>
          </span>
          <span className="line-mask" style={{ ["--i" as string]: 1 }}>
            <span>Written. Lit.</span>
          </span>
          <span className="line-mask" style={{ ["--i" as string]: 2 }}>
            <span>
              Remembered<span className="text-accent">.</span>
            </span>
          </span>
        </h1>

        <div className="mt-7 flex flex-col gap-6 md:mt-9 md:gap-7">
          <p className="fade-rise max-w-[40ch] text-lead text-muted" style={{ ["--i" as string]: 1 }}>
            Apparel, bottles, diaries, candles and gift boxes — made around your people, so every chapter becomes something
            worth keeping.
          </p>
          <div className="fade-rise pointer-events-auto flex flex-wrap items-center gap-3" style={{ ["--i" as string]: 2 }}>
            <MagneticButton href="#contact" size="lg" className="max-sm:h-12 max-sm:px-5 max-sm:text-[12px]">
              Start your chapter
            </MagneticButton>
            <MagneticButton
              href="#work"
              size="lg"
              variant="secondary"
              arrow="none"
              cursor="hover"
              className="max-sm:h-12 max-sm:px-5 max-sm:text-[12px]"
            >
              <span className="sm:hidden">Our work</span>
              <span className="max-sm:hidden">Explore our work</span>
            </MagneticButton>
          </div>
        </div>

        <div className="text-label fade-rise mt-7 flex items-center justify-between border-t border-ink/10 pt-4 text-muted md:mt-9" style={{ ["--i" as string]: 3 }}>
          <span className="flex items-center gap-3">
            <span className="relative block h-5 w-px overflow-hidden bg-ink/10" aria-hidden>
              <span className="scroll-cue absolute inset-0 bg-ink" />
            </span>
            Scroll
          </span>
          <span className="hidden sm:inline">Fig. 01 — Four good things, waiting for a story.</span>
          <span className="sm:hidden">Fig. 01</span>
        </div>
      </div>
    </section>
  );
}
