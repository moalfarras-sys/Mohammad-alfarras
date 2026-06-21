"use client";

import dynamic from "next/dynamic";
import { LoaderCircle, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

const SiteAssistantWidget = dynamic(
  () =>
    import("@/components/site/site-assistant-widget").then((module) => module.SiteAssistantWidget),
  {
    ssr: false,
    loading: () => (
      <aside className="mo-ai-widget mo-ai-widget-open" aria-label="Mo Ai" aria-busy="true">
        <section className="mo-ai-panel mo-ai-panel-loading">
          <LoaderCircle className="animate-spin" />
          <span aria-hidden="true">…</span>
        </section>
      </aside>
    ),
  },
);

export function LazySiteAssistant({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const hiddenOnFocusedFlow = Boolean(
    pathname?.includes("/activate") || pathname?.includes("/moplayer/setup"),
  );

  useEffect(() => {
    function handleOpenAssistant(event: Event) {
      const prompt = (
        event as CustomEvent<{
          prompt?: string;
        }>
      ).detail?.prompt?.trim();
      setInitialPrompt(prompt ?? "");
      setReady(true);
    }

    window.addEventListener("mo-ai:open", handleOpenAssistant);
    return () => window.removeEventListener("mo-ai:open", handleOpenAssistant);
  }, []);

  if (hiddenOnFocusedFlow) return null;
  if (ready) {
    return <SiteAssistantWidget locale={locale} initialOpen initialPrompt={initialPrompt} />;
  }

  return (
    <div className="mo-ai-widget">
      <button
        type="button"
        className="mo-ai-fab"
        onClick={() => setReady(true)}
        aria-label={locale === "ar" ? "تحدّث مع Mo Ai" : "Chat with Mo Ai"}
      >
        <Sparkles />
        <span>Mo Ai</span>
      </button>
    </div>
  );
}
