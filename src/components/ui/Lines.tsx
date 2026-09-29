import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Multi-line display heading with per-line masks. The reveal itself is run by
 * <RevealController>; without JS the text is simply visible.
 */
export function Lines({
  lines,
  as: Tag = "h2",
  className,
  lineClassName,
  id,
}: {
  lines: ReactNode[];
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  lineClassName?: (i: number) => string | undefined;
  id?: string;
}) {
  return (
    <Tag id={id} className={className} data-reveal="lines">
      {lines.map((l, i) => (
        <span key={i} className="line-mask">
          <span className={cn("block", lineClassName?.(i))}>{l}</span>{" "}
        </span>
      ))}
    </Tag>
  );
}
