import Image from "next/image";
import { ArrowUpRight, Clock3, Mail, MessageCircle, MonitorPlay, Network, Send, ShieldCheck } from "lucide-react";

import { LiquidContactForm } from "@/components/site/liquid-contact-form";
import { Reveal, SplitHeadline, TiltCard } from "@/components/v3/motion-kit";
import { socialLinks } from "@/content/site";
import type { RebuildLocaleContent } from "@/data/rebuild-content";
import { rebuildContent } from "@/data/rebuild-content";
import type { Locale } from "@/types/cms";

import { Eyebrow, SectionHead } from "./v3-page-parts";
import { LocalTimes } from "./local-times";

const copy = {
  en: {
    pill: "Contact",
    title: "Tell me what you want to *build*.",
    body: "Websites, product pages, MoPlayer questions, YouTube collaborations or a serious redesign — send it as it is, even unfinished. I reply with a clear next step.",
    portraitAlt: "Mohammad Alfarras with holographic design tool icons floating above his hand",
    based: "Based in Germany",
    languages: "Arabic · German · English",
    direct: "Direct",
    whatsappDetail: "Fastest for short questions",
    emailLabel: "Email",
    more: "Also on",
    linkedinDetail: "Professional profile",
    youtubeDetail: "Collaborations & reviews",
    telegramDetail: "Messages",
    formLabel: "Project inquiry",
    formTitle: "Write it the way you would *say* it.",
    formBody: "A short brief is enough: where you are now, the goal, and what matters most.",
    timezone: "Local time",
    germany: "Germany",
    syria: "Syria",
    privacy: "Privacy",
    privacyBody: "Your message is used only to answer your request — no newsletter, no advertising.",
  },
  ar: {
    pill: "تواصل",
    title: "احكِ لي ماذا تريد أن *تبني*.",
    body: "موقع، صفحة منتج، سؤال عن MoPlayer، تعاون على يوتيوب، أو إعادة تصميم جادّة — أرسل الفكرة كما هي حتى لو لم تكتمل، وأردّ عليك بخطوة تالية واضحة.",
    portraitAlt: "محمد الفراس وفوق يده أيقونات أدوات تصميم هولوغرامية",
    based: "مقيم في ألمانيا",
    languages: "العربية · الألمانية · الإنجليزية",
    direct: "مباشرة",
    whatsappDetail: "الأسرع للأسئلة القصيرة",
    emailLabel: "البريد الإلكتروني",
    more: "تجدني أيضاً على",
    linkedinDetail: "الملف المهني",
    youtubeDetail: "تعاون ومراجعات",
    telegramDetail: "رسائل",
    formLabel: "طلب مشروع",
    formTitle: "اكتبها كما *تحكيها*.",
    formBody: "يكفي شرح مختصر: أين وصلت، ما هدفك، وما أهم نتيجة تريدها.",
    timezone: "الوقت المحلي",
    germany: "ألمانيا",
    syria: "سوريا",
    privacy: "الخصوصية",
    privacyBody: "رسالتك تُستخدم فقط للرد على طلبك — بدون نشرات بريدية أو إعلانات.",
  },
} as const;

/** "+49 176 23419358" from the real wa.me link. */
function phoneFromWhatsapp(url: string) {
  const digits = url.replace(/\D/g, "");
  if (!digits.startsWith("49") || digits.length < 11) return `+${digits}`;
  return `+49 ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

export function ContactV3({ locale, content }: { locale: Locale; content?: RebuildLocaleContent["contact"] }) {
  const t = copy[locale];
  // Admin-edited contact copy wins; the bundled default falls back to the curated copy above.
  const bundled = rebuildContent[locale].contact;
  const pick = (cms: string | undefined, curated: string, original: string) => (cms && cms.trim() && cms !== original ? cms : curated);
  const title = pick(content?.title, t.title, bundled.title);
  const body = pick(content?.body, t.body, bundled.body);
  const formLabel = pick(content?.directTitle, t.formLabel, bundled.directTitle);

  const secondary = [
    { id: "linkedin", label: "LinkedIn", detail: t.linkedinDetail, href: socialLinks.linkedin, icon: Network },
    { id: "youtube", label: "YouTube", detail: t.youtubeDetail, href: socialLinks.youtube, icon: MonitorPlay },
    { id: "telegram", label: "Telegram", detail: t.telegramDetail, href: socialLinks.telegram, icon: Send },
  ];

  return (
    <div className="st-page v3p v3p-contact">
      <section className="v3p-hero v3k-hero">
        <div className="st-container v3k-hero-grid">
          <Reveal className="v3k-portrait-wrap" y={30}>
            <TiltCard className="v3k-portrait" max={7}>
              <Image src="/images/protofeilnew.jpeg" alt={t.portraitAlt} fill priority sizes="(max-width: 900px) 86vw, 460px" quality={75} className="v3-cover v3k-portrait-img" />
              <span className="v3-holo-sweep" aria-hidden="true" />
              <span className="v3-holo-scan" aria-hidden="true" />
              <span className="v3k-portrait-fade" aria-hidden="true" />
            </TiltCard>
            <span className="v3k-chip v3k-chip--a">
              <span className="v3k-chip-dot" aria-hidden="true" />
              {t.based}
            </span>
            <span className="v3k-chip v3k-chip--b">{t.languages}</span>
          </Reveal>

          <div className="v3k-hero-copy">
            <Reveal y={14}>
              <Eyebrow>{t.pill}</Eyebrow>
            </Reveal>
            <SplitHeadline text={title} className="v3p-h1" />
            <Reveal delay={0.2} y={18}>
              <p className="v3p-lead">{body}</p>
            </Reveal>

            <Reveal delay={0.32} y={22} className="v3k-methods">
              <p className="v3k-label">{t.direct}</p>
              <a className="v3k-method v3k-method--wa" href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                <span className="v3k-method-icon" aria-hidden="true">
                  <MessageCircle size={22} />
                </span>
                <span className="v3k-method-text">
                  <strong>WhatsApp</strong>
                  <bdi>{phoneFromWhatsapp(socialLinks.whatsapp)}</bdi>
                  <small>{t.whatsappDetail}</small>
                </span>
                <ArrowUpRight size={18} aria-hidden className="v3k-method-arrow" />
              </a>
              <a className="v3k-method v3k-method--mail" href={`mailto:${socialLinks.email}`}>
                <span className="v3k-method-icon" aria-hidden="true">
                  <Mail size={22} />
                </span>
                <span className="v3k-method-text">
                  <strong>{t.emailLabel}</strong>
                  <bdi>{socialLinks.email}</bdi>
                </span>
                <ArrowUpRight size={18} aria-hidden className="v3k-method-arrow" />
              </a>
              <p className="v3k-label v3k-label--more">{t.more}</p>
              <ul className="v3k-socials">
                {secondary.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        <Icon size={17} aria-hidden />
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.detail}</small>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="v3p-section" id="inquiry">
        <div className="st-container v3k-form-grid">
          <div className="v3k-form-col">
            <SectionHead eyebrow={formLabel} title={t.formTitle} body={t.formBody} />
            <Reveal y={30} amount={0.1}>
              <section className="contact-form-panel v3k-form" id="inquiry-form" aria-label={formLabel}>
                <LiquidContactForm locale={locale} />
              </section>
            </Reveal>
          </div>
          <Reveal className="v3k-aside" y={24} delay={0.1}>
            <div className="v3k-aside-media">
              <Image src="/images/service_web.png" alt="" fill sizes="(max-width: 900px) 92vw, 380px" quality={65} className="v3-cover" />
            </div>
            <div className="v3k-aside-block">
              <p className="v3k-label">
                <Clock3 size={14} aria-hidden /> {t.timezone}
              </p>
              <LocalTimes
                locale={locale}
                zones={[
                  { city: t.germany, zone: "Europe/Berlin" },
                  { city: t.syria, zone: "Asia/Damascus" },
                ]}
              />
            </div>
            <div className="v3k-aside-block">
              <p className="v3k-label">
                <ShieldCheck size={14} aria-hidden /> {t.privacy}
              </p>
              <p className="v3k-note">{t.privacyBody}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
