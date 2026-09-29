/** Tiny event bus so WebGL scenes (outside the DOM tree) can drive the cursor label. */
export type CursorVariant = "hover" | "view" | "open";
export type CursorState = { label?: string; variant: CursorVariant } | null;

const listeners = new Set<(s: CursorState) => void>();

export function setCursor(s: CursorState) {
  listeners.forEach((l) => l(s));
}

export function onCursor(l: (s: CursorState) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
