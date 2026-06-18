import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Compass, Download, LifeBuoy, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

import { SITE_URL } from "@/content/site";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { OpenAssistantButton } from "./open-assistant-button";

export const revalidate = 3600;

const copy = {
  ar: {
    eyebrow: "المساعد الذكي للموقع",
    title: "اسأل، ودع المساعد يرشدك خطوة بخطوة",
    lead: "مساعد محمد الذكي يجيبك مباشرة داخل الموقع عن MoPlayer والتفعيل والتحميل والخدمات وطرق التواصل — بالعربية، وبدون أن تغادر الصفحة.",
    primary: "ابدأ المحادثة الآن",
    secondary: "تواصل بشري مباشر",
    capabilitiesTitle: "كيف يساعدك؟",
    capabilities: [
      { icon: "compass", title: "إرشاد داخل الموقع", body: "يشرح أي صفحة ويأخذك للقسم الصحيح بسرعة." },
      { icon: "download", title: "التحميل والإصدارات", body: "يوجّهك لتحميل النسخة الصحيحة: Pro أو Classic أو PC." },
      { icon: "shield", title: "التفعيل والربط", body: "يشرح خطوات تفعيل التلفزيون والربط بالكود بوضوح." },
      { icon: "support", title: "الدعم والتواصل", body: "يرتّب طلبك ويوجّهك لقناة الدعم أو التواصل المناسبة." },
    ],
    askTitle: "جرّب سؤالاً مباشراً",
    questions: ["كيف أفعّل MoPlayer Pro على التلفزيون؟", "ما الفرق بين Pro و Classic؟", "كيف أحمّل MoPlayer على الكمبيوتر؟", "كيف أتواصل مع محمد؟"],
    note: "المساعد دليل إرشادي ضمن الموقع. للطلبات الرسمية أو الحساسة استخدم صفحة التواصل أو الدعم.",
  },
  en: {
    eyebrow: "Smart site assistant",
    title: "Ask, and let the assistant guide you step by step",
    lead: "Mohammad's smart assistant answers right inside the site about MoPlayer, activation, downloads, services, and contact — in English, without leaving the page.",
    primary: "Start the conversation",
    secondary: "Talk to a human",
    capabilitiesTitle: "How it helps",
    capabilities: [
      { icon: "compass", title: "On-page guidance", body: "Explains any page and takes you to the right section fast." },
      { icon: "download", title: "Downloads & releases", body: "Points you to the correct build: Pro, Classic, or PC." },
      { icon: "shield", title: "Activation & pairing", body: "Walks you through TV activation and code pairing clearly." },
      { icon: "support", title: "Support & contact", body: "Organizes your request and routes you to the right channel." },
    ],
    askTitle: "Try a direct question",
    questions: ["How do I activate MoPlayer Pro on TV?", "What is the difference between Pro and Classic?", "How do I install MoPlayer on PC?", "How can I contact Mohammad?"],
    note: "The assistant is an in-site guide. For official or sensitive requests, use the contact or support page.",
  },
} satisfies Record<Locale, unknown>;

const iconFor = {
  compass: Compass,
  download: Download,
  shield: ShieldCheck,
  support: LifeBuoy,
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const isAr = loc === "ar";
  const title = isAr ? "المساعد الذكي للموقع | محمد الفراس" : "Smart site assistant | Mohammad Alfarras";
  const description = isAr
    ? "مساعد ذكي داخل موقع محمد الفراس يجيبك عن MoPlayer والتفعيل والتحميل والخدمات والتواصل بالعربية."
    : "A smart assistant inside Mohammad Alfarras' site that answers about MoPlayer, activation, downloads, services, and contact.";
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${loc}/ai`,
      languages: {
        ar: `${SITE_URL}/ar/ai`,
        en: `${SITE_URL}/en/ai`,
        "x-default": `${SITE_URL}/ar/ai`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${loc}/ai`,
      type: "website",
    },
  };
}

export default async function AiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const isAr = loc === "ar";
  const t = copy[loc];

  return (
    <div className="ai-page" dir={isAr ? "rtl" : "ltr"}>
      <section className="section-frame">
        <div className="ai-hero">
          <span className="ai-eyebrow">
            <Sparkles size={15} aria-hidden="true" /> {t.eyebrow}
          </span>
          <h1 className="ai-title">{t.title}</h1>
          <p className="ai-lead">{t.lead}</p>
          <div className="ai-actions">
            <OpenAssistantButton className="ai-cta ai-cta-primary">{t.primary}</OpenAssistantButton>
            <Link href={`/${loc}/contact`} className="ai-cta ai-cta-ghost" prefetch={false}>
              {t.secondary}
            </Link>
          </div>
        </div>

        <h2 className="ai-section-title">{t.capabilitiesTitle}</h2>
        <ul className="ai-grid" role="list">
          {t.capabilities.map((cap) => {
            const Icon = iconFor[cap.icon as keyof typeof iconFor];
            return (
              <li key={cap.title} className="ai-card">
                <span className="ai-card-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <strong>{cap.title}</strong>
                <p>{cap.body}</p>
              </li>
            );
          })}
        </ul>

        <h2 className="ai-section-title">{t.askTitle}</h2>
        <div className="ai-questions">
          {t.questions.map((q) => (
            <OpenAssistantButton key={q} prompt={q} className="ai-chip" withIcon={false}>
              <MessageCircle size={15} aria-hidden="true" /> {q}
            </OpenAssistantButton>
          ))}
        </div>

        <p className="ai-note">{t.note}</p>
      </section>
    </div>
  );
}
