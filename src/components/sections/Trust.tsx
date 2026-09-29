"use client";

import { useRef } from "react";
import { clientLogos, clientTypes, stats, testimonials } from "@/content/proof";
import { gsap, useGSAP } from "@/lib/gsap";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Lines } from "@/components/ui/Lines";
import { Marquee } from "@/components/ui/Marquee";
import { PlaceholderTag } from "@/components/ui/Placeholder";

/** Chapter 07 — the proof. All figures and quotes live in content/proof.ts. */
export function Trust() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils.toArray<HTMLElement>("[data-count]", root.current).forEach((el) => {
        const to = Number(el.dataset.count);
        const obj = { v: 0 };
        el.textContent = "0";
        gsap.to(obj, {
          v: to,
          duration: 2,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="proof"
      data-chapter="proof"
      data-nav="light"
      aria-labelledby="proof-title"
      className="relative bg-beige py-section"
    >
      <div className="px-gutter">
        <ChapterLabel id="proof" className="mb-8 text-muted md:mb-10" />
        <Lines id="proof-title" lines={["Made to be", "remembered."]} className="text-display-l" />

        <dl className="mt-16 grid grid-cols-2 border-t border-ink/15 md:mt-24 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              data-reveal="fade"
              className="border-b border-ink/15 py-8 pr-4 max-lg:odd:border-r max-lg:even:pl-5 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <dt className="text-label flex items-center gap-2 text-muted">
                <span>0{i + 1}</span>
                <span>{s.label}</span>
              </dt>
              <dd className="mt-6 flex items-baseline font-display text-[clamp(3.4rem,7.4vw,7.5rem)] font-semibold leading-none tracking-[-0.06em]">
                <span data-count={s.value} className="tabular-nums">
                  {s.value}
                </span>
                <span className="text-accent">{s.suffix}</span>
              </dd>
              <dd className="mt-4">
                <PlaceholderTag show={s.placeholder} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-20 md:mt-28">
        <p className="text-label mb-6 px-gutter text-muted">
          {clientLogos.length ? "In good company" : "Made for"}
        </p>
        <div className="border-y border-ink/15 py-5" aria-label={clientLogos.length ? "Clients" : `Made for ${clientTypes.join(", ")}`}>
          <Marquee speed={46} reverse>
            {clientLogos.length
              ? clientLogos.map((l) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={l.name} src={l.src} alt={l.name} className="mx-10 h-8 w-auto opacity-70 grayscale" />
                ))
              : clientTypes.map((t) => (
                  <span key={t} aria-hidden className="flex items-center">
                    <span className="px-8 font-display text-[clamp(1.6rem,3vw,2.8rem)] font-semibold uppercase tracking-[-0.04em] text-ink/80">
                      {t}
                    </span>
                    <span className="text-accent">✦</span>
                  </span>
                ))}
          </Marquee>
        </div>
      </div>

      <div className="mt-20 grid gap-4 px-gutter md:mt-28 md:grid-cols-3 md:gap-6">
        {testimonials.map((t, i) => (
          <figure
            key={i}
            data-reveal="fade"
            className="flex flex-col justify-between rounded-[3px] bg-ivory/70 p-7 ring-1 ring-ink/[0.06] md:min-h-[340px] md:p-9"
          >
            <blockquote>
              <span aria-hidden className="block font-display text-6xl leading-[0.6] text-accent">
                &ldquo;
              </span>
              <p className="mt-4 text-[clamp(1.15rem,1.5vw,1.4rem)] font-medium leading-[1.35] tracking-[-0.015em]">{t.quote}</p>
            </blockquote>
            <figcaption className="mt-10 flex items-end justify-between gap-4">
              <span>
                <span className="block text-[15px] font-medium">{t.name}</span>
                <span className="text-label mt-1 block text-muted">{t.role}</span>
              </span>
              <PlaceholderTag show={t.placeholder} />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
