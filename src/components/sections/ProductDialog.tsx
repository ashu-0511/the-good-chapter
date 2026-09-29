"use client";

import dynamic from "next/dynamic";
import type { Product } from "@/content/products";
import { startChapterHref } from "@/lib/mailto";
import { Dialog } from "@/components/ui/Dialog";
import { MagneticButton } from "@/components/ui/MagneticButton";

const ProductFallback = dynamic(() => import("@/components/webgl/ProductFallback").then((m) => m.ProductFallback), { ssr: false });

/** Editorial detail sheet — not a product page: no prices, no cart. */
export function ProductDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <Dialog
      open={!!product}
      onClose={onClose}
      labelledBy="product-dialog-title"
      className="fixed inset-0 m-auto h-[min(92dvh,820px)] w-[min(94vw,1180px)] overflow-hidden rounded-[6px] bg-paper text-ink shadow-2xl"
    >
      {product && (
        <div className="grid h-full grid-rows-[auto_1fr] md:grid-cols-2 md:grid-rows-1">
          <div
            className="relative h-[34dvh] md:h-full"
            style={{ backgroundColor: product.backdrop }}
          >
            <span
              aria-hidden
              className={`absolute -bottom-[0.12em] -left-[0.04em] font-display text-[clamp(8rem,20vw,18rem)] font-semibold leading-none tracking-[-0.08em] ${
                product.dark ? "text-ivory/[0.07]" : "text-ink/[0.06]"
              }`}
            >
              {product.n}
            </span>
            <ProductFallback
              kind={product.kind}
              colors={product.colors}
              label={`${product.name} — rendered illustration`}
              className="absolute inset-[8%] h-[84%] w-[84%]"
            />
          </div>

          <div className="flex min-h-0 flex-col overflow-y-auto p-6 md:p-12" data-lenis-prevent>
            <div className="flex items-center justify-between">
              <p className="text-label text-muted">
                {product.n} — The range
              </p>
              <button
                type="button"
                onClick={onClose}
                className="text-label flex h-10 items-center gap-2 rounded-full px-3 text-[11px] ring-1 ring-ink/15 transition-colors hover:bg-ink hover:text-ivory"
              >
                Close
                <span aria-hidden className="relative block size-3">
                  <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
                  <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
                </span>
              </button>
            </div>

            <h2 id="product-dialog-title" className="text-display-m mt-8 md:mt-12">
              {product.name}
            </h2>
            <p className="mt-5 max-w-[46ch] text-lead text-muted">{product.description}</p>

            <dl className="mt-10 grid grid-cols-1 gap-8 border-t border-ink/10 pt-8 sm:grid-cols-3">
              {(
                [
                  ["Materials", product.materials],
                  ["Techniques", product.techniques],
                  ["Made for", product.goodFor],
                ] as const
              ).map(([term, items]) => (
                <div key={term}>
                  <dt className="text-label mb-3 text-muted">{term}</dt>
                  {items.map((it) => (
                    <dd key={it} className="text-[14.5px] leading-7">
                      {it}
                    </dd>
                  ))}
                </div>
              ))}
            </dl>

            <div className="mt-auto flex flex-wrap items-center gap-4 pt-10">
              <MagneticButton href={startChapterHref(product.name)} size="md">
                Start with {product.short}
              </MagneticButton>
              <p className="text-[13px] text-muted">Every piece is quoted to your brief — no fixed catalogue.</p>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
