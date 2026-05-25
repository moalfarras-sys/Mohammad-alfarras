"use client";

import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import type { Locale } from "@/types/cms";

type Message = { role: "user" | "assistant"; content: string };

const copy = {
  en: {
    eyebrow: "Smart assistant",
    title: "Ask about the site, MoPlayer, activation, or your next project.",
    body: "A focused assistant connected to the Moalfarras ecosystem. It can guide visitors through services, app pages, support, and product activation.",
    placeholder: "Ask about MoPlayer Pro activation, website services, or support...",
    send: "Send",
    starter: ["How do I activate MoPlayer Pro?", "What can Mohammad build for my business?", "Where is the support page?"],
    initial: "Hi. I can help with MoPlayer, activation, services, support, and project planning.",
  },
  ar: {
    eyebrow: "المساعد الذكي",
    title: "اسأل عن الموقع، MoPlayer، التفعيل، أو مشروعك القادم.",
    body: "مساعد مركز على منظومة محمد الفراس: الخدمات، صفحات التطبيقات، الدعم، وتفعيل MoPlayer.",
    placeholder: "اسأل عن تفعيل MoPlayer Pro أو خدمات المواقع أو الدعم...",
    send: "إرسال",
    starter: ["كيف أفعل MoPlayer Pro؟", "ما الخدمات التي يمكن تنفيذها لمشروعي؟", "أين صفحة الدعم؟"],
    initial: "أهلاً بك. أقدر أساعدك في MoPlayer، التفعيل، الخدمات، الدعم، وترتيب فكرة مشروعك.",
  },
} satisfies Record<Locale, Record<string, string | string[]>>;

export function SiteAssistantPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: t.initial as string }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const conversationId = useMemo(() => crypto.randomUUID(), []);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/site-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, locale, messages: nextMessages }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || "Assistant failed");
      setMessages((current) => [...current, { role: "assistant", content: data.reply! }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fresh-page ai-page">
      <section className="fresh-section fresh-first ai-hero">
        <div className="fresh-section-head">
          <p className="fresh-eyebrow">
            <Sparkles size={16} />
            {t.eyebrow}
          </p>
          <h1>{t.title}</h1>
          <p>{t.body}</p>
        </div>
      </section>

      <section className="ai-console" aria-label={t.eyebrow as string}>
        <div className="ai-thread">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`ai-message ai-message-${message.role}`}>
              {message.role === "assistant" ? <Bot size={18} /> : null}
              <p>{message.content}</p>
            </div>
          ))}
          {loading ? (
            <div className="ai-message ai-message-assistant">
              <Loader2 className="animate-spin" size={18} />
              <p>{locale === "ar" ? "يفكر..." : "Thinking..."}</p>
            </div>
          ) : null}
        </div>

        {error ? <p className="ai-error">{error}</p> : null}

        <div className="ai-starters">
          {(t.starter as string[]).map((item) => (
            <button key={item} type="button" onClick={() => sendMessage(item)} disabled={loading}>
              {item}
            </button>
          ))}
        </div>

        <form
          className="ai-form"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.placeholder as string} rows={3} />
          <button type="submit" disabled={loading || !input.trim()} aria-label={t.send as string}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            <span>{t.send}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
