"use client";

import { ArrowUpRight, Clock3, Mail, MessageCircle, MonitorPlay, Network, ShieldCheck } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

import { LiquidContactForm } from "@/components/site/liquid-contact-form";
import { PageHero } from "@/components/studio/primitives";
import { socialLinks } from "@/content/site";
import type { RebuildLocaleContent } from "@/data/rebuild-content";
import { rebuildContent } from "@/data/rebuild-content";
import type { Locale } from "@/types/cms";

type ContactHubPageProps = {
  locale: Locale;
  content?: RebuildLocaleContent["contact"];
};

const copy = {
  en: {
    pill: "Contact",
    title: "Tell me what you want to *build*.",
    body: "Websites, product pages, MoPlayer questions, YouTube collaborations or a serious redesign — send it as it is, even unfinished. I reply with a clear next step.",
    write: "Write a message",
    formTitle: "Project inquiry",
    formBody: "A short brief is enough: where you are now, the goal, and what matters most.",
    channels: "Direct channels",
    timezone: "Local time",
    germany: "Germany",
    syria: "Syria",
    privacy: "Privacy",
    privacyBody: "Your message is used only to answer your request — no newsletter, no advertising.",
    languages: "Arabic · German · English",
    socials: [
      { id: "whatsapp", label: "WhatsApp", detail: "Fastest for short questions" },
      { id: "email", label: "Email", detail: socialLinks.email },
      { id: "linkedin", label: "LinkedIn", detail: "Professional profile" },
      { id: "youtube", label: "YouTube", detail: "Collaborations & reviews" },
    ],
  },
  ar: {
    pill: "تواصل",
    title: "احكِ لي ماذا تريد أن *تبني*.",
    body: "موقع، صفحة منتج، سؤال عن MoPlayer، تعاون على يوتيوب، أو إعادة تصميم جادّة — أرسل الفكرة كما هي حتى لو لم تكتمل، وأردّ عليك بخطوة تالية واضحة.",
    write: "اكتب رسالتك",
    formTitle: "طلب مشروع",
    formBody: "يكفي شرح مختصر: أين وصلت، ما هدفك، وما أهم نتيجة تريدها.",
    channels: "قنوات مباشرة",
    timezone: "الوقت المحلي",
    germany: "ألمانيا",
    syria: "سوريا",
    privacy: "الخصوصية",
    privacyBody: "رسالتك تُستخدم فقط للرد على طلبك — بدون نشرات بريدية أو إعلانات.",
    languages: "العربية · الألمانية · الإنجليزية",
    socials: [
      { id: "whatsapp", label: "واتساب", detail: "الأسرع للأسئلة القصيرة" },
      { id: "email", label: "البريد", detail: socialLinks.email },
      { id: "linkedin", label: "LinkedIn", detail: "الملف المهني" },
      { id: "youtube", label: "يوتيوب", detail: "تعاون ومراجعات" },
    ],
  },
} as const;

const channelMeta = {
  whatsapp: { icon: MessageCircle, href: socialLinks.whatsapp, external: true },
  email: { icon: Mail, href: `mailto:${socialLinks.email}`, external: false },
  linkedin: { icon: Network, href: socialLinks.linkedin, external: true },
  youtube: { icon: MonitorPlay, href: socialLinks.youtube, external: true },
} as const;

function formatTime(locale: Locale, timeZone: string, date: Date) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

// Client-only clock: the server snapshot is null so SSR markup matches, and the
// time fills in after mount (rendering a real time during SSR caused React #418).
const clockStore = {
  subscribe(onChange: () => void) {
    const timer = window.setInterval(onChange, 30_000);
    return () => window.clearInterval(timer);
  },
  getSnapshot: () => Math.floor(Date.now() / 30_000),
  getServerSnapshot: () => null,
};

function LocalTimes({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const tick = useSyncExternalStore(clockStore.subscribe, clockStore.getSnapshot, clockStore.getServerSnapshot);
  const now = useMemo(() => (tick === null ? null : new Date()), [tick]);
  const zones = [
    { city: t.germany, zone: "Europe/Berlin" },
    { city: t.syria, zone: "Asia/Damascus" },
  ];
  return (
    <div className="st-side-block">
      <p className="st-meta st-mono">
        <Clock3 size={14} aria-hidden /> {t.timezone}
      </p>
      <dl className="st-times">
        {zones.map((item) => (
          <div key={item.zone}>
            <dt>{item.city}</dt>
            <dd>{now ? formatTime(locale, item.zone, now) : "--:--"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ContactHubPage({ locale, content }: ContactHubPageProps) {
  const t = copy[locale];
  // Admin-edited contact copy wins; the bundled default falls back to the
  // curated copy above.
  const bundled = rebuildContent[locale].contact;
  const pick = (cms: string | undefined, curated: string, original: string) => (cms && cms.trim() && cms !== original ? cms : curated);
  const title = pick(content?.title, t.title, bundled.title);
  const body = pick(content?.body, t.body, bundled.body);
  const formTitle = pick(content?.directTitle, t.formTitle, bundled.directTitle);

  return (
    <div className="st-page">
      <PageHero pill={t.pill} title={title} lead={body}>
        <div className="st-actions">
          <a href="#inquiry-form" className="st-btn st-btn--primary">
            {t.write}
            <ArrowUpRight size={18} aria-hidden />
          </a>
          <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--ghost">
            <MessageCircle size={17} aria-hidden />
            WhatsApp
          </a>
        </div>
      </PageHero>

      <section className="st-section st-section--tight">
        <div className="st-container st-contact">
          <section className="contact-form-panel st-contact-form" id="inquiry-form" aria-label={formTitle}>
            <LiquidContactForm locale={locale} />
          </section>

          <aside className="st-contact-side">
            <div className="st-side-block">
              <p className="st-meta st-mono">{t.channels}</p>
              <ul className="st-channels">
                {t.socials.map((item) => {
                  const meta = channelMeta[item.id];
                  const Icon = meta.icon;
                  return (
                    <li key={item.id}>
                      <a href={meta.href} target={meta.external ? "_blank" : undefined} rel={meta.external ? "noopener noreferrer" : undefined}>
                        <span className="st-channel-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                        <span className="st-channel-text">
                          <strong>{item.label}</strong>
                          <small>{item.detail}</small>
                        </span>
                        <ArrowUpRight size={15} aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <LocalTimes locale={locale} />
            <div className="st-side-block">
              <p className="st-meta st-mono">
                <ShieldCheck size={14} aria-hidden /> {t.privacy}
              </p>
              <p className="st-side-note">{t.privacyBody}</p>
              <p className="st-side-note">{t.languages}</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
