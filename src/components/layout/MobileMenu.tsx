"use client";

import { nav, site } from "@/content/site";
import { scrollToTarget } from "@/components/providers/SmoothScroll";
import { Dialog } from "@/components/ui/Dialog";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Wordmark } from "./Navbar";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    // wait a frame for the dialog to release the scroll lock
    requestAnimationFrame(() => scrollToTarget(href));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="menu-title"
      className="pointer-events-auto fixed inset-0 h-dvh w-screen bg-ink text-ivory"
    >
      <div className="flex h-full flex-col px-[clamp(20px,4vw,64px)] pb-[max(2rem,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex h-14 items-center justify-between">
          <Wordmark />
          <h2 id="menu-title" className="sr-only">
            Menu
          </h2>
          <button type="button" onClick={onClose} className="text-label flex h-10 items-center gap-2 px-3 text-[11px]">
            Close
            <span aria-hidden className="relative block size-3.5">
              <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <nav aria-label="Mobile" className="mt-[8vh]">
          <ul className="space-y-1">
            {nav.map((item, i) => (
              <li key={item.href} className="fade-rise border-b border-ivory/10" style={{ ["--i" as string]: i - 4 }}>
                <a href={item.href} onClick={go(item.href)} className="flex items-baseline gap-4 py-3">
                  <span className="text-label text-mist">0{i + 1}</span>
                  <span className="text-display-m">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-8">
          <MagneticButton href="#contact" tone="dark" size="lg" onClick={go("#contact")} className="w-full">
            Start your chapter
          </MagneticButton>
          <div className="flex items-end justify-between gap-6 text-sm text-mist">
            <a href={`mailto:${site.email}`} className="underline-offset-4 hover:underline">
              {site.email}
            </a>
            <div className="flex gap-5">
              <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href={site.socials.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
