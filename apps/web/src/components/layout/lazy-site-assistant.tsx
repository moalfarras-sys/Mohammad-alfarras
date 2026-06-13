"use client";

import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/types/cms";

const SiteAssistantWidget = dynamic(
  () => import("@/components/site/site-assistant-widget").then((module) => module.SiteAssistantWidget),
  { ssr: false },
);

export function LazySiteAssistant({ locale }: { locale: Locale }) {
  const [ready, setReady] = useState(false);
  if (ready) return <SiteAssistantWidget locale={locale} initialOpen />;

  return (
    <div className="mo-ai-widget">
      <button
        type="button"
        className="mo-ai-fab"
        onClick={() => setReady(true)}
        aria-label={locale === "ar" ? "فتح مساعد Mo Ai" : "Open Mo Ai assistant"}
      >
        <MessageCircle />
        <span>Mo Ai</span>
      </button>
    </div>
  );
}
