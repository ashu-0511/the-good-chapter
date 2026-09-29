"use client";

import { useSyncExternalStore } from "react";

/**
 * Quality tier for WebGL work.
 *  high   — desktop-class GPU, fine pointer
 *  medium — tablets / modest laptops / big phones
 *  low    — phones & constrained devices: fewer objects, lower DPR
 *  none   — no WebGL, data-saver, or a failed context → 2D fallbacks
 */
export type Tier = "high" | "medium" | "low" | "none";

type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

let cached: Tier | null = null;
let forcedNone = false;
const listeners = new Set<() => void>();

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function computeTier(): Tier {
  if (forcedNone) return "none";
  const nav = navigator as NavigatorExtras;
  const params = new URLSearchParams(window.location.search);
  if (params.has("nogl")) return "none";
  if (nav.connection?.saveData) return "none";
  if (!detectWebGL()) return "none";

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const width = window.innerWidth;

  if (memory <= 2 || cores <= 2) return "low";
  if (coarse || width < 768) return memory >= 6 && width >= 600 ? "medium" : "low";
  if (memory <= 4 || cores <= 4) return "medium";
  return "high";
}

export function getTier(): Tier {
  if (cached === null) cached = computeTier();
  return cached;
}

/** Called when a WebGL context is lost — everything drops to fallbacks. */
export function disableWebGL() {
  forcedNone = true;
  cached = "none";
  listeners.forEach((l) => l());
}

/** Returns null during SSR / hydration, then the detected tier. */
export function useTier(): Tier | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getTier(),
    () => null,
  );
}

export const tierConfig = {
  high: { dpr: [1, 1.5] as [number, number], tex: 1024, detail: 1, heroCount: 4 },
  medium: { dpr: [1, 1.5] as [number, number], tex: 1024, detail: 0.8, heroCount: 4 },
  low: { dpr: [1, 1.25] as [number, number], tex: 512, detail: 0.6, heroCount: 3 },
} as const;
