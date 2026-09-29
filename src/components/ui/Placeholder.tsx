import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/** Small, honest marker on placeholder content. Toggle via site.markPlaceholders. */
export function PlaceholderTag({ show = true, className }: { show?: boolean; className?: string }) {
  if (!site.markPlaceholders || !show) return null;
  return (
    <span
      className={cn(
        "text-label inline-flex items-center gap-1.5 rounded-sm border border-dashed border-current px-1.5 py-0.5 text-[9.5px] opacity-55",
        className,
      )}
      title="Placeholder — replace with real content"
    >
      Placeholder
    </span>
  );
}
