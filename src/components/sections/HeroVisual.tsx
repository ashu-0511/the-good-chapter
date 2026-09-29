"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTier } from "@/lib/capabilities";
import { useInView, usePageVisible, useReducedMotion } from "@/lib/hooks";
import { ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import type { HeroPointer } from "@/components/webgl/HeroScene";

const HeroScene = dynamic(() => import("@/components/webgl/HeroScene"), { ssr: false });
const ProductFallback = dynamic(() => import("@/components/webgl/ProductFallback").then((m) => m.ProductFallback), { ssr: false });

const FALLBACK = [
  { kind: "bottle", colors: { body: "#c8552b", trim: "#1d1d1b", accent: "#f4f1ea" }, className: "left-[56%] top-[13%] w-[17%] opacity-90 max-md:left-[4%] max-md:top-[13%] max-md:w-[34%]", depth: 0.4 },
  { kind: "diary", colors: { body: "#1f1f1d", trim: "#c9a66b", accent: "#c8552b" }, className: "left-[78%] top-[12%] w-[20%] max-md:left-[60%] max-md:top-[11%] max-md:w-[36%]", depth: 0.6 },
  { kind: "hoodie", colors: { body: "#1c1c1a", accent: "#c8552b" }, className: "left-[62%] top-[26%] w-[25%] max-md:left-[25%] max-md:top-[17%] max-md:w-[48%]", depth: 1 },
] as const;

/**
 * The hero's visual layer: WebGL garments when the device can afford them,
 * otherwise painted 2D garments with pointer parallax. Pointer + scroll
 * progress are shared through refs so nothing re-renders per frame.
 */
export function HeroVisual({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const tier = useTier();
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const inView = useInView(sectionRef, { rootMargin: "80px" });
  const pointer = useRef<HeroPointer>({ x: 0, y: 0 });
  const progress = useRef(0);
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const f = fallbackRef.current;
      if (f && !reduced) {
        f.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
          const d = Number(el.dataset.depth);
          el.style.transform = `translate3d(${pointer.current.x * -14 * d}px, ${pointer.current.y * 10 * d}px, 0) rotate(${pointer.current.x * 1.5 * d}deg)`;
        });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => (progress.current = self.progress),
    });
    return () => {
      window.removeEventListener("pointermove", onMove);
      st.kill();
    };
  }, [sectionRef, reduced]);

  const onReady = useCallback(() => setReady(true), []);

  if (tier === null) return null;

  if (tier === "none") {
    return (
      <div ref={fallbackRef} className="absolute inset-0" role="img" aria-label="Custom merchandise: a water bottle, a diary and a hoodie.">
        {FALLBACK.map((g) => (
          <div
            key={g.kind}
            data-depth={g.depth}
            className={cn("fade-rise absolute aspect-[4/5] transition-transform duration-700 ease-out-expo", g.className)}
          >
            <ProductFallback kind={g.kind} colors={g.colors} className="size-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="Floating custom merchandise: a water bottle, a hoodie, a diary and a candle."
      className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-out", ready ? "opacity-100" : "opacity-0")}
    >
      {fontsReady && (
        <HeroScene
          tier={tier}
          reduced={reduced}
          active={inView && visible}
          pointer={pointer}
          progress={progress}
          onReady={onReady}
        />
      )}
    </div>
  );
}
