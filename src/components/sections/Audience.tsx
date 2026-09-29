"use client";

import Image from "next/image";
import { useState } from "react";
import { audiences } from "@/content/audiences";
import { media } from "@/content/media";
import { mailto, briefTemplate } from "@/lib/mailto";
import { cn } from "@/lib/cn";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Lines } from "@/components/ui/Lines";
import { ArrowUpRight } from "@/components/ui/Icons";

/**
 * Chapter 06 — the people. Desktop: a horizontal accordion of four full-bleed
 * images that opens toward whatever you hover or focus. Mobile: stacked cards
 * that pile up as you scroll.
 */
export function Audience() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      id="people"
      data-chapter="people"
      data-nav="dark"
      aria-labelledby="people-title"
      className="relative bg-ink px-gutter py-section text-ivory"
    >
      <div className="grid-12 items-end gap-y-8">
        <div className="col-span-12 md:col-span-8">
          <ChapterLabel id="people" className="mb-8 text-mist md:mb-10" />
          <Lines id="people-title" lines={["Who we", "make for."]} className="text-display-l" />
        </div>
        <p className="col-span-12 max-w-[32ch] text-lead text-mist md:col-span-4 md:justify-self-end" data-reveal="fade">
          Different people, same instinct: make something worth keeping.
        </p>
      </div>

      <ul
        className="mt-16 flex flex-col gap-3 md:mt-24 xl:h-[78svh] xl:min-h-[560px] xl:flex-row"
        onPointerLeave={() => setHovered(null)}
      >
        {audiences.map((a, i) => {
          const m = media[a.media];
          const open = hovered === i;
          return (
            <li
              key={a.id}
              onPointerEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              className={cn(
                "group relative overflow-hidden rounded-[3px] bg-graphite max-xl:sticky max-xl:top-[var(--stack)] max-xl:h-[68svh]",
                "xl:min-w-0 xl:transition-[flex-grow] xl:duration-[900ms] xl:ease-out-expo",
                open ? "xl:grow-[2.6]" : "xl:grow",
              )}
              style={{ ["--stack" as string]: `calc(12svh + ${i * 14}px)` }}
            >
              <div className="absolute inset-0">
                <Image
                  src={m.src}
                  alt={m.alt}
                  fill
                  sizes="(min-width: 1280px) 50vw, 100vw"
                  className="object-cover opacity-80 transition-[transform,opacity] duration-[1400ms] ease-out-expo group-hover:scale-[1.04] group-hover:opacity-100"
                  style={{ objectPosition: m.focus }}
                />
              </div>
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/10" />

              <div className="relative flex h-full flex-col justify-between p-5 md:p-7">
                <p className="text-label flex justify-between text-ivory/70">
                  <span>0{i + 1}</span>
                  <span className="hidden sm:inline">{a.name}</span>
                </p>
                <div>
                  <h3 className="font-display text-[clamp(2.2rem,3.1vw,4.4rem)] max-xl:text-[clamp(2.4rem,7vw,4.4rem)] font-semibold uppercase leading-[0.88] tracking-[-0.05em]">
                    {a.name}
                  </h3>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-700 ease-out-expo max-xl:grid-rows-[1fr] max-xl:opacity-100",
                      open ? "xl:grid-rows-[1fr] xl:opacity-100" : "xl:grid-rows-[0fr] xl:opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-3 max-w-[28ch] text-[clamp(1.05rem,1.4vw,1.35rem)] leading-snug text-ivory/85">{a.line}</p>
                      <a
                        href={mailto({ subject: a.subject, body: briefTemplate })}
                        data-cursor="open"
                        className="text-label mt-5 inline-flex items-center gap-2 border-b border-ivory/40 pb-1 text-ivory transition-colors hover:border-accent hover:text-accent"
                      >
                        {a.cta}
                        <ArrowUpRight className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
