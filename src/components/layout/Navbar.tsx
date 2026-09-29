"use client";

import { useEffect, useState } from "react";
import { nav } from "@/content/site";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { MobileMenu } from "./MobileMenu";

export function Wordmark({ className }: { className?: string }) {
  return <Logo label="The Good Chapter" className={cn("block h-9 w-auto", className)} />;
}

/**
 * Floating nav: transparent over the hero, then a soft blurred pill.
 * It reads the `data-nav` theme of whatever section sits beneath it.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-nav]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setTheme((e.target as HTMLElement).dataset.nav as "light" | "dark");
      },
      { rootMargin: "-32px 0px -94% 0px" },
    );
    sections.forEach((s) => io.observe(s));

    const targets = nav.map((n) => document.querySelector<HTMLElement>(n.href)).filter(Boolean) as HTMLElement[];
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
          else if (e.boundingClientRect.top > 0) setActive((a) => (a === `#${e.target.id}` ? null : a));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => spy.observe(t));
    return () => {
      io.disconnect();
      spy.disconnect();
    };
  }, []);

  const dark = theme === "dark";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex h-14 max-w-[1680px] items-center justify-between rounded-full transition-[margin,padding,background-color,color,box-shadow] duration-700 ease-out-expo",
          scrolled ? "mx-3 mt-3 pl-5 pr-2 md:mx-5 md:mt-4" : "mt-3 px-[clamp(20px,4vw,64px)] md:mt-5",
          scrolled && !dark && "bg-ivory/85 shadow-[0_10px_40px_-18px_rgba(21,21,20,0.35)] ring-1 ring-ink/[0.07] backdrop-blur-md",
          scrolled && dark && "bg-graphite/75 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.6)] ring-1 ring-ivory/10 backdrop-blur-md",
          dark ? "text-ivory" : "text-ink",
        )}
      >
        <a href="#top" aria-label="The Good Chapter — back to top" data-cursor="hover">
          <Wordmark />
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {nav.map((item) => {
              const on = active === item.href;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={on ? "location" : undefined}
                    className="group relative flex items-center gap-2 py-2 text-[13px] font-medium tracking-[-0.005em]"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1 rounded-full bg-accent transition-all duration-500 ease-out-expo",
                        on ? "scale-100 opacity-100" : "scale-0 opacity-0",
                      )}
                    />
                    {item.label}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-1 h-px origin-right scale-x-0 bg-current transition-transform duration-500 ease-out-expo group-hover:origin-left group-hover:scale-x-100"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <MagneticButton href="#contact" size="sm" tone={dark ? "dark" : "light"}>
              Start your chapter
            </MagneticButton>
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="text-label flex h-10 items-center gap-2.5 rounded-full px-3 text-[11px] lg:hidden"
          >
            Menu
            <span aria-hidden className="flex w-4 flex-col gap-[5px]">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-2/3 bg-current" />
            </span>
          </button>
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
