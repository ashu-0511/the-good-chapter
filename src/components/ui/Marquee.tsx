"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * Endless marquee whose speed (and direction) responds to scroll velocity,
 * then eases back to a slow drift. Static for reduced motion.
 */
export function Marquee({
  children,
  speed = 40,
  className,
  reverse = false,
}: {
  children: ReactNode;
  /** seconds per loop */
  speed?: number;
  className?: string;
  reverse?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const track = root.current?.querySelector<HTMLElement>("[data-track]");
      if (!track) return;
      const tween = reverse
        ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: speed, ease: "none", repeat: -1 })
        : gsap.to(track, { xPercent: -50, duration: speed, ease: "none", repeat: -1 });
      // headroom so negative timeScale (scrolling up) can play backwards indefinitely
      tween.totalTime(speed * 500);
      let dir = 1;
      let decay: gsap.core.Tween | null = null;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity();
          if (Math.abs(v) < 5) return;
          dir = v < 0 ? -1 : 1;
          const boost = gsap.utils.clamp(0, 6, Math.abs(v) / 350);
          decay?.kill();
          tween.timeScale(dir * (1 + boost));
          decay = gsap.to(tween, { timeScale: dir, duration: 1.4, ease: "power2.out" });
        },
        onToggle: (self) => void tween.paused(!self.isActive),
      });
      return () => {
        st.kill();
        tween.kill();
        decay?.kill();
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={cn("overflow-hidden", className)}>
      <div data-track className="flex w-max will-change-transform">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
