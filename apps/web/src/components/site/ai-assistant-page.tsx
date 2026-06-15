"use client";

import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import type { Locale } from "@/types/cms";

type Message = { role: "user" | "assistant"; content: string };

const copy = {
  en: {
    eyebrow: "Mo Ai",
    title: "A direct assistant for the site, MoPlayer, and project requests.",
    intro:
      "Ask about services, MoPlayer activation, app downloads, support steps, the CV, YouTube, or a website idea. The assistant keeps answers grounded in moalfarras.space.",
    initial:
      "Hi. I can help you find the right page, understand MoPlayer or MoPlayer Pro, prepare a support request, or shape a website/app project.",
    placeholder: "Ask about MoPlayer, activation, services, or your project...",
    send: "Send",
    thinking: "Thinking...",
    error: "The assistant could not answer right now. Please try again or use the contact page.",
    starters: [
      "How do I activate MoPlayer Pro?",
      "Which page should I use for app support?",
      "Can Mohammad build a website for my business?",
      "Where can I download the latest app?",
    ],
  },
  ar: {
    eyebrow: "Mo Ai",
    title: "مساعد مباشر للموقع وMoPlayer وطلبات المشاريع.",
    intro:
      "اسأل عن الخدمات، تفعيل MoPlayer، تحميل التطبيقات، خطوات الدعم، السيرة، يوتيوب، أو فكرة موقع. المساعد يلتزم بمحتوى moalfarras.space.",
    initial:
      "أهلًا بك. أستطيع مساعدتك في الوصول للصفحة المناسبة، فهم MoPlayer أو MoPlayer Pro، تجهيز طلب دعم، أو ترتيب فكرة موقع/تطبيق.",
    placeholder: "اسأل عن MoPlayer، التفعيل، الخدمات، أو مشروعك...",
    send: "إرسال",
    thinking: "يفكر...",
    error: "تعذر على المساعد الرد الآن. جرّب مرة أخرى أو استخدم صفحة التواصل.",
    starters: [
      "كيف أفعل MoPlayer Pro؟",
      "ما الصفحة المناسبة لدعم التطبيق؟",
      "هل يمكن لمحمد بناء موقع لشركتي؟",
      "أين أحمل أحدث إصدار؟",
    ],
  },
} satisfies Record<Locale, Record<string, string | string[]>>;

export function AiAssistantPage({ locale, heroImage }: { locale: Locale; heroImage: string }) {
  const t = copy[locale];
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: t.initial as string }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const conversationId = useMemo(() => crypto.randomUUID(), []);

  async function sendMessage(value: string) {
    const content = value.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user" as const, content }].slice(-12);
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/site-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          locale,
          pagePath: `/${locale}/ai`,
          messages: next,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || "Assistant failed");
      setMessages((current) => [...current, { role: "assistant" as const, content: data.reply! }].slice(-12));
    } catch {
      setError(t.error as string);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fresh-page ai-page" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="fresh-section ai-hero">
        <div className="fresh-section-head">
          <p className="fresh-eyebrow">
            <Sparkles size={15} aria-hidden /> {t.eyebrow}
          </p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        <div className="fresh-card overflow-hidden p-0">
          <div className="relative aspect-[16/9] min-h-[220px]">
            <Image
              src={heroImage}
              alt={t.title as string}
              fill
              sizes="(max-width: 900px) 92vw, 1080px"
              className="fresh-image"
              priority
              unoptimized={heroImage.startsWith("http")}
            />
          </div>
        </div>

        <section className="ai-console" aria-label={t.eyebrow as string}>
          <div className="ai-thread" aria-live="polite">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`ai-message ai-message-${message.role}`}>
                {message.role === "assistant" ? <Bot size={18} aria-hidden /> : null}
                <p>{message.content}</p>
              </article>
            ))}
            {loading ? (
              <article className="ai-message ai-message-assistant">
                <Loader2 size={18} className="animate-spin" aria-hidden />
                <p>{t.thinking}</p>
              </article>
            ) : null}
          </div>

          {error ? <p className="ai-error">{error}</p> : null}

          <div className="ai-starters">
            {(t.starters as string[]).map((starter) => (
              <button key={starter} type="button" onClick={() => sendMessage(starter)} disabled={loading}>
                {starter}
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
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder as string}
              maxLength={1800}
              required
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Send size={16} aria-hidden />}
              <span>{t.send}</span>
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
