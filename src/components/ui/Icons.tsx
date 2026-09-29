import type { SVGProps } from "react";

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

/** Brand mark: a bookmark ribbon — the place you mark a good chapter. */
