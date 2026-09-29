"use client";

import { useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { ArrowRight, ArrowUpRight } from "./Icons";

type Common = {
  children: ReactNode;
  /** visual weight */
  variant?: "primary" | "secondary";
  /** the surface the button sits on */
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  arrow?: "right" | "up-right" | "none";
  /** custom cursor treatment */
  cursor?: "open" | "hover";
  className?: string;
};

type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className">;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

const styles = {
  "primary-light": "bg-ink text-ivory",
  "primary-dark": "bg-ivory text-ink hover:text-ivory",
  "secondary-light": "text-ink ring-1 ring-inset ring-ink/25 hover:text-ivory",
  "secondary-dark": "text-ivory ring-1 ring-inset ring-ivory/30 hover:text-ink",
} as const;

const fills = {
  "primary-light": "bg-accent-deep",
  "primary-dark": "bg-accent-deep",
  "secondary-light": "bg-ink",
  "secondary-dark": "bg-ivory",
} as const;

const sizes = {
  sm: "h-10 gap-2.5 px-4.5 text-[11.5px]",
  md: "h-12 gap-3 px-6 text-[12.5px]",
  lg: "h-15 gap-4 px-8 text-[13.5px] md:h-17 md:px-10 md:text-[14px]",
};

/**
 * Premium pill button: fill wipes up from below, the arrow swaps diagonally,
 * and on fine pointers the whole button leans magnetically toward the cursor.
 */
export function MagneticButton(props: AsLink | AsButton) {
  const {
    children,
    variant = "primary",
    tone = "light",
    size = "md",
    arrow = "right",
    cursor = "open",
    className,
    ...rest
  } = props;
  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const key = `${variant}-${tone}` as const;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
      if (!mq.matches) return;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      const ixTo = gsap.quickTo(inner.current, "x", { duration: 0.6, ease: "power3.out" });
      const iyTo = gsap.quickTo(inner.current, "y", { duration: 0.6, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.22);
        yTo(dy * 0.32);
        ixTo(dx * 0.08);
        iyTo(dy * 0.1);
      };
      const leave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.45)" });
        gsap.to(inner.current, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.45)" });
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root },
  );

  const Arrow = arrow === "up-right" ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute left-1/2 top-full h-[260%] w-[130%] -translate-x-1/2 rounded-[50%] transition-[top] duration-[650ms] ease-out-expo group-hover:-top-[80%] group-focus-visible:-top-[80%]",
          fills[key],
        )}
      />
      <span ref={inner} className="relative z-10 flex items-center gap-[inherit]">
        <span className="whitespace-nowrap">{children}</span>
        {arrow !== "none" && (
          <span className="relative block size-[1.15em] overflow-hidden">
            <Arrow className="absolute inset-0 size-full transition-transform duration-500 ease-out-expo group-hover:translate-x-full group-hover:-translate-y-full" />
            <Arrow className="absolute inset-0 size-full -translate-x-full translate-y-full transition-transform duration-500 ease-out-expo group-hover:translate-x-0 group-hover:translate-y-0" />
          </span>
        )}
      </span>
    </>
  );

  const cls = cn(
    "group relative isolate inline-flex select-none items-center justify-center overflow-hidden rounded-full font-medium uppercase tracking-[0.07em] transition-colors duration-500 will-change-transform",
    sizes[size],
    styles[key],
    className,
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...a } = rest as AsLink;
    const external = /^(https?:|mailto:|tel:)/.test(href);
    return (
      <a
        ref={root as React.RefObject<HTMLAnchorElement>}
        href={href}
        data-cursor={cursor}
        className={cls}
        {...(external && href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...a}
      >
        {content}
      </a>
    );
  }
  const b = rest as Omit<AsButton, keyof Common>;
  return (
    <button ref={root as React.RefObject<HTMLButtonElement>} type="button" data-cursor={cursor} className={cls} {...b}>
      {content}
    </button>
  );
}
