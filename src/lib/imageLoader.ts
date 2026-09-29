"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

/**
 * next/image loader for the static export.
 * Unsplash (imgix) URLs get responsive resize params; local files pass through.
 */
export default function imageLoader({ src, width, quality }: LoaderArgs) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 72));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }
  return src;
}
