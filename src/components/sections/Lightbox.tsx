"use client";

import Image from "next/image";
import { useEffect } from "react";
import { gallery } from "@/content/gallery";
import { media } from "@/content/media";
import { Dialog } from "@/components/ui/Dialog";
import { ArrowRight } from "@/components/ui/Icons";

export function Lightbox({
  index,
  onClose,
  onIndex,
}: {
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const n = gallery.length;
  const item = index === null ? null : gallery[index];
  const m = item ? media[item.media] : null;

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % n);
      if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, n, onIndex]);

  return (
    <Dialog
      open={index !== null}
      onClose={onClose}
      labelledBy="lightbox-title"
      className="fixed inset-0 h-dvh w-screen bg-ink/95 text-ivory"
    >
      {item && m && index !== null && (
        <div className="flex h-full flex-col px-gutter pb-6 pt-5">
          <div className="flex h-12 items-center justify-between">
            <p className="text-label tabular-nums text-mist">
              {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="text-label flex h-10 items-center gap-2 rounded-full px-3 text-[11px] ring-1 ring-ivory/20 transition-colors hover:bg-ivory hover:text-ink"
            >
              Close
              <span aria-hidden className="relative block size-3">
                <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
                <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
              </span>
            </button>
          </div>

          <figure className="relative my-4 min-h-0 flex-1">
            <Image key={m.src} src={m.src} alt={m.alt} fill sizes="92vw" className="fade-rise object-contain" style={{ ["--i" as string]: -5 }} />
          </figure>

          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 id="lightbox-title" className="font-display text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
                {item.title}
              </h2>
              <p className="text-label mt-2 text-mist">{item.tag} — placeholder photography</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => onIndex((index - 1 + n) % n)}
                className="grid size-12 place-items-center rounded-full ring-1 ring-ivory/20 transition-colors hover:bg-ivory hover:text-ink"
              >
                <ArrowRight className="size-4 rotate-180" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => onIndex((index + 1) % n)}
                className="grid size-12 place-items-center rounded-full ring-1 ring-ivory/20 transition-colors hover:bg-ivory hover:text-ink"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
