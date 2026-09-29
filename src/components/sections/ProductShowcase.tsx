"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { products, type Product } from "@/content/products";
import { useTier } from "@/lib/capabilities";
import { useInView, usePageVisible, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { ChapterLabel } from "@/components/ui/Chapter";
import { Lines } from "@/components/ui/Lines";
import { ArrowRight } from "@/components/ui/Icons";
import type { PanelPointer } from "@/components/webgl/ProductView";
import { ProductDialog } from "./ProductDialog";

const ProductCanvas = dynamic(() => import("@/components/webgl/ProductCanvas"), { ssr: false });
const ProductView = dynamic(() => import("@/components/webgl/ProductView"), { ssr: false });
// 2D paintings only ever render without WebGL — keep the painter out of the main bundle
const ProductFallback = dynamic(() => import("@/components/webgl/ProductFallback").then((m) => m.ProductFallback), { ssr: false });

/** Editorial, asymmetric placement for the eight panels (desktop). */
const PLACEMENT = [
  { col: "md:col-span-7", aspect: "aspect-[4/3.3]" },
  { col: "md:col-span-5 md:mt-[18vh]", aspect: "aspect-[4/5]" },
  { col: "md:col-span-5 md:-mt-[6vh]", aspect: "aspect-[4/5]" },
  { col: "md:col-span-6 md:col-start-7 md:mt-[12vh]", aspect: "aspect-[5/4.2]" },
  { col: "md:col-span-6 md:col-start-1 md:-mt-[2vh]", aspect: "aspect-[5/4.2]" },
  { col: "md:col-span-5 md:col-start-8 md:mt-[16vh]", aspect: "aspect-[4/5]" },
  { col: "md:col-span-5 md:col-start-2 md:-mt-[4vh]", aspect: "aspect-[4/5]" },
  { col: "md:col-span-6 md:col-start-7 md:mt-[14vh]", aspect: "aspect-[5/4.2]" },
];

function Panel({
  product,
  index,
  webgl,
  fallback,
  onOpen,
}: {
  product: Product;
  index: number;
  webgl: { tier: "high" | "medium" | "low"; reduced: boolean } | null;
  /** no WebGL on this device: paint the 2D rendition instead */
  fallback: boolean;
  onOpen: (p: Product, trigger: HTMLElement) => void;
}) {
  const pointer = useRef<PanelPointer>({ x: 0, y: 0, hover: 0 });
  const visual = useRef<HTMLDivElement>(null);
  const dark = !!product.dark;
  const place = PLACEMENT[index];

  const onMove = (e: React.PointerEvent) => {
    const r = visual.current?.getBoundingClientRect();
    if (!r) return;
    pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  return (
    <article
      id={`product-${product.id}`}
      className={cn(
        "group relative scroll-mt-28 max-md:w-[82vw] max-md:shrink-0 max-md:snap-center",
        "col-span-12",
        place.col,
      )}
      onPointerEnter={(e) => e.pointerType === "mouse" && (pointer.current.hover = 1)}
      onPointerLeave={() => {
        pointer.current.hover = 0;
        pointer.current.x = 0;
        pointer.current.y = 0;
      }}
      onPointerMove={onMove}
    >
      <div
        ref={visual}
        className={cn(
          "relative overflow-hidden rounded-[3px] transition-colors duration-700 ease-out-expo",
          "bg-[var(--bd)] group-hover:bg-[var(--bdh)]",
          place.aspect,
          "max-md:aspect-[4/5]",
        )}
        style={{ ["--bd" as string]: product.backdrop, ["--bdh" as string]: product.backdropHover }}
      >
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-[0.12em] -left-[0.04em] select-none font-display text-[clamp(7rem,16vw,15rem)] font-semibold leading-none tracking-[-0.08em] transition-transform duration-1000 ease-out-expo group-hover:-translate-y-2",
            dark ? "text-ivory/[0.06]" : "text-ink/[0.055]",
          )}
        >
          {product.n}
        </span>
        <div className={cn("text-label absolute inset-x-5 top-4 flex justify-between", dark ? "text-mist" : "text-muted")}>
          <span>{product.n} — {product.name}</span>
          <span className="hidden sm:inline">{product.techniques.slice(0, 2).join(" · ")}</span>
        </div>

        {webgl ? (
          <ProductView product={product} pointer={pointer} tier={webgl.tier} reduced={webgl.reduced} index={index} />
        ) : fallback && (
          <ProductFallback
            kind={product.kind}
            colors={product.colors}
            className="absolute inset-[9%] h-[82%] w-[82%] transition-transform duration-1000 ease-out-expo group-hover:-translate-y-1 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-6" data-reveal="fade">
        <div>
          <h3 className="text-display-s transition-transform duration-700 ease-out-expo group-hover:translate-x-1.5">{product.name}</h3>
          <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-muted">{product.line}</p>
        </div>
        <button
          type="button"
          onClick={(e) => onOpen(product, e.currentTarget)}
          data-cursor="view"
          data-cursor-label="Explore"
          aria-label={`Explore ${product.name}`}
          className="text-label mt-2 flex shrink-0 items-center gap-2 whitespace-nowrap after:absolute after:inset-0 after:content-['']"
        >
          Explore
          <ArrowRight className="size-3.5 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

/** Chapter 02 — the range. */
export function ProductShowcase() {
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const tier = useTier();
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const near = useInView(section, { rootMargin: "100% 0px", once: true });
  const onScreen = useInView(section, { rootMargin: "5% 0px" });
  const [open, setOpen] = useState<Product | null>(null);
  const [slide, setSlide] = useState(0);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const webgl = tier && tier !== "none" && near ? { tier, reduced } : null;
  const glOn = !!webgl;
  // models join one per idle slot, so building the range never blocks a frame for long
  const [mounted, setMounted] = useState(0);
  useEffect(() => {
    if (!glOn || mounted >= products.length) return;
    if (typeof window.requestIdleCallback !== "function") {
      const id = window.setTimeout(() => setMounted((m) => m + 1), 48);
      return () => window.clearTimeout(id);
    }
    const id = window.requestIdleCallback(() => setMounted((m) => m + 1), { timeout: 300 });
    return () => window.cancelIdleCallback(id);
  }, [glOn, mounted]);

  // mobile rail counter
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const onScroll = () => {
      const items = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      items.forEach((it, i) => {
        if (Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid) < Math.abs(items[best].offsetLeft + items[best].offsetWidth / 2 - mid)) best = i;
      });
      setSlide(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const onOpen = useCallback((p: Product, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setOpen(p);
  }, []);
  const onClose = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      ref={section}
      id="products"
      data-chapter="products"
      data-nav="light"
      aria-labelledby="products-title"
      className="relative bg-ivory py-section"
    >
      <div className="grid-12 items-end gap-y-8 px-gutter">
        <div className="col-span-12 md:col-span-8">
          <ChapterLabel id="products" className="mb-8 text-muted md:mb-10" />
          <Lines id="products-title" lines={["Built for", "every chapter."]} className="text-display-l" />
        </div>
        <p className="col-span-12 max-w-[36ch] text-lead text-muted md:col-span-4 md:justify-self-end" data-reveal="fade">
          Hoodies to water bottles, diaries to candles, varsity jackets to curated gift boxes. Every piece designed, made and
          finished around the people who&apos;ll keep it.
        </p>
      </div>

      <div
        ref={rail}
        className="no-scrollbar mt-16 max-md:-mb-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-4 max-md:overflow-x-auto max-md:px-gutter max-md:pb-4 md:mt-24 md:grid-12 md:gap-y-24 md:px-gutter"
      >
        {products.map((p, i) => (
          <Panel key={p.id} product={p} index={i} webgl={i < mounted ? webgl : null} fallback={tier === "none"} onOpen={onOpen} />
        ))}
      </div>

      <div className="text-label mt-6 flex items-center justify-between px-gutter text-muted md:hidden" aria-hidden>
        <span className="tabular-nums">
          {String(slide + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
        </span>
        <span className="flex items-center gap-2">
          Swipe <ArrowRight className="size-3" />
        </span>
      </div>

      {webgl && <ProductCanvas tier={webgl.tier} active={onScreen && pageVisible} />}
      <ProductDialog product={open} onClose={onClose} />
    </section>
  );
}
