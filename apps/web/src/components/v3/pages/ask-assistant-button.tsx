"use client";

import { MessageCircle } from "lucide-react";

/** Opens the site assistant (Mo AI) with a prepared prompt. */
export function AskAssistantButton({ prompt, label, className }: { prompt: string; label: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("mo-ai:open", { detail: { prompt } }))}
    >
      <MessageCircle size={17} aria-hidden />
      {label}
    </button>
  );
}
