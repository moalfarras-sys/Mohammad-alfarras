import { ArrowUpRight, Download, FileText, Languages, Mail, MapPin, PlayCircle, Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SectionIntro, StudioCta } from "@/components/studio/primitives";
import { cvPageCopy } from "@/content/cv";
import { socialLinks } from "@/content/site";
import { languageLevels } from "@/content/site-data";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

type CvExperience = {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
};

type CvPageProps = {
  locale: Locale;
  profileName: string;
  portrait: string;
  downloads: { branded: string; docx: string };
  stats: { views: number; videos: number; subscribers: number; projects: number; apps: number };
  experience: CvExperience[];
};

const copy = {
  en: {
    pill: "Curriculum vitae",
    role: "Web developer & digital designer",
    sub: "Logistics dispatcher · MoPlayer & MoOS builder · Arabic tech creator",
    location: "Based in Germany · from Al-Hasakah, Syria",
    pdf: "Download PDF",
    docx: "DOCX version",
    german: "German CV (PDF)",
    print: "Print view",
    stats: { projects: "Client projects online", apps: "Apps released", views: "YouTube views", subscribers: "Subscribers" },
    profileLabel: "Profile",
    profileTitle: "Operations discipline, *digital* execution.",
    profile: [
      "My path started with a practical question: how can complicated work become clearer, faster and less chaotic? It followed me from production floors and logistics dispatch into interfaces and systems.",
      "Germany taught me that discipline, language and reliability are part of the product itself. I treat a website or an app as a complete system — structure, copy, interface, code and support.",
      "Today I combine logistics experience, web development, Arabic tech content and my own products to build digital experiences that are clear, credible and built to grow.",
    ],
    experienceLabel: "Experience",
    experienceTitle: "Work and *products*.",
    moplayer: {
      role: "MoPlayer — product owner & developer",
      company: "Own product · Android, Android TV, Windows",
      period: "2024 – now",
      location: "Remote",
      description:
        "Media player family for user-provided M3U/Xtream sources: Classic and Pro for Android/Android TV and a Windows edition, with QR activation, signed releases and in-app updates.",
      highlights: ["Android TV", "QR activation", "Release pipeline", "Support"],
    },
    skillsLabel: "Skills",
    skillsTitle: "What I *use* every week.",
    languagesLabel: "Languages",
    principlesLabel: "Working principles",
    youtube: "YouTube channel",
    ctaLabel: "Hiring or briefing?",
    ctaTitle: "Let's talk about the *role* or project.",
    ctaBody: "Send the role, the scope, the timeline and what needs to be proven — I reply in Arabic, German or English.",
    contact: "Contact me",
  },
  ar: {
    pill: "السيرة الذاتية",
    role: "مطوّر ومصمّم مواقع ومنتجات رقمية",
    sub: "ديسبوزيشن في اللوجستيات · صانع MoPlayer وMoOS · صانع محتوى تقني عربي",
    location: "مقيم في ألمانيا · من الحسكة، سوريا",
    pdf: "تحميل PDF",
    docx: "نسخة DOCX",
    german: "النسخة الألمانية (PDF)",
    print: "نسخة الطباعة",
    stats: { projects: "مشاريع عملاء منشورة", apps: "تطبيقات صادرة", views: "مشاهدة على يوتيوب", subscribers: "مشترك" },
    profileLabel: "نبذة",
    profileTitle: "انضباط تشغيلي، وتنفيذ *رقمي*.",
    profile: [
      "بدأت رحلتي بسؤال عملي: كيف نجعل العمل المعقّد أوضح وأسرع وأقل فوضى؟ رافقني هذا السؤال من أرض الإنتاج ومكاتب الديسبوزيشن إلى بناء الواجهات والأنظمة.",
      "في ألمانيا تعلّمت أن الانضباط واللغة والموثوقية جزء من المنتج نفسه. لذلك أتعامل مع الموقع أو التطبيق كنظام كامل — الهيكل، النص، الواجهة، البرمجة والدعم.",
      "اليوم أجمع بين خبرة اللوجستيات، تطوير الويب، المحتوى التقني العربي، ومنتجاتي الخاصة لأبني تجارب رقمية واضحة وموثوقة وقابلة للنمو.",
    ],
    experienceLabel: "الخبرة",
    experienceTitle: "العمل *والمنتجات*.",
    moplayer: {
      role: "MoPlayer — مالك المنتج ومطوّره",
      company: "منتج خاص · Android وAndroid TV وWindows",
      period: "2024 – الآن",
      location: "عن بُعد",
      description:
        "عائلة مشغّلات وسائط لمصادر M3U/Xtream التي يضيفها المستخدم: Classic وPro لأجهزة Android وAndroid TV ونسخة Windows، مع تفعيل عبر QR وإصدارات موقّعة وتحديثات داخل التطبيق.",
      highlights: ["Android TV", "تفعيل QR", "نظام إصدارات", "دعم"],
    },
    skillsLabel: "المهارات",
    skillsTitle: "ما *أستخدمه* كل أسبوع.",
    languagesLabel: "اللغات",
    principlesLabel: "مبادئ العمل",
    youtube: "قناة يوتيوب",
    ctaLabel: "توظيف أو مشروع؟",
    ctaTitle: "لنتحدث عن *الدور* أو المشروع.",
    ctaBody: "أرسل الدور، النطاق، المدة، وما الذي يجب أن يثبته العمل — أردّ بالعربية أو الألمانية أو الإنجليزية.",
    contact: "تواصل معي",
  },
} as const;

function compactNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/**
 * A recruiter-readable CV: real roles from the CMS, real numbers, the three
 * download formats, and no gimmicks. Rendered on the server — no client JS.
 */
export function InteractiveCvPage({ locale, profileName, portrait, downloads, stats, experience }: CvPageProps) {
  const t = copy[locale];
  const isAr = locale === "ar";
  const cv = cvPageCopy[locale];
  const roles = [...experience, { id: "moplayer", ...t.moplayer, highlights: [...t.moplayer.highlights] }];
  const statItems = [
    { label: t.stats.projects, value: compactNumber(locale, stats.projects) },
    { label: t.stats.apps, value: compactNumber(locale, stats.apps) },
    { label: t.stats.views, value: compactNumber(locale, stats.views) },
    { label: t.stats.subscribers, value: compactNumber(locale, stats.subscribers) },
  ];

  return (
    <div className="st-page st-cv">
      <section className="st-page-hero">
        <div className="st-container st-cv-hero">
          <figure className="st-cv-photo">
            <Image src={portrait} alt={isAr ? `صورة ${profileName}` : `Portrait of ${profileName}`} fill preload sizes="(max-width: 900px) 60vw, 300px" quality={70} className="st-portrait-img" />
          </figure>
          <div className="st-cv-id">
            <p className="st-pill">
              <span className="st-pill-dot" aria-hidden="true" />
              {t.pill}
            </p>
            <h1 className="st-h1">{profileName}</h1>
            <p className="st-cv-role">{t.role}</p>
            <p className="st-cv-sub">{t.sub}</p>
            <ul className="st-cv-facts">
              <li>
                <MapPin size={15} aria-hidden /> {t.location}
              </li>
              <li>
                <Languages size={15} aria-hidden /> {languageLevels[locale].map((l) => l.label).join(" · ")}
              </li>
              <li>
                <Mail size={15} aria-hidden /> <a href={`mailto:${socialLinks.email}`}>{socialLinks.email}</a>
              </li>
            </ul>
            <div className="st-actions">
              <a href={downloads.branded} className="st-btn st-btn--primary" download>
                <Download size={17} aria-hidden />
                {t.pdf}
              </a>
              <a href={downloads.docx} className="st-btn st-btn--ghost" download>
                <FileText size={17} aria-hidden />
                {t.docx}
              </a>
              <a href="/api/cv-pdf?locale=de&variant=branded" className="st-btn st-btn--ghost" download hrefLang="de">
                <Languages size={17} aria-hidden />
                {t.german}
              </a>
              <a href={`/cv-print/${locale}`} className="st-btn st-btn--ghost" target="_blank" rel="noopener">
                <Printer size={17} aria-hidden />
                {t.print}
              </a>
            </div>
          </div>
        </div>

        <div className="st-container">
          <dl className="st-cv-stats">
            {statItems.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="st-section">
        <div className="st-container st-about">
          <div>
            <SectionIntro index="01" label={t.profileLabel} title={t.profileTitle} />
            <div className="st-prose">
              {t.profile.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <aside className="st-about-side">
            <div>
              <p className="st-meta st-mono">{t.languagesLabel}</p>
              <ul className="st-lang-list">
                {languageLevels[locale].map((language) => (
                  <li key={language.id}>
                    <strong>{language.label}</strong>
                    <span>{language.level}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="st-meta st-mono">{t.principlesLabel}</p>
              <ul className="st-check-list">
                {cv.principles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="st-section">
        <div className="st-container">
          <SectionIntro index="02" label={t.experienceLabel} title={t.experienceTitle} />
          <ol className="st-roles">
            {roles.map((item) => (
              <li className="st-role st-reveal" key={item.id}>
                <div className="st-role-when">
                  <span className="st-mono">{item.period}</span>
                  <span>{item.location}</span>
                </div>
                <div className="st-role-body">
                  <h3>{item.role}</h3>
                  <p className="st-role-company">{item.company}</p>
                  {item.description ? <p>{item.description}</p> : null}
                  {item.highlights.length ? (
                    <ul className="st-tags">
                      {item.highlights.slice(0, 5).map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="st-section">
        <div className="st-container">
          <SectionIntro index="03" label={t.skillsLabel} title={t.skillsTitle} />
          <div className="st-skill-groups">
            {cv.skillGroups.map((group) => (
              <div className="st-skill-group st-reveal" key={group.title}>
                <h3>{group.title}</h3>
                <ul className="st-tags">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="st-cv-channel">
            <a className="st-link" href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
              <PlayCircle size={16} aria-hidden />
              {t.youtube}
              <ArrowUpRight size={15} aria-hidden />
            </a>
          </p>
        </div>
      </section>

      <StudioCta label={t.ctaLabel} title={t.ctaTitle} body={t.ctaBody}>
        <Link href={withLocale(locale, "contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
          {t.contact}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        <a href={downloads.branded} className="st-btn st-btn--ghost" download>
          <Download size={17} aria-hidden />
          {t.pdf}
        </a>
      </StudioCta>
    </div>
  );
}
