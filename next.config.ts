import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One-page static site: `next build` emits a fully static bundle in /out.
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    // Static export has no image server — the loader builds responsive
    // srcsets from the image CDN (Unsplash/imgix params) instead.
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
  },
};

export default nextConfig;
