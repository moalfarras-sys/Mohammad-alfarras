"use client";

import type { ReactNode } from "react";

/**
 * Opens the floating Mo AI widget from anywhere on the site by dispatching the
 * global `mo-ai:open` event. Both the lazy loader and the widget itself listen
 * for it, so this works before and after the chat chunk is loaded.
 */
export function AssistantTrigger({
  children,
  prompt,
  className,
}: {
  children: ReactNode;
  prompt?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent("mo-ai:open", { detail: { prompt } }));
      }}
    >
      {children}
    </button>
  );
}
