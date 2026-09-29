"use client";

import { useEffect, useRef } from "react";
import { paintFallback, type GarmentColors } from "./garments/painter";
import { paintGiftFallback } from "./gifts/painter";
import { isGift, type ProductKind } from "./models";
import { cn } from "@/lib/cn";

/**
 * 2D rendition of a product (same pattern / measurements + painter as the
 * WebGL model, with baked shading). Used when WebGL is unavailable or lost,
 * and in the product dialog.
 */
export function ProductFallback({
  kind,
  colors,
  className,
  label,
}: {
  kind: ProductKind;
  colors: GarmentColors;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colorKey = `${colors.body}|${colors.trim}|${colors.accent}`;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (isGift(kind)) paintGiftFallback(canvas, kind, colors, dpr);
      else paintFallback(canvas, kind, colors, dpr);
    };
    document.fonts.ready.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, colorKey]);

  return <canvas ref={ref} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("block", className)} />;
}
