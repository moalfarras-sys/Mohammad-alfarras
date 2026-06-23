"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Code2,
  Download,
  FileText,
  Languages,
  MonitorPlay,
  Palette,
  PlayCircle,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
  Terminal,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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

type Mode = "developer" | "designer";

type InteractiveCvProps = {
  locale: Locale;
  profileName: string;
  portrait: string;
  downloads: { branded: string; docx: string };
  stats: { views: number; videos: number; subscribers: number; projects: number; apps: number };
  experience: CvExperience[];
};

function compactNumber(value: number, suffix = "+") {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M${suffix}`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K${suffix}`;
  return `${value}${suffix}`;
}

const reveal = {
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
};

function copy(locale: Locale, stats: InteractiveCvProps["stats"]) {
  const ar = locale === "ar";
  return repairMojibakeDeep({
    heroTitle: ar ? "محمد الفراس — مطوّر ومصمّم مواقع وتطبيقات" : "Mohammad Alfarras — Engineer & Digital Designer",
    developer: ar ? "وضع المطوّر" : "Developer Mode",
    designer: ar ? "وضع المصمّم" : "Designer Mode",
    devBody: ar ? "مواقع وتطبيقات ويب سريعة، أنظمة واضحة، وكود قابل للتطوير." : "Fast web apps, clean systems, and scalable code.",
    designerBody: ar ? "واجهات وتجارب مبهرة، هوية بصرية، ومحتوى يحكي قصة المنتج." : "Stunning interfaces, visual identity, and content that tells the product's story.",
    devHook: ar ? "أبني المنتج كنظام كامل: سريع، واضح، وقابل للنمو." : "I build the product as a complete system: fast, clear, and built to grow.",
    designerHook: ar ? "أصمّم تجربة تجذب الزائر وتقنعه من أول شاشة." : "I design an experience that pulls the visitor in and convinces from the first screen.",
    switchHint: ar ? "اضغط الزرّين فوق أو Ctrl/⌘ + K للتبديل" : "Tap the toggles above or press Ctrl/⌘ + K to switch",
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
      { year: "2015", title: ar ? "الانتقال" : "The Transition", body: ar ? "من سوريا إلى ألمانيا: بداية جديدة في 2015، لغة جديدة، ومسؤولية مختلفة." : "From Syria to Germany in 2015: a new beginning, a new language, and sharper responsibility.", icon: Route },
      { year: ar ? "الخبرة التشغيلية" : "Operations", title: ar ? "مرحلة اللوجستيات" : "The Logistics Phase", body: ar ? "تشغيل، تنظيم، خدمة عملاء، وتعلّم كيف تتحرك الأعمال الحقيقية تحت الضغط." : "Operations, coordination, customer flow, and learning how real businesses move under pressure.", icon: Truck },
      { year: ar ? "التحوّل الرقمي" : "Digital systems", title: ar ? "القفزة الرقمية" : "The Digital Leap", body: ar ? "بناء منتجات رقمية، يوتيوب، MoPlayer، وأنظمة ويب تربط المنتج بالمستخدم." : "Digital product work, YouTube, MoPlayer, and web systems connecting products with users.", icon: Code2 },
    ],
    skillTitle: ar ? "مهارات تقنية مرئية." : "Technical signal, made visible.",
    languageTitle: ar ? "لغات تربط التجربة بالعالم." : "Languages with real-world reach.",
    experienceTitle: ar ? "خبرة عملية ومشاريع رئيسية." : "Work experience and key projects.",
    metricsTitle: ar ? "لوحة نمو يوتيوب وصناعة المحتوى." : "YouTube and creator growth dashboard.",
    terminalTitle: ar ? "وضع الطرفية" : "Terminal Mode",
    terminalLines: ["> whoami", "Mohammad Alfarras: Engineer & Designer", "> fetch story --source logistics", "Syria → Germany → Operations → Web → MoPlayer", "> status", ar ? "أبني أنظمة رقمية واضحة." : "Building clear digital systems."],
    ctaTitle: ar ? "هل تريد نسخة رقمية أقوى من خبرتك أو مشروعك؟" : "Want a stronger digital version of your work?",
    ctaBody: ar ? "أستطيع تحويل الفكرة، الخبرة، أو الخدمة إلى موقع واضح وتجربة رقمية تقنع الزائر." : "I can turn an idea, expertise, or service into a clear website and digital experience that earns trust.",
    contact: ar ? "ابدأ الحديث" : "Start the conversation",
    badges: [
      [compactNumber(stats.views), ar ? "مشاهدات" : "Views"],
      [`${stats.videos}+`, ar ? "فيديو" : "Videos"],
      [ar ? "خبير لوجستيات" : "Logistics Expert", ar ? "عمليات" : "Operations"],
      [ar ? "باني تطبيقات" : "App Builder", "MoPlayer"],
    ] as Array<[string, string]>,
    gameStats: [
      [stats.videos, ar ? "فيديو منشور" : "Videos published", PlayCircle],
      [stats.views, ar ? "إجمالي المشاهدات" : "Total views", Users],
      [stats.projects, ar ? "مشاريع وأنظمة منشورة" : "Shipped web projects", Code2],
      [stats.apps, ar ? "تطبيقات منشورة" : "Published apps", MonitorPlay],
    ] as Array<[number, string, LucideIcon]>,
  });
}

export function InteractiveCvPage({ locale, profileName, portrait, downloads, stats, experience }: InteractiveCvProps) {
  const t = copy(locale, stats);
  const isAr = locale === "ar";
  const [mode, setMode] = useState<Mode>("developer");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMode((m) => (m === "developer" ? "designer" : "developer"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const skillProof = [
    ["Web platforms", isAr ? "أنظمة ويب إنتاجية ثنائية اللغة" : "Production bilingual web systems"],
    ["Product flows", isAr ? "واجهات منظمة ولوحات إدارة ومسارات منتج واضحة" : "Structured screens, control panels, and product flows"],
    ["Managed content", isAr ? "بيانات المحتوى والإصدارات وقواعد الوصول" : "Content, release data, and access rules"],
    ["Android TV", isAr ? "MoPlayer Classic وMoPlayer Pro" : "MoPlayer Classic and MoPlayer Pro"],
    ["Product delivery", isAr ? "تنزيل وتفعيل ودعم وإدارة إصدارات" : "Downloads, activation, support, and releases"],
    ["Technical content", `${compactNumber(stats.views)} ${isAr ? "مشاهدة" : "views"} / ${stats.videos} ${isAr ? "فيديو" : "videos"}`],
  ] as const;
  const languages = languageLevels[locale];
  const languageFlags: Record<string, string> = { ar: "/icons/flag-sy-new.svg", de: "/icons/flag-de.svg", en: "/icons/flag-gb.svg" };

  return (
    <main className={`cv-blueprint cv-mode-${mode}`}>
      <section className="cv-hero">
        <div className="cv-persona-grid" role="tablist" aria-label={isAr ? "تبديل الوضع" : "Switch mode"}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "developer"}
            onClick={() => setMode("developer")}
            className={mode === "developer" ? "cv-persona cv-persona-dev cv-persona-active" : "cv-persona cv-persona-dev"}
          >
            <Code2 />
            <strong>{t.developer}</strong>
            <span>{t.devBody}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "designer"}
            onClick={() => setMode("designer")}
            className={mode === "designer" ? "cv-persona cv-persona-creator cv-persona-active" : "cv-persona cv-persona-creator"}
          >
            <Palette />
            <strong>{t.designer}</strong>
            <span>{t.designerBody}</span>
          </button>
        </div>

        <div className="cv-profile-wrap">
          <div className="cv-photo-shell">
            <Image src={portrait} alt={profileName} fill priority sizes="(max-width: 480px) 348px, (max-width: 900px) 86vw, 380px" quality={65} className="cv-photo" />
          </div>
          <div className="cv-hero-copy">
            <p className="fresh-eyebrow">
              <Sparkles size={14} aria-hidden /> Interactive CV / The Engineer&apos;s Blueprint
            </p>
            <h1>{t.heroTitle}</h1>
            <motion.p key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="cv-hero-hook">
              {mode === "developer" ? t.devHook : t.designerHook}
            </motion.p>
            <p className="cv-switch-hint">
              <Terminal size={13} aria-hidden /> {t.switchHint}
            </p>
            <div className="cv-floating-badges">
              {t.badges.map(([value, label]) => (
                <span key={`${value}-${label}`}>
                  <strong>{value}</strong>
                  {label}
                </span>
              ))}
            </div>
            <div className="fresh-actions">
              <Link href={downloads.branded} className="fresh-button fresh-button-primary" download>
                <Download size={17} />
                {t.downloads}
              </Link>
              <Link href={downloads.docx} className="fresh-button" download>
                <FileText size={17} />
                {t.docx}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <motion.section className="cv-game-stats" {...reveal}>
        {t.gameStats.map(([value, label, Icon]) => (
          <CountCard key={label} value={value} label={label} icon={Icon} suffix="+" />
        ))}
      </motion.section>

      <motion.section className="cv-story-card" {...reveal}>
        <div>
          <p className="fresh-eyebrow">{isAr ? "نبذة شخصية" : "About me"}</p>
          <h2>{t.storyTitle}</h2>
        </div>
        <div className="cv-story-copy">{t.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </motion.section>

      <motion.section className="cv-journey" {...reveal}>
        <svg className="cv-journey-path" viewBox="0 0 260 820" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d="M130 20 C30 150 230 235 130 360 C35 480 225 570 130 800"
            pathLength={1}
            initial={{ pathLength: 0, opacity: 0.2 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          />
        </svg>
        <div className="cv-waypoints">
          {t.waypoints.map((item, i) => (
            <TimelineItem key={item.year} item={item} index={i} />
          ))}
        </div>
      </motion.section>

      <motion.section className="cv-terminal" {...reveal}>
        <div className="cv-terminal-bar">
          <i /><i /><i />
          <span><Terminal size={13} aria-hidden /> {t.terminalTitle}</span>
        </div>
        <Typewriter lines={t.terminalLines} />
      </motion.section>

      <motion.section className="cv-skills" {...reveal}>
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
      </motion.section>

      <motion.section className="cv-languages" {...reveal}>
        <h2>{t.languageTitle}</h2>
        <div>
          {languages.map((language) => (
            <LanguageBadge key={language.id} flagSrc={languageFlags[language.id]} title={language.label} level={language.level} />
          ))}
        </div>
      </motion.section>

      <motion.section className="cv-deep-dive" {...reveal}>
        <p className="fresh-eyebrow">Experience / Projects</p>
        <h2>{t.experienceTitle}</h2>
        <div className="cv-experience-grid">
          {experience.slice(0, 3).map((item) => (
            <ExperienceCard key={item.id} item={item} />
          ))}
          <ExperienceCard
            item={{ id: "moplayer", role: "MoPlayer", company: isAr ? "تطبيق Android TV مخصص" : "Custom Android TV Player", period: "2024-now", location: "Product", description: isAr ? "تجربة منتج تجمع التشغيل، التفعيل، مصادر IPTV، والإصدارات الرسمية." : "A product experience connecting playback, activation, IPTV sources, and official release flow.", highlights: ["Android TV", "Activation", "Remote config", "Release system"] }}
          />
        </div>
      </motion.section>

      <motion.section className="cv-youtube-dashboard" {...reveal}>
        <div>
          <p className="fresh-eyebrow">Creator Metrics</p>
          <h2>{t.metricsTitle}</h2>
        </div>
        <div className="cv-dashboard-cells">
          <CountCard value={stats.views} label={isAr ? "إجمالي المشاهدات" : "Total views"} icon={Radio} compact />
          <CountCard value={stats.subscribers} label={isAr ? "مشترك" : "Subscribers"} icon={Users} compact />
          <CountCard value={stats.videos} label={isAr ? "فيديو" : "Videos"} icon={MonitorPlay} compact />
        </div>
      </motion.section>

      <motion.section className="cv-final-cta" {...reveal}>
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaBody}</p>
        <Link href={withLocale(locale, "contact")} className="fresh-button fresh-button-primary magnetic-surface">
          {t.contact}
          <ArrowUpRight size={17} />
        </Link>
      </motion.section>
    </main>
  );
}

function CountCard({ value, label, icon: Icon, compact = false, suffix }: { value: number; label: string; icon: LucideIcon; compact?: boolean; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className={compact ? "cv-count-card cv-count-card-compact" : "cv-count-card"}>
      <Icon />
      <strong>
        <CountUp value={value} start={inView} suffix={suffix} />
      </strong>
      <span>{label}</span>
    </div>
  );
}

function CountUp({ value, start, suffix }: { value: number; start: boolean; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const id = setTimeout(() => setN(value), 0);
      return () => clearTimeout(id);
    }
    const totalSteps = 42;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const p = Math.min(1, i / totalSteps);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p >= 1) clearInterval(id);
    }, 36);
    return () => clearInterval(id);
  }, [start, value]);
  // Only show the "+" once the count has reached its target, so it doesn't flash mid-animation.
  const reached = n >= value;
  return <span>{compactNumber(n, suffix !== undefined ? (reached ? suffix : "") : n >= 1000 ? "+" : "")}</span>;
}

function Typewriter({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [shown, setShown] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  useEffect(() => {
    if (!inView) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const id = requestAnimationFrame(() => setShown(lines));
      return () => cancelAnimationFrame(id);
    }
    let line = 0;
    let char = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (line >= lines.length) return;
      const current = lines[line];
      char += 1;
      setTyping(current.slice(0, char));
      if (char >= current.length) {
        setShown((s) => [...s, current]);
        setTyping("");
        line += 1;
        char = 0;
        timer = setTimeout(tick, 320);
      } else {
        timer = setTimeout(tick, 26);
      }
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [inView, lines]);
  return (
    <div className="cv-terminal-body" ref={ref}>
      {shown.map((l, i) => (
        <p key={i} className={l.startsWith(">") ? "cv-term-cmd" : "cv-term-out"}>
          {l}
        </p>
      ))}
      {typing ? (
        <p className={typing.startsWith(">") ? "cv-term-cmd" : "cv-term-out"}>
          {typing}
          <span className="cv-term-caret" />
        </p>
      ) : null}
    </div>
  );
}

function TimelineItem({ item, index }: { item: { year: string; title: string; body: string; icon: LucideIcon }; index: number }) {
  const Icon = item.icon;
  return (
    <motion.article
      className="cv-waypoint"
      initial={{ opacity: 0, x: index % 2 === 0 ? -28 : 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.12 }}
    >
      <span>{item.year}</span>
      <Icon />
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </motion.article>
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
      <span>
        {item.period} / {item.location}
      </span>
      <h3>{item.role}</h3>
      <strong>{item.company}</strong>
      <p>{item.description}</p>
      <div>
        {item.highlights.slice(0, 4).map((highlight) => (
          <em key={highlight}>{highlight}</em>
        ))}
      </div>
    </article>
  );
}
