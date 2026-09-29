"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { useTier } from "@/lib/capabilities";
import { useInView, usePageVisible, useReducedMotion } from "@/lib/hooks";
import { startChapterHref, talkHref } from "@/lib/mailto";
import { cn } from "@/lib/cn";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Lines } from "@/components/ui/Lines";
import { MagneticButton } from "@/components/ui/MagneticButton";
import type { FabricPointer } from "@/components/webgl/FabricSurface";

const FabricSurface = dynamic(() => import("@/components/webgl/FabricSurface"), { ssr: false });

function CopyEmail() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(site.email);
          setCopied(true);
          setTimeout(() => setCopied(false), 2200);
        } catch {
          window.location.href = `mailto:${site.email}`;
        }
      }}
      className="group inline-flex items-center gap-2 text-ivory"
      aria-live="polite"
    >
      <span className="border-b border-ivory/30 pb-0.5 transition-colors group-hover:border-accent">{site.email}</span>
      <span className="text-mist transition-colors group-hover:text-ivory">{copied ? "Copied ✓" : "Copy"}</span>
    </button>
  );
}

/** Chapter 09 — yours. The single destination every CTA on the page leads to. */
export function CTA() {
  const ref = useRef<HTMLElement>(null);
  const tier = useTier();
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const near = useInView(ref, { rootMargin: "100% 0px", once: true });
  const inView = useInView(ref);
  const pointer = useRef<FabricPointer>({ x: 0.7, y: 0.6, inside: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const inside = e.clientY >= r.top && e.clientY <= r.bottom && e.pointerType === "mouse";
      pointer.current.inside = inside;
      pointer.current.x = (e.clientX - r.left) / r.width;
      pointer.current.y = 1 - (e.clientY - r.top) / r.height;
    };
    const onLeave = () => (pointer.current.inside = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const gl = tier && tier !== "none" && near;

  return (
    <section
      ref={ref}
      id="contact"
      data-chapter="contact"
      data-nav="dark"
      aria-labelledby="contact-title"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink px-gutter pb-10 pt-32 text-ivory md:pb-14"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 72% 38%, rgba(200,85,43,0.22), transparent 70%), radial-gradient(90% 80% at 30% 100%, #1f1e1c, #151514 70%)",
          }}
        />
        {gl && (
          <div className={cn("absolute inset-0 transition-opacity duration-[1600ms]", inView ? "opacity-100" : "opacity-0")}>
            <FabricSurface tier={tier} reduced={reduced} active={inView && visible} pointer={pointer} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/70 to-transparent" />
      </div>

      <ChapterLabel id="contact" className="text-mist" />
      <Lines
        id="contact-title"
        lines={["Ready to", "start your", <>chapter<span className="text-accent">?</span></>]}
        className="text-display-xl mt-8 md:mt-10"
      />

      <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
        <p className="max-w-[40ch] text-lead text-ivory/80" data-reveal="fade">
          Tell us what you&apos;re building, celebrating or becoming. We&apos;ll help you make it something worth keeping.
        </p>
        <div className="flex flex-wrap gap-3" data-reveal="fade">
          <MagneticButton href={startChapterHref()} tone="dark" size="lg">
            Start your chapter
          </MagneticButton>
          <MagneticButton href={talkHref()} tone="dark" variant="secondary" size="lg" arrow="up-right" cursor="hover">
            Talk to us
          </MagneticButton>
        </div>
      </div>

      <div className="text-label mt-14 flex flex-col gap-3 border-t border-ivory/15 pt-6 text-mist md:mt-20 md:flex-row md:items-center md:justify-between">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 normal-case tracking-normal text-[14px]">
          Or write to us — <CopyEmail />
        </span>
        <span>Briefs, questions, half-formed ideas — all welcome.</span>
      </div>
    </section>
  );
}
