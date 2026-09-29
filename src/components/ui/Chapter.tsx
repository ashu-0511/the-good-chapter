import { chapter, type ChapterId } from "@/content/site";
import { cn } from "@/lib/cn";

/** "Chapter 03 —— The craft" section label. */
export function ChapterLabel({ id, className }: { id: ChapterId; className?: string }) {
  const c = chapter(id);
  return (
    <p className={cn("text-label flex items-center gap-3", className)} data-reveal="fade">
      <span>Chapter {c.n}</span>
      <span aria-hidden className="h-px w-8 bg-current opacity-40" />
      <span className="opacity-70">{c.title}</span>
    </p>
  );
}
