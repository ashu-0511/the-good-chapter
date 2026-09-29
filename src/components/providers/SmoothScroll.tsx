"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

let lenis: Lenis | null = null;

/** Offset so anchored sections don't hide under the floating nav. */
const ANCHOR_OFFSET = 0;

export function scrollToTarget(target: string | HTMLElement | number, opts: { immediate?: boolean } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { offset: ANCHOR_OFFSET, duration: 1.4, immediate: opts.immediate });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: opts.immediate ? "auto" : "smooth" });
    return;
  }
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView({ behavior: opts.immediate ? "auto" : "smooth", block: "start" });
}

/** Pause smooth scrolling while a modal is open. */
export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in
 * lock-step. Disabled entirely for prefers-reduced-motion (native scroll).
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let tick: ((time: number) => void) | null = null;

    const start = () => {
      if (reduce.matches || lenis) return;
      lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1,
        anchors: { offset: ANCHOR_OFFSET, duration: 1.4 },
        autoRaf: false,
      });
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    };

    const stop = () => {
      if (tick) gsap.ticker.remove(tick);
      tick = null;
      lenis?.destroy();
      lenis = null;
    };

    start();
    const onChange = () => (reduce.matches ? stop() : start());
    reduce.addEventListener("change", onChange);
    return () => {
      reduce.removeEventListener("change", onChange);
      stop();
    };
  }, []);

  return null;
}
