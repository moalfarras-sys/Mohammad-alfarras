"use client";

import Image from "next/image";
import Link from "next/link";
import { type LiveYoutubeStats } from "@/lib/youtube-live";
import { type LiveWeather } from "@/lib/weather-live";
import { type LiveMatch } from "@/lib/matches-live";
import { motion, useInView } from "framer-motion";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Clapperboard,
  ChevronDown,
  Eye,
  ExternalLink,
  Globe2,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircleMore,
  PlayCircle,
  Sparkles,
  Video,
  Zap,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Trophy,
  Timer,
  Activity,
  Droplets,
  Wind
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

import { useThemeMode } from "@/components/layout/use-theme-mode";
import type { RebuildLocaleContent } from "@/data/rebuild-content";
import type { Locale, YoutubeVideo } from "@/types/cms";
import type { CvBuilderData, CvBuilderSection } from "@/lib/cv-builder";
import { formatMonthYear, formatNumber } from "@/lib/locale-format";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

import { ContactForm } from "./contact-form";
import { CvProfessional2026 } from "./cv-professional-2026";
import { YoutubeProfessional2026 } from "./youtube-professional-2026";
import { ProjectsProfessional2026 } from "./projects-professional-2026";
import { ContactProfessional2026 } from "./contact-professional-2026";

/* ── Types ── */
type SiteProject = {
  id: string;
  slug: string;
  title: string;
  ctaLabel: string;
  summary: string;
  description: string;
  image: string;
  href?: string;
  repoUrl?: string;
  featured: boolean;
  featuredRank: number;
  accent: "green" | "orange" | "cyan" | "purple";
  highlightStyle: "operations" | "trust" | "app" | "editorial";
  deviceFrame: "browser" | "phone" | "floating";
  eyebrow: string;
  challenge: string;
  solution: string;
  result: string;
  tags: string[];
  gallery: string[];
  metrics: Array<{ value: string; label: string }>;
};

type SiteService = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  image: string;
};

type SiteExperience = {
  id: string;
  role: string;
  description: string;
  highlights: string[];
  company: string;
  location: string;
  period: string;
};

type SiteContactChannel = {
  id: string;
  type: string;
  label: string;
  description: string;
  value: string;
  icon: string;
  isPrimary: boolean;
};

type SiteGalleryItem = {
  id: string;
  title: string;
  image: string;
  ratio: "portrait" | "wide" | "square";
};

type SiteProfile = {
  name: string;
  subtitle: string;
  location: string;
};

type YoutubeSummary = {
  channel_id?: string;
  views?: number | string;
  subscribers?: number | string;
  videos?: number | string;
  handle?: string;
  title?: string;
};

type SiteCertification = {
  id: string;
  name: string;
  description: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
};

type CvLinksSetting = {
  ar?: string;
  en?: string;
  de?: string;
  portrait?: string;
};

export type SiteViewModel = {
  locale: Locale;
  pageSlug: string;
  t: RebuildLocaleContent;
  profile: SiteProfile;
  projects: SiteProject[];
  services: SiteService[];
  experience: SiteExperience[];
  certifications: SiteCertification[];
  contact: {
    channels: SiteContactChannel[];
    emailAddress: string;
    whatsappUrl: string;
  };
  settings?: Record<string, { key: string; value_json: Record<string, unknown> }>;
  youtube: YoutubeSummary;
  featuredVideo: YoutubeVideo | null;
  latestVideos: YoutubeVideo[];
  gallery: SiteGalleryItem[];
  live: {
    weather: LiveWeather | null;
    matches: LiveMatch[];
    youtube?: LiveYoutubeStats | null;
  };
  cvBuilder: CvBuilderData;
  cvSections: CvBuilderSection[];
  cvProjects: {
    id: string;
    title: string;
    summary: string;
    href?: string;
    repoUrl?: string;
  }[];
  cvExperience: {
    id: string;
    role: string;
    company: string;
    period: string;
    location: string;
    description: string;
    highlights: string[];
  }[];
};

/* ── Helpers ── */
function fmt(locale: Locale, value: number | string | undefined, compact = true) {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (!num || isNaN(num)) return "0";
  return formatNumber(locale, num, compact ? { notation: "compact", maximumFractionDigits: 1 } : undefined);
}

function formatVideoDate(locale: Locale, value: string) {
  return formatMonthYear(locale, value);
}

function videoTitle(video: YoutubeVideo, locale: Locale) {
  return locale === "ar" ? video.title_ar || video.title_en || video.youtube_id : video.title_en || video.title_ar || video.youtube_id;
}

function videoBody(video: YoutubeVideo, locale: Locale) {
  return locale === "ar" ? video.description_ar || video.description_en || "" : video.description_en || video.description_ar || "";
}

function projectStory(project: SiteProject, locale: Locale) {
  const key = `${project.id} ${project.title}`.toLowerCase();
  if (key.includes("seel")) {
    return locale === "ar"
      ? {
          type: "خدمات نقل",
          challenge: "الشركة كانت تعمل جيدًا، لكن الانطباع الأول لم يكن يقول ذلك بوضوح.",
          solution: "أُعيد ترتيب العرض البصري والرسالة حتى يشعر الزائر بالثقة قبل قراءة التفاصيل.",
          result: "صورة أكثر جدية، ورسالة أسرع، ومسار أوضح نحو التواصل.",
          accent: "neon-green" as const,
        }
      : {
          type: "Transport services",
          challenge: "The business was solid, but the first impression did not communicate that clearly.",
          solution: "I rebuilt the visual flow and messaging so trust lands before the visitor reads the details.",
          result: "A stronger impression, faster clarity, and a cleaner path toward contact.",
          accent: "neon-green" as const,
        };
  }
  if (key.includes("schnell")) {
    return locale === "ar"
      ? {
          type: "موقع حجز",
          challenge: "في خدمات النقل، القرار يحدث بسرعة وتحت ضغط. التشتيت هنا يكلّف.",
          solution: "بُنيت الواجهة حول خطوة واحدة واضحة مع عرض أكثر هدوءًا وسرعة.",
          result: "واجهة تقود للحجز مباشرة وتخفض التردد في أول زيارة.",
          accent: "neon-orange" as const,
        }
      : {
          type: "Booking-focused site",
          challenge: "Moving services are chosen under pressure, so hesitation costs conversions.",
          solution: "The interface was rebuilt around one clear action and a calmer message flow.",
          result: "A quicker route to booking and less hesitation on first visit.",
          accent: "neon-orange" as const,
        };
  }
  return locale === "ar"
    ? {
        type: "منتج رقمي",
        challenge: "كان المطلوب تقديم الفكرة بشكل واضح دون فقدان الشخصية أو الإيقاع البصري.",
        solution: project.description,
        result: "عرض أنظف، ثقة أعلى، وتجربة أسهل في الفهم من أول شاشة.",
        accent: "neon-purple" as const,
      }
    : {
        type: "Digital product",
        challenge: "The goal was to present the idea clearly without losing personality or visual tension.",
        solution: project.description,
        result: "Cleaner presentation, stronger trust, and easier comprehension from screen one.",
        accent: "neon-purple" as const,
      };
}

function experienceStory(entry: SiteExperience, locale: Locale) {
  const key = `${entry.company} ${entry.role}`.toLowerCase();
  if (key.includes("rhenus")) {
    return locale === "ar"
      ? "في عالم التوصيل، التأخير يظهر مباشرة على وجه العميل. هناك تعلّمت أن النظام ليس رفاهية، بل ما يجعل كل شيء يعمل."
      : "In delivery work, delays show up immediately on the customer side. That is where I learned that structure is not a luxury; it is what makes things work.";
  }
  if (key.includes("ikea")) {
    return locale === "ar"
      ? "أكبر درس من IKEA كان بسيطًا: حتى البساطة تحتاج نظامًا قويًا خلفها."
      : "The biggest lesson from IKEA was simple: even simplicity needs a strong system behind it.";
  }
  return locale === "ar"
    ? "هنا اجتمعت الخيوط: انضباط التشغيل، ذوق التصميم، ورسالة تقنع بسرعة."
    : "This is where the threads met: operational discipline, design taste, and messaging that persuades quickly.";
}

type JourneyStepFallback = {
  title: string;
  body: string;
  role?: string;
  period?: string;
  location?: string;
  highlights?: string[];
};

/* ── CountUp Hook ── */
function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { value, ref };
}

/* ── Shared UI ── */
function SectionHeading({
  eyebrow,
  title,
  body,
  align = "start",
}: {
  eyebrow: string;
  title: string;
  body: string;
  align?: "start" | "center";
}) {
  return (
    <div className={cn("max-w-3xl space-y-4", align === "center" && "mx-auto text-center")}>
      <span className="eyebrow">{eyebrow}</span>
      <h2
        className="headline-arabic max-w-4xl text-4xl font-bold text-foreground md:text-5xl"
        style={{ lineHeight: 1.15 }}
      >
        {title}
      </h2>
      <p className="text-base leading-8 text-foreground-muted md:text-lg">{body}</p>
    </div>
  );
}

function ActionLink({
  href,
  label,
  primary = false,
  external = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
  external?: boolean;
}) {
  return (
    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}>
      <Link
        href={href}
        className={primary ? "button-primary-shell" : "button-secondary-shell"}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {label}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

/* ── Video Card ── */
function VideoCard({ video, locale }: { video: YoutubeVideo; locale: Locale }) {
  return (
    <div
      className="group relative overflow-hidden rounded-[1.75rem] p-3 transition-all duration-500"
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      <Link
        href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="video-card-thumb relative aspect-video overflow-hidden rounded-[1.25rem]">
          <Image
            src={video.thumbnail}
            alt={videoTitle(video, locale)}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-center transition duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Play button */}
          <motion.div
            whileHover={{ scale: 1.15 }}
            className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100"
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, var(--secondary), #ff3d00)",
                boxShadow: "0 0 40px rgba(255,107,0,0.5)",
              }}
            >
              <PlayCircle className="h-7 w-7 text-foreground" />
            </span>
          </motion.div>

          {/* Duration */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-foreground backdrop-blur-sm">
            <PlayCircle className="h-3 w-3" />
            {video.duration}
          </div>
        </div>
        <div className="space-y-2 px-1 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--secondary)" }}>
            <Video className="h-3.5 w-3.5" />
            <span>{formatVideoDate(locale, video.published_at)}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-bold text-foreground">{videoTitle(video, locale)}</h3>
          <p className="line-clamp-2 text-sm leading-7 text-foreground-muted">{videoBody(video, locale)}</p>
        </div>
      </Link>
    </div>
  );
}

function HeroStatAnimated({ target, suffix, prefix = "" }: { target: number, suffix: string, prefix?: string }) {
  const { value, ref } = useCountUp(target, 2000);
  return (
    <span ref={ref}>
      {prefix}{target % 1 !== 0 ? value.toFixed(1) : Math.floor(value)}{suffix}
    </span>
  );
}

/* ── HOME PAGE ── */
function HomePage({ model }: { model: SiteViewModel }) {
  const { locale, t, projects, services, featuredVideo, youtube } = model;

  const heroStats = [
    { label: locale === "ar" ? "مشاهدة" : "Views", target: 1.5, suffix: "M", prefix: "+" },
    { label: locale === "ar" ? "مشترك" : "Subscribers", target: 6.1, suffix: "K", prefix: "+" },
    { label: locale === "ar" ? "فيديو" : "Videos", target: Number(youtube.videos ?? 162), suffix: "", prefix: "" },
    { label: locale === "ar" ? "الرد" : "Response", target: 24, suffix: "h", prefix: "" },
  ];

  return (
    <div className="space-y-0">

      {/* ── HERO ── */}
      <section
        data-testid="home-hero"
        className="relative overflow-hidden px-5 py-14 md:px-8 md:py-20"
      >
        {/* Background orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/4 left-1/4 h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
        />

        <div className="section-frame">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">

            {/* LEFT — Copy */}
            <Reveal className="space-y-8">
              <div className="space-y-2">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="eyebrow"
                >
                  {locale === "ar" ? "متاح للمشاريع المختارة · ألمانيا 🇩🇪" : "Available for selected projects · Germany 🇩🇪"}
                </motion.span>
              </div>

              <div className="space-y-5">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  className="headline-arabic max-w-2xl text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl md:text-6.5xl tracking-tight"
                >
                  {locale === "ar" ? (
                    <>
                      الإنترنت مليء بالضجيج.{" "}
                      <span
                        className="text-glow-green"
                        style={{ color: "var(--primary)" }}
                      >
                        أنا هنا لأصنع ما يستحق الصمت.
                      </span>{" "}
                      <span
                        style={{
                          background: "linear-gradient(135deg, var(--secondary), var(--accent))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        خذ لحظتك.
                      </span>
                    </>
                  ) : (
                    <>
                      The internet is loud.{" "}
                      <span style={{ color: "var(--primary)" }} className="text-glow-green">
                        I build what earns the silence.
                      </span>{" "}
                      <span
                        style={{
                          background: "linear-gradient(135deg, var(--secondary), var(--accent))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Take your moment.
                      </span>
                    </>
                  )}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 1.0 }}
                  className="max-w-2xl text-base leading-8 text-foreground-muted md:text-lg"
                >
                  {locale === "ar"
                    ? "مطوّر وصانع محتوى من ألمانيا. ما بناه الناس في سنوات، أحاول أن أختصره في أول ثانية يراك فيها الزائر."
                    : "Developer and content creator based in Germany. What brands spend years building, I try to compress into the first second a visitor sees you."}
                </motion.p>
              </div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-10 flex w-full flex-col gap-4 sm:flex-row md:w-auto md:flex-wrap"
              >
                <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }} className="w-full sm:w-auto">
                  <Link href={`/${locale}#contact`} className="button-primary-shell flex w-full justify-center text-base px-8 py-4 sm:w-auto">
                    <Sparkles className="h-4 w-4" />
                    {locale === "ar" ? "ابدأ مشروعك الاستثنائي" : "Start your standout project"}
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }} className="w-full sm:w-auto">
                  <Link href={`/${locale}/youtube`} className="button-secondary-shell flex w-full justify-center text-base px-8 py-4 sm:w-auto">
                    <PlayCircle className="h-4 w-4" />
                    {locale === "ar" ? "شاهد كيف أعمل" : "See how I work"}
                  </Link>
                </motion.div>
              </motion.div>

              {/* Stats bar */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="grid grid-cols-2 gap-3 md:grid-cols-4"
              >
                {heroStats.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="rounded-2xl p-4"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid rgba(0,255,135,0.1)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-foreground-muted">{item.label}</p>
                    <p className="mt-1 text-xl font-extrabold text-foreground md:text-2xl" style={{ color: "var(--primary)" }}>
                      <HeroStatAnimated target={item.target} suffix={item.suffix} prefix={item.prefix} />
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </Reveal>

            {/* RIGHT — Image */}
            <Reveal delay={0.1}>
              <div className="relative mx-auto w-full max-w-[28rem]">
                {/* Floating glow orb */}
                <div
                  className="absolute -inset-8 rounded-full opacity-25 blur-3xl"
                  style={{ background: "radial-gradient(circle, var(--primary), var(--accent), transparent 70%)" }}
                  aria-hidden
                />

                {/* Main image card */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                  className="hero-image-frame relative pb-24 md:pb-0"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem]">
                    <Image
                      src="/images/protofeilnew.jpeg"
                      alt={locale === "ar" ? "محمد الفراس — مطور ويب ومصمم" : "Mohammad Alfarras — Web Developer & Designer"}
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 40vw"
                      className="object-cover object-center-top"
                      style={{ objectPosition: "center top" }}
                    />
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>

                  {/* Floating info card: Location (Orange) */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 90, damping: 15 }}
                    className="absolute bottom-4 right-4 z-20 flex min-w-[172px] max-w-[calc(100%-2rem)] items-center gap-3 rounded-[1.6rem] px-4 py-3 md:-bottom-10 md:-right-6 md:min-w-[200px] md:gap-4 md:rounded-[2.5rem] md:px-6 md:py-4"
                    style={{
                      background: "rgba(10,12,24,0.92)",
                      border: "1px solid rgba(255,107,0,0.45)",
                      backdropFilter: "blur(32px)",
                      boxShadow: "0 15px 45px rgba(255,107,0,0.22), inset 0 1px 1px rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-orange-500/15 md:h-11 md:w-11 md:rounded-[1.25rem]" style={{ border: "1px solid rgba(255,107,0,0.25)" }}>
                      <MapPin className="h-5 w-5 md:h-6 md:w-6" style={{ color: "var(--secondary)" }} />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-foreground-soft md:text-[10px] md:tracking-[0.28em]">
                        {locale === "ar" ? "مقيم في ألمانيا" : "Based in Germany"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-foreground transition-colors hover:text-secondary whitespace-nowrap md:text-sm">
                        <span dir="ltr">Frontend</span> · <span dir="ltr">Design</span> · <span dir="ltr">Content</span>
                      </p>
                    </div>
                  </motion.div>

                  {/* Floating info card: Available Now (Neon Green) */}
                  <motion.div
                    initial={{ opacity: 0, y: -30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.0, type: "spring", stiffness: 90, damping: 15 }}
                    className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-4 py-2.5 backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,255,135,0.22)] md:-left-10 md:top-12 md:gap-3 md:px-6 md:py-3.5"
                  >
                    <div className="relative flex h-3 w-3 md:h-3.5 md:w-3.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_var(--primary)] md:h-3.5 md:w-3.5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-primary md:text-sm md:tracking-[0.3em]">
                      {locale === "ar" ? "متاح الآن" : "Available now"}
                    </span>
                  </motion.div>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â• ABOUT â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative overflow-hidden px-5 py-16 md:px-8 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.12), transparent 60%)",
          }}
        />
        <div className="section-frame">
          <Reveal className="space-y-12">
            <SectionHeading
              eyebrow={locale === "ar" ? "قصتي" : "My story"}
              title={locale === "ar" ? "من اللوجستيات إلى صناعة الدهشة" : "From logistics to making impact"}
              body=""
            />

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {/* Story text */}
              <div
                className="rounded-[2rem] p-8 md:p-10"
                style={{
                  background: "var(--surface)",
                  border: "1px solid rgba(0,255,135,0.1)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <p className="text-lg leading-9 text-foreground-muted md:text-xl md:leading-10" dir={locale === "ar" ? "rtl" : "ltr"}>
                  {locale === "ar" ? (
                    <>
                      <span className="font-bold text-foreground">محمد الفراس.</span>{" "}
                      مطوّر، مصمّم، وصانع محتوى.
                      <br /><br />
                      قضيتُ سنواتٍ في قطاعي التشغيل واللوجستيك داخل{" "}
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>ألمانيا</span>.
                      {" "}تعلّمت هناك أن الناس لا يقرأون كل شيء —{" "}
                      <span className="font-semibold text-foreground">{"ثانيتان والقرار اتُّخذ"}</span>.
                      <br /><br />
                      لهذا أبنيها صحيحًا من الأساس: واجهة تقول كل شيء في أول نظرة، لا تحتاج فقرة ثالثة لتُقنع، ولا صفحة كاملة لتشرح. الثقة تبدأ بصريًا.
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-foreground">Mohammad Alfarras.</span>{" "}
                      Developer, designer, and content creator.
                      <br /><br />
                      Years in logistics in{" "}
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>Germany</span>{" "}
                      taught me one thing people rarely say out loud:{" "}
                      <span className="font-semibold text-foreground">&ldquo;2 seconds and the decision is made.&rdquo;</span>
                      <br /><br />
                      So I build it right from the foundation: an interface that says everything at first glance — no third paragraph needed, no full page to explain. Trust starts visually.
                    </>
                  )}
                </p>
              </div>

              {/* Identity cards */}
              <div className="grid gap-4">
                {(locale === "ar"
                    ? [
                      { icon: Globe2, title: "من الحسكة إلى ألمانيا", body: "الهجرة غيّرت نظرتي للوقت، الالتزام، والنتيجة التي يجب أن تصل في موعدها." },
                      { icon: Zap, title: "اللوجستيات علّمتني", body: "كل تأخير له ثمن. لهذا أبني واجهات تعتمد على الترتيب والوضوح، لا الاستعراض." },
                      { icon: Eye, title: "+1.5M مشاهدة", body: "من شرح صادق يبني ثقة لا تستطيع الإعلانات شراءها." },
                    ]
                  : [
                      { icon: Globe2, title: "From Syria to Germany", body: "Migration changed how I think about time, commitment, and delivery that actually arrives." },
                      { icon: Zap, title: "Logistics taught me", body: "Every delay has a cost. That's why I build interfaces built on order and clarity, not show." },
                      { icon: Eye, title: "+1.5M views", body: "From honest explanations that build trust no advertising budget can buy." },
                    ]
                ).map((card, i) => (
                  <Reveal key={card.title} delay={i * 0.06}>
                    <motion.div
                      whileHover={{ translateX: locale === "ar" ? -4 : 4, borderColor: "rgba(0,255,135,0.3)" }}
                      className="flex items-start gap-4 rounded-2xl p-5 transition duration-300"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backdropFilter: "blur(16px)",
                      }}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.15)" }}>
                        <card.icon className="h-5 w-5 text-primary" />
                      </span>
                      <div>
                        <h3 className="font-bold text-foreground">{card.title}</h3>
                        <p className="mt-1 text-sm leading-7 text-foreground-muted">{card.body}</p>
                      </div>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â• SERVICES â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative px-5 py-16 md:px-8 md:py-20">
        <div className="section-frame">
          <Reveal>
            <SectionHeading eyebrow={t.services.eyebrow} title={t.services.title} body={t.services.body} />
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index * 0.07}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="group relative h-full overflow-hidden rounded-[2rem] p-1 transition duration-500"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,255,135,0.15), rgba(168,85,247,0.1), rgba(255,107,0,0.08))"
                  }}
                >
                  <div
                    className="h-full rounded-[1.75rem] p-4"
                    style={{ background: "var(--surface-strong)", backdropFilter: "blur(20px)" }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem]">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover object-center transition duration-700 group-hover:scale-[1.04]"
                        style={{ objectPosition: "center top" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="space-y-4 px-1 pt-5">
                      <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
                      <p className="text-sm leading-8 text-foreground-muted">{service.body}</p>
                      <div className="flex flex-wrap gap-2">
                        {service.bullets.map((bullet) => (
                          <span
                            key={bullet}
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: "rgba(0,255,135,0.06)",
                              border: "1px solid rgba(0,255,135,0.15)",
                              color: "var(--primary)",
                            }}
                          >
                            {bullet}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â• PROJECTS BENTO â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative px-5 py-16 md:px-8 md:py-20" data-testid="projects-preview">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,255,135,0.06), transparent 55%)" }}
        />
        <div className="section-frame">
          <Reveal>
            <SectionHeading eyebrow={t.featuredWork.eyebrow} title={t.featuredWork.title} body={t.featuredWork.body} />
          </Reveal>

          {/* Bento Grid */}
          <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {projects.slice(0, 3).map((project, index) => {
              const story = projectStory(project, locale);
              const isFeatured = index === 0;
              const isMoPlayer = project.id?.toLowerCase().includes("moplayer") || project.title?.toLowerCase().includes("moplayer");
              const glowColor = story.accent === "neon-green"
                ? "var(--primary-glow)"
                : story.accent === "neon-orange"
                ? "var(--secondary-glow)"
                : "var(--accent-glow)";
              const borderColor = story.accent === "neon-green"
                ? "var(--primary-border)"
                : story.accent === "neon-orange"
                ? "var(--secondary-border)"
                : "var(--accent-border)";

              return (
                <Reveal key={project.id} delay={index * 0.06}>
                  <motion.div
                    whileHover={{ y: -5, scale: 1.01 }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                      "group relative overflow-hidden rounded-[2rem]",
                      isFeatured ? "lg:col-span-2 lg:row-span-2" : "",
                      isMoPlayer ? "ring-2 ring-purple-500/30" : "",
                    )}
                    style={{
                      background: "var(--surface)",
                      border: `1px solid ${borderColor}`,
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Image */}
                    <div className={cn("relative overflow-hidden", isFeatured ? "aspect-[16/10]" : "aspect-[16/9]")}>
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        priority={isFeatured}
                        sizes={isFeatured ? "(max-width: 1024px) 100vw, 65vw" : "(max-width: 1024px) 100vw, 34vw"}
                        className="object-cover object-center-top transition duration-700 group-hover:scale-[1.04]"
                        style={{ objectPosition: "center top" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Project type badge */}
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md"
                        style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${borderColor}`, color: "var(--primary)" }}>
                        <BriefcaseBusiness className="h-3 w-3" />
                        {story.type}
                      </div>

                      {/* MoPlayer premium badge */}
                      {isMoPlayer && (
                        <div className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", color: "white" }}>
                          ⭐ {locale === "ar" ? "منتج رقمي" : "Digital Product"}
                        </div>
                      )}

                      {/* Hover reveal — Challenge → Solution */}
                      <motion.div
                        className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 transition-all duration-500 group-hover:opacity-100"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.4), transparent)" }}
                      >
                        <div className="translate-y-4 space-y-3 transition-all duration-500 group-hover:translate-y-0">
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: glowColor.replace("0.2", "1") }}>
                            {locale === "ar" ? "التحدي" : "Challenge"}
                          </span>
                          <p className="line-clamp-2 text-sm text-foreground/80">{story.challenge}</p>
                          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--primary)" }}>
                            <Zap className="h-3 w-3" />
                            {locale === "ar" ? "الحل: " : "Solution: "}
                            <span className="line-clamp-1 text-foreground/70">{story.solution}</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Card content */}
                    <div className="space-y-3 p-5">
                      <h3 className={cn("font-extrabold text-foreground", isFeatured ? "text-2xl" : "text-lg")}>
                        {project.title}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-7 text-foreground-muted">{story.result}</p>
                      {project.href && (
                        <motion.div whileTap={{ scale: 0.96 }}>
                          <a
                            href={project.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5"
                            style={{
                              background: "rgba(0,255,135,0.07)",
                              border: `1px solid ${borderColor}`,
                              color: "var(--primary)",
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t.common.visitProject}
                          </a>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <ActionLink href={`/${locale}/projects`} label={t.common.allProjects} />
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â• YOUTUBE SECTION â•â•â•â•â•â•â•â•â•â• */}
      {featuredVideo ? (
        <section className="relative px-5 py-16 md:px-8 md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(255,107,0,0.08), transparent 55%)" }}
          />
          <div className="section-frame space-y-10">
            <Reveal>
              <SectionHeading eyebrow={t.media.eyebrow} title={t.media.title} body={t.media.body} />
            </Reveal>

            {/* YouTube Stats Dashboard */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { raw: 1500000, display: "+1.5M", label: locale === "ar" ? "مشاهدة إجمالية" : "Total Views", icon: Eye },
                { raw: 6100, display: "+6.1K", label: locale === "ar" ? "مشترك" : "Subscribers", icon: Heart },
                { raw: Number(youtube.videos ?? 162), display: fmt(locale, Number(youtube.videos ?? 162), false), label: locale === "ar" ? "فيديو منشور" : "Videos", icon: Clapperboard },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Reveal key={stat.label} delay={i * 0.07}>
                    <div
                      className="rounded-2xl p-6 text-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,107,0,0.08), var(--surface-strong))",
                        border: "1px solid var(--secondary-border)",
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <Icon className="h-5 w-5 text-secondary" />
                      </span>
                      <p
                        className="mt-3 text-3xl font-extrabold"
                        style={{ color: "var(--secondary)" }}
                      >
                        {stat.display}
                      </p>
                      <p className="mt-1 text-sm text-foreground-muted">{stat.label}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Featured video + carousel */}
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Reveal>
                <VideoCard video={featuredVideo} locale={locale} />
              </Reveal>
              <Reveal delay={0.08}>
                <div
                  className="flex h-full flex-col justify-between rounded-[2rem] p-7"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,107,0,0.06), var(--surface-strong))",
                    border: "1px solid rgba(255,107,0,0.15)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div>
                    <span className="eyebrow">{locale === "ar" ? "لماذا تتابعني؟" : "Why follow me?"}</span>
                    <h3 className="mt-4 text-2xl font-bold text-foreground">{t.youtube.collaborationTitle}</h3>
                    <p className="mt-4 text-sm leading-8 text-foreground-muted">{t.youtube.collaborationBody}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {[locale === "ar" ? "🎯 مراجعات صادقة" : "🎯 Honest reviews",
                        locale === "ar" ? "🇩🇪 عربي من ألمانيا" : "🇩🇪 Arab from Germany",
                        locale === "ar" ? "💡 محتوى تقني" : "💡 Tech content"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-3 py-1.5 text-xs font-bold"
                          style={{ background: "rgba(255,107,0,0.08)", border: "1px solid var(--secondary-glow)", color: "var(--secondary)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6">
                    <ActionLink href="https://www.youtube.com/@Moalfarras" label={t.youtube.channelCta} external />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {/* â•â•â•â•â•â•â•â•â•â• EXPERIENCE STRIP â•â•â•â•â•â•â•â•â•â• */}
      {model.experience.length > 0 && (
        <section className="relative overflow-hidden px-5 py-12 md:px-8 md:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,229,255,0.06), transparent 50%)" }}
          />
          <div className="section-frame">
            <Reveal>
              <div
                className="flex flex-wrap items-center gap-6 rounded-[2rem] px-7 py-5 md:flex-nowrap md:gap-8"
                style={{
                  background: "linear-gradient(135deg, var(--surface-strong), rgba(5,7,15,0.95))",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <span
                  className="shrink-0 text-xs font-bold uppercase tracking-[0.28em]"
                  style={{ color: "var(--cyan)", whiteSpace: "nowrap" }}
                >
                  {locale === "ar" ? "الخبرة المهنية" : "Work experience"}
                </span>
                <div className="hidden h-6 w-px shrink-0 md:block" style={{ background: "rgba(255,255,255,0.1)" }} />
                <div className="flex flex-wrap gap-4">
                  {model.experience.map((exp, i) => (
                    <div key={exp.id} className="flex items-center gap-3">
                      {i > 0 && <span className="h-1 w-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />}
                      <span className="text-sm font-bold text-foreground">{exp.company}</span>
                      <span className="text-xs text-foreground-soft">{exp.period}</span>
                    </div>
                  ))}
                </div>
                <div className="ms-auto shrink-0">
                  <ActionLink href={`/${locale}/cv`} label={locale === "ar" ? "السيرة الكاملة" : "Full CV"} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* â•â•â•â•â•â•â•â•â•â• CONTACT CTA â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative px-5 py-16 md:px-8 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.8), transparent 70%), radial-gradient(ellipse at 30% 50%, rgba(0,255,135,0.06), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(168,85,247,0.06), transparent 60%)",
          }}
        />
        <div className="section-frame">
          <Reveal>
            <div className="contact-cta-frame text-center">
              {/* Decorative top line */}
              <div className="mx-auto mb-8 h-px w-32 opacity-50" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />

              <span className="eyebrow mx-auto">{locale === "ar" ? "الخطوة التالية" : "Next step"}</span>

              <h2
                className="headline-arabic mx-auto mt-6 max-w-3xl text-3xl font-extrabold text-foreground md:text-5xl"
                style={{ lineHeight: 1.2 }}
              >
                {locale === "ar"
                  ? "فكرتك تستحق حضوراً رقمياً لا يُنسى. لنبدأ الحوار."
                  : "Your idea deserves an unforgettable digital presence. Let's start the conversation."}
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-foreground-muted">
                {locale === "ar"
                  ? "ارسل الفكرة كما هي، سأعيدها إليك بخطوة مباشرة خلال 24 ساعة."
                  : "Send the idea as it is — I'll return with a clear next step within 24 hours."}
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.04 }}>
                  <a
                    href={model.contact.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-whatsapp"
                  >
                    <MessageCircleMore className="h-5 w-5" />
                    WhatsApp
                  </a>
                </motion.div>

                <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.04 }}>
                  <Link href={`/${locale}/contact`} className="button-secondary-shell px-8 py-4 text-base">
                    <Mail className="h-4 w-4" />
                    {locale === "ar" ? "أرسل رسالة" : "Send a message"}
                  </Link>
                </motion.div>
              </div>

              {/* Bottom decoration */}
              <div className="mx-auto mt-10 h-px w-32 opacity-30" style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }} />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
   CV PAGE — Cinematic Redesign
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
function CvPage({ model }: { model: SiteViewModel }) {
  const { locale, t, experience, gallery } = model;
  const cvLinks = (model.settings?.cv_links?.value_json as CvLinksSetting | undefined) ?? {};

  const skills = locale === "ar"
    ? [
        { label: "Next.js / React", pct: 92, color: "var(--primary)" },
        { label: "UI/UX & واجهات", pct: 89, color: "var(--secondary)" },
        { label: "سرد بصري ومحتوى", pct: 86, color: "var(--accent)" },
        { label: "تنفيذ منضبط", pct: 94, color: "#06b6d4" },
      ]
    : [
        { label: "Next.js / React", pct: 92, color: "var(--primary)" },
        { label: "UI/UX interfaces", pct: 89, color: "var(--secondary)" },
        { label: "Visual storytelling", pct: 86, color: "var(--accent)" },
        { label: "Operational execution", pct: 94, color: "#06b6d4" },
      ];

  const techStack = [
    "Next.js", "React", "TypeScript", "Tailwind CSS",
    "Framer Motion", "Figma", "Node.js", "Vercel",
    "YouTube Studio", "Premiere Pro", "Git", "Supabase",
  ];
  void techStack;

  // Merge CMS experiences with our rich static fallback data for a dense CV
  const cmsEntries = experience.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    period: e.period,
    location: e.location,
    story: experienceStory(e, locale),
    highlights: e.highlights,
  }));

  const fallbackEntries = t.journey.steps.map((s, i) => {
    const step = s as JourneyStepFallback;
    return {
      id: `fb-${i}`,
      company: s.title,
      role: step.role || s.title,
      period: step.period || "",
      location: step.location || (locale === "ar" ? "ألمانيا" : "Germany"),
      story: s.body,
      highlights: step.highlights || [],
    };
  });

  const entries = [...cmsEntries, ...fallbackEntries];

  return (
    <div className="space-y-0" data-testid="cv-page">

      {/* â•â•â•â•â• SPLIT HERO â•â•â•â•â• */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background mesh */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 10% 50%, rgba(0,255,135,0.10), transparent)," +
              "radial-gradient(ellipse 60% 80% at 90% 50%, rgba(168,85,247,0.09), transparent)," +
              "linear-gradient(to bottom right, #060810, #08080f)",
          }}
        />
        {/* Horizontal scan line */}
        <div
          aria-hidden
          className="pointer-events-none absolute start-0 end-0 h-px"
          style={{ top: "50%", background: "linear-gradient(to right, transparent, rgba(0,255,135,0.15), transparent)" }}
        />

        <div className="section-frame relative z-10">
          <div className="grid min-h-[90vh] items-center gap-10 lg:grid-cols-[1fr_420px]">

            {/* Left: identity stack */}
            <div className="py-20 space-y-8">
              {/* Availability badge */}
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
                  style={{ background: "rgba(0,255,135,0.08)", border: "1px solid var(--primary)", color: "var(--primary)" }}>
                  <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                  {locale === "ar" ? "متاح لمشاريع جديدة · 2026" : "Available for projects · 2026"}
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="headline-arabic text-5xl font-black leading-[1.15] text-foreground md:text-6.5xl tracking-tight lg:text-7xl">
                  {locale === "ar" ? "محمد الفراس" : "Mohammad Alfarras"}
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="max-w-lg text-lg leading-8 text-foreground-muted">
                  {t.cv.body}
                </p>
              </Reveal>

              {/* Identity chips */}
              <Reveal delay={0.14}>
                <div className="flex flex-wrap gap-2">
                  {t.cv.chips.map((chip, i) => {
                    const colors = ["rgba(0,255,135,0.15)", "rgba(255,107,0,0.15)", "rgba(168,85,247,0.15)", "rgba(6,182,212,0.15)"];
                    const textColors = ["var(--primary)", "var(--secondary)", "var(--accent)", "#06b6d4"];
                    return (
                      <motion.span
                        key={chip}
                        whileHover={{ scale: 1.06 }}
                        className="rounded-full px-4 py-2 text-sm font-bold"
                        style={{ background: colors[i % 4], border: `1px solid ${textColors[i % 4]}44`, color: textColors[i % 4] }}
                      >
                        {chip}
                      </motion.span>
                    );
                  })}
                </div>
              </Reveal>

              {/* CTA row */}
              <Reveal delay={0.18}>
                <div className="flex flex-wrap gap-3">
                  <motion.a
                    href={cvLinks[locale] || "/Lebenslauf.pdf"}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.04, boxShadow: "0 0 30px var(--primary)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-black text-black"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {locale === "ar" ? "تحميل السيرة PDF" : (locale === "en" ? "Download CV PDF" : "Lebenslauf PDF")}
                  </motion.a>
                  <motion.a
                    href={`/${locale}/contact`}
                    whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-sm font-bold text-foreground-muted transition"
                  >
                    <MessageCircleMore className="h-4 w-4" />
                    {locale === "ar" ? "تواصل مباشر" : "Get in touch"}
                  </motion.a>
                </div>
              </Reveal>
            </div>

            {/* Right: portrait card */}
            <Reveal delay={0.08}>
              <div className="relative hidden lg:block">
                {/* Glow halo */}
                <div
                  aria-hidden
                  className="absolute -inset-4 rounded-[2.5rem] blur-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,135,0.12), rgba(168,85,247,0.1))" }}
                />
                <div
                  className="relative overflow-hidden rounded-[2.5rem]"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(8,10,20,0.6)", backdropFilter: "blur(20px)" }}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                      src={cvLinks.portrait || "/images/portrait.jpg"}
                      alt={locale === "ar" ? "محمد الفراس" : "Mohammad Alfarras"}
                      fill priority
                      sizes="420px"
className="object-cover object-top"
                    />
                    {/* Bottom overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/70 via-transparent to-transparent" />
                    {/* Stats strip on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="grid grid-cols-3 gap-2"
                        style={{
                          background: "var(--surface-strong)",
                          border: "1px solid var(--border)",
                          backdropFilter: "blur(32px) saturate(1.5)",
                          WebkitBackdropFilter: "blur(32px) saturate(1.5)",
                          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,135,0.06), inset 0 1px 0 rgba(255,255,255,0.04)"
                        }}>
                        {[
                          { num: "+5", sub: locale === "ar" ? "سنوات" : "Years" },
                          { num: "3", sub: locale === "ar" ? "مشاريع" : "Projects" },
                          { num: "2", sub: locale === "ar" ? "دول" : "Countries" },
                        ].map((s) => (
                          <div key={s.sub} className="rounded-xl p-3 text-center"
                            style={{ background: "var(--surface-strong)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <p className="text-xl font-black text-foreground">{s.num}</p>
                            <p className="text-[11px] text-foreground-soft">{s.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#060810] to-transparent" />
      </section>

      {/* â•â•â•â•â• EXPERIENCE TIMELINE â•â•â•â•â• */}
      <section className="relative px-5 py-20 md:px-8 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 50% 60% at 5% 50%, rgba(0,255,135,0.05), transparent)" }}
        />
        <div className="section-frame">
          <Reveal>
            <div className="mb-14">
              <span className="eyebrow">{t.journey.eyebrow}</span>
              <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl">{t.journey.title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-foreground-muted">{t.journey.body}</p>
            </div>
          </Reveal>

          <div className="relative space-y-0">
            {/* Vertical line */}
            <div
              className="absolute start-5 top-3 bottom-3 w-[2px] md:start-[3.5rem]"
              style={{ background: "linear-gradient(to bottom, var(--primary), var(--accent)aa, transparent)" }}
            />

            {entries.map((entry, i) => (
              <Reveal key={entry.id} delay={i * 0.08}>
                <div className="relative flex gap-8 pb-12">
                  {/* Dot */}
                  <div className="relative z-10 mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:h-14 md:w-28 md:rounded-2xl"
                    style={{
                      background: i === 0
                        ? "linear-gradient(135deg, var(--primary), rgba(0,255,135,0.08))"
                        : "var(--surface-strong)",
                      border: i === 0 ? "2px solid var(--primary)88" : "2px solid rgba(255,255,255,0.08)",
                      boxShadow: i === 0 ? "0 0 20px rgba(0,255,135,0.3)" : "none",
                    }}
                  >
                    {/* Mobile: dot only */}
                    <span className="h-3 w-3 rounded-full md:hidden"
                      style={{ background: i === 0 ? "var(--primary)" : "rgba(255,255,255,0.2)" }} />
                    {/* Desktop: year */}
                    {entry.period && (
                      <span className="hidden font-mono text-[10px] font-bold leading-tight text-center text-foreground-muted md:block">
                        {entry.period.split("–")[0]?.trim() ?? entry.period}
                      </span>
                    )}
                  </div>

                  {/* Card */}
                  <motion.div
                    whileHover={{ borderColor: "var(--primary)", y: -2 }}
                    className="flex-1 rounded-[2rem] p-6 transition duration-300 md:p-8"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px)" }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-extrabold text-foreground md:text-2xl" dangerouslySetInnerHTML={{ __html: entry.company }} />
                          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--secondary)" }} dangerouslySetInnerHTML={{ __html: entry.role }} />
                      </div>
                      <div className="text-end">
                        {entry.period && (
                          <span className="rounded-full px-3 py-1 font-mono text-[11px] font-bold"
                            style={{ background: "rgba(0,255,135,0.07)", border: "1px solid var(--primary-glow)", color: "var(--primary)" }}>
                            {entry.period}
                          </span>
                        )}
                        {entry.location && (
                          <p className="mt-1.5 flex items-center justify-end gap-1 text-xs text-foreground-soft">
                            <MapPin className="h-3 w-3" />{entry.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mt-4 text-base leading-8 text-foreground-muted" dangerouslySetInnerHTML={{ __html: entry.story }} />
                    {entry.highlights.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {entry.highlights.map((h) => (
                          <span key={h} className="rounded-full px-3 py-1.5 text-xs font-semibold"
                            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.18)", color: "#06b6d4" }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â• SKILLS PANEL â•â•â•â•â• */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="section-frame">
          <div className="grid gap-12 lg:grid-cols-2">

            {/* Skill bars */}
            <div>
              <Reveal>
                <span className="eyebrow">{t.cv.pillarsTitle}</span>
                <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl">
                  {locale === "ar" ? "ما أُتقنه فعلاً" : "What I actually master"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{t.cv.pillarsBody ?? t.cv.creatorBody}</p>
              </Reveal>
              <div className="mt-8 space-y-5">
                {skills.map((skill, i) => (
                  <Reveal key={skill.label} delay={i * 0.06}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{skill.label}</span>
                        <span className="font-mono text-sm font-black" style={{ color: skill.color }}>{skill.pct}%</span>
                      </div>
                      <div className="h-[3px] rounded-full" style={{ background: "var(--surface-soft)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          style={{ background: skill.color, boxShadow: `0 0 12px ${skill.color}99` }}
                        />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Tech cloud */}
              <Reveal delay={0.28}>
                <div className="mt-8">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">
                    {locale === "ar" ? "الأدوات والتقنيات" : "Stack & tools"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Next.js","React","TypeScript","Tailwind","Framer Motion","Figma","Node.js","Vercel","YouTube","Premiere","Git","Supabase"].map((t) => (
                      <motion.span
                        key={t}
                        whileHover={{ scale: 1.1, borderColor: "rgba(0,255,135,0.45)" }}
                        className="cursor-default rounded-full px-3 py-1.5 text-[11px] font-bold text-foreground-soft"
                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
                      >{t}</motion.span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Photo mosaic */}
            <div className="grid grid-cols-2 gap-3">
              {(gallery.length > 0 ? gallery : [
                { id: "g1", image: "/images/cv-mosaic-tech.png", title: "Digital", ratio: "portrait" as const },
                { id: "g2", image: "/images/logo-unboxing.png", title: "Brand", ratio: "wide" as const },
                { id: "g3", image: "/images/cv-mosaic-ops.png", title: "Logistics", ratio: "wide" as const },
                { id: "g4", image: "/images/yt-hero-2026.png", title: "Media", ratio: "square" as const },
              ]).slice(0, 4).map((item, i) => (
                <Reveal key={item.id} delay={i * 0.06}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      "overflow-hidden rounded-[1.75rem]",
                      i === 0 ? "col-span-2" : ""
                    )}
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className={cn(
                      "relative overflow-hidden",
                      i === 0 ? "aspect-[21/9]" : item.ratio === "portrait" ? "aspect-[3/4]" : "aspect-square"
                    )}>
                      <Image
                        src={item.image} alt={item.title} fill loading={i === 0 ? "eager" : "lazy"}
                        sizes="(max-width:768px) 100vw, 40vw"
                        className="object-cover transition duration-700 hover:scale-105"
                        style={{ objectPosition: item.ratio === "portrait" ? "top" : "center" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition duration-300 hover:opacity-0" />
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â• BOTTOM CTA â•â•â•â•â• */}
      <section className="px-5 pb-20 md:px-8">
        <div className="section-frame">
          <Reveal>
            <motion.div
              whileHover={{ borderColor: "rgba(0,255,135,0.30)" }}
              className="relative overflow-hidden rounded-[2.5rem] p-10 md:p-16"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(0,255,135,0.14)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute end-0 top-0 h-full w-1/2 opacity-30"
                style={{ background: "radial-gradient(ellipse at right center, rgba(0,255,135,0.12), transparent 70%)" }}
              />
              <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex-1">
                  <span className="eyebrow">{locale === "ar" ? "جاهز للتعاون" : "Ready to collaborate"}</span>
                  <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-4xl">
                    {locale === "ar" ? "تحميل السيرة أو ابدأ الحوار مباشرة" : "Download the CV or open the conversation"}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-foreground-muted">
                    {locale === "ar"
                      ? "المشاريع الجادة تستحق تواصلاً مباشراً. سأرد خلال 24 ساعة."
                      : "Serious projects deserve direct conversation. Response within 24 hours."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <motion.a
                    href="/Lebenslauf.pdf" target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px var(--primary)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-black text-black"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    PDF
                  </motion.a>
                  <motion.a
                    href={`/${locale}/contact`}
                    whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.25)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-7 py-3.5 text-sm font-bold text-foreground-muted"
                  >
                    <Mail className="h-4 w-4" />
                    {locale === "ar" ? "تواصل" : "Contact"}
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3D UI HELPERS — Advanced Motion Systems
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function TiltCard({ children, className, glowColor = "var(--primary)" }: { children: React.ReactNode, className?: string, glowColor?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { damping: 25, stiffness: 120 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { damping: 25, stiffness: 120 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    x.set(px);
    y.set(py);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("relative group perspective-1000", className)}
    >
      <div className="absolute inset-0 z-0 scale-95 opacity-0 group-hover:opacity-100 transition duration-700 blur-[60px]"
        style={{ background: `radial-gradient(circle at center, ${glowColor}33, transparent 70%)` }} />
      <div className="relative z-10 h-full w-full" style={{ transform: "translateZ(50px)" }}>
        {children}
      </div>
    </motion.div>
  );
}

function GlareEffect() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleGlobalMove);
    return () => window.removeEventListener("mousemove", handleGlobalMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
      style={{
        background: useTransform(
          [mouseX, mouseY],
          ([x, y]) => `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4), transparent 40%)`
        )
      }}
    />
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PROJECTS PAGE — 2026 3D Cinematic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Weather3DWidget({ weather: liveWeather, locale }: { weather: LiveWeather | null, locale: Locale }) {
  const mockWeather: LiveWeather = {
    city: locale === "ar" ? "برلين" : "Berlin",
    country: "DE",
    temp: 22,
    feelsLike: 21,
    humidity: 42,
    wind: 8,
    pressure: 1018,
    sunrise: "06:30",
    sunset: "20:30",
    isDay: true,
    condition: "Clear",
    icon: "01d"
  };
  
  const weather = liveWeather || mockWeather;
  const isDemo = !liveWeather;

  const getIcon = () => {
    switch (weather.condition) {
      case "Clear": return <Sun className="h-10 w-10 text-yellow-400 animate-pulse" />;
      case "Clouds": return <Cloud className="h-10 w-10 text-gray-400" />;
      case "Rain": return <CloudRain className="h-10 w-10 text-blue-400" />;
      case "Thunderstorm": return <CloudLightning className="h-10 w-10 text-purple-400" />;
      case "Snow": return <Snowflake className="h-10 w-10 text-blue-200" />;
      default: return <Sun className="h-10 w-10 text-yellow-400" />;
    }
  };

  return (
    <TiltCard glowColor="var(--primary)" className="h-full min-h-[220px]">
      <div className="flex h-full flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-3xl relative">
        {isDemo && (
          <div className="absolute top-4 right-4 rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white/30 border border-white/10">
            Preview
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
              {locale === "ar" ? "الطقس المباشر" : "Live Weather"}
            </span>
            <h3 className="text-xl font-bold text-foreground">{weather.city}</h3>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 shadow-inner">
            {getIcon()}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-5xl font-black text-foreground">{weather.temp}°</p>
          <p className="text-sm font-semibold text-foreground-soft capitalize mt-1">{weather.condition}</p>
        </div>

        <div className="mt-6 flex gap-4 text-xs text-foreground-muted">
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-4">
            <Wind className="h-3.5 w-3.5" />
            <span>{weather.wind} km/h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5" />
            <span>{weather.humidity}%</span>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

function Matches3DWidget({ matches: liveMatches, locale }: { matches: LiveMatch[], locale: Locale }) {
  const mockMatches: LiveMatch[] = [
    {
      id: 202611,
      league: "Champions League",
      homeTeam: "Real Madrid",
      awayTeam: "Man City",
      homeScore: 2,
      awayScore: 2,
      homeLogo: "https://crests.football-data.org/86.svg",
      awayLogo: "https://crests.football-data.org/65.svg",
      status: "LIVE",
      time: "78'"
    }
  ];

  const matches = liveMatches.length > 0 ? liveMatches : mockMatches;
  const isDemo = liveMatches.length === 0;

  const [index, setIndex] = useState(0);
  const current = matches[index % matches.length];

  useEffect(() => {
    if (matches.length <= 1) return;
    const interval = setInterval(() => setIndex(i => i + 1), 6000);
    return () => clearInterval(interval);
  }, [matches.length]);

  if (!current) return null;

  return (
    <TiltCard glowColor="var(--secondary)" className="h-full min-h-[220px]">
      <div className="flex h-full flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-3xl relative">
        {isDemo && (
          <div className="absolute top-4 right-4 rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white/30 border border-white/10">
            Preview
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary/80">
              {current.league}
            </span>
          </div>
          <div className={cn(
            "rounded-full px-2 py-1 text-[9px] font-black",
            current.status === "LIVE" ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-foreground-soft"
          )}>
            {current.status}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-around gap-4">
          <div className="text-center w-20">
            <div className="relative mx-auto h-12 w-12 overflow-hidden rounded-xl bg-white p-1">
              <Image src={current.homeLogo} alt={current.homeTeam} fill className="object-contain" />
            </div>
            <p className="mt-2 text-[10px] font-bold text-foreground-soft truncate">{current.homeTeam}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-foreground">
              {current.homeScore ?? "-"} <span className="text-lg text-white/20 mx-1">:</span> {current.awayScore ?? "-"}
            </p>
            <p className="mt-1 text-[10px] font-mono font-bold text-secondary">{current.time}</p>
          </div>
          <div className="text-center w-20">
            <div className="relative mx-auto h-12 w-12 overflow-hidden rounded-xl bg-white p-1">
              <Image src={current.awayLogo} alt={current.awayTeam} fill className="object-contain" />
            </div>
            <p className="mt-2 text-[10px] font-bold text-foreground-soft truncate">{current.awayTeam}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/5 pt-4">
           <div className="flex items-center justify-center gap-2 text-xs text-foreground-muted">
              <Timer className="h-3 w-3" />
              <span>{isDemo ? (locale === "ar" ? "معاينة العرض" : "Preview Mode") : (locale === "ar" ? "محدث لحظياً" : "Updated instantly")}</span>
           </div>
        </div>
      </div>
    </TiltCard>
  );
}

function Project3DShowcase({ project, index, locale, t }: { project: SiteProject, index: number, locale: Locale, t: any }) {
  const story = projectStory(project, locale);
  const accentMap = {
    "neon-green": { border: "var(--primary-border)", color: "var(--primary)", bg: "rgba(0,255,135,0.06)", glow: "rgba(0,255,135,0.12)" },
    "neon-orange": { border: "var(--secondary-border)", color: "var(--secondary)", bg: "rgba(255,107,0,0.06)", glow: "rgba(255,107,0,0.12)" },
    "neon-purple": { border: "var(--accent-border)", color: "var(--accent)", bg: "rgba(168,85,247,0.06)", glow: "rgba(168,85,247,0.12)" },
  };
  const accent = accentMap[story.accent as keyof typeof accentMap] ?? accentMap["neon-green"];

  return (
    <Reveal delay={index * 0.08}>
      <TiltCard glowColor={accent.color} className="mb-10 lg:mb-16">
        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-surface backdrop-blur-3xl shadow-2xl transition duration-500 hover:border-white/20">
          <GlareEffect />
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            {/* Visual Side */}
            <div className="relative min-h-[350px] overflow-hidden lg:min-h-[500px]">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover object-top transition duration-1000 group-hover:scale-110"
                style={{ transform: "translateZ(30px)" }}
              />
              <div
                className="absolute inset-0 z-10"
                style={{ background: `linear-gradient(to ${locale === "ar" ? "right" : "left"}, var(--background) 0%, transparent 80%)` }}
              />
              {/* Floating Meta */}
              <div className="absolute top-8 start-8 z-20">
                <span className="rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] shadow-2xl"
                  style={{ background: "rgba(10,12,24,0.8)", border: `1px solid ${accent.border}`, color: accent.color, backdropFilter: "blur(12px)" }}>
                  {story.type}
                </span>
              </div>
            </div>

            {/* Content Side */}
            <div className="flex flex-col justify-center p-10 lg:p-14 relative z-20">
              <motion.h2 className="text-3xl font-black text-foreground md:text-5xl tracking-tight leading-none"
                style={{ transform: "translateZ(40px)" }}>
                {project.title}
              </motion.h2>
              <p className="mt-6 text-lg leading-relaxed text-foreground-muted" style={{ transform: "translateZ(20px)" }}>
                {project.summary}
              </p>

              {/* Problem/Solution Bento */}
              <div className="mt-10 grid gap-4" style={{ transform: "translateZ(10px)" }}>
                {[
                  { label: locale === "ar" ? "التحدي" : "Challenge", text: story.challenge, color: "rgba(255,255,255,0.04)" },
                  { label: locale === "ar" ? "الحل الفني" : "Engineering", text: story.solution, color: accent.bg },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl p-6 transition hover:bg-white/5" style={{ background: item.color, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: accent.color }}>{item.label}</p>
                    <p className="mt-2 text-sm leading-7 text-foreground/80">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Action Hub */}
              <div className="mt-12 flex flex-wrap gap-4">
                {project.href && (
                  <motion.a
                    href={project.href} target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, boxShadow: `0 0 32px ${accent.color}44` }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-black text-black"
                    style={{ background: accent.color }}
                  >
                    {t.common.visitProject}
                    <ExternalLink className="h-4 w-4" />
                  </motion.a>
                )}
                {project.repoUrl && (
                  <motion.a
                    href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-sm font-bold text-foreground-muted"
                  >
                    GitHub
                    <ArrowUpRight className="h-4 w-4" />
                  </motion.a>
                )}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}

function ProjectsPage({ model }: { model: SiteViewModel }) {
  const { locale, t, projects, live } = model;

  return (
    <div className="space-y-0" data-testid="projects-page">

      {/* ═════ HERO ═════ */}
      <section className="relative overflow-hidden px-5 py-20 md:px-8 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 0% 50%, rgba(0,255,135,0.09), transparent)," +
              "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(168,85,247,0.08), transparent)," +
              "var(--background)",
          }}
        />
        <div className="section-frame relative z-10">
          <Reveal>
            <div className="max-w-3xl">
              <span className="eyebrow">{t.projects.eyebrow}</span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="headline-arabic mt-5 text-4xl font-black leading-tight text-foreground md:text-7xl tracking-tighter"
              >
                {t.projects.title}
              </motion.h1>
              <p className="mt-6 text-lg leading-8 text-foreground-muted">{t.projects.body}</p>
            </div>
          </Reveal>

          {/* Interactive Live Bento */}
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {/* Stats Card */}
             <Reveal delay={0.1}>
                <div className="flex h-full flex-col justify-between rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-md">
                   <div className="space-y-6">
                      {[
                        { num: String(projects.length), label: locale === "ar" ? "مشروع منشور" : "Projects live", color: "var(--primary)" },
                        { num: "100%", label: locale === "ar" ? "بناء مخصص" : "Custom built", color: "var(--accent)" },
                        { num: "Live", label: locale === "ar" ? "بيانات حية" : "Live data APIs", color: "var(--secondary)" },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-3xl font-black" style={{ color: s.color }}>{s.num}</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft/60">{s.label}</p>
                        </div>
                      ))}
                   </div>
                   <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-foreground-muted">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      {locale === "ar" ? "جاهز للتحديات الجديدة" : "Ready for new challenges"}
                   </div>
                </div>
             </Reveal>

             {/* Live Weather */}
             <Reveal delay={0.15}>
                <Weather3DWidget weather={live.weather} locale={locale} />
             </Reveal>

             {/* Live Sports */}
             <Reveal delay={0.2}>
                <Matches3DWidget matches={live.matches} locale={locale} />
             </Reveal>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ═════ 3D PROJECT SHOWCASE ═════ */}
      <section className="px-5 py-20 md:px-8">
        <div className="section-frame">
          <div className="mb-14">
             <Reveal>
                <h2 className="text-2xl font-black text-foreground md:text-4xl">
                   {locale === "ar" ? "أبرز الإنجازات" : "Selected Masterpieces"}
                </h2>
             </Reveal>
          </div>
          
          <div className="space-y-0">
            {projects.map((project, index) => (
              <Project3DShowcase 
                key={project.id} 
                project={project} 
                index={index} 
                locale={locale} 
                t={t} 
              />
            ))}
          </div>

          {/* Epic Bottom CTA */}
          <Reveal delay={0.2}>
            <div className="group relative mt-20 overflow-hidden rounded-[3rem] border border-primary/20 bg-background p-12 text-center md:p-20">
               <div className="absolute inset-0 z-0 opacity-10 transition duration-1000 group-hover:opacity-20"
                 style={{ background: "radial-gradient(circle at center, var(--primary), transparent 70%)" }} />
               
               <div className="relative z-10 flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 mb-8 border border-primary/20">
                    <Zap className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="headline-arabic text-3xl font-black text-foreground md:text-5xl">
                    {locale === "ar" ? "لنصنع شيئاً مبهراً معاً" : "Let's build something epic together"}
                  </h2>
                  <p className="mt-6 max-w-xl text-lg leading-8 text-foreground-muted">
                    {locale === "ar" 
                      ? "أحول الأفكار المعقدة إلى واجهات بسيطة، تفاعلية، ومربحة. هل أنت جاهز؟" 
                      : "I transform complex ideas into simple, interactive, and profitable interfaces. Ready?"}
                  </p>
                  <div className="mt-10 flex flex-wrap justify-center gap-4">
                    <motion.a
                      href={`/${locale}/contact`}
                      whileHover={{ scale: 1.05, boxShadow: "0 0 50px var(--primary)" }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center gap-3 rounded-full px-10 py-5 text-sm font-black text-black"
                      style={{ background: "var(--primary)" }}
                    >
                      {locale === "ar" ? "ابدأ مشروعك الآن" : "Start your project"}
                      <ArrowUpRight className="h-5 w-5" />
                    </motion.a>
                  </div>
               </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   YOUTUBE PAGE — Cinematic Redesign
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
function YoutubePage({ model }: { model: SiteViewModel }) {
  const { locale, t, featuredVideo } = model;
  const latest = model.latestVideos.filter((v) => v.id !== featuredVideo?.id).slice(0, 6);
  const videoCount = Number(model.youtube.videos ?? 162);

  const stats = [
    { num: "+1.5M", label: locale === "ar" ? "مشاهدة إجمالية" : "Total views", color: "var(--secondary)", icon: Eye },
    { num: "+6.1K", label: locale === "ar" ? "مشترك" : "Subscribers", color: "var(--primary)", icon: Heart },
    { num: String(videoCount), label: locale === "ar" ? "فيديو منشور" : "Videos published", color: "var(--accent)", icon: Clapperboard },
    { num: "DE", label: locale === "ar" ? "من ألمانيا" : "Based in Germany", color: "#06b6d4", icon: Globe2 },
  ];

  return (
    <div className="space-y-0" data-testid="youtube-page">

      {/* â•â•â•â•â• DRAMATIC HERO â•â•â•â•â• */}
      <section className="relative overflow-hidden">
        {/* Full-bleed background */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url('/images/yt-hero-2026.png')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,107,0,0.15), transparent 60%)," +
              "radial-gradient(ellipse 60% 60% at 80% 80%, rgba(168,85,247,0.10), transparent)," +
              "linear-gradient(180deg, transparent, #06080f 80%)",
          }}
        />

        <div className="section-frame relative z-10 py-24 md:py-32">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "var(--secondary)" }}>
                <PlayCircle className="h-3.5 w-3.5" />
                @Moalfarras
              </div>
              <h1 className="headline-arabic text-4xl font-black leading-tight text-foreground md:text-6.5xl tracking-tight">
                {t.youtube.title}
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-foreground-muted">
                {t.youtube.body}
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <motion.a
                  href="https://www.youtube.com/@Moalfarras"
                  target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,107,0,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-black text-foreground"
                  style={{ background: "linear-gradient(135deg, var(--secondary), #e05500)" }}
                >
                  <PlayCircle className="h-5 w-5" />
                  {t.youtube.channelCta}
                </motion.a>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#06080f] to-transparent" />
      </section>

      {/* â•â•â•â•â• STAT CARDS â•â•â•â•â• */}
      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="section-frame">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
              <Reveal key={s.label} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -4, borderColor: `${s.color}44` }}
                  className="relative overflow-hidden rounded-[2rem] p-7 text-center transition duration-300"
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${s.color}22`,
                    backdropFilter: "blur(24px)",
                  }}
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(circle at center, ${s.color}12, transparent 70%)` }} />
                  <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </span>
                  <p className="relative z-10 text-3xl font-black md:text-4xl" style={{ color: s.color }}>
                    {s.num}
                  </p>
                  <p className="relative z-10 mt-2 text-xs font-bold uppercase tracking-widest text-foreground-muted">
                    {s.label}
                  </p>
                </motion.div>
              </Reveal>
            )})}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â• FEATURED VIDEO + ABOUT â•â•â•â•â• */}
      <section className="px-5 py-4 md:px-8">
        <div className="section-frame">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Featured video */}
            {featuredVideo ? (
              <Reveal>
                <div className="overflow-hidden rounded-[2rem]"
                  style={{ border: "1px solid var(--secondary-glow)", background: "rgba(8,10,20,0.8)" }}>
                  <VideoCard video={featuredVideo} locale={locale} />
                </div>
              </Reveal>
            ) : null}

            {/* Channel story */}
            <Reveal delay={0.08}>
              <div
                className="flex h-full flex-col justify-center rounded-[2rem] p-7 md:p-9"
                style={{
                  background: "linear-gradient(160deg, rgba(255,107,0,0.07) 0%, rgba(8,10,20,0.95) 60%)",
                  border: "1px solid var(--secondary-border)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Clapperboard className="h-5 w-5 text-secondary" />
                </span>
                <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl">
                  {t.youtube.collaborationTitle}
                </h2>
                <p className="mt-4 text-base leading-8 text-foreground-muted">{t.youtube.collaborationBody}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {t.youtube.values.map((v) => (
                    <span key={v} className="rounded-full px-3 py-1.5 text-xs font-bold"
                      style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.25)", color: "var(--secondary)" }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â• CONTENT CATEGORIES â•â•â•â•â• */}
      <section className="px-5 py-12 md:px-8 md:py-14">
        <div className="section-frame">
          <Reveal>
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.26em] text-foreground-soft">
              {locale === "ar" ? "أنواع المحتوى" : "Content types"}
            </p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {(locale === "ar"
              ? [
                  { icon: "📱", label: "مراجعات منتجات", count: "60+", color: "var(--secondary)" },
                  { icon: "💻", label: "شرح تقني",        count: "40+", color: "var(--primary)" },
                  { icon: "🇩🇪", label: "حياة في ألمانيا", count: "30+", color: "var(--accent)" },
                  { icon: "🎯", label: "بناء مهارات",     count: "30+", color: "#06b6d4" },
                ]
              : [
                  { icon: "📱", label: "Product reviews",   count: "60+", color: "var(--secondary)" },
                  { icon: "💻", label: "Tech explainers",   count: "40+", color: "var(--primary)" },
                  { icon: "🇩🇪", label: "Life in Germany",  count: "30+", color: "var(--accent)" },
                  { icon: "🎯", label: "Skill building",    count: "30+", color: "#06b6d4" },
                ]
            ).map((cat, i) => (
              <Reveal key={cat.label} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4, borderColor: `${cat.color}44` }}
                  className="flex flex-col items-center gap-3 rounded-[2rem] p-6 text-center transition duration-300"
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${cat.color}22`,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <span className="text-4xl">{cat.icon}</span>
                  <p className="text-sm font-bold text-foreground">{cat.label}</p>
                  <p className="font-mono text-xl font-black" style={{ color: cat.color }}>{cat.count}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â• LATEST VIDEOS â•â•â•â•â• */}
      {latest.length > 0 && (
        <section className="px-5 py-12 md:px-8 md:py-16">
          <div className="section-frame">
            <Reveal>
              <div className="mb-8">
                <span className="eyebrow">{t.youtube.latestLabel}</span>
                <h2 className="headline-arabic mt-3 text-2xl font-black text-foreground md:text-3xl">
                  {locale === "ar" ? "أحدث الفيديوهات" : "Latest uploads"}
                </h2>
              </div>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {latest.map((video, i) => (
                <Reveal key={video.id} delay={i * 0.05}>
                  <VideoCard video={video} locale={locale} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
   CONTACT PAGE — Cinematic Redesign
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
function ContactPage({ model }: { model: SiteViewModel }) {
  const { locale, t } = model;

  return (
    <div className="space-y-0" data-testid="contact-page">

      {/* â•â•â•â•â• SPLIT HERO â•â•â•â•â• */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Contact Hero Background Image */}
        <div 
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/images/contact-hero-2026.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 100%)"
          }}
        />
        {/* Glow Effects */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(0,255,135,0.10), transparent 55%)," +
              "radial-gradient(ellipse 60% 50% at 0% 80%, rgba(168,85,247,0.08), transparent)," +
              "linear-gradient(180deg, transparent, #06080f 80%)",
          }}
        />

        <div className="section-frame relative z-10">
          <div className="grid min-h-screen items-center gap-10 lg:grid-cols-[1fr_480px]">

            {/* Left: hero copy */}
            <div className="py-24 space-y-7">
              {/* Availability indicator */}
              <Reveal>
                <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-bold"
                  style={{ background: "rgba(0,255,135,0.07)", border: "1px solid var(--primary)", color: "var(--primary)" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "var(--primary)" }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--primary)" }} />
                  </span>
                  {locale === "ar" ? "متاح الآن · الرد خلال 24 ساعة" : "Available now · Response within 24h"}
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="headline-arabic text-4xl font-black leading-tight text-foreground md:text-5xl lg:text-6.5xl tracking-tight">
                  {locale === "ar"
                    ? "فكرتك تستحق\nحضوراً لا يُنسى."
                    : "Your idea deserves\nan unforgettable presence."}
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="max-w-lg text-lg leading-8 text-foreground-muted">{t.contact.body}</p>
              </Reveal>

              {/* Direct channels */}
              <Reveal delay={0.14}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <motion.a
                    href={model.contact.whatsappUrl}
                    target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.04, boxShadow: "0 0 30px var(--primary)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-sm font-black text-black"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                  >
                    <MessageCircleMore className="h-5 w-5" />
                    WhatsApp
                  </motion.a>
                  <motion.a
                    href={`mailto:${model.contact.emailAddress}`}
                    whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.25)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 rounded-full border border-white/10 px-8 py-4 text-sm font-bold text-foreground-muted transition"
                  >
                    <Mail className="h-4 w-4" />
                    {model.contact.emailAddress}
                  </motion.a>
                </div>
              </Reveal>

              {/* Quick topic chips */}
              <Reveal delay={0.18}>
                <div className="flex flex-wrap gap-2">
                  {t.contact.chips.map((chip) => (
                    <span key={chip} className="rounded-full px-4 py-2 text-sm font-semibold text-foreground-muted"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      {chip}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: reasons panel */}
            <Reveal delay={0.06}>
              <div
                className="hidden lg:flex flex-col gap-4 rounded-[2.5rem] p-8"
                style={{
                  background: "var(--surface)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(28px)",
                }}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-foreground-soft">
                  {locale === "ar" ? "لماذا يتواصل الناس معي؟" : "Why people get in touch"}
                </p>
                {t.contact.reasons.map((reason, i) => {
                  const colors = ["var(--primary)", "var(--secondary)", "var(--accent)", "#06b6d4"];
                  return (
                    <motion.div
                      key={reason.title}
                      whileHover={{ x: locale === "ar" ? -4 : 4, borderColor: `${colors[i % 4]}44` }}
                      className="flex items-start gap-4 rounded-2xl p-5 transition duration-300"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: `1px solid ${colors[i % 4]}18`,
                      }}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                        style={{ background: `${colors[i % 4]}14`, color: colors[i % 4] }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">{reason.title}</p>
                        <p className="mt-1 text-sm leading-6 text-foreground-muted">{reason.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
                {/* 24h badge */}
                <div className="mt-2 flex items-center gap-3 rounded-2xl p-4"
                  style={{ background: "rgba(168,85,247,0.07)", border: "1px solid var(--accent-glow)" }}>
                  <Zap className="h-5 w-5 shrink-0" style={{ color: "var(--accent)" }} />
                  <p className="text-sm text-foreground-muted">
                    <span className="font-bold text-foreground">{t.contact.directTitle}</span>
                    {" — "}{t.contact.directBody}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#06080f] to-transparent" />
      </section>

      {/* â•â•â•â•â• FORM SECTION â•â•â•â•â• */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="section-frame">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">

            {/* Mobile reasons (hidden on desktop) */}
            <div className="space-y-4 lg:hidden">
              {t.contact.reasons.map((reason, i) => {
                const colors = ["var(--primary)", "var(--secondary)", "var(--accent)", "#06b6d4"];
                return (
                  <div key={reason.title} className="flex items-start gap-4 rounded-2xl p-5"
                    style={{ background: "rgba(8,10,20,0.8)", border: `1px solid ${colors[i % 4]}18`, backdropFilter: "blur(20px)" }}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                      style={{ background: `${colors[i % 4]}14`, color: colors[i % 4] }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-bold text-foreground">{reason.title}</p>
                      <p className="mt-1 text-sm leading-6 text-foreground-muted">{reason.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Left side: what to expect */}
            <Reveal>
              <div className="space-y-6">
                <div>
                  <span className="eyebrow">{t.contact.eyebrow}</span>
                  <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl">
                    {locale === "ar" ? "ابدأ بفكرة، سنكمل الباقي" : "Start with an idea, we'll build the rest"}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-foreground-muted">{t.contact.body}</p>
                </div>

                {/* Process steps */}
                {[
                  { icon: "âœ️", step: locale === "ar" ? "أرسل الفكرة" : "Send the idea", body: locale === "ar" ? "وصف بسيط يكفي في البداية" : "A simple description is enough to start" },
                  { icon: "⚡", step: locale === "ar" ? "رد خلال 24 ساعة" : "Reply within 24h", body: locale === "ar" ? "سأحلل الطلب وأعود بخطوة واضحة" : "I'll analyze and return with a clear next step" },
                  { icon: "🚀", step: locale === "ar" ? "ابدأ التنفيذ" : "Start execution", body: locale === "ar" ? "مشروع حقيقي بنتائج قابلة للقياس" : "Real project with measurable outcomes" },
                ].map((step, i) => (
                  <Reveal key={step.step} delay={i * 0.06}>
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {step.icon}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">{step.step}</p>
                        <p className="mt-1 text-sm leading-6 text-foreground-muted">{step.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            {/* Right side: form */}
            <Reveal delay={0.08}>
              <div
                className="rounded-[2rem] p-6 md:p-8"
                style={{
                  background: "linear-gradient(135deg, rgba(8,10,20,0.95), rgba(5,7,15,0.98))",
                  border: "1px solid rgba(0,255,135,0.14)",
                  backdropFilter: "blur(28px)",
                }}
              >
                <ContactForm locale={locale} whatsappUrl={model.contact.whatsappUrl} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}

void [CvPage, ProjectsPage, YoutubePage, ContactPage, useCountUp];

function BlogPage({ model }: { model: SiteViewModel }) {
  const { locale, t } = model;

  const insightIcons = ["🎯", "⚡", "🔍"];
  const insightAccents = [
    { border: "var(--primary-border)", bg: "rgba(0,255,135,0.06)", color: "var(--primary)" },
    { border: "var(--secondary-border)", bg: "rgba(255,107,0,0.06)", color: "var(--secondary)" },
    { border: "var(--accent-border)", bg: "rgba(168,85,247,0.06)", color: "var(--accent)" },
  ];

  const principles = locale === "ar"
    ? [
        { icon: "🎯", title: "اقرأ المشكلة قبل أن تبدأ الحل", body: "أكثر المشاريع التي تُعاد من الصفر كان يمكن حلها بقراءة أولية أعمق للجمهور والهدف.", tag: "منهج" },
        { icon: "⏱", title: "السرعة في التسليم ليست اختياراً", body: "في كل مشروع، هناك لحظة يتحول فيها التردد إلى فرصة ضائعة. التسليم الحقيقي يعني أن تصل في الوقت المناسب.", tag: "تنفيذ" },
        { icon: "🪞", title: "الواجهة مرآة للقرار التجاري", body: "ما تراه على الشاشة هو انعكاس مباشر لقرارات اتخذها شخص ما. الواجهة الجيدة لا تُصنع بالصدفة.", tag: "تصميم" },
      ]
    : [
        { icon: "🎯", title: "Read the problem before solving it", body: "Most projects rebuilt from scratch could have been fixed with a deeper initial reading of the audience and objective.", tag: "Method" },
        { icon: "⏱", title: "Speed in delivery is not optional", body: "In every project, there is a moment where hesitation becomes a missed opportunity. Real delivery means arriving at the right time.", tag: "Execution" },
        { icon: "🪞", title: "The interface mirrors business decisions", body: "What you see on screen is a direct reflection of decisions someone made. A good interface is never accidental.", tag: "Design" },
      ];

  return (
    <div className="space-y-0" data-testid="blog-page">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-14 md:px-8 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.08), transparent 55%)" }}
        />
        <div className="section-frame">
          <Reveal>
            <SectionHeading eyebrow={t.insights.eyebrow} title={t.insights.title} body={t.insights.body} />
          </Reveal>
        </div>
      </section>

      {/* Main insight cards */}
      <section className="px-5 py-12 md:px-8 md:py-14">
        <div className="section-frame">
          <div className="grid gap-5 lg:grid-cols-3">
            {t.insights.cards.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -6, borderColor: insightAccents[i]?.border.replace("0.18", "0.35") ?? "rgba(0,255,135,0.35)" }}
                  className="group h-full rounded-[2rem] p-7 transition duration-500"
                  style={{
                    background: "rgba(8,10,20,0.8)",
                    border: `1px solid ${insightAccents[i]?.border ?? "var(--primary-border)"}`,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Icon + number */}
                  <div className="mb-5 flex items-center gap-4">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                      style={{ background: insightAccents[i]?.bg ?? "rgba(0,255,135,0.06)", border: `1px solid ${insightAccents[i]?.border ?? "var(--primary-border)"}` }}
                    >
                      {insightIcons[i]}
                    </span>
                    <span className="font-mono text-4xl font-black" style={{ color: insightAccents[i]?.color ?? "var(--primary)", opacity: 0.2 }}>
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{card.title}</h3>
                  <p className="mt-4 text-sm leading-8 text-foreground-muted">{card.body}</p>

                  {/* Bottom accent line */}
                  <div className="mt-6 h-px w-full" style={{ background: `linear-gradient(${locale === "ar" ? "270deg" : "90deg"}, ${insightAccents[i]?.color ?? "var(--primary)"}40, transparent)` }} />
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics strip */}
      <section className="px-5 pb-2 md:px-8">
        <div className="section-frame">
          <Reveal>
            <div
              className="grid gap-3 sm:grid-cols-3"
            >
              {(
                locale === "ar"
                  ? [
                      { num: "+1.5M", label: "مشاهدة يوتيوب", sub: "محتوى بني على تكرار المشاهدة", color: "var(--secondary)" },
                      { num: "3", label: "مشاريع منشورة", sub: "كل واحدة حلت مشكلة حقيقية", color: "var(--primary)" },
                      { num: "100%", label: "مثنى عليها", sub: "لا أقبل مشاريع التجميل فقط", color: "var(--accent)" },
                    ]
                  : [
                      { num: "+1.5M", label: "YouTube views", sub: "Content built on repeat watching", color: "var(--secondary)" },
                      { num: "3", label: "Published projects", sub: "Each one solved a real problem", color: "var(--primary)" },
                      { num: "100%", label: "Stake in outcomes", sub: "No cosmetic-only projects accepted", color: "var(--accent)" },
                    ]
              ).map((m) => (
                <div key={m.label}
                  className="rounded-[2rem] p-6 text-center"
                  style={{
                    background: "rgba(8,10,20,0.8)",
                    border: `1px solid ${m.color}22`,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <p className="text-3xl font-black" style={{ color: m.color }}>{m.num}</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{m.label}</p>
                  <p className="mt-1 text-xs text-foreground-soft">{m.sub}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Deeper principles */}
      <section className="px-5 py-12 md:px-8 md:py-14">
        <div className="section-frame space-y-8">
          <Reveal>
            <SectionHeading
              eyebrow={locale === "ar" ? "من مشاريع حقيقية" : "From real projects"}
              title={locale === "ar" ? "مبادئ عملية أعود إليها دائمًا" : "Practical principles I keep returning to"}
              body=""
            />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="h-full rounded-[2rem] p-6 transition duration-300"
                  style={{
                    background: "linear-gradient(135deg, var(--surface-strong), rgba(5,7,15,0.95))",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-2xl">{p.icon}</span>
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)", color: "var(--primary)" }}>
                      {p.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground-muted">{p.body}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="section-frame">
          <Reveal>
            <div
              className="flex flex-col items-center gap-6 rounded-[2.5rem] p-10 text-center md:p-14"
              style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(8,10,20,0.95))",
                border: "1px solid var(--accent-glow)",
                backdropFilter: "blur(24px)",
              }}
            >
              <Lightbulb className="h-10 w-10" style={{ color: "var(--accent)" }} />
              <p className="max-w-xl text-xl font-bold text-foreground">
                {locale === "ar"
                  ? "هل لديك مشروع يحتاج دراسة حالة؟ تحدّث معي."
                  : "Have a project worth turning into a case study? Let's talk."}
              </p>
              <ActionLink href={`/${model.locale}/contact`} label={locale === "ar" ? "ابدأ التواصل" : "Start the conversation"} primary />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
   PRIVACY PAGE
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
function PrivacyAccordionItem({ item, index }: { item: string; index: number }) {
  const [open, setOpen] = useState(false);
  // Split into title (before first period/colon) and body
  const colonIdx = item.indexOf(":");
  const periodIdx = item.indexOf(".");
  const splitAt = colonIdx > -1 && colonIdx < 60 ? colonIdx : periodIdx > -1 && periodIdx < 80 ? periodIdx : -1;
  const title = splitAt > -1 ? item.slice(0, splitAt + 1) : item.slice(0, 60) + "…";
  const body = splitAt > -1 ? item.slice(splitAt + 1).trim() : item;

  return (
    <motion.div
      whileHover={{ borderColor: open ? "rgba(0,255,135,0.3)" : "var(--primary-border)" }}
      className="overflow-hidden rounded-[1.75rem] transition duration-300"
      style={{
        background: "rgba(8,10,20,0.75)",
        border: `1px solid ${open ? "rgba(0,255,135,0.22)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(20px)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black"
            style={{ background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.15)", color: "var(--primary)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-base font-bold text-foreground">{title}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
          style={{ color: "var(--primary)" }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div className="px-6 pb-6">
          <div className="h-px w-full mb-4" style={{ background: "linear-gradient(90deg, var(--primary-glow), transparent)" }} />
          <p className="text-sm leading-8 text-foreground-muted">{body || item}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PrivacyPage({ model }: { model: SiteViewModel }) {
  const { locale, t } = model;
  return (
    <div className="space-y-0" data-testid="privacy-page">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-14 md:px-8 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.07), transparent 55%)" }}
        />
        <div className="section-frame">
          <Reveal>
            <SectionHeading eyebrow={t.privacy.eyebrow} title={t.privacy.title} body={t.privacy.body} />
          </Reveal>
        </div>
      </section>

      {/* Accordion */}
      <section className="px-5 py-12 md:px-8 md:py-14">
        <div className="section-frame grid gap-3">
          {t.privacy.items.map((item, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <PrivacyAccordionItem item={item} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Summary box */}
      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="section-frame">
          <Reveal>
            <div
              className="flex flex-col items-center gap-5 rounded-[2.5rem] p-10 text-center md:flex-row md:text-start"
              style={{
                background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(8,10,20,0.95))",
                border: "1px solid rgba(0,229,255,0.15)",
                backdropFilter: "blur(24px)",
              }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
                🔒
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground">
                  {locale === "ar"
                    ? "بياناتك تبقى معك. لا مشاركة، لا بيع، لا تتبع تجاري."
                    : "Your data stays with you. No sharing, no selling, no commercial tracking."}
                </p>
                <p className="mt-2 text-sm leading-7 text-foreground-muted">
                  {locale === "ar"
                    ? "إن كان لديك أي سؤال حول خصوصيتك، أنا هنا للإجابة مباشرة."
                    : "If you have any questions about how your data is handled, I'm here to answer directly."}
                </p>
              </div>
              <ActionLink href={`/${locale}/contact`} label={locale === "ar" ? "تواصل معي" : "Contact me"} />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
   ROUTER
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
export function SiteViewClient({ model }: { model: SiteViewModel }) {
  switch (model.pageSlug) {
    case "cv":
      return <CvProfessional2026 model={model} />;
    case "projects":
      return <ProjectsProfessional2026 model={model} />;
    case "youtube":
      return <YoutubeProfessional2026 model={model} />;
    case "contact":
      return <ContactProfessional2026 model={model} />;
    case "blog":
      return <BlogPage model={model} />;
    case "privacy":
      return <PrivacyPage model={model} />;
    default:
      return <HomePage model={model} />;
  }
}
