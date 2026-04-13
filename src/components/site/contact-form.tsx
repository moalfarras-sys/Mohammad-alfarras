"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";

import { cn } from "@/lib/cn";

type Locale = "ar" | "en";
type PresetKey = "website" | "landing" | "content" | "redesign" | "consultation";

type ContactFormProps = {
  locale: Locale;
  whatsappUrl: string;
};

const copy = {
  ar: {
    title: "أرسل الفكرة كما هي",
    subtitle: "حتى لو لم تكتمل بعد. المهم أن نبدأ من اتجاه واضح، لا من ملف مثالي.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    phoneHint: "اختياري، ويفضّل واتساب",
    requestType: "نوع المشروع",
    message: "تفاصيل الفكرة",
    budget: "الميزانية التقريبية",
    subjectPreview: "العنوان المقترح",
    send: "إرسال الرسالة",
    sending: "جارٍ الإرسال...",
    successTitle: "وصلت الرسالة",
    successBody: "سأعود إليك خلال 24 ساعة بخطوة واضحة ومباشرة.",
    reset: "إرسال رسالة جديدة",
    error: "تعذّر إرسال الرسالة الآن. يمكنك المحاولة مرة أخرى أو التواصل مباشرة عبر واتساب.",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
    whatsapp: "واتساب",
    placeholder: "ما الفكرة؟ ما الذي تريد الوصول إليه؟ وما الذي يجب أن أعرفه قبل أن أرتب الحل؟",
    defaultSubject: "رسالة تواصل جديدة",
    presets: {
      website: { label: "🖥 موقع جديد", subject: "موقع جديد", template: "أحتاج موقعًا جديدًا يرفع الانطباع الأول ويشرح القيمة بسرعة." },
      landing: { label: "📄 صفحة هبوط", subject: "صفحة هبوط", template: "أحتاج صفحة هبوط تركّز على عرض واضح ورسالة قوية وتحويل أفضل." },
      content: { label: "🎥 تعاون محتوى", subject: "تعاون محتوى", template: "أريد تعاون محتوى تقني يشرح المنتج بوضوح ويبني ثقة حقيقية." },
      redesign: { label: "🔄 إعادة تصميم", subject: "إعادة تصميم", template: "أريد إعادة تصميم كاملة بهوية أقوى وتجربة أكثر إقناعًا من النسخة الحالية." },
      consultation: { label: "💬 استشارة", subject: "استشارة", template: "أحتاج استشارة قصيرة لتحديد الاتجاه الأنسب قبل بدء التنفيذ." },
    },
    budgets: ["أقل من 500€", "500€ - 1500€", "1500€ - 3000€", "3000€+", "نحدده لاحقًا"],
  },
  en: {
    title: "Send the idea as it is",
    subtitle: "Even if it is incomplete. The point is to start from a clear direction, not a perfect brief.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    phoneHint: "Optional, WhatsApp preferred",
    requestType: "Project type",
    message: "Project details",
    budget: "Approximate budget",
    subjectPreview: "Suggested subject",
    send: "Send message",
    sending: "Sending...",
    successTitle: "Your message is in",
    successBody: "I will come back within 24 hours with a clear next step.",
    reset: "Send another message",
    error: "The message could not be sent right now. Please try again or use WhatsApp directly.",
    invalidEmail: "Please enter a valid email address",
    whatsapp: "WhatsApp",
    placeholder: "What are you building, what should this improve, and what would make the final result feel like a win?",
    defaultSubject: "New inquiry",
    presets: {
      website: { label: "🖥 New website", subject: "New website", template: "I need a new website that raises trust fast and presents the offer more clearly." },
      landing: { label: "📄 Landing page", subject: "Landing page", template: "I need a landing page focused on one clear offer, sharper hierarchy, and stronger conversion." },
      content: { label: "🎥 Content collaboration", subject: "Content collaboration", template: "I want a content collaboration that explains the product honestly and builds trust." },
      redesign: { label: "🔄 Redesign", subject: "Redesign", template: "I want a full redesign with a stronger identity and a more persuasive user experience." },
      consultation: { label: "💬 Consultation", subject: "Consultation", template: "I need a short consultation to define the strongest direction before execution." },
    },
    budgets: ["Under 500€", "500€ - 1500€", "1500€ - 3000€", "3000€+", "We can define it later"],
  },
} as const;

const inputClass =
  "w-full rounded-[1.4rem] border border-border bg-white/6 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground-soft focus:border-primary/70 focus:bg-white/10";

export function ContactForm({ locale, whatsappUrl }: ContactFormProps) {
  const t = copy[locale];
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [budget, setBudget] = useState("");
  const [subjectLine, setSubjectLine] = useState<string>(t.defaultSubject);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = form.name.trim().length > 1 && emailValid && form.message.trim().length > 10;
  const submitting = status === "sending";

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectPreset(key: PresetKey) {
    const nextPreset = activePreset === key ? null : key;
    setActivePreset(nextPreset);
    setSubjectLine(nextPreset ? t.presets[nextPreset].subject : t.defaultSubject);

    const template = nextPreset ? t.presets[nextPreset].template : "";
    setForm((current) => ({
      ...current,
      message: current.message.trim().length > 10 && nextPreset !== null ? current.message : template,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouchedEmail(true);

    if (!canSubmit) return;

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subject: subjectLine,
          budget,
          locale,
          projectTypes: activePreset ? [activePreset] : [],
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="glass-panel rounded-[1.8rem] p-6 text-center">
        <span className="eyebrow">{locale === "ar" ? "تم الاستلام" : "Received"}</span>
        <h3 className="headline-display text-3xl font-semibold text-foreground">{t.successTitle}</h3>
        <p className="mt-3 text-sm leading-7 text-foreground-muted">{t.successBody}</p>
        <button
          type="button"
          className="button-primary-shell mt-5"
          onClick={() => {
            setStatus("idle");
            setTouchedEmail(false);
            setActivePreset(null);
            setBudget("");
            setSubjectLine(t.defaultSubject);
            setForm({ name: "", email: "", phone: "", message: "" });
          }}
        >
          {t.reset}
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {status === "error" ? (
        <div className="glass-panel rounded-[1.5rem] border-red-400/20 bg-red-500/8 p-4">
          <p className="text-sm leading-6 text-foreground-muted">{t.error}</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button-secondary-shell mt-3">
            {t.whatsapp}
          </a>
        </div>
      ) : null}

      <div>
        <h3 className="headline-display text-3xl font-semibold text-foreground">{t.title}</h3>
        <p className="mt-2 text-sm leading-7 text-foreground-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground-muted">{t.name}</span>
          <input className={inputClass} value={form.name} onChange={(event) => updateField("name", event.target.value)} disabled={submitting} autoComplete="name" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground-muted">{t.email}</span>
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onBlur={() => setTouchedEmail(true)}
            onChange={(event) => updateField("email", event.target.value)}
            disabled={submitting}
            autoComplete="email"
          />
          {touchedEmail && !emailValid ? <small className="block text-xs font-medium text-red-300">{t.invalidEmail}</small> : null}
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-foreground-muted">
          {t.phone} <small className="text-foreground-soft">({t.phoneHint})</small>
        </span>
        <input className={inputClass} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} disabled={submitting} autoComplete="tel" />
      </label>

      <div className="space-y-3">
        <span className="text-sm font-medium text-foreground-muted">{t.requestType}</span>
        <div className="flex flex-wrap gap-2" data-testid="contact-preset-list">
          {(Object.keys(t.presets) as PresetKey[]).map((key) => {
            const active = activePreset === key;
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.96 }}
                className={cn(active ? "button-primary-shell" : "button-secondary-shell", "text-sm")}
                onClick={() => selectPreset(key)}
                disabled={submitting}
                aria-pressed={active}
                data-testid={`preset-${key}`}
              >
                {t.presets[key].label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel rounded-[1.5rem] p-4">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground-soft">{t.subjectPreview}</span>
        <p className="mt-2 text-sm font-semibold text-foreground" data-testid="contact-subject-preview">
          {subjectLine}
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-foreground-muted">{t.message}</span>
        <textarea
          className={cn(inputClass, "min-h-40 resize-y")}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          disabled={submitting}
          rows={7}
          placeholder={t.placeholder}
        />
      </label>

      <div className="space-y-3">
        <span className="text-sm font-medium text-foreground-muted">{t.budget}</span>
        <div className="flex flex-wrap gap-2">
          {t.budgets.map((item) => (
            <motion.button
              key={item}
              type="button"
              whileTap={{ scale: 0.96 }}
              className={cn(budget === item ? "button-primary-shell" : "button-secondary-shell", "text-sm")}
              onClick={() => setBudget(item)}
              disabled={submitting}
              aria-pressed={budget === item}
            >
              {item}
            </motion.button>
          ))}
        </div>
      </div>

      <button type="submit" className="button-primary-shell w-full justify-center" disabled={!canSubmit || submitting}>
        {submitting ? t.sending : t.send}
      </button>
    </form>
  );
}
