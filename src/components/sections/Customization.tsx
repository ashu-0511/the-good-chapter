"use client";

import { useRef, useState } from "react";
import { customSteps } from "@/content/customization";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { scrollToTarget } from "@/components/providers/SmoothScroll";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Lines } from "@/components/ui/Lines";
import { COLORWAYS, CREST, HoodieSVG, STAGE } from "./HoodieSVG";

const N = customSteps.length;

/** Camera framing per step: scale around a focal point that lands at stage centre. */
function frame(scale: number, fx: number, fy: number) {
  const x = STAGE.cx - scale * fx;
  const y = STAGE.cy - scale * fy;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale})`;
}
const crest = [STAGE.cx + CREST[0] * STAGE.k, STAGE.cy - CREST[1] * STAGE.k];
const FRAMES = [
  frame(0.94, 300, 320), // base
  frame(1, 300, 320), // fabric
  frame(1, 300, 320), // color
  frame(1.26, 300, 334), // print
  frame(1.72, crest[0], crest[1]), // embroidery
  frame(0.8, 300, 372), // finish
];

/**
 * Chapter 03 — the craft. A sticky stage: as you scroll, a tech-pack hoodie
 * is built up step by step — base, fabric, colour, print, embroidery, finish.
 */
export function Customization() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const q = gsap.utils.selector(root);
      const L = (name: string) => q(`[data-l='${name}']`);

      gsap.set(L("cam"), { attr: { transform: FRAMES[0] } });

      const tl = gsap.timeline({ defaults: { ease: "power2.inOut", duration: 0.6 } });
      const at = (i: number) => i - 1 + 0.2; // transition into step i

      // 1 · FABRIC
      tl.to(L("fabric"), { opacity: 1 }, at(1))
        .to(L("lines"), { opacity: 0.25 }, at(1))
        .to(L("measure"), { opacity: 0 }, at(1))
        .to(L("grid"), { opacity: 0.35 }, at(1))
        .to(L("swatch"), { opacity: 1 }, at(1) + 0.2);

      // 2 · COLOR — cycle colourways, land on burnt orange
      tl.to(L("swatch"), { opacity: 0, duration: 0.3 }, at(2))
        .to(L("chips"), { opacity: 1, duration: 0.3 }, at(2))
        .to(L("lines"), { opacity: 0 }, at(2));
      COLORWAYS.slice(1).forEach((c, i) => {
        tl.to(L("fill"), { attr: { fill: c }, duration: 0.2, ease: "none" }, at(2) + 0.1 + i * 0.2).to(
          L("chip-ring"),
          { attr: { cx: 246 + (i + 1) * 36 }, duration: 0.2 },
          at(2) + 0.1 + i * 0.2,
        );
      });

      // 3 · PRINT — squeegee wipe
      tl.to(L("chips"), { opacity: 0, duration: 0.3 }, at(3))
        .set(L("squeegee"), { opacity: 1 }, at(3) + 0.15)
        .to(L("wipe"), { attr: { width: 300 }, duration: 0.45, ease: "power1.inOut" }, at(3) + 0.15)
        .to(L("squeegee"), { attr: { x: 450 }, duration: 0.45, ease: "power1.inOut" }, at(3) + 0.15)
        .to(L("squeegee"), { opacity: 0, duration: 0.1 }, at(3) + 0.6)
        .to(L("print-note"), { opacity: 1, duration: 0.3 }, at(3) + 0.4);

      // 4 · EMBROIDERY — stitch the crest, show the loupe
      tl.to(L("print-note"), { opacity: 0, duration: 0.25 }, at(4))
        .to(L("crest-ring"), { strokeDashoffset: 0, duration: 0.4, ease: "none" }, at(4) + 0.1)
        .to(L("crest-fill"), { opacity: 1, duration: 0.25 }, at(4) + 0.35)
        .to(L("loupe"), { opacity: 1, duration: 0.3 }, at(4) + 0.3);

      // 5 · FINISH — sleeve hit, label, hang tag, into the box
      tl.to(L("loupe"), { opacity: 0, duration: 0.25 }, at(5))
        .to(L("finish"), { opacity: 1, duration: 0.3 }, at(5) + 0.1)
        .fromTo(L("tag"), { attr: { transform: "rotate(18)" } }, { attr: { transform: "rotate(0)" }, duration: 0.5, ease: "back.out(2)" }, at(5) + 0.15)
        .fromTo(L("box"), { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, at(5) + 0.25)
        .fromTo(L("box-back"), { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, at(5) + 0.25)
        .to(L("shadow"), { opacity: 0, duration: 0.3 }, at(5) + 0.25);

      // camera moves (skipped for reduced motion)
      if (!reduced) {
        FRAMES.forEach((f, i) => {
          if (i === 0) return;
          tl.to(L("cam"), { attr: { transform: f }, duration: 0.7, ease: "power3.inOut" }, at(i) - 0.05);
        });
      }
      tl.set({}, {}, N - 1); // pin total length to N-1 units

      const st = ScrollTrigger.create({
        trigger: track.current,
        start: "top top",
        end: "bottom bottom",
        animation: tl,
        scrub: reduced ? true : 0.6,
        onUpdate: (self) => {
          const idx = Math.min(N - 1, Math.round(self.progress * (N - 1)));
          setActive((a) => (a === idx ? a : idx));
          if (rail.current) rail.current.style.transform = `scaleY(${self.progress})`;
        },
      });

      // dark stage opens up from an inset card as it arrives
      if (!reduced) {
        gsap.fromTo(
          "[data-stage-frame]",
          { clipPath: "inset(64px 3vw 0px 3vw round 28px)" },
          {
            clipPath: "inset(0px 0vw 0px 0vw round 0px)",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true },
          },
        );
      }

      return () => st.kill();
    },
    { scope: root },
  );

  const jump = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollToTarget(top + (span * i) / (N - 1) + 2);
  };

  const step = customSteps[active];

  return (
    <section
      ref={root}
      id="craft"
      data-chapter="craft"
      data-nav="dark"
      aria-labelledby="craft-title"
      className="relative bg-ivory"
    >
      <div data-stage-frame className="bg-ink text-ivory">
        <div className="grid-12 gap-y-8 px-gutter pt-section">
          <div className="col-span-12 md:col-span-8">
            <ChapterLabel id="craft" className="mb-8 text-mist md:mb-10" />
            <Lines id="craft-title" lines={["Your idea.", "Our craft."]} className="text-display-l" />
          </div>
          <p className="col-span-12 max-w-[34ch] self-end text-lead text-mist md:col-span-4 md:justify-self-end" data-reveal="fade">
            Every detail is a decision — and every decision is yours. Here&apos;s how a blank becomes something with a story.
          </p>
        </div>

        <div ref={track} className="relative" style={{ height: `${N * 85}svh` }}>
          <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-gutter pb-6 pt-20 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8 lg:py-0">
            {/* step list (desktop) */}
            <ol className="relative hidden lg:col-span-3 lg:block" aria-label="Customisation steps">
              <span aria-hidden className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-ivory/15">
                <span ref={rail} className="block h-full w-full origin-top scale-y-0 bg-accent" />
              </span>
              {customSteps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-current={i === active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-baseline gap-4 py-2.5 pl-6 text-left transition-colors duration-500",
                      i === active ? "text-ivory" : "text-ivory/30 hover:text-ivory/60",
                    )}
                  >
                    <span className="text-label tabular-nums">0{i + 1}</span>
                    <span className="font-display text-[clamp(1.4rem,2.2vw,2.2rem)] font-semibold uppercase leading-none tracking-[-0.04em]">
                      {s.label}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            {/* stage */}
            <div className="relative min-h-0 flex-1 lg:col-span-6 lg:h-[86svh]">
              <HoodieSVG className="absolute inset-0 m-auto size-full max-h-full" />
            </div>

            {/* mobile step chips */}
            <div className="no-scrollbar -mx-[clamp(20px,4vw,64px)] mt-2 flex gap-2 overflow-x-auto px-[clamp(20px,4vw,64px)] lg:hidden">
              {customSteps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jump(i)}
                  className={cn(
                    "text-label shrink-0 rounded-full px-3.5 py-2 text-[10.5px] ring-1 transition-colors",
                    i === active ? "bg-ivory text-ink ring-ivory" : "text-ivory/60 ring-ivory/20",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* step detail */}
            <div className="mt-5 lg:col-span-3 lg:mt-0" aria-live="polite">
              <div key={step.id} className="fade-rise" style={{ ["--i" as string]: -5 }}>
                <p className="text-label text-mist">
                  <span className="tabular-nums">0{active + 1}</span> / 0{N} — {step.label}
                </p>
                <h3 className="mt-3 font-display text-[clamp(1.5rem,2.3vw,2.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] md:mt-5">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-mist md:mt-4">{step.text}</p>
                <ul className="mt-5 hidden flex-wrap gap-2 lg:flex">
                  {step.specs.map((sp) => (
                    <li key={sp} className="text-label rounded-full px-3 py-1.5 text-[10px] text-ivory/80 ring-1 ring-ivory/20">
                      {sp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
