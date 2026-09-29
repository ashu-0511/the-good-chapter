"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { lockScroll } from "@/components/providers/SmoothScroll";
import { cn } from "@/lib/cn";

/**
 * Native <dialog> wrapper: top-layer rendering, focus trapping and Esc come
 * from the platform. Clicking the backdrop closes it.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      lockScroll(true);
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      lockScroll(false);
      onClose();
    };
    d.addEventListener("close", onDialogClose);
    return () => d.removeEventListener("close", onDialogClose);
  }, [onClose]);

  useEffect(() => () => lockScroll(false), []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      data-lenis-prevent
      className={cn("m-0 overscroll-contain p-0 backdrop:bg-ink/60", className)}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      {open && children}
    </dialog>
  );
}
