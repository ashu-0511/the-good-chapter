"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { onCursor, type CursorState } from "./cursorBus";

const INTERACTIVE = "a, button, [role='button'], summary, label, [data-cursor]";
const SIZE = 64; // px, the ball's full size (scaled down for the dot)

const SCALE = { dot: 8 / SIZE, hover: 34 / SIZE, view: 1, open: 1 };

/**
 * Desktop-only custom cursor: a small difference-blend dot that grows over
 * interactive elements and shows VIEW / OPEN on images and CTAs.
 * Touch devices and reduced-motion users keep the native cursor.
 */
export function Cursor() {
  const ball = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches || !ball.current || !label.current) return;

    const el = ball.current;
    const text = label.current;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const xTo = gsap.quickTo(el, "x", { duration: 0.32, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.32, ease: "power3.out" });
    let visible = false;
    let domState: CursorState = null;
    let busState: CursorState = null;

    const apply = () => {
      const s = busState ?? domState;
      const variant = s?.variant ?? "dot";
      const big = variant === "view" || variant === "open";
      el.dataset.variant = variant;
      text.textContent = big ? (s?.label ?? (variant === "view" ? "View" : "Open")) : "";
      gsap.to(el, { scale: SCALE[variant as keyof typeof SCALE], duration: 0.45, ease: "expo.out", overwrite: "auto" });
      gsap.to(text, { opacity: big ? 1 : 0, duration: big ? 0.3 : 0.12, delay: big ? 0.08 : 0, overwrite: "auto" });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      xTo(e.clientX);
      yTo(e.clientY);
      if (!visible) {
        visible = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { opacity: 1, duration: 0.3 });
      }
    };

    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
      let next: CursorState = null;
      if (target) {
        const v = target.dataset.cursor;
        if (v === "view" || v === "open") next = { variant: v, label: target.dataset.cursorLabel };
        else if (v !== "none") next = { variant: "hover" };
      }
      if (next?.variant !== domState?.variant || next?.label !== domState?.label) {
        domState = next;
        apply();
      }
    };

    const onLeave = () => {
      visible = false;
      gsap.to(el, { opacity: 0, duration: 0.2 });
    };
    const onDown = () => gsap.to(el, { scale: `*=0.82`, duration: 0.2 });
    const onUp = () => apply();

    const off = onCursor((s) => {
      busState = s;
      apply();
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    apply();

    return () => {
      root.classList.remove("has-cursor");
      off();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div
      ref={ball}
      aria-hidden
      data-variant="dot"
      className="pointer-events-none fixed left-0 top-0 z-[120] flex items-center justify-center rounded-full opacity-0 will-change-transform data-[variant=dot]:bg-ivory data-[variant=dot]:mix-blend-difference data-[variant=hover]:bg-ivory data-[variant=hover]:mix-blend-difference data-[variant=open]:bg-accent-deep data-[variant=view]:bg-accent-deep"
      style={{ width: SIZE, height: SIZE, marginLeft: -SIZE / 2, marginTop: -SIZE / 2, transform: `scale(${SCALE.dot})` }}
    >
      <span ref={label} className="text-label text-[10px] tracking-[0.14em] text-ivory opacity-0" />
    </div>
  );
}
