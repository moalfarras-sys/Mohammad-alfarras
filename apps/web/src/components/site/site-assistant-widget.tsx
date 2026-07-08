"use client";

import {
  Eraser,
  Loader2,
  MessageCircle,
  Minus,
  Send,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { MoAiRobot } from "@/components/site/mo-ai-robot";
import type { Locale } from "@/types/cms";

type Message = { role: "user" | "assistant"; content: string };
type SavedThread = { savedAt: string; messages: Message[] };

const localThreadTtlMs = 7 * 24 * 60 * 60 * 1000;
const uiStateKey = "mo-ai-ui:v1";

function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function MoLink({ href, children }: { href: string; children: ReactNode }) {
  const internal = href.startsWith("/") || href.includes("moalfarras.space");
  return (
    <a
      className="mo-ai-link"
      href={href}
      {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}

/** Bold + tidy bullets inside a plain-text fragment (no links). */
function renderInline(text: string, keyPrefix: string): ReactNode {
  const tidy = text.replace(/^[ \t]*[*-][ \t]+/gm, "• ");
  const pieces = tidy.split(/\*\*([^*]+)\*\*/g);
  if (pieces.length === 1) return tidy;
  return pieces.map((piece, index) =>
    index % 2 === 1 ? <strong key={`${keyPrefix}b${index}`}>{piece}</strong> : <Fragment key={`${keyPrefix}p${index}`}>{piece}</Fragment>,
  );
}

/** Renders assistant text with clickable links: Markdown [text](url) + bare URLs, plus **bold** and bullets. */
function renderRich(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<Fragment key={`t${key}`}>{renderInline(text.slice(last, match.index), `t${key}`)}</Fragment>);
    const [, label, mdUrl, bareUrl] = match;
    if (label && mdUrl) {
      parts.push(
        <MoLink key={`l${key}`} href={mdUrl}>
          {label}
        </MoLink>,
      );
    } else if (bareUrl) {
      const clean = bareUrl.replace(/[).,!?؟،]+$/, "");
      parts.push(
        <MoLink key={`l${key}`} href={clean}>
          {prettyUrl(clean)}
        </MoLink>,
      );
      const trailing = bareUrl.slice(clean.length);
      if (trailing) parts.push(<Fragment key={`p${key}`}>{trailing}</Fragment>);
    }
    key += 1;
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(<Fragment key={`t${key}`}>{renderInline(text.slice(last), `e${key}`)}</Fragment>);
  return parts;
}

const widgetCopy = {
  en: {
    label: "Mo AI",
    title: "Mo AI",
    status: "Online · replies instantly",
    initial: "👋 Hi, I'm Mo AI — Mohammad's assistant on this site. Ask me about services, MoPlayer apps, activation, downloads, or how to reach Mohammad.",
    placeholder: "Type your question…",
    send: "Send",
    close: "Close chat",
    minimize: "Minimize chat",
    clear: "Clear conversation",
    open: "Chat with Mo AI",
    thinking: "Mo AI is typing…",
    error: "Connection hiccup — I answered from the site data below. Try again or use the contact page.",
    contactCta: "Talk directly to Mohammad",
    cleared: "✨ Fresh start! How can I help you now?",
    starters: [
      { icon: "wrench", label: "My services", prompt: "What services does Mohammad offer?" },
      { icon: "sparkles", label: "MoPlayer apps", prompt: "Tell me about the MoPlayer apps" },
      { icon: "sparkles", label: "Activation", prompt: "How do I activate MoPlayer?" },
      { icon: "sparkles", label: "Downloads", prompt: "How do I download the apps?" },
      { icon: "message", label: "Contact me", prompt: "How can I contact Mohammad?" },
    ],
  },
  ar: {
    label: "Mo AI",
    title: "Mo AI",
    status: "متصل الآن · يرد فورًا",
    initial: "👋 أهلًا، أنا Mo AI — مساعد محمد داخل الموقع. اسألني عن الخدمات، تطبيقات MoPlayer، التفعيل، التحميل، أو طريقة التواصل مع محمد.",
    placeholder: "اكتب سؤالك هنا…",
    send: "إرسال",
    close: "إغلاق المحادثة",
    minimize: "تصغير المحادثة",
    clear: "مسح المحادثة",
    open: "تحدّث مع Mo AI",
    thinking: "Mo AI يكتب…",
    error: "تعذّر الاتصال مؤقتًا — جاوبتك من بيانات الموقع بالأسفل. جرّب مرة ثانية أو استخدم صفحة التواصل.",
    contactCta: "تواصل مباشرة مع محمد",
    cleared: "✨ بداية جديدة! كيف أقدر أساعدك الآن؟",
    starters: [
      { icon: "wrench", label: "خدماتي", prompt: "ما هي الخدمات التي يقدمها محمد؟" },
      { icon: "sparkles", label: "تطبيقات MoPlayer", prompt: "حدثني عن تطبيقات MoPlayer" },
      { icon: "sparkles", label: "طريقة التفعيل", prompt: "كيف أفعّل MoPlayer؟" },
      { icon: "sparkles", label: "تحميل البرامج", prompt: "كيف أحمّل التطبيقات؟" },
      { icon: "message", label: "تواصل معي", prompt: "كيف أتواصل مع محمد؟" },
    ],
  },
} as const;

const starterIcons = {
  wrench: Wrench,
  sparkles: Sparkles,
  message: MessageCircle,
} as const;

function storageKey(locale: Locale) {
  return `mo-ai-thread:${locale}`;
}

function fallbackMessages(locale: Locale): Message[] {
  return [{ role: "assistant", content: widgetCopy[locale].initial }];
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

function persistAssistantOpenState(open: boolean) {
  try {
    localStorage.setItem(uiStateKey, JSON.stringify({ open }));
  } catch {
    // Browser storage is optional.
  }
}

/**
 * Offline answer built from real site pages — used only when the assistant API
 * itself is unreachable (network failure / 5xx). Never invents facts: it links
 * to the exact page that holds the answer.
 */
function localFallbackReply(question: string, locale: Locale): string {
  const q = question.toLowerCase();
  const ar = locale === "ar";
  const p = (path: string) => `/${locale}${path}`;

  if (/(فعّ?ل|تفعيل|activat|كود|code|ربط|pair|qr)/.test(q)) {
    return ar
      ? `خطوات التفعيل كاملة موجودة في صفحة [التفعيل](${p("/activate")}): افتح التطبيق على التلفزيون، اقرأ الكود المعروض، ثم أدخله في الصفحة. إذا واجهتك مشكلة راسل محمد عبر [صفحة التواصل](${p("/contact")}).`
      : `Full activation steps are on the [activation page](${p("/activate")}): open the app on your TV, read the code it shows, then enter it on that page. If anything fails, reach Mohammad via the [contact page](${p("/contact")}).`;
  }
  if (/(حمّ?ل|تحميل|تنزيل|download|apk|exe|install|تثبيت|ويندوز|windows|كمبيوتر|pc)/.test(q)) {
    return ar
      ? `روابط التحميل الرسمية: [MoPlayer للأندرويد والتلفزيون](${p("/apps/moplayer")}) و[MoPlayer للكمبيوتر (Windows)](${p("/apps/moplayer-pc")}). كل زر تحميل هناك يعطيك أحدث إصدار مباشرة.`
      : `Official downloads: [MoPlayer for Android/TV](${p("/apps/moplayer")}) and [MoPlayer for Windows PC](${p("/apps/moplayer-pc")}). Every download button there serves the latest release.`;
  }
  if (/(خدم|service|موقع|website|تصميم|design|سعر|price|مشروع|project)/.test(q)) {
    return ar
      ? `محمد يقدّم تصميم وتطوير مواقع وتطبيقات احترافية ومحتوى تقني. التفاصيل في [صفحة الخدمات](${p("/services")})، وأعماله السابقة في [صفحة الأعمال](${p("/work")}). لبدء مشروع راسله عبر [صفحة التواصل](${p("/contact")}).`
      : `Mohammad builds premium websites, apps, and tech content. Details on the [services page](${p("/services")}), past work on the [work page](${p("/work")}). To start a project, use the [contact page](${p("/contact")}).`;
  }
  if (/(تواصل|contact|واتس|whats|ايميل|email|بريد)/.test(q)) {
    return ar
      ? `أسرع طريقة للتواصل مع محمد هي [صفحة التواصل](${p("/contact")}) — فيها نموذج مباشر وواتساب وبريد إلكتروني.`
      : `The fastest way to reach Mohammad is the [contact page](${p("/contact")}) — direct form, WhatsApp, and email.`;
  }
  if (/(يوتيوب|youtube|قناة|فيديو)/.test(q)) {
    return ar
      ? `قناة محمد وكل المحتوى التقني موجود في [صفحة يوتيوب](${p("/youtube")}).`
      : `Mohammad's channel and tech content live on the [YouTube page](${p("/youtube")}).`;
  }
  if (/(سيرة|خبرة|cv|resume|experience)/.test(q)) {
    return ar
      ? `السيرة الذاتية الكاملة لمحمد — الخبرات والمهارات والمحطات — في [صفحة السيرة](${p("/cv")}).`
      : `Mohammad's full CV — experience, skills, and milestones — is on the [CV page](${p("/cv")}).`;
  }
  if (/(moplayer|مشغل|تطبيق|app)/.test(q)) {
    return ar
      ? `MoPlayer عائلة مشغلات وسائط: Pro وClassic للأندرويد/التلفزيون في [صفحة التطبيقات](${p("/apps/moplayer")}), ونسخة الكمبيوتر في [MoPlayer PC](${p("/apps/moplayer-pc")}).`
      : `MoPlayer is a family of media players: Pro and Classic for Android/TV on the [apps page](${p("/apps/moplayer")}), and the desktop build on [MoPlayer PC](${p("/apps/moplayer-pc")}).`;
  }
  return ar
    ? `ما قدرت أتأكد من الجواب الدقيق الآن، وما بحب أخمّن. أفضل مكانين: [صفحة الخدمات](${p("/services")}) و[تطبيقات MoPlayer](${p("/apps/moplayer")}) — أو اسأل محمد مباشرة عبر [صفحة التواصل](${p("/contact")}).`
    : `I can't verify the exact answer right now and I won't guess. Best places to look: the [services page](${p("/services")}) and [MoPlayer apps](${p("/apps/moplayer")}) — or ask Mohammad directly on the [contact page](${p("/contact")}).`;
}

export function SiteAssistantWidget({
  locale,
  initialOpen = false,
  initialPrompt = "",
}: {
  locale: Locale;
  initialOpen?: boolean;
  initialPrompt?: string;
}) {
  const pathname = usePathname();
  const t = widgetCopy[locale];
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>(() => initialMessages(locale));
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<{ label: string; prompt: string }[]>(
    t.starters.map((s) => ({ label: s.label, prompt: s.prompt })),
  );
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    persistAssistantOpenState(open);
  }, [open]);

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

  function clearChat() {
    setMessages([{ role: "assistant", content: t.cleared }]);
    setError("");
    setSuggestions(t.starters.map((s) => ({ label: s.label, prompt: s.prompt })));
    try {
      localStorage.removeItem(storageKey(locale));
    } catch {
      // Browser storage is optional.
    }
  }

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
          pagePath: pathname || "/",
          messages: [{ role: "system", content: pageContext }, ...nextMessages],
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; suggestions?: string[] };
      if (!res.ok || !data.reply) throw new Error(data.error || "Assistant failed");
      setMessages((current) =>
        [...current, { role: "assistant" as const, content: data.reply! }].slice(-10),
      );
      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        setSuggestions(data.suggestions.slice(0, 4).map((s) => ({ label: s, prompt: s })));
      }
    } catch {
      // Network / server failure: answer from local site knowledge instead of
      // leaving the visitor with a dead end.
      setError(t.error);
      setMessages((current) =>
        [...current, { role: "assistant" as const, content: localFallbackReply(content, locale) }].slice(-10),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      className={open ? "mo-ai-widget mo-ai-widget-open" : "mo-ai-widget"}
      aria-label={t.title}
    >
      {open ? (
        <section className="mo-ai-panel" role="dialog" aria-label={t.title}>
          <header className="mo-ai-head">
            <span className="mo-ai-mark" aria-hidden>
              <MoAiRobot className="mo-ai-mark-bot" />
            </span>
            <span className="mo-ai-title">
              <strong>{t.title}</strong>
              <small>
                <span className="mo-ai-online" aria-hidden />
                {t.status}
              </small>
            </span>
            <span className="mo-ai-head-actions">
              <button type="button" onClick={clearChat} aria-label={t.clear} title={t.clear}>
                <Eraser size={15} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.minimize} title={t.minimize}>
                <Minus size={16} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.close} title={t.close}>
                <X size={16} />
              </button>
            </span>
          </header>

          <div className="mo-ai-thread" ref={threadRef} role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`mo-ai-row mo-ai-row-${message.role}`}>
                {message.role === "assistant" ? (
                  <span className="mo-ai-avatar" aria-hidden>
                    <MoAiRobot className="mo-ai-avatar-bot" />
                  </span>
                ) : null}
                <div className={`mo-ai-bubble mo-ai-bubble-${message.role}`}>
                  <p>{message.role === "assistant" ? renderRich(message.content) : message.content}</p>
                </div>
              </div>
            ))}
            {loading ? (
              <div className="mo-ai-row mo-ai-row-assistant">
                <span className="mo-ai-avatar" aria-hidden>
                  <MoAiRobot className="mo-ai-avatar-bot" />
                </span>
                <div className="mo-ai-bubble mo-ai-bubble-assistant mo-ai-typing-bubble">
                  <span className="mo-ai-typing" role="status" aria-label={t.thinking}>
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="mo-ai-error">{error}</p> : null}

          <div className="mo-ai-starters">
            {suggestions.map((starter) => {
              const matched = t.starters.find((s) => s.label === starter.label);
              const Icon = matched ? starterIcons[matched.icon] : MessageCircle;
              return (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => sendMessage(starter.prompt)}
                  disabled={loading}
                >
                  <Icon size={13} aria-hidden />
                  {starter.label}
                </button>
              );
            })}
          </div>

          <form
            className="mo-ai-form"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              enterKeyHint="send"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label={t.send}>
              {loading ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
            </button>
          </form>

          <a className="mo-ai-contact" href={`/${locale}/contact`}>
            {t.contactCta}
          </a>
        </section>
      ) : null}

      <div className="mo-ai-dock">
        <button
          type="button"
          className={open ? "mo-ai-fab mo-ai-fab-active" : "mo-ai-fab"}
          onClick={() => setOpen((value) => !value)}
          aria-label={t.open}
          aria-expanded={open}
        >
          <span className="mo-ai-fab-halo" aria-hidden />
          <MoAiRobot className="mo-ai-fab-bot" />
          <span className="mo-ai-fab-dot" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
