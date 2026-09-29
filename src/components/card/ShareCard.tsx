"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Check, LinkIcon, Share } from "./CardIcons";

const noSubscribe = () => () => {};

const pill =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium ring-1 ring-ink/15 transition-colors hover:bg-ink hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** The phone's own share sheet where there is one, and copy-link everywhere. */
export function ShareCard({ url, title, text }: { url: string; title: string; text: string }) {
  const canShare = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  const share = () => navigator.share({ title, text, url }).catch(() => {});
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <>
      {canShare && (
        <button type="button" onClick={share} className={pill}>
          <Share className="size-[18px]" />
          Share
        </button>
      )}
      <button type="button" onClick={copy} className={pill} aria-live="polite">
        {copied ? <Check className="size-[18px]" /> : <LinkIcon className="size-[18px]" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </>
  );
}
