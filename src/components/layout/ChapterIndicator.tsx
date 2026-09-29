"use client";

import { useEffect, useRef, useState } from "react";
import { chapters } from "@/content/site";
import { cn } from "@/lib/cn";

/** Fixed "Ch. 03 / 09 — The craft" marker with a page-progress hairline. */
export function ChapterIndicator() {
  const [current, setCurrent] = useState<number>(-1);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const els = chapters
      .map((c) => document.querySelector<HTMLElement>(`[data-chapter="${c.id}"]`))
      .filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = chapters.findIndex((c) => c.id === (e.target as HTMLElement).dataset.chapter);
          if (e.isIntersecting) setCurrent(idx);
          else if (e.boundingClientRect.top > 0 && idx === 0) setCurrent(-1);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const c = chapters[current];
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed bottom-6 left-[clamp(20px,4vw,64px)] z-40 hidden w-52 text-ivory mix-blend-difference transition-opacity duration-700 lg:block",
        c && c.id !== "contact" ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="text-label flex items-center gap-2 text-[10.5px]">
        <span className="tabular-nums">Ch. {c?.n ?? "01"}</span>
        <span className="opacity-50">/ 09</span>
        <span className="opacity-50">—</span>
        <span key={c?.id} className="fade-rise truncate" style={{ ["--i" as string]: -5 }}>
          {c?.title}
        </span>
      </div>
      <span className="mt-2 block h-px w-full bg-current/25">
        <span ref={bar} className="block h-full w-full origin-left scale-x-0 bg-current" />
      </span>
    </div>
  );
}
