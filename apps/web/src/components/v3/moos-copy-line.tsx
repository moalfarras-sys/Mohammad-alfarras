"use client";

import { Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";

/** A terminal command with a copy button (MoOS install / update / verify lines). */
export function MoosCopyLine({ command, copyLabel, copiedLabel }: { command: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mo3-term">
      <div className="mo3-term-code">
        <Terminal size={15} aria-hidden />
        <code dir="ltr">{command}</code>
      </div>
      <button
        type="button"
        className="mo3-copy"
        aria-label={`${copyLabel}: ${command}`}
        onClick={() => {
          navigator.clipboard?.writeText(command).then(
            () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            },
            () => undefined,
          );
        }}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}
