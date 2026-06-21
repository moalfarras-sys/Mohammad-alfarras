"use client";

import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, MonitorPlay, Network, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LiquidContactForm } from "@/components/site/liquid-contact-form";
import { socialLinks } from "@/content/site";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";
import type { RebuildLocaleContent } from "@/data/rebuild-content";

type ContactHubPageProps = {
  locale: Locale;
  content?: RebuildLocaleContent["contact"];
};

const copy = {
  en: {
    eyebrow: "Digital Hub / Direct Line",
    title: "Tell me what you want to build. I will help shape the next digital move.",
    body:
      "For premium websites, product pages, MoPlayer questions, YouTube collaborations, or a serious redesign, this is the cleanest way to reach me.",
    status: "Available for premium projects & collaborations",
    formTitle: "The direct line",
    formBody: "A focused brief is enough. Send the current situation, the goal, and what matters most.",
    socialTitle: "Choose your channel",
    socialBody: "Use the form for structured project inquiries, or open a direct channel if the conversation is already clear.",
    locationTitle: "Working between real operations and digital systems",
    locationBody: "Based in Germany, connected to Syrian roots, and building for bilingual audiences across web, product, and content.",
    germany: "Germany",
    syria: "Syria",
    timezone: "Current local time",
    privacy: "Privacy first",
    privacyBody: "Your message stays focused on the request. No tracking tricks, no public exposure, no unnecessary data.",
    cta: "Explore selected work",
    socials: {
      youtube: "YouTube",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn",
      email: "Email",
    },
    socialDetails: {
      youtube: "Creator channel",
      whatsapp: "Fast direct chat",
      linkedin: "Professional profile",
      email: "",
    },
  },
  ar: {
    eyebrow: "تواصل مباشر",
    title: "احكِ لي شو بدك تبني، وبساعدك نرتّب الخطوة التالية بوضوح.",
    body:
      "موقع احترافي، صفحة منتج، سؤال عن MoPlayer، تعاون على يوتيوب، أو إعادة تصميم — هاي أوضح طريقة توصلني فيها.",
    status: "متاح لاستقبال مشاريع وتعاون جديد",
    formTitle: "تواصل مباشر",
    formBody: "يكفي شرح مختصر: وين وصلت، شو هدفك، وشو أهم نتيجة بدك توصلها.",
    socialTitle: "اختر طريقة التواصل المناسبة",
    socialBody: "استخدم النموذج للطلبات المرتّبة، أو راسلني مباشرة إذا فكرتك واضحة وجاهزة للنقاش.",
    locationTitle: "أعمل بين أرض الواقع وعالم البرمجة والمواقع",
    locationBody: "مقيم في ألمانيا وأصلي من سوريا، وأبني مواقع وتطبيقات ومحتوى بالعربي والإنجليزي.",
    germany: "ألمانيا",
    syria: "سوريا",
    timezone: "الوقت المحلي الآن",
    privacy: "الخصوصية أولًا",
    privacyBody: "رسالتك تبقى ضمن سياق الطلب فقط. بدون حيل تتبع، بدون نشر، وبدون بيانات غير لازمة.",
    cta: "استعرض الأعمال المختارة",
    socials: {
      youtube: "يوتيوب",
      whatsapp: "واتساب",
      linkedin: "LinkedIn",
      email: "البريد",
    },
    socialDetails: {
      youtube: "قناة المحتوى",
      whatsapp: "محادثة مباشرة سريعة",
      linkedin: "الملف المهني",
      email: "",
    },
  },
} as const;

const socialCards = [
  {
    id: "youtube",
    icon: MonitorPlay,
    href: socialLinks.youtube,
    tone: "#ff0000",
    detail: "Creator channel",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    href: socialLinks.whatsapp,
    tone: "#25d366",
    detail: "Fast direct chat",
  },
  {
    id: "linkedin",
    icon: Network,
    href: socialLinks.linkedin,
    tone: "#0a66c2",
    detail: "Professional profile",
  },
  {
    id: "email",
    icon: Mail,
    href: `mailto:${socialLinks.email}`,
    tone: "#48d8ff",
    detail: socialLinks.email,
  },
] as const;

function formatTime(locale: Locale, timeZone: string, date: Date) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function TimezoneWidget({ locale }: { locale: Locale }) {
  const [now, setNow] = useState(() => new Date());
  const t = repairMojibakeDeep(copy[locale]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const times = useMemo(
    () => [
      { city: t.germany, zone: "Europe/Berlin", time: formatTime(locale, "Europe/Berlin", now) },
      { city: t.syria, zone: "Asia/Damascus", time: formatTime(locale, "Asia/Damascus", now) },
    ],
    [locale, now, t.germany, t.syria],
  );

  return (
    <div className="contact-time-widget">
      <div>
        <Clock3 />
        <span>{t.timezone}</span>
      </div>
      {times.map((item) => (
        <article key={item.zone}>
          <strong>{item.time}</strong>
          <span>{item.city}</span>
        </article>
      ))}
    </div>
  );
}

export function ContactHubPage({ locale, content }: ContactHubPageProps) {
  const fallback = repairMojibakeDeep(copy[locale]);
  const t = {
    ...fallback,
    eyebrow: content?.eyebrow ?? fallback.eyebrow,
    title: content?.title ?? fallback.title,
    body: content?.body ?? fallback.body,
    formTitle: content?.directTitle ?? fallback.formTitle,
    formBody: content?.directBody ?? fallback.formBody,
    cta: content?.primaryCta ?? fallback.cta,
  };
  const chips = content?.chips?.length ? content.chips : [];

  return (
    <main className="contact-hub fresh-page">
      <section className="contact-hero">
        <div className="contact-hero-copy">
          <p className="fresh-eyebrow"><ShieldCheck size={15} />{t.eyebrow}</p>
          <div className="contact-live-status">
            <span aria-hidden="true" />
            <strong>{t.status}</strong>
          </div>
          <h1>{t.title}</h1>
          <p>{t.body}</p>
          <div className="fresh-actions">
            <a href="#inquiry-form" className="fresh-button fresh-button-primary magnetic-surface">
              {t.cta}
              <ArrowUpRight size={17} />
            </a>
            <a href={`mailto:${socialLinks.email}`} className="fresh-button magnetic-surface">
              {t.socials.email}
              <Mail size={17} />
            </a>
          </div>
          {chips.length ? (
            <div className="contact-chip-row">
              {chips.map((chip) => (
                <span key={chip} className="fresh-pill">{chip}</span>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="contact-orbit-card">
          <div className="contact-orbit-core">
            <ShieldCheck />
            <strong>{t.privacy}</strong>
            <p>{t.privacyBody}</p>
          </div>
          <TimezoneWidget locale={locale} />
        </aside>
      </section>

      <section className="contact-grid">
        <aside className="contact-social-panel">
          <p className="fresh-eyebrow"><MapPin size={15} />{t.socialTitle}</p>
          <h2>{t.locationTitle}</h2>
          <p>{t.locationBody}</p>
          <div className="contact-social-grid">
            {socialCards.map((item) => {
              const Icon = item.icon;
              const label = t.socials[item.id as keyof typeof t.socials];
              const detail = t.socialDetails[item.id as keyof typeof t.socialDetails] || item.detail;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target={item.id === "email" ? undefined : "_blank"}
                  rel={item.id === "email" ? undefined : "noopener noreferrer"}
                  className="contact-social-card magnetic-surface"
                  style={{ "--contact-tone": item.tone } as React.CSSProperties}
                >
                  <Icon />
                  <span>{label}</span>
                  <small>{detail}</small>
                  <ArrowUpRight size={15} />
                </a>
              );
            })}
          </div>
        </aside>

        <section className="contact-form-panel" id="inquiry-form">
          <div className="contact-form-head">
            <p className="fresh-eyebrow"><Mail size={15} />{t.formTitle}</p>
            <p>{t.formBody}</p>
          </div>
          <LiquidContactForm locale={locale} />
        </section>
      </section>
    </main>
  );
}
