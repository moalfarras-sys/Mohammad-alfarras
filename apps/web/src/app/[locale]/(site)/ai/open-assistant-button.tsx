"use client";

import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Opens the floating site assistant from anywhere on the page by dispatching the
 * global `mo-ai:open` event. Both the lazy loader and the widget itself listen
 * for it, so the assistant mounts + opens even before the user has interacted.
 */
export function OpenAssistantButton({
  prompt,
  className,
  children,
  withIcon = true,
}: {
  prompt?: string;
  className?: string;
  children: ReactNode;
  withIcon?: boolean;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent("mo-ai:open", { detail: { prompt } }));
      }}
    >
      {withIcon ? <MessageCircle size={18} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
