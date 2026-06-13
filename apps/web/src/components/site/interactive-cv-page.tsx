import {
  ArrowUpRight,
  BriefcaseBusiness,
  Code2,
  Download,
  FileText,
  Languages,
  MonitorPlay,
  PlayCircle,
  Radio,
  Route,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/lib/i18n";
import { languageLevels } from "@/content/site-data";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
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

type InteractiveCvProps = {
  locale: Locale;
  profileName: string;
  portrait: string;
  downloads: {
    branded: string;
    docx: string;
  };
  stats: {
    views: number;
    videos: number;
    subscribers: number;
  };
  experience: CvExperience[];
};

function compactNumber(value: number, suffix = "+") {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M${suffix}`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K${suffix}`;
  return `${value}${suffix}`;
}

function copy(locale: Locale, stats: InteractiveCvProps["stats"]) {
  const ar = locale === "ar";
  return repairMojibakeDeep({
    heroTitle: ar ? "محمد الفراس - مهندس برمجيات ومعماري رقمي" : "Mohammad Alfarras - Software Engineer & Digital Architect",
    heroHook: ar
      ? "الجسر بين عالم اللوجستيات الواقعي والأنظمة الرقمية المتقدمة."
      : "Bridging the gap between physical logistics and digital systems.",
    developer: ar ? "وضع المطور" : "Developer Mode",
    creator: ar ? "وضع الصانع" : "Creator Mode",
    devBody: ar ? "واجهات ويب، أنظمة رقمية، Next.js، وقرارات تصميم قابلة للتوسع." : "Web interfaces, digital systems, Next.js, and scalable design decisions.",
    creatorBody: ar ? "يوتيوب، شرح تقني، مراجعات، وتحويل التجربة إلى محتوى واضح." : "YouTube, tech storytelling, reviews, and turning experiments into clear content.",
    cmdHint: ar ? "اضغط Ctrl/⌘ + K لوضع Dev" : "Press Ctrl/⌘ + K for Dev Mode",
    downloads: ar ? "تحميل السيرة" : "Download CV",
    docx: ar ? "نسخة DOCX" : "DOCX version",
    storyTitle: ar ? "رحلتي: من سوريا إلى ألمانيا، ومن العمليات إلى الهندسة." : "My story: from Syria to Germany, from operations to engineering.",
    story: ar
      ? [
          "بدأت رحلتي بعقلية عملية: كيف نجعل الأشياء أوضح، أسرع، وأقل فوضى؟ هذا السؤال رافقني من بيئة العمل الواقعية إلى بناء الواجهات والأنظمة.",
          "في ألمانيا تعلّمت أن الانضباط، اللغة، والموثوقية ليست تفاصيل جانبية، بل هي جزء من أي تجربة ناجحة. لذلك أتعامل مع الموقع أو التطبيق كنظام كامل وليس كشاشة جميلة فقط.",
          "اليوم أجمع بين اللوجستيات، تطوير الويب، صناعة المحتوى التقني، وMoPlayer لأبني تجارب رقمية مفهومة، موثوقة، وقابلة للنمو.",
        ]
      : [
          "My journey started with an operational question: how can complex work become clearer, faster, and less chaotic? That question followed me from real-world logistics into digital systems.",
          "In Germany, I learned that discipline, language, reliability, and trust are not side details. They are part of the product experience itself.",
          "Today I connect logistics thinking, web engineering, Arabic tech content, and MoPlayer into digital experiences that are clear, credible, and built to grow.",
        ],
    waypoints: [
      {
        year: "2015",
        title: ar ? "الانتقال" : "The Transition",
        body: ar ? "من سوريا إلى ألمانيا: بداية جديدة في 2015، لغة جديدة، ومسؤولية مختلفة." : "From Syria to Germany in 2015: a new beginning, a new language, and sharper responsibility.",
        icon: Route,
      },
      {
        year: ar ? "\u0627\u0644\u062e\u0628\u0631\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629" : "Operations",
        title: ar ? "مرحلة اللوجستيات" : "The Logistics Phase",
        body: ar ? "تشغيل، تنظيم، خدمة عملاء، وتعلّم كيف تتحرك الأعمال الحقيقية تحت الضغط." : "Operations, coordination, customer flow, and learning how real businesses move under pressure.",
        icon: Truck,
      },
      {
        year: ar ? "\u0627\u0644\u062a\u062d\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064a" : "Digital systems",
        title: ar ? "القفزة الرقمية" : "The Digital Leap",
        body: ar ? "Full Stack، يوتيوب، MoPlayer، وأنظمة ويب تربط المنتج بالمستخدم." : "Full stack work, YouTube, MoPlayer, and web systems connecting products with users.",
        icon: Code2,
      },
    ],
    skillTitle: ar ? "مهارات تقنية مرئية." : "Technical signal, made visible.",
    languageTitle: ar ? "لغات تربط التجربة بالعالم." : "Languages with real-world reach.",
    experienceTitle: ar ? "خبرة عملية ومشاريع رئيسية." : "Work experience and key projects.",
    metricsTitle: ar ? "لوحة نمو يوتيوب وصناعة المحتوى." : "YouTube and creator growth dashboard.",
    terminalTitle: ar ? "وضع الطرفية" : "Terminal Mode",
    terminalLines: ar
      ? ["> whoami", "Mohammad Alfarras: Engineer & Creator", "> fetching_story --source logistics", "Syria -> Germany -> Operations -> Web -> MoPlayer", "> status", "Building clear digital systems."]
      : ["> whoami", "Mohammad Alfarras: Engineer & Creator", "> fetching_story --source logistics", "Syria -> Germany -> Operations -> Web -> MoPlayer", "> status", "Building clear digital systems."],
    ctaTitle: ar ? "هل تريد نسخة رقمية أقوى من خبرتك أو مشروعك؟" : "Want a stronger digital version of your work?",
    ctaBody: ar ? "أستطيع تحويل الفكرة، الخبرة، أو الخدمة إلى موقع واضح وتجربة رقمية تقنع الزائر." : "I can turn an idea, expertise, or service into a clear website and digital experience that earns trust.",
    contact: ar ? "ابدأ الحديث" : "Start the conversation",
    badges: [
      [compactNumber(stats.views), ar ? "مشاهدات" : "Views"],
      [`${stats.videos}+`, ar ? "فيديو" : "Videos"],
      [ar ? "خبير لوجستيات" : "Logistics Expert", ar ? "عمليات" : "Operations"],
      [ar ? "باني تطبيقات" : "App Builder", "MoPlayer"],
    ],
    gameStats: [
      [stats.videos, ar ? "فيديو منشور" : "Videos published", PlayCircle],
      [stats.views, ar ? "إجمالي المشاهدات" : "Total views", Users],
      [4, ar ? "مشاريع ويب منشورة" : "Shipped web projects", Code2],
      [2, ar ? "منتجان من MoPlayer" : "MoPlayer products", MonitorPlay],
    ] as Array<[number, string, LucideIcon]>,
  });
}

export function InteractiveCvPage({ locale, profileName, portrait, downloads, stats, experience }: InteractiveCvProps) {
  const displayStats = {
    views: stats.views,
    videos: stats.videos,
    subscribers: stats.subscribers,
  };
  const t = copy(locale, displayStats);
  const isAr = locale === "ar";
  const skillProof = [
    ["Next.js + React", isAr ? "أنظمة ويب إنتاجية ثنائية اللغة" : "Production bilingual web systems"],
    ["TypeScript", isAr ? "واجهات API وCMS ومسارات منتج Typed" : "Typed APIs, CMS, and product flows"],
    ["Supabase + Postgres", isAr ? "بيانات المحتوى والإصدارات وقواعد الوصول" : "Content, release data, and access policies"],
    ["Android TV", isAr ? "MoPlayer Classic وMoPlayer Pro" : "MoPlayer Classic and MoPlayer Pro"],
    ["Product delivery", isAr ? "تنزيل وتفعيل ودعم وإدارة إصدارات" : "Downloads, activation, support, and releases"],
    ["Technical content", `${compactNumber(displayStats.views)} ${isAr ? "مشاهدة" : "views"} / ${displayStats.videos} ${isAr ? "فيديو" : "videos"}`],
  ] as const;
  const languages = languageLevels[locale];
  const languageFlags: Record<string, string> = {
    ar: "/icons/flag-sy-new.svg",
    de: "/icons/flag-de.svg",
    en: "/icons/flag-gb.svg",
  };

  return (
    <main className="cv-blueprint">
      <section className="cv-hero">
        <div className="cv-persona-grid">
          <div className="cv-persona cv-persona-dev">
            <Code2 />
            <strong>{t.developer}</strong>
            <span>{t.devBody}</span>
          </div>
          <div className="cv-persona cv-persona-creator">
            <PlayCircle />
            <strong>{t.creator}</strong>
            <span>{t.creatorBody}</span>
          </div>
        </div>

        <div className="cv-profile-wrap">
          <div className="cv-photo-shell">
            <Image src={portrait} alt={profileName} fill priority sizes="(max-width: 480px) 348px, (max-width: 900px) 86vw, 380px" quality={65} className="cv-photo" />
          </div>
          <div className="cv-hero-copy">
            <p className="fresh-eyebrow">Interactive CV / The Engineer&apos;s Blueprint</p>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroHook}</p>
            <div className="cv-floating-badges">
              {t.badges.map(([value, label]) => (
                <span key={`${value}-${label}`}><strong>{value}</strong>{label}</span>
              ))}
            </div>
            <div className="fresh-actions">
              <Link href={downloads.branded} className="fresh-button fresh-button-primary" download><Download size={17} />{t.downloads}</Link>
              <Link href={downloads.docx} className="fresh-button" download><FileText size={17} />{t.docx}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-game-stats">
        {t.gameStats.map(([value, label, Icon]) => <CountCard key={label} value={value as number} label={label as string} icon={Icon} />)}
      </section>

      <section className="cv-story-card">
        <div>
          <p className="fresh-eyebrow">{isAr ? "نبذة شخصية" : "About me"}</p>
          <h2>{t.storyTitle}</h2>
        </div>
        <div className="cv-story-copy">{t.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="cv-journey">
        <svg className="cv-journey-path" viewBox="0 0 260 820" preserveAspectRatio="none" aria-hidden="true">
          <path d="M130 20 C30 150 230 235 130 360 C35 480 225 570 130 800" pathLength={1} />
        </svg>
        <div className="cv-waypoints">
          {t.waypoints.map((item) => <TimelineItem key={item.year} item={item} />)}
        </div>
      </section>

      <section className="cv-skills">
        <div className="cv-skills-proof">
          <p className="fresh-eyebrow">Skills / Tech Stats</p>
          <h2>{t.skillTitle}</h2>
          <div className="cv-proof-grid">
            {skillProof.map(([label, proof]) => (
              <article className="cv-proof-card" key={label}>
                <ShieldCheck />
                <strong>{label}</strong>
                <span>{proof}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-languages">
        <h2>{t.languageTitle}</h2>
        <div>
          {languages.map((language) => (
            <LanguageBadge
              key={language.id}
              flagSrc={languageFlags[language.id]}
              title={language.label}
              level={language.level}
            />
          ))}
        </div>
      </section>

      <section className="cv-deep-dive">
        <p className="fresh-eyebrow">Experience / Projects</p>
        <h2>{t.experienceTitle}</h2>
        <div className="cv-experience-grid">
          {experience.slice(0, 3).map((item) => <ExperienceCard key={item.id} item={item} />)}
          <ExperienceCard item={{ id: "moplayer", role: "MoPlayer", company: isAr ? "تطبيق Android TV مخصص" : "Custom Android TV Player", period: "2024-now", location: "Product", description: isAr ? "تجربة منتج تجمع التشغيل، التفعيل، مصادر IPTV، والإصدارات الرسمية." : "A product experience connecting playback, activation, IPTV sources, and official release flow.", highlights: ["Android TV", "Activation", "Remote config", "Release system"] }} />
        </div>
      </section>

      <section className="cv-youtube-dashboard">
        <div>
          <p className="fresh-eyebrow">Creator Metrics</p>
          <h2>{t.metricsTitle}</h2>
        </div>
        <div className="cv-dashboard-cells">
          <CountCard value={displayStats.views} label={isAr ? "إجمالي المشاهدات" : "Total views"} icon={Radio} compact />
          <CountCard value={displayStats.subscribers} label={isAr ? "مشترك" : "Subscribers"} icon={Users} compact />
          <CountCard value={displayStats.videos} label={isAr ? "فيديو" : "Videos"} icon={MonitorPlay} compact />
        </div>
      </section>

      <section className="cv-final-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaBody}</p>
        <Link href={withLocale(locale, "contact")} className="fresh-button fresh-button-primary magnetic-surface">{t.contact}<ArrowUpRight size={17} /></Link>
      </section>
    </main>
  );
}

function CountCard({ value, label, icon: Icon, compact = false }: { value: number; label: string; icon: LucideIcon; compact?: boolean }) {
  return (
    <div className={compact ? "cv-count-card cv-count-card-compact" : "cv-count-card"}>
      <Icon />
      <strong>{compactNumber(value, value >= 1000 ? "+" : "")}</strong>
      <span>{label}</span>
    </div>
  );
}

function TimelineItem({ item }: { item: { year: string; title: string; body: string; icon: LucideIcon } }) {
  const Icon = item.icon;
  return (
    <article className="cv-waypoint">
      <span>{item.year}</span>
      <Icon />
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </article>
  );
}

function LanguageBadge({ flagSrc, title, level }: { flagSrc: string; title: string; level: string }) {
  return (
    <article className="cv-language-badge">
      <span className="cv-language-flag">
        <Image src={flagSrc} alt="" width={58} height={58} />
      </span>
      <div className="cv-language-title">
        <h3>{title}</h3>
      </div>
      <p>{level}</p>
      <Languages />
    </article>
  );
}

function ExperienceCard({ item }: { item: CvExperience }) {
  return (
    <article className="cv-experience-card">
      <BriefcaseBusiness />
      <span>{item.period} / {item.location}</span>
      <h3>{item.role}</h3>
      <strong>{item.company}</strong>
      <p>{item.description}</p>
      <div>{item.highlights.slice(0, 4).map((highlight) => <em key={highlight}>{highlight}</em>)}</div>
    </article>
  );
}
