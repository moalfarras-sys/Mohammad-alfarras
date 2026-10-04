"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import styles from "./moplayer.module.css";

/** Copies a value (the full SHA-256) to the clipboard. */
export function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`${styles.focusRing} inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold text-white transition hover:bg-white/10`}
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
