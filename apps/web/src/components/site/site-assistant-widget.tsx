"use client";

import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/types/cms";

type Message = { role: "user" | "assistant"; content: string };
type SavedThread = { savedAt: string; messages: Message[] };

const localThreadTtlMs = 7 * 24 * 60 * 60 * 1000;

const widgetCopy = {
  en: {
    label: "Mo Ai",
    title: "Mo Ai",
    status: "Site guide",
    initial:
      "Hi. I can guide you through this page, MoPlayer, activation, services, and contact options.",
    placeholder: "Ask about this page...",
    send: "Send",
    close: "Close assistant",
    open: "Open Mo Ai assistant",
    thinking: "Thinking...",
    starters: [
      "What is this page?",
      "How do I activate MoPlayer Pro?",
      "How can I contact Mohammad?",
    ],
  },
  ar: {
    label: "Mo Ai",
    title: "Mo Ai",
    status: "دليل الموقع",
    initial: "أهلا بك. أقدر أرشدك داخل هذه الصفحة، MoPlayer، التفعيل، الخدمات، وطرق التواصل.",
    placeholder: "اسأل عن هذه الصفحة...",
    send: "إرسال",
    close: "إغلاق المساعد",
    open: "فتح مساعد Mo Ai",
    thinking: "يفكر...",
    starters: ["ما محتوى هذه الصفحة؟", "كيف أفعل MoPlayer Pro؟", "كيف أتواصل مع محمد؟"],
  },
} satisfies Record<Locale, Record<string, string | string[]>>;

function storageKey(locale: Locale) {
  return `mo-ai-thread:${locale}`;
}

function fallbackMessages(locale: Locale): Message[] {
  return [{ role: "assistant", content: widgetCopy[locale].initial as string }];
}

function initialMessages(locale: Locale): Message[] {
  const fallback = fallbackMessages(locale);
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(storageKey(locale));
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as SavedThread | Message[];
    const savedAt = Array.isArray(parsed) ? "" : parsed.savedAt;
    const rawMessages = Array.isArray(parsed) ? parsed : parsed.messages;
    if (savedAt && Date.now() - new Date(savedAt).getTime() > localThreadTtlMs) {
      window.localStorage.removeItem(storageKey(locale));
      return fallback;
    }
    const valid = Array.isArray(rawMessages)
      ? rawMessages.filter(
          (message) =>
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string",
        )
      : [];
    return valid.length ? valid.slice(-10) : fallback;
  } catch {
    return fallback;
  }
}

export function SiteAssistantWidget({ locale, initialOpen = false }: { locale: Locale; initialOpen?: boolean }) {
  const pathname = usePathname();
  const t = widgetCopy[locale];
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>(() => initialMessages(locale));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const hiddenOnFocusedFlow = Boolean(pathname?.includes("/activate") || pathname?.includes("/moplayer/setup"));

  useEffect(() => {
    try {
      const payload: SavedThread = {
        savedAt: new Date().toISOString(),
        messages: messages.slice(-10),
      };
      localStorage.setItem(storageKey(locale), JSON.stringify(payload));
    } catch {
      // Browser storage is optional.
    }
  }, [locale, messages]);

  useEffect(() => {
    function handleOpenAssistant(event: Event) {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt?.trim();
      setOpen(true);
      if (prompt) setInput(prompt);
    }

    window.addEventListener("mo-ai:open", handleOpenAssistant);
    return () => window.removeEventListener("mo-ai:open", handleOpenAssistant);
  }, []);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content }].slice(-10);
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const pageContext =
        locale === "ar"
          ? `السياق الحالي: الزائر موجود في ${pathname || "/"}. اربط الإجابة بهذه الصفحة عند الحاجة.`
          : `Current context: the visitor is on ${pathname || "/"}. Tie the answer to this page when useful.`;
      const res = await fetch("/api/ai/site-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          locale,
          messages: [{ role: "system", content: pageContext }, ...nextMessages],
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || "Assistant failed");
      setMessages((current) =>
        [...current, { role: "assistant" as const, content: data.reply! }].slice(-10),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant failed");
    } finally {
      setLoading(false);
    }
  }

  if (hiddenOnFocusedFlow) return null;

  return (
    <aside
      className={open ? "mo-ai-widget mo-ai-widget-open" : "mo-ai-widget"}
      aria-label={t.title as string}
    >
      {open ? (
        <section className="mo-ai-panel">
          <header className="mo-ai-head">
            <span className="mo-ai-mark">
              <Bot size={16} />
            </span>
            <span className="mo-ai-title">
              <strong>{t.title}</strong>
              <small>{t.status}</small>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.close as string}>
              <X size={16} />
            </button>
          </header>

          <div className="mo-ai-thread">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`mo-ai-bubble mo-ai-bubble-${message.role}`}
              >
                <p>{message.content}</p>
              </div>
            ))}
            {loading ? (
              <div className="mo-ai-bubble mo-ai-bubble-assistant">
                <p>
                  <Loader2 className="inline animate-spin" size={14} /> {t.thinking}
                </p>
              </div>
            ) : null}
          </div>

          {error ? <p className="mo-ai-error">{error}</p> : null}

          <div className="mo-ai-starters">
            {(t.starters as string[]).map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => sendMessage(starter)}
                disabled={loading}
              >
                {starter}
              </button>
            ))}
          </div>

          <form
            className="mo-ai-form"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder as string}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label={t.send as string}>
              {loading ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="mo-ai-fab"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.open as string}
      >
        <MessageCircle size={16} />
        <span>{t.label}</span>
      </button>
    </aside>
  );
}
