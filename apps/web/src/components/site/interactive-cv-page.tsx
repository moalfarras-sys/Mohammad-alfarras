"use client";

import { AnimatePresence, motion, useInView, useScroll } from "framer-motion";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Code2,
  Coffee,
  Download,
  FileText,
  Languages,
  MonitorPlay,
  PlayCircle,
  Radio,
  Route,
  ShieldCheck,
  Terminal,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  return {
    heroTitle: ar ? "محمد الفراس - مهندس برمجيات ومعماري رقمي" : "Mohamed Al Farras - Software Engineer & Digital Architect",
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
        year: "2017",
        title: ar ? "الانتقال" : "The Transition",
        body: ar ? "من دمشق وسوريا إلى ألمانيا: بداية جديدة، لغة جديدة، ومسؤولية مختلفة." : "From Damascus and Syria to Germany: a new beginning, a new language, and sharper responsibility.",
        icon: Route,
      },
      {
        year: "2018-2021",
        title: ar ? "مرحلة اللوجستيات" : "The Logistics Phase",
        body: ar ? "تشغيل، تنظيم، خدمة عملاء، وتعلّم كيف تتحرك الأعمال الحقيقية تحت الضغط." : "Operations, coordination, customer flow, and learning how real businesses move under pressure.",
        icon: Truck,
      },
      {
        year: "2021-now",
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
      [stats.videos, ar ? "فيديو تم إنتاجه" : "Videos Exported", PlayCircle],
      [Math.round(stats.views / 1000), ar ? "ألف مشاهدة" : "K Views Generated", Users],
      [4200, ar ? "شحنة/عملية لوجستية" : "Logistics Flows Managed", Truck],
      [999, ar ? "قهوة أثناء البناء" : "Coffees Brewed", Coffee],
    ] as Array<[number, string, LucideIcon]>,
  };
}

export function InteractiveCvPage({ locale, profileName, portrait, downloads, stats, experience }: InteractiveCvProps) {
  const displayStats = {
    views: Math.max(stats.views, 1_500_000),
    videos: Math.max(stats.videos, 162),
    subscribers: stats.subscribers,
  };
  const t = copy(locale, displayStats);
  const isAr = locale === "ar";
  const [persona, setPersona] = useState<"dev" | "creator" | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const journeyRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: journeyRef, offset: ["start 70%", "end 55%"] });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setTerminalOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rings = [
    ["Next.js", 92, "cyan"],
    ["TypeScript", 88, "blue"],
    ["React", 90, "orange"],
  ] as const;
  const bars = [
    ["Supabase", 78],
    ["Firebase", 72],
    ["Tailwind", 94],
    ["Framer Motion", 82],
  ] as const;

  return (
    <main className="cv-blueprint">
      <section className={terminalOpen ? "cv-hero cv-terminal-open" : "cv-hero"}>
        <div className="cv-persona-grid" onMouseLeave={() => setPersona(null)}>
          <div className={persona === "dev" ? "cv-persona cv-persona-dev cv-persona-active" : "cv-persona cv-persona-dev"} onMouseEnter={() => setPersona("dev")}>
            <Code2 />
            <strong>{t.developer}</strong>
            <span>{t.devBody}</span>
          </div>
          <div className={persona === "creator" ? "cv-persona cv-persona-creator cv-persona-active" : "cv-persona cv-persona-creator"} onMouseEnter={() => setPersona("creator")}>
            <PlayCircle />
            <strong>{t.creator}</strong>
            <span>{t.creatorBody}</span>
          </div>
        </div>

        <div className="cv-profile-wrap">
          <motion.div className="cv-photo-shell" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65 }}>
            <Image src={portrait} alt={profileName} fill priority sizes="(max-width: 900px) 86vw, 380px" className="cv-photo" />
          </motion.div>
          <motion.div className="cv-hero-copy" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.65 }}>
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
              <button type="button" className="fresh-button cv-terminal-toggle" onClick={() => setTerminalOpen((value) => !value)}><Terminal size={17} />{t.cmdHint}</button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {terminalOpen ? (
            <motion.div className="cv-terminal" initial={{ rotateX: -75, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: 75, opacity: 0 }}>
              <div className="cv-terminal-bar"><span /><span /><span /><strong>{t.terminalTitle}</strong></div>
              <div className="cv-terminal-body">
                {t.terminalLines.map((line, index) => <p key={`${line}-${index}`} style={{ "--delay": `${index * 240}ms` } as React.CSSProperties}>{line}</p>)}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
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

      <section className="cv-journey" ref={journeyRef}>
        <svg className="cv-journey-path" viewBox="0 0 260 820" preserveAspectRatio="none" aria-hidden="true">
          <motion.path d="M130 20 C30 150 230 235 130 360 C35 480 225 570 130 800" pathLength={scrollYProgress} />
        </svg>
        <div className="cv-waypoints">
          {t.waypoints.map((item) => <TimelineItem key={item.year} item={item} />)}
        </div>
      </section>

      <section className="cv-skills">
        <div>
          <p className="fresh-eyebrow">Skills / Tech Stats</p>
          <h2>{t.skillTitle}</h2>
          <div className="cv-rings">{rings.map(([label, value, tone]) => <SkillRing key={label} label={label} value={value} tone={tone} />)}</div>
        </div>
        <div className="cv-bars">
          {bars.map(([label, value]) => <SkillBar key={label} label={label} value={value} />)}
          <div className="cv-radar">
            <ShieldCheck />
            <strong>{isAr ? "حل المشكلات" : "Problem Solving"}</strong>
            <span>{isAr ? "إدارة العمليات" : "Operations Management"}</span>
            <span>{isAr ? "استراتيجية المحتوى" : "Content Strategy"}</span>
          </div>
        </div>
      </section>

      <section className="cv-languages">
        <h2>{t.languageTitle}</h2>
        <div>
          <LanguageBadge flag="AR" title={isAr ? "العربية" : "Arabic"} level={isAr ? "اللغة الأم" : "Native Mother Tongue"} />
          <LanguageBadge flag="DE" title={isAr ? "الألمانية" : "German"} level={isAr ? "C1 مهني - حياة وعمل في ألمانيا" : "C1 Professional - Life & Work in Germany"} />
          <LanguageBadge flag="EN" title={isAr ? "الإنجليزية" : "English"} level={isAr ? "كفاءة مهنية عملية" : "Professional Working Proficiency"} />
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
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const animatedRef = useRef(false);
  const [current, setCurrent] = useState(value);
  const display = useMemo(() => compactNumber(current, value >= 1000 ? "+" : ""), [current, value]);

  useEffect(() => {
    if (!inView || animatedRef.current) return;
    animatedRef.current = true;
    let frame = 0;
    const total = 34;
    const tick = () => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / total, 3);
      setCurrent(Math.round(value * Math.min(progress, 1)));
      if (frame < total) requestAnimationFrame(tick);
    };
    const start = requestAnimationFrame(() => {
      setCurrent(0);
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(start);
  }, [inView, value]);

  return (
    <div ref={ref} className={compact ? "cv-count-card cv-count-card-compact" : "cv-count-card"}>
      <Icon />
      <strong>{display}</strong>
      <span>{label}</span>
    </div>
  );
}

function TimelineItem({ item }: { item: { year: string; title: string; body: string; icon: LucideIcon } }) {
  const Icon = item.icon;
  return (
    <motion.article className="cv-waypoint" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-120px" }}>
      <span>{item.year}</span>
      <Icon />
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </motion.article>
  );
}

function SkillRing({ label, value, tone }: { label: string; value: number; tone: "cyan" | "blue" | "orange" }) {
  return (
    <div className={`cv-skill-ring cv-ring-${tone}`} style={{ "--ring-value": value / 100 } as React.CSSProperties}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="46" />
        <motion.circle cx="60" cy="60" r="46" initial={{ pathLength: 0 }} whileInView={{ pathLength: value / 100 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <strong>{value}%</strong>
      <span>{label}</span>
    </div>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="cv-skill-bar">
      <div><span>{label}</span><strong>{value}%</strong></div>
      <span><motion.i initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: "easeOut" }} /></span>
    </div>
  );
}

function LanguageBadge({ flag, title, level }: { flag: string; title: string; level: string }) {
  return (
    <article className="cv-language-badge">
      <span>{flag}</span>
      <h3>{title}</h3>
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
