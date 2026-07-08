"use client";

import dynamic from "next/dynamic";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { MoAiRobot } from "@/components/site/mo-ai-robot";
import type { Locale } from "@/types/cms";

const SiteAssistantWidget = dynamic(
  () =>
    import("@/components/site/site-assistant-widget").then((module) => module.SiteAssistantWidget),
  {
    ssr: false,
    loading: () => (
      <aside className="mo-ai-widget mo-ai-widget-open" aria-label="Mo AI" aria-busy="true">
        <section className="mo-ai-panel mo-ai-panel-loading">
          <LoaderCircle className="animate-spin" />
          <span aria-hidden="true">…</span>
        </section>
      </aside>
    ),
  },
);

const teaserKey = "mo-ai-teaser:dismissed";

const teaserCopy = {
  ar: { text: "أهلًا، أنا Mo AI 👋 كيف أقدر أساعدك؟", open: "تحدّث مع Mo AI", dismiss: "إخفاء الرسالة" },
  en: { text: "Hi, I'm Mo AI 👋 How can I help?", open: "Chat with Mo AI", dismiss: "Hide message" },
} as const;

export function LazySiteAssistant({ locale }: { locale: Locale }) {
  const [ready, setReady] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [teaser, setTeaser] = useState(false);
  const t = teaserCopy[locale];

  // Wake triggers: the mo-ai:open event (buttons anywhere on the site),
  // ?ai=open / #moai deep links (old /ai URLs redirect here), and a previously
  // open chat persisted in localStorage.
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

    const timer = window.setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const deepLink = params.get("ai") === "open" || window.location.hash === "#moai";
        const wasOpen = JSON.parse(localStorage.getItem("mo-ai-ui:v1") || "{}") as { open?: boolean };
        if (deepLink || wasOpen.open) setReady(true);
        if (deepLink) {
          params.delete("ai");
          const clean =
            window.location.pathname + (params.size ? `?${params.toString()}` : "") + (window.location.hash === "#moai" ? "" : window.location.hash);
          window.history.replaceState(null, "", clean);
        }
      } catch {
        // Storage/URL access is best-effort.
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mo-ai:open", handleOpenAssistant);
    };
  }, []);

  // Gentle welcome teaser: once per session, a few seconds after load.
  useEffect(() => {
    if (ready) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(teaserKey) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;
    const timer = window.setTimeout(() => setTeaser(true), 2600);
    return () => window.clearTimeout(timer);
  }, [ready]);

  function dismissTeaser() {
    setTeaser(false);
    try {
      sessionStorage.setItem(teaserKey, "1");
    } catch {
      // Session storage is optional.
    }
  }

  function openChat() {
    dismissTeaser();
    setReady(true);
  }

  if (ready) {
    return <SiteAssistantWidget locale={locale} initialOpen initialPrompt={initialPrompt} />;
  }

  return (
    <div className={teaser ? "mo-ai-widget mo-ai-teasing" : "mo-ai-widget"}>
      {teaser ? (
        <div className="mo-ai-teaser" role="status">
          <button type="button" className="mo-ai-teaser-text" onClick={openChat}>
            {t.text}
          </button>
          <button type="button" className="mo-ai-teaser-close" onClick={dismissTeaser} aria-label={t.dismiss}>
            <X size={13} />
          </button>
        </div>
      ) : null}
      <div className="mo-ai-dock">
        <button type="button" className="mo-ai-fab" onClick={openChat} aria-label={t.open}>
          <span className="mo-ai-fab-halo" aria-hidden />
          <MoAiRobot className="mo-ai-fab-bot" />
          <span className="mo-ai-fab-dot" aria-hidden />
        </button>
      </div>
    </div>
  );
}
