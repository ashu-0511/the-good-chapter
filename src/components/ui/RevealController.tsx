"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * One controller for every scroll reveal on the page:
 *   [data-reveal="lines"] — masked lines rise into place
 *   [data-reveal="fade"]  — soft fade + rise
 *   [data-reveal="clip"]  — image frames unveil from the bottom
 * Hidden states are only applied from JS, so no-JS visitors see everything.
 */
export function RevealController() {
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lines = gsap.utils.toArray<HTMLElement>("[data-reveal='lines']:not([data-intro] *)");
    const fades = gsap.utils.toArray<HTMLElement>("[data-reveal='fade']");
    const clips = gsap.utils.toArray<HTMLElement>("[data-reveal='clip']");

    lines.forEach((el) => gsap.set(el.querySelectorAll(".line-mask > span"), { yPercent: 112, rotate: 2.5 }));
    if (fades.length) gsap.set(fades, { autoAlpha: 0, y: 26 });
    if (clips.length) gsap.set(clips, { clipPath: "inset(100% 0% 0% 0%)" });

    const triggers: ScrollTrigger[] = [];

    lines.forEach((el) =>
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.to(el.querySelectorAll(".line-mask > span"), {
              yPercent: 0,
              rotate: 0,
              duration: 1.25,
              stagger: 0.09,
              ease: "expo.out",
            }),
        }),
      ),
    );

    if (fades.length)
      triggers.push(
        ...ScrollTrigger.batch(fades, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: "expo.out" }),
        }),
      );
    if (clips.length)
      triggers.push(
        ...ScrollTrigger.batch(clips, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, stagger: 0.1, ease: "expo.inOut" }),
        }),
      );

    // Recalculate once fonts and late layout have settled.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => triggers.forEach((t) => t.kill());
  });

  return null;
}
