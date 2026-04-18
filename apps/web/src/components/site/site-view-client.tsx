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
  Wind,
  CheckCircle,
  Clock
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

/* â”€â”€ Types â”€â”€ */
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
  portraitImage: string;
  downloads: {
    branded: string;
    ats: string;
  };
};

/* â”€â”€ Helpers â”€â”€ */
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
          type: "Ø®Ø¯Ù…Ø§Øª Ù†Ù‚Ù„",
          challenge: "Ø§Ù„Ø´Ø±ÙƒØ© ÙƒØ§Ù†Øª ØªØ¹Ù…Ù„ Ø¬ÙŠØ¯Ù‹Ø§ØŒ Ù„ÙƒÙ† Ø§Ù„Ø§Ù†Ø·Ø¨Ø§Ø¹ Ø§Ù„Ø£ÙˆÙ„ Ù„Ù… ÙŠÙƒÙ† ÙŠÙ‚ÙˆÙ„ Ø°Ù„Ùƒ Ø¨ÙˆØ¶ÙˆØ­.",
          solution: "Ø£ÙØ¹ÙŠØ¯ ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¨ØµØ±ÙŠ ÙˆØ§Ù„Ø±Ø³Ø§Ù„Ø© Ø­ØªÙ‰ ÙŠØ´Ø¹Ø± Ø§Ù„Ø²Ø§Ø¦Ø± Ø¨Ø§Ù„Ø«Ù‚Ø© Ù‚Ø¨Ù„ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØªÙØ§ØµÙŠÙ„.",
          result: "ØµÙˆØ±Ø© Ø£ÙƒØ«Ø± Ø¬Ø¯ÙŠØ©ØŒ ÙˆØ±Ø³Ø§Ù„Ø© Ø£Ø³Ø±Ø¹ØŒ ÙˆÙ…Ø³Ø§Ø± Ø£ÙˆØ¶Ø­ Ù†Ø­Ùˆ Ø§Ù„ØªÙˆØ§ØµÙ„.",
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
          type: "Ù…ÙˆÙ‚Ø¹ Ø­Ø¬Ø²",
          challenge: "ÙÙŠ Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù†Ù‚Ù„ØŒ Ø§Ù„Ù‚Ø±Ø§Ø± ÙŠØ­Ø¯Ø« Ø¨Ø³Ø±Ø¹Ø© ÙˆØªØ­Øª Ø¶ØºØ·. Ø§Ù„ØªØ´ØªÙŠØª Ù‡Ù†Ø§ ÙŠÙƒÙ„Ù‘Ù.",
          solution: "Ø¨ÙÙ†ÙŠØª Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø­ÙˆÙ„ Ø®Ø·ÙˆØ© ÙˆØ§Ø­Ø¯Ø© ÙˆØ§Ø¶Ø­Ø© Ù…Ø¹ Ø¹Ø±Ø¶ Ø£ÙƒØ«Ø± Ù‡Ø¯ÙˆØ¡Ù‹Ø§ ÙˆØ³Ø±Ø¹Ø©.",
          result: "ÙˆØ§Ø¬Ù‡Ø© ØªÙ‚ÙˆØ¯ Ù„Ù„Ø­Ø¬Ø² Ù…Ø¨Ø§Ø´Ø±Ø© ÙˆØªØ®ÙØ¶ Ø§Ù„ØªØ±Ø¯Ø¯ ÙÙŠ Ø£ÙˆÙ„ Ø²ÙŠØ§Ø±Ø©.",
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
        type: "Ù…Ù†ØªØ¬ Ø±Ù‚Ù…ÙŠ",
        challenge: "ÙƒØ§Ù† Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„ÙÙƒØ±Ø© Ø¨Ø´ÙƒÙ„ ÙˆØ§Ø¶Ø­ Ø¯ÙˆÙ† ÙÙ‚Ø¯Ø§Ù† Ø§Ù„Ø´Ø®ØµÙŠØ© Ø£Ùˆ Ø§Ù„Ø¥ÙŠÙ‚Ø§Ø¹ Ø§Ù„Ø¨ØµØ±ÙŠ.",
        solution: project.description,
        result: "Ø¹Ø±Ø¶ Ø£Ù†Ø¸ÙØŒ Ø«Ù‚Ø© Ø£Ø¹Ù„Ù‰ØŒ ÙˆØªØ¬Ø±Ø¨Ø© Ø£Ø³Ù‡Ù„ ÙÙŠ Ø§Ù„ÙÙ‡Ù… Ù…Ù† Ø£ÙˆÙ„ Ø´Ø§Ø´Ø©.",
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
      ? "ÙÙŠ Ø¹Ø§Ù„Ù… Ø§Ù„ØªÙˆØµÙŠÙ„ØŒ Ø§Ù„ØªØ£Ø®ÙŠØ± ÙŠØ¸Ù‡Ø± Ù…Ø¨Ø§Ø´Ø±Ø© Ø¹Ù„Ù‰ ÙˆØ¬Ù‡ Ø§Ù„Ø¹Ù…ÙŠÙ„. Ù‡Ù†Ø§Ùƒ ØªØ¹Ù„Ù‘Ù…Øª Ø£Ù† Ø§Ù„Ù†Ø¸Ø§Ù… Ù„ÙŠØ³ Ø±ÙØ§Ù‡ÙŠØ©ØŒ Ø¨Ù„ Ù…Ø§ ÙŠØ¬Ø¹Ù„ ÙƒÙ„ Ø´ÙŠØ¡ ÙŠØ¹Ù…Ù„."
      : "In delivery work, delays show up immediately on the customer side. That is where I learned that structure is not a luxury; it is what makes things work.";
  }
  if (key.includes("ikea")) {
    return locale === "ar"
      ? "Ø£ÙƒØ¨Ø± Ø¯Ø±Ø³ Ù…Ù† IKEA ÙƒØ§Ù† Ø¨Ø³ÙŠØ·Ù‹Ø§: Ø­ØªÙ‰ Ø§Ù„Ø¨Ø³Ø§Ø·Ø© ØªØ­ØªØ§Ø¬ Ù†Ø¸Ø§Ù…Ù‹Ø§ Ù‚ÙˆÙŠÙ‹Ø§ Ø®Ù„ÙÙ‡Ø§."
      : "The biggest lesson from IKEA was simple: even simplicity needs a strong system behind it.";
  }
  return locale === "ar"
    ? "Ù‡Ù†Ø§ Ø§Ø¬ØªÙ…Ø¹Øª Ø§Ù„Ø®ÙŠÙˆØ·: Ø§Ù†Ø¶Ø¨Ø§Ø· Ø§Ù„ØªØ´ØºÙŠÙ„ØŒ Ø°ÙˆÙ‚ Ø§Ù„ØªØµÙ…ÙŠÙ…ØŒ ÙˆØ±Ø³Ø§Ù„Ø© ØªÙ‚Ù†Ø¹ Ø¨Ø³Ø±Ø¹Ø©."
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

/* â”€â”€ CountUp Hook â”€â”€ */
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

/* â”€â”€ Shared UI â”€â”€ */
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

/* â”€â”€ Video Card â”€â”€ */
function VideoCard({ video, locale }: { video: YoutubeVideo; locale: Locale }) {
  return (
    <div
      className="video-card-shell group relative overflow-hidden rounded-[1.75rem] p-3 transition-all duration-500"
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

/* â”€â”€ HOME PAGE â”€â”€ */
function HomePage({ model }: { model: SiteViewModel }) {
  const { locale, t, projects, services, featuredVideo, youtube } = model;

  const heroStats = [
    { label: locale === "ar" ? "Ù…Ø´Ø§Ù‡Ø¯Ø©" : "Views", target: 1.5, suffix: "M", prefix: "+" },
    { label: locale === "ar" ? "Ù…Ø´ØªØ±Ùƒ" : "Subscribers", target: 6.1, suffix: "K", prefix: "+" },
    { label: locale === "ar" ? "ÙÙŠØ¯ÙŠÙˆ" : "Videos", target: Number(youtube.videos ?? 162), suffix: "", prefix: "" },
    { label: locale === "ar" ? "Ø§Ù„Ø±Ø¯" : "Response", target: 24, suffix: "h", prefix: "" },
  ];

  return (
    <div className="space-y-0">

      {/* â”€â”€ HERO â”€â”€ */}

      {/* ── CINEMATIC HERO ── */}
      <section
        data-testid="home-hero"
        className="relative flex min-h-[90svh] flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-16"
      >
        <div className="absolute top-0 right-1/4 h-[800px] w-[800px] rounded-full bg-white/[0.02] blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-white/[0.015] blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#04060C_100%)] pointer-events-none z-0" />

        <div className="relative z-10 mx-auto max-w-6xl w-full flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
             <span className="eyebrow mb-8">
               {locale === "ar" ? "متاح للمشاريع المختارة · ألمانيا" : "Available for selective projects · Based in Germany"}
             </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="headline-display text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] tracking-tighter text-white"
          >
            {locale === "ar" ? "مختصر." : "Clarity."} <br />
            <span className="text-white/40">
              {locale === "ar" ? "في واقع مزدحم." : "In a noisy world."}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 max-w-2xl text-lg md:text-xl font-medium leading-relaxed text-white/50 text-balance"
          >
            {locale === "ar"
               ? "أنا محمد الفراس. أبني واجهات ومنتجات رقمية تخطف الانتباه، تبني الثقة، وتقود للقرار. "
               : "I'm Mohammad Alfarras. I architect digital products and ecosystems that demand attention, build trust, and drive action. No excess, just impact."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href={`/${locale}#contact`} className="button-primary-shell w-full sm:w-auto">
               <Sparkles className="h-5 w-5" />
               {locale === "ar" ? "ابدأ العمل" : "Start your project"}
            </Link>
            <Link href="/app" className="button-secondary-shell w-full sm:w-auto">
               <PlayCircle className="h-5 w-5" />
               {locale === "ar" ? "استكشف MoPlayer" : "Explore MoPlayer"}
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl"
          >
            {heroStats.map((item, i) => (
              <div key={item.label} className="flex flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] mb-2">{item.label}</p>
                 <p className="text-3xl lg:text-4xl font-extrabold text-white tracking-tighter">
                   <HeroStatAnimated target={item.target} suffix={item.suffix} prefix={item.prefix} />
                 </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative px-5 py-12 md:px-8 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 18% 35%, rgba(0,229,255,0.12), transparent 28%), radial-gradient(circle at 82% 65%, rgba(139,92,246,0.16), transparent 30%)",
          }}
        />
        <div className="section-frame">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-[2.5rem] border border-white/8 p-5 md:p-8 lg:p-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(6,12,22,0.96), rgba(8,15,29,0.88) 55%, rgba(17,11,33,0.92))",
                boxShadow: "0 30px 80px rgba(0,0,0,0.38)",
              }}
            >
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-6">
                  <span className="eyebrow">
                    {locale === "ar" ? "ضمن نفس المنظومة" : "Inside the same ecosystem"}
                  </span>

                  <div className="space-y-4">
                    <h2 className="headline-display max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                      {locale === "ar"
                        ? "MoPlayer صار جزءاً واضحاً من moalfarras.space"
                        : "MoPlayer now lives as a clear product surface inside moalfarras.space"}
                    </h2>
                    <p className="max-w-2xl text-sm leading-8 text-white/60 md:text-base">
                      {locale === "ar"
                        ? "صفحة منتج حقيقية، تنزيل مباشر، دعم، خصوصية، وإيقاع بصري أقوى من مجرد مشروع داخل البورتفوليو. الفكرة الآن أوضح: هذا منتج رقمي له هويته، لكنه ما زال جزءاً من نفس البراند."
                        : "A real product page, direct download flow, support, privacy, and a stronger visual rhythm than a simple portfolio card. The message is clearer now: this is a digital product with its own identity inside the same brand."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        label: locale === "ar" ? "تنزيل مباشر" : "Direct APK",
                        body: locale === "ar" ? "من نفس الدومين" : "Served from the same domain",
                      },
                      {
                        label: locale === "ar" ? "Android + TV" : "Android + TV",
                        body: locale === "ar" ? "تجربة موجهة للشاشتين" : "Built for remote and touch flows",
                      },
                      {
                        label: locale === "ar" ? "دعم واضح" : "Clear support",
                        body: locale === "ar" ? "خصوصية ومركز مساعدة" : "Support and privacy linked cleanly",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-4 backdrop-blur-xl"
                      >
                        <p className="text-sm font-bold text-white">{item.label}</p>
                        <p className="mt-1 text-xs leading-6 text-white/45">{item.body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/app" className="button-primary-shell w-full sm:w-auto">
                      <PlayCircle className="h-4 w-4" />
                      {locale === "ar" ? "افتح صفحة التطبيق" : "Open the app page"}
                    </Link>
                    <Link href="/support" className="button-secondary-shell w-full sm:w-auto">
                      <MessageCircleMore className="h-4 w-4" />
                      {locale === "ar" ? "الدعم والمساعدة" : "Support and help"}
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-4">
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-black/30 p-3">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                        <Image
                          src="/images/moplayer_ui_now_playing-final.png"
                          alt="MoPlayer now playing preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 20vw"
                          className="object-cover object-center"
                        />
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-black/30 p-3">
                      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem]">
                        <Image
                          src="/images/moplayer_ui_playlist-final.png"
                          alt="MoPlayer playlist preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 20vw"
                          className="object-cover object-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[2.25rem] border border-white/8 bg-black/35 p-3">
                    <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-[#00E5FF]/10 blur-3xl" />
                    <div className="relative flex h-full min-h-[24rem] flex-col overflow-hidden rounded-[1.7rem] border border-white/6 bg-[linear-gradient(180deg,rgba(12,18,33,0.94),rgba(8,11,21,0.94))]">
                      <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src="/images/moplayer-brand-logo-final.png"
                            alt="MoPlayer logo"
                            width={40}
                            height={40}
                            className="h-10 w-10 object-contain"
                          />
                          <div>
                            <p className="text-sm font-bold text-white">MoPlayer</p>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">
                              {locale === "ar" ? "نفس الهوية" : "Same ecosystem"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                          2.0.0
                        </span>
                      </div>

                      <div className="relative flex-1">
                        <Image
                          src="/images/moplayer-brand-glow-card.png"
                          alt="MoPlayer brand hero"
                          fill
                          sizes="(max-width: 768px) 100vw, 28vw"
                          className="object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#05070E] via-[#05070E]/35 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <div className="rounded-[1.5rem] border border-white/8 bg-black/35 p-4 backdrop-blur-xl">
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                              {locale === "ar" ? "صفحة تطبيق مستقلة" : "Dedicated product page"}
                            </p>
                            <p className="mt-2 text-sm leading-7 text-white/70">
                              {locale === "ar"
                                ? "شرح أوضح، صور أقوى، تنزيل مباشر، ومسار دعم مرتب."
                                : "Clearer story, stronger imagery, direct download, and a cleaner support path."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â ABOUT Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
            
            {/* â”€â”€ TRUST STRIP â”€â”€ */}
            <div className="mx-auto flex w-full flex-wrap items-center justify-center gap-6 rounded-[2rem] border border-border-glass bg-bg-secondary/30 px-6 py-6 sm:gap-12 md:justify-between text-sm font-bold text-foreground">
              <div className="flex items-center gap-3">
                <PlayCircle className="h-5 w-5 text-[#FF0000]" />
                <span>1.5M+ <span className="font-medium text-foreground-muted">{locale === "ar" ? "Ù…Ø´Ø§Ù‡Ø¯Ø§Øª ÙŠÙˆØªÙŠÙˆØ¨" : "YouTube Views"}</span></span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>40+ <span className="font-medium text-foreground-muted">{locale === "ar" ? "Ù…Ø´Ø±ÙˆØ¹ Ø­Ù‚ÙŠÙ‚ÙŠ" : "Real Projects"}</span></span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-secondary" />
                <span>{'<'}24h <span className="font-medium text-foreground-muted">{locale === "ar" ? "Ø³Ø±Ø¹Ø© Ø§Ù„Ø§Ø³ØªØ¬Ø§Ø¨Ø©" : "Response Time"}</span></span>
              </div>
              <div className="flex items-center gap-3">
                 <MapPin className="h-5 w-5 text-orange-500" />
                <span>{locale === "ar" ? "Ù…Ù‚Ø±Ù‡ ÙÙŠ Ø£Ù„Ù…Ø§Ù†ÙŠØ§" : "Based in Germany"}</span>
              </div>
            </div>

            <SectionHeading
              eyebrow={locale === "ar" ? "Ù‚ØµØªÙŠ" : "My story"}
              title={locale === "ar" ? "Ù…Ù† Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ§Øª Ø¥Ù„Ù‰ ØµÙ†Ø§Ø¹Ø© Ø§Ù„Ø¯Ù‡Ø´Ø©" : "From logistics to making impact"}
              body=""
            />

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {/* Story text */}
              <div
                className="rounded-[2rem] p-8 md:p-10 border border-border-glass"
                style={{
                  background: "var(--surface)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <p className="text-lg leading-9 text-foreground-muted md:text-xl md:leading-10" dir={locale === "ar" ? "rtl" : "ltr"}>
                  {locale === "ar" ? (
                    <>
                      <span className="font-bold text-foreground">Ù…Ø­Ù…Ø¯ Ø§Ù„ÙØ±Ø§Ø³.</span>{" "}
                      Ù…Ø·ÙˆÙ‘Ø±ØŒ Ù…ØµÙ…Ù‘Ù…ØŒ ÙˆØµØ§Ù†Ø¹ Ù…Ø­ØªÙˆÙ‰.
                      <br /><br />
                      Ù‚Ø¶ÙŠØªÙ Ø³Ù†ÙˆØ§ØªÙ ÙÙŠ Ù‚Ø·Ø§Ø¹ÙŠ Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„Ù„ÙˆØ¬Ø³ØªÙŠÙƒ Ø¯Ø§Ø®Ù„{" "}
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>Ø£Ù„Ù…Ø§Ù†ÙŠØ§</span>.
                      {" "}ØªØ¹Ù„Ù‘Ù…Øª Ù‡Ù†Ø§Ùƒ Ø£Ù† Ø§Ù„Ù†Ø§Ø³ Ù„Ø§ ÙŠÙ‚Ø±Ø£ÙˆÙ† ÙƒÙ„ Ø´ÙŠØ¡ â€”{" "}
                      <span className="font-semibold text-foreground">{"Ø«Ø§Ù†ÙŠØªØ§Ù† ÙˆØ§Ù„Ù‚Ø±Ø§Ø± Ø§ØªÙÙ‘Ø®Ø°"}</span>.
                      <br /><br />
                      Ù„Ù‡Ø°Ø§ Ø£Ø¨Ù†ÙŠÙ‡Ø§ ØµØ­ÙŠØ­Ù‹Ø§ Ù…Ù† Ø§Ù„Ø£Ø³Ø§Ø³: ÙˆØ§Ø¬Ù‡Ø© ØªÙ‚ÙˆÙ„ ÙƒÙ„ Ø´ÙŠØ¡ ÙÙŠ Ø£ÙˆÙ„ Ù†Ø¸Ø±Ø©ØŒ Ù„Ø§ ØªØ­ØªØ§Ø¬ ÙÙ‚Ø±Ø© Ø«Ø§Ù„Ø«Ø© Ù„ØªÙÙ‚Ù†Ø¹ØŒ ÙˆÙ„Ø§ ØµÙØ­Ø© ÙƒØ§Ù…Ù„Ø© Ù„ØªØ´Ø±Ø­. Ø§Ù„Ø«Ù‚Ø© ØªØ¨Ø¯Ø£ Ø¨ØµØ±ÙŠÙ‹Ø§.
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
                      So I build it right from the foundation: an interface that says everything at first glance â€” no third paragraph needed, no full page to explain. Trust starts visually.
                    </>
                  )}
                </p>
              </div>

              {/* Identity cards */}
              <div className="grid gap-4">
                {(locale === "ar"
                    ? [
                      { icon: Globe2, title: "Ù…Ù† Ø§Ù„Ø­Ø³ÙƒØ© Ø¥Ù„Ù‰ Ø£Ù„Ù…Ø§Ù†ÙŠØ§", body: "Ø§Ù„Ù‡Ø¬Ø±Ø© ØºÙŠÙ‘Ø±Øª Ù†Ø¸Ø±ØªÙŠ Ù„Ù„ÙˆÙ‚ØªØŒ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù…ØŒ ÙˆØ§Ù„Ù†ØªÙŠØ¬Ø© Ø§Ù„ØªÙŠ ÙŠØ¬Ø¨ Ø£Ù† ØªØµÙ„ ÙÙŠ Ù…ÙˆØ¹Ø¯Ù‡Ø§." },
                      { icon: Zap, title: "Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ§Øª Ø¹Ù„Ù‘Ù…ØªÙ†ÙŠ", body: "ÙƒÙ„ ØªØ£Ø®ÙŠØ± Ù„Ù‡ Ø«Ù…Ù†. Ù„Ù‡Ø°Ø§ Ø£Ø¨Ù†ÙŠ ÙˆØ§Ø¬Ù‡Ø§Øª ØªØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ø§Ù„ØªØ±ØªÙŠØ¨ ÙˆØ§Ù„ÙˆØ¶ÙˆØ­ØŒ Ù„Ø§ Ø§Ù„Ø§Ø³ØªØ¹Ø±Ø§Ø¶." },
                      { icon: Eye, title: "+1.5M Ù…Ø´Ø§Ù‡Ø¯Ø©", body: "Ù…Ù† Ø´Ø±Ø­ ØµØ§Ø¯Ù‚ ÙŠØ¨Ù†ÙŠ Ø«Ù‚Ø© Ù„Ø§ ØªØ³ØªØ·ÙŠØ¹ Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª Ø´Ø±Ø§Ø¡Ù‡Ø§." },
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
                      className="flex items-start gap-4 rounded-2xl p-5 transition duration-300 border border-border-glass"
                      style={{
                        background: "var(--surface)",
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â SERVICES Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â PROJECTS BENTO Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                      isFeatured ? "lg:col-span-2 lg:row-span-2 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr]" : "flex flex-col",
                      isMoPlayer ? "ring-2 ring-purple-500/30" : "",
                    )}
                    style={{
                      background: "var(--surface)",
                      border: `1px solid ${borderColor}`,
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Image */}
                    <div className={cn(
                      "relative overflow-hidden w-full h-full",
                      isFeatured ? "aspect-[16/10] lg:aspect-auto min-h-[300px]" : "aspect-[16/9]"
                    )}>
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
                          â­ {locale === "ar" ? "Ù…Ù†ØªØ¬ Ø±Ù‚Ù…ÙŠ" : "Digital Product"}
                        </div>
                      )}

                      {/* Hover reveal â€” Challenge â†’ Solution (Only for non-featured) */}
                      {!isFeatured && (
                        <motion.div
                          className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 transition-all duration-500 group-hover:opacity-100"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.4), transparent)" }}
                        >
                          <div className="translate-y-4 space-y-3 transition-all duration-500 group-hover:translate-y-0">
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: glowColor.replace("0.2", "1") }}>
                              {locale === "ar" ? "Ø§Ù„ØªØ­Ø¯ÙŠ" : "Challenge"}
                            </span>
                            <p className="line-clamp-2 text-sm text-foreground/80">{story.challenge}</p>
                            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--primary)" }}>
                              <Zap className="h-3 w-3" />
                              {locale === "ar" ? "Ø§Ù„Ø­Ù„: " : "Solution: "}
                              <span className="line-clamp-1 text-foreground/70">{story.solution}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Card content */}
                    <div className={cn(
                      "flex flex-col space-y-3 p-5",
                      isFeatured ? "lg:p-8 lg:justify-center w-full" : "w-full"
                    )}>
                      <h3 className={cn("font-extrabold text-foreground", isFeatured ? "text-2xl md:text-3xl" : "text-lg")}>
                        {project.title}
                      </h3>
                      
                      {isFeatured && (
                        <div className="mt-4 space-y-5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                              {locale === "ar" ? "Ø§Ù„Ù…Ø´ÙƒÙ„Ø©" : "Problem"}
                            </span>
                            <p className="text-sm leading-relaxed text-foreground-muted">{story.challenge}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                              {locale === "ar" ? "Ø§Ù„Ø­Ù„" : "Solution"}
                            </span>
                            <p className="text-sm leading-relaxed text-foreground-muted">{story.solution}</p>
                          </div>
                        </div>
                      )}

                      <p className={cn(
                        "text-foreground-muted",
                        isFeatured ? "mt-6 text-sm leading-relaxed border-t border-border-glass pt-6" : "line-clamp-2 text-sm leading-7"
                      )}>
                        {story.result}
                      </p>
                      
                      {project.href && (
                        <motion.div whileTap={{ scale: 0.96 }} className={isFeatured ? "mt-6" : "mt-2"}>
                          <a
                            href={project.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
                            style={{
                              background: isFeatured ? "var(--primary)" : "rgba(0,255,135,0.07)",
                              border: `1px solid ${isFeatured ? "var(--primary)" : borderColor}`,
                              color: isFeatured ? "black" : "var(--primary)",
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â YOUTUBE SECTION Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                { raw: 1500000, display: "+1.5M", label: locale === "ar" ? "Ù…Ø´Ø§Ù‡Ø¯Ø© Ø¥Ø¬Ù…Ø§Ù„ÙŠØ©" : "Total Views", icon: Eye },
                { raw: 6100, display: "+6.1K", label: locale === "ar" ? "Ù…Ø´ØªØ±Ùƒ" : "Subscribers", icon: Heart },
                { raw: Number(youtube.videos ?? 162), display: fmt(locale, Number(youtube.videos ?? 162), false), label: locale === "ar" ? "ÙÙŠØ¯ÙŠÙˆ Ù…Ù†Ø´ÙˆØ±" : "Videos", icon: Clapperboard },
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
                    <span className="eyebrow">{locale === "ar" ? "Ù„Ù…Ø§Ø°Ø§ ØªØªØ§Ø¨Ø¹Ù†ÙŠØŸ" : "Why follow me?"}</span>
                    <h3 className="mt-4 text-2xl font-bold text-foreground">{t.youtube.collaborationTitle}</h3>
                    <p className="mt-4 text-sm leading-8 text-foreground-muted">{t.youtube.collaborationBody}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {[locale === "ar" ? "ðŸŽ¯ Ù…Ø±Ø§Ø¬Ø¹Ø§Øª ØµØ§Ø¯Ù‚Ø©" : "ðŸŽ¯ Honest reviews",
                        locale === "ar" ? "ðŸ‡©ðŸ‡ª Ø¹Ø±Ø¨ÙŠ Ù…Ù† Ø£Ù„Ù…Ø§Ù†ÙŠØ§" : "ðŸ‡©ðŸ‡ª Arab from Germany",
                        locale === "ar" ? "ðŸ’¡ Ù…Ø­ØªÙˆÙ‰ ØªÙ‚Ù†ÙŠ" : "ðŸ’¡ Tech content"].map((tag) => (
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â EXPERIENCE STRIP Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                  {locale === "ar" ? "Ø§Ù„Ø®Ø¨Ø±Ø© Ø§Ù„Ù…Ù‡Ù†ÙŠØ©" : "Work experience"}
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
                  <ActionLink href={`/${locale}/cv`} label={locale === "ar" ? "Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„ÙƒØ§Ù…Ù„Ø©" : "Full CV"} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â CONTACT CTA Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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

              <span className="eyebrow mx-auto">{locale === "ar" ? "Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©" : "Next step"}</span>

              <h2
                className="headline-arabic mx-auto mt-6 max-w-3xl text-3xl font-extrabold text-foreground md:text-5xl"
                style={{ lineHeight: 1.2 }}
              >
                {locale === "ar"
                  ? "ÙÙƒØ±ØªÙƒ ØªØ³ØªØ­Ù‚ Ø­Ø¶ÙˆØ±Ø§Ù‹ Ø±Ù‚Ù…ÙŠØ§Ù‹ Ù„Ø§ ÙŠÙÙ†Ø³Ù‰. Ù„Ù†Ø¨Ø¯Ø£ Ø§Ù„Ø­ÙˆØ§Ø±."
                  : "Your idea deserves an unforgettable digital presence. Let's start the conversation."}
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-foreground-muted">
                {locale === "ar"
                  ? "Ø§Ø±Ø³Ù„ Ø§Ù„ÙÙƒØ±Ø© ÙƒÙ…Ø§ Ù‡ÙŠØŒ Ø³Ø£Ø¹ÙŠØ¯Ù‡Ø§ Ø¥Ù„ÙŠÙƒ Ø¨Ø®Ø·ÙˆØ© Ù…Ø¨Ø§Ø´Ø±Ø© Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©."
                  : "Send the idea as it is â€” I'll return with a clear next step within 24 hours."}
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
                    {locale === "ar" ? "Ø£Ø±Ø³Ù„ Ø±Ø³Ø§Ù„Ø©" : "Send a message"}
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

/* Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â
   CV PAGE â€” Cinematic Redesign
Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â */
function CvPage({ model }: { model: SiteViewModel }) {
  const { locale, t, experience, gallery } = model;

  const skills = locale === "ar"
    ? [
        { label: "Next.js / React", pct: 92, color: "var(--primary)" },
        { label: "UI/UX & ÙˆØ§Ø¬Ù‡Ø§Øª", pct: 89, color: "var(--secondary)" },
        { label: "Ø³Ø±Ø¯ Ø¨ØµØ±ÙŠ ÙˆÙ…Ø­ØªÙˆÙ‰", pct: 86, color: "var(--accent)" },
        { label: "ØªÙ†ÙÙŠØ° Ù…Ù†Ø¶Ø¨Ø·", pct: 94, color: "#06b6d4" },
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
      location: step.location || (locale === "ar" ? "Ø£Ù„Ù…Ø§Ù†ÙŠØ§" : "Germany"),
      story: s.body,
      highlights: step.highlights || [],
    };
  });

  const entries = [...cmsEntries, ...fallbackEntries];

  return (
    <div className="space-y-0" data-testid="cv-page">

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â SPLIT HERO Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                  {locale === "ar" ? "Ù…ØªØ§Ø­ Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø¬Ø¯ÙŠØ¯Ø© Â· 2026" : "Available for projects Â· 2026"}
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="headline-arabic text-5xl font-black leading-[1.15] text-foreground md:text-6.5xl tracking-tight lg:text-7xl">
                  {locale === "ar" ? "Ù…Ø­Ù…Ø¯ Ø§Ù„ÙØ±Ø§Ø³" : "Mohammad Alfarras"}
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
                    href={model.downloads.branded}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.04, boxShadow: "0 0 30px var(--primary)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-black text-black"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {locale === "ar" ? "ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø³ÙŠØ±Ø© PDF" : (locale === "en" ? "Download CV PDF" : "Lebenslauf PDF")}
                  </motion.a>
                  <motion.a
                    href={`/${locale}/contact`}
                    whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-sm font-bold text-foreground-muted transition"
                  >
                    <MessageCircleMore className="h-4 w-4" />
                    {locale === "ar" ? "ØªÙˆØ§ØµÙ„ Ù…Ø¨Ø§Ø´Ø±" : "Get in touch"}
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
                      src={model.portraitImage || "/images/portrait.jpg"}
                      alt={locale === "ar" ? "Ù…Ø­Ù…Ø¯ Ø§Ù„ÙØ±Ø§Ø³" : "Mohammad Alfarras"}
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
                          { num: "+5", sub: locale === "ar" ? "Ø³Ù†ÙˆØ§Øª" : "Years" },
                          { num: "3", sub: locale === "ar" ? "Ù…Ø´Ø§Ø±ÙŠØ¹" : "Projects" },
                          { num: "2", sub: locale === "ar" ? "Ø¯ÙˆÙ„" : "Countries" },
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â EXPERIENCE TIMELINE Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                        {entry.period.split("â€“")[0]?.trim() ?? entry.period}
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
                        <h3 className="text-xl font-extrabold text-foreground md:text-2xl">
                          <span dir="ltr" className="inline-block">{entry.company}</span>
                        </h3>
                          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--secondary)" }}>{entry.role}</p>
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â SKILLS PANEL Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="section-frame">
          <div className="grid gap-12 lg:grid-cols-2">

            {/* Skill bars */}
            <div>
              <Reveal>
                <span className="eyebrow">{t.cv.pillarsTitle}</span>
                <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl">
                  {locale === "ar" ? "Ù…Ø§ Ø£ÙØªÙ‚Ù†Ù‡ ÙØ¹Ù„Ø§Ù‹" : "What I actually master"}
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
                    {locale === "ar" ? "Ø§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ§Ù„ØªÙ‚Ù†ÙŠØ§Øª" : "Stack & tools"}
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â BOTTOM CTA Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                  <span className="eyebrow">{locale === "ar" ? "Ø¬Ø§Ù‡Ø² Ù„Ù„ØªØ¹Ø§ÙˆÙ†" : "Ready to collaborate"}</span>
                  <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-4xl">
                    {locale === "ar" ? "ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø³ÙŠØ±Ø© Ø£Ùˆ Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø­ÙˆØ§Ø± Ù…Ø¨Ø§Ø´Ø±Ø©" : "Download the CV or open the conversation"}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-foreground-muted">
                    {locale === "ar"
                      ? "Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ø¬Ø§Ø¯Ø© ØªØ³ØªØ­Ù‚ ØªÙˆØ§ØµÙ„Ø§Ù‹ Ù…Ø¨Ø§Ø´Ø±Ø§Ù‹. Ø³Ø£Ø±Ø¯ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©."
                      : "Serious projects deserve direct conversation. Response within 24 hours."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto mt-6 md:mt-0">
                  <motion.a
                    href={`/${locale}/contact?subject=new_project`}
                    whileTap={{ scale: 0.96 }}
                    className="button-primary-shell flex w-full justify-center text-sm px-6 py-3 sm:w-auto"
                  >
                    {locale === "ar" ? "Ø§Ø¨Ø¯Ø£ Ù…Ø´Ø±ÙˆØ¹Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹" : "Start a project"}
                  </motion.a>
                  <motion.a
                    href={`/${locale}/contact?subject=redesign`}
                    whileTap={{ scale: 0.96 }}
                    className="button-secondary-shell flex w-full justify-center text-sm px-6 py-3 sm:w-auto"
                  >
                    {locale === "ar" ? "Ø¥Ø¹Ø§Ø¯Ø© ØªØµÙ…ÙŠÙ… Ù…ÙˆÙ‚Ø¹ÙŠ" : "Redesign my website"}
                  </motion.a>
                  <motion.a
                    href={`/${locale}/contact?subject=personal_brand`}
                    whileTap={{ scale: 0.96 }}
                    className="button-ghost-shell flex w-full justify-center border border-border-glass bg-bg-secondary text-sm px-6 py-3 sm:w-auto hover:bg-bg-glass"
                  >
                    {locale === "ar" ? "Ø¨Ù†Ø§Ø¡ Ù…ÙˆÙ‚Ø¹ÙŠ Ø§Ù„Ø´Ø®ØµÙŠ" : "Build personal brand site"}
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

/* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
   3D UI HELPERS â€” Advanced Motion Systems
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */

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

/* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
   PROJECTS PAGE â€” 2026 3D Cinematic
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */

function Weather3DWidget({ weather: liveWeather, locale }: { weather: LiveWeather | null, locale: Locale }) {
  const mockWeather: LiveWeather = {
    city: locale === "ar" ? "Ø¨Ø±Ù„ÙŠÙ†" : "Berlin",
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
              {locale === "ar" ? "Ø§Ù„Ø·Ù‚Ø³ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±" : "Live Weather"}
            </span>
            <h3 className="text-xl font-bold text-foreground">{weather.city}</h3>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 shadow-inner">
            {getIcon()}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-5xl font-black text-foreground">{weather.temp}Â°</p>
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
              <span>{isDemo ? (locale === "ar" ? "Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø¹Ø±Ø¶" : "Preview Mode") : (locale === "ar" ? "Ù…Ø­Ø¯Ø« Ù„Ø­Ø¸ÙŠØ§Ù‹" : "Updated instantly")}</span>
           </div>
        </div>
      </div>
    </TiltCard>
  );
}

function Project3DShowcase({
  project,
  index,
  locale,
  t,
}: {
  project: SiteProject;
  index: number;
  locale: Locale;
  t: RebuildLocaleContent;
}) {
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
                  { label: locale === "ar" ? "Ø§Ù„ØªØ­Ø¯ÙŠ" : "Challenge", text: story.challenge, color: "rgba(255,255,255,0.04)" },
                  { label: locale === "ar" ? "Ø§Ù„Ø­Ù„ Ø§Ù„ÙÙ†ÙŠ" : "Engineering", text: story.solution, color: accent.bg },
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

      {/* â•â•â•â•â• HERO â•â•â•â•â• */}
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
                        { num: String(projects.length), label: locale === "ar" ? "Ù…Ø´Ø±ÙˆØ¹ Ù…Ù†Ø´ÙˆØ±" : "Projects live", color: "var(--primary)" },
                        { num: "100%", label: locale === "ar" ? "Ø¨Ù†Ø§Ø¡ Ù…Ø®ØµØµ" : "Custom built", color: "var(--accent)" },
                        { num: "Live", label: locale === "ar" ? "Ø¨ÙŠØ§Ù†Ø§Øª Ø­ÙŠØ©" : "Live data APIs", color: "var(--secondary)" },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-3xl font-black" style={{ color: s.color }}>{s.num}</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft/60">{s.label}</p>
                        </div>
                      ))}
                   </div>
                   <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-foreground-muted">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      {locale === "ar" ? "Ø¬Ø§Ù‡Ø² Ù„Ù„ØªØ­Ø¯ÙŠØ§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©" : "Ready for new challenges"}
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

      {/* â•â•â•â•â• 3D PROJECT SHOWCASE â•â•â•â•â• */}
      <section className="px-5 py-20 md:px-8">
        <div className="section-frame">
          <div className="mb-14">
             <Reveal>
                <h2 className="text-2xl font-black text-foreground md:text-4xl">
                   {locale === "ar" ? "Ø£Ø¨Ø±Ø² Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²Ø§Øª" : "Selected Masterpieces"}
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
                    {locale === "ar" ? "Ù„Ù†ØµÙ†Ø¹ Ø´ÙŠØ¦Ø§Ù‹ Ù…Ø¨Ù‡Ø±Ø§Ù‹ Ù…Ø¹Ø§Ù‹" : "Let's build something epic together"}
                  </h2>
                  <p className="mt-6 max-w-xl text-lg leading-8 text-foreground-muted">
                    {locale === "ar" 
                      ? "Ø£Ø­ÙˆÙ„ Ø§Ù„Ø£ÙÙƒØ§Ø± Ø§Ù„Ù…Ø¹Ù‚Ø¯Ø© Ø¥Ù„Ù‰ ÙˆØ§Ø¬Ù‡Ø§Øª Ø¨Ø³ÙŠØ·Ø©ØŒ ØªÙØ§Ø¹Ù„ÙŠØ©ØŒ ÙˆÙ…Ø±Ø¨Ø­Ø©. Ù‡Ù„ Ø£Ù†Øª Ø¬Ø§Ù‡Ø²ØŸ" 
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
                      {locale === "ar" ? "Ø§Ø¨Ø¯Ø£ Ù…Ø´Ø±ÙˆØ¹Ùƒ Ø§Ù„Ø¢Ù†" : "Start your project"}
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

/* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
   YOUTUBE PAGE â€” Cinematic Redesign
Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â */
function YoutubePage({ model }: { model: SiteViewModel }) {
  const { locale, t, featuredVideo } = model;
  const latest = model.latestVideos.filter((v) => v.id !== featuredVideo?.id).slice(0, 6);
  const videoCount = Number(model.youtube.videos ?? 162);

  const stats = [
    { num: "+1.5M", label: locale === "ar" ? "Ù…Ø´Ø§Ù‡Ø¯Ø© Ø¥Ø¬Ù…Ø§Ù„ÙŠØ©" : "Total views", color: "var(--secondary)", icon: Eye },
    { num: "+6.1K", label: locale === "ar" ? "Ù…Ø´ØªØ±Ùƒ" : "Subscribers", color: "var(--primary)", icon: Heart },
    { num: String(videoCount), label: locale === "ar" ? "ÙÙŠØ¯ÙŠÙˆ Ù…Ù†Ø´ÙˆØ±" : "Videos published", color: "var(--accent)", icon: Clapperboard },
    { num: "DE", label: locale === "ar" ? "Ù…Ù† Ø£Ù„Ù…Ø§Ù†ÙŠØ§" : "Based in Germany", color: "#06b6d4", icon: Globe2 },
  ];

  return (
    <div className="space-y-0" data-testid="youtube-page">

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â DRAMATIC HERO Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â STAT CARDS Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â FEATURED VIDEO + ABOUT Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â CONTENT CATEGORIES Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      <section className="px-5 py-12 md:px-8 md:py-14">
        <div className="section-frame">
          <Reveal>
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.26em] text-foreground-soft">
              {locale === "ar" ? "Ø£Ù†ÙˆØ§Ø¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰" : "Content types"}
            </p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {(locale === "ar"
              ? [
                  { icon: "ðŸ“±", label: "Ù…Ø±Ø§Ø¬Ø¹Ø§Øª Ù…Ù†ØªØ¬Ø§Øª", count: "60+", color: "var(--secondary)" },
                  { icon: "ðŸ’»", label: "Ø´Ø±Ø­ ØªÙ‚Ù†ÙŠ",        count: "40+", color: "var(--primary)" },
                  { icon: "ðŸ‡©ðŸ‡ª", label: "Ø­ÙŠØ§Ø© ÙÙŠ Ø£Ù„Ù…Ø§Ù†ÙŠØ§", count: "30+", color: "var(--accent)" },
                  { icon: "ðŸŽ¯", label: "Ø¨Ù†Ø§Ø¡ Ù…Ù‡Ø§Ø±Ø§Øª",     count: "30+", color: "#06b6d4" },
                ]
              : [
                  { icon: "ðŸ“±", label: "Product reviews",   count: "60+", color: "var(--secondary)" },
                  { icon: "ðŸ’»", label: "Tech explainers",   count: "40+", color: "var(--primary)" },
                  { icon: "ðŸ‡©ðŸ‡ª", label: "Life in Germany",  count: "30+", color: "var(--accent)" },
                  { icon: "ðŸŽ¯", label: "Skill building",    count: "30+", color: "#06b6d4" },
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

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â LATEST VIDEOS Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
      {latest.length > 0 && (
        <section className="px-5 py-12 md:px-8 md:py-16">
          <div className="section-frame">
            <Reveal>
              <div className="mb-8">
                <span className="eyebrow">{t.youtube.latestLabel}</span>
                <h2 className="headline-arabic mt-3 text-2xl font-black text-foreground md:text-3xl">
                  {locale === "ar" ? "Ø£Ø­Ø¯Ø« Ø§Ù„ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª" : "Latest uploads"}
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

/* Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â
   CONTACT PAGE â€” Cinematic Redesign
Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â */
function ContactPage({ model }: { model: SiteViewModel }) {
  const { locale, t } = model;

  return (
    <div className="space-y-0" data-testid="contact-page">

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â SPLIT HERO Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                  {locale === "ar" ? "Ù…ØªØ§Ø­ Ø§Ù„Ø¢Ù† Â· Ø§Ù„Ø±Ø¯ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©" : "Available now Â· Response within 24h"}
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="headline-arabic text-4xl font-black leading-tight text-foreground md:text-5xl lg:text-6.5xl tracking-tight">
                  {locale === "ar"
                    ? "ÙÙƒØ±ØªÙƒ ØªØ³ØªØ­Ù‚\nØ­Ø¶ÙˆØ±Ø§Ù‹ Ù„Ø§ ÙŠÙÙ†Ø³Ù‰."
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
                  {locale === "ar" ? "Ù„Ù…Ø§Ø°Ø§ ÙŠØªÙˆØ§ØµÙ„ Ø§Ù„Ù†Ø§Ø³ Ù…Ø¹ÙŠØŸ" : "Why people get in touch"}
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
                    {" â€” "}{t.contact.directBody}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#06080f] to-transparent" />
      </section>

      {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â FORM SECTION Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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
                    {locale === "ar" ? "Ø§Ø¨Ø¯Ø£ Ø¨ÙÙƒØ±Ø©ØŒ Ø³Ù†ÙƒÙ…Ù„ Ø§Ù„Ø¨Ø§Ù‚ÙŠ" : "Start with an idea, we'll build the rest"}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-foreground-muted">{t.contact.body}</p>
                </div>

                {/* Process steps */}
                {[
                  { icon: "Ã¢Å“Âï¸", step: locale === "ar" ? "Ø£Ø±Ø³Ù„ Ø§Ù„ÙÙƒØ±Ø©" : "Send the idea", body: locale === "ar" ? "ÙˆØµÙ Ø¨Ø³ÙŠØ· ÙŠÙƒÙÙŠ ÙÙŠ Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©" : "A simple description is enough to start" },
                  { icon: "âš¡", step: locale === "ar" ? "Ø±Ø¯ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©" : "Reply within 24h", body: locale === "ar" ? "Ø³Ø£Ø­Ù„Ù„ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ£Ø¹ÙˆØ¯ Ø¨Ø®Ø·ÙˆØ© ÙˆØ§Ø¶Ø­Ø©" : "I'll analyze and return with a clear next step" },
                  { icon: "ðŸš€", step: locale === "ar" ? "Ø§Ø¨Ø¯Ø£ Ø§Ù„ØªÙ†ÙÙŠØ°" : "Start execution", body: locale === "ar" ? "Ù…Ø´Ø±ÙˆØ¹ Ø­Ù‚ÙŠÙ‚ÙŠ Ø¨Ù†ØªØ§Ø¦Ø¬ Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù‚ÙŠØ§Ø³" : "Real project with measurable outcomes" },
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

  const insightIcons = ["ðŸŽ¯", "âš¡", "ðŸ”"];
  const insightAccents = [
    { border: "var(--primary-border)", bg: "rgba(0,255,135,0.06)", color: "var(--primary)" },
    { border: "var(--secondary-border)", bg: "rgba(255,107,0,0.06)", color: "var(--secondary)" },
    { border: "var(--accent-border)", bg: "rgba(168,85,247,0.06)", color: "var(--accent)" },
  ];

  const principles = locale === "ar"
    ? [
        { icon: "ðŸŽ¯", title: "Ø§Ù‚Ø±Ø£ Ø§Ù„Ù…Ø´ÙƒÙ„Ø© Ù‚Ø¨Ù„ Ø£Ù† ØªØ¨Ø¯Ø£ Ø§Ù„Ø­Ù„", body: "Ø£ÙƒØ«Ø± Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„ØªÙŠ ØªÙØ¹Ø§Ø¯ Ù…Ù† Ø§Ù„ØµÙØ± ÙƒØ§Ù† ÙŠÙ…ÙƒÙ† Ø­Ù„Ù‡Ø§ Ø¨Ù‚Ø±Ø§Ø¡Ø© Ø£ÙˆÙ„ÙŠØ© Ø£Ø¹Ù…Ù‚ Ù„Ù„Ø¬Ù…Ù‡ÙˆØ± ÙˆØ§Ù„Ù‡Ø¯Ù.", tag: "Ù…Ù†Ù‡Ø¬" },
        { icon: "â±", title: "Ø§Ù„Ø³Ø±Ø¹Ø© ÙÙŠ Ø§Ù„ØªØ³Ù„ÙŠÙ… Ù„ÙŠØ³Øª Ø§Ø®ØªÙŠØ§Ø±Ø§Ù‹", body: "ÙÙŠ ÙƒÙ„ Ù…Ø´Ø±ÙˆØ¹ØŒ Ù‡Ù†Ø§Ùƒ Ù„Ø­Ø¸Ø© ÙŠØªØ­ÙˆÙ„ ÙÙŠÙ‡Ø§ Ø§Ù„ØªØ±Ø¯Ø¯ Ø¥Ù„Ù‰ ÙØ±ØµØ© Ø¶Ø§Ø¦Ø¹Ø©. Ø§Ù„ØªØ³Ù„ÙŠÙ… Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ ÙŠØ¹Ù†ÙŠ Ø£Ù† ØªØµÙ„ ÙÙŠ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…Ù†Ø§Ø³Ø¨.", tag: "ØªÙ†ÙÙŠØ°" },
        { icon: "ðŸªž", title: "Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ù…Ø±Ø¢Ø© Ù„Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ØªØ¬Ø§Ø±ÙŠ", body: "Ù…Ø§ ØªØ±Ø§Ù‡ Ø¹Ù„Ù‰ Ø§Ù„Ø´Ø§Ø´Ø© Ù‡Ùˆ Ø§Ù†Ø¹ÙƒØ§Ø³ Ù…Ø¨Ø§Ø´Ø± Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§ØªØ®Ø°Ù‡Ø§ Ø´Ø®Øµ Ù…Ø§. Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø¬ÙŠØ¯Ø© Ù„Ø§ ØªÙØµÙ†Ø¹ Ø¨Ø§Ù„ØµØ¯ÙØ©.", tag: "ØªØµÙ…ÙŠÙ…" },
      ]
    : [
        { icon: "ðŸŽ¯", title: "Read the problem before solving it", body: "Most projects rebuilt from scratch could have been fixed with a deeper initial reading of the audience and objective.", tag: "Method" },
        { icon: "â±", title: "Speed in delivery is not optional", body: "In every project, there is a moment where hesitation becomes a missed opportunity. Real delivery means arriving at the right time.", tag: "Execution" },
        { icon: "ðŸªž", title: "The interface mirrors business decisions", body: "What you see on screen is a direct reflection of decisions someone made. A good interface is never accidental.", tag: "Design" },
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
                      { num: "+1.5M", label: "Ù…Ø´Ø§Ù‡Ø¯Ø© ÙŠÙˆØªÙŠÙˆØ¨", sub: "Ù…Ø­ØªÙˆÙ‰ Ø¨Ù†ÙŠ Ø¹Ù„Ù‰ ØªÙƒØ±Ø§Ø± Ø§Ù„Ù…Ø´Ø§Ù‡Ø¯Ø©", color: "var(--secondary)" },
                      { num: "3", label: "Ù…Ø´Ø§Ø±ÙŠØ¹ Ù…Ù†Ø´ÙˆØ±Ø©", sub: "ÙƒÙ„ ÙˆØ§Ø­Ø¯Ø© Ø­Ù„Øª Ù…Ø´ÙƒÙ„Ø© Ø­Ù‚ÙŠÙ‚ÙŠØ©", color: "var(--primary)" },
                      { num: "100%", label: "Ù…Ø«Ù†Ù‰ Ø¹Ù„ÙŠÙ‡Ø§", sub: "Ù„Ø§ Ø£Ù‚Ø¨Ù„ Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„ØªØ¬Ù…ÙŠÙ„ ÙÙ‚Ø·", color: "var(--accent)" },
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
              eyebrow={locale === "ar" ? "Ù…Ù† Ù…Ø´Ø§Ø±ÙŠØ¹ Ø­Ù‚ÙŠÙ‚ÙŠØ©" : "From real projects"}
              title={locale === "ar" ? "Ù…Ø¨Ø§Ø¯Ø¦ Ø¹Ù…Ù„ÙŠØ© Ø£Ø¹ÙˆØ¯ Ø¥Ù„ÙŠÙ‡Ø§ Ø¯Ø§Ø¦Ù…Ù‹Ø§" : "Practical principles I keep returning to"}
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
                  ? "Ù‡Ù„ Ù„Ø¯ÙŠÙƒ Ù…Ø´Ø±ÙˆØ¹ ÙŠØ­ØªØ§Ø¬ Ø¯Ø±Ø§Ø³Ø© Ø­Ø§Ù„Ø©ØŸ ØªØ­Ø¯Ù‘Ø« Ù…Ø¹ÙŠ."
                  : "Have a project worth turning into a case study? Let's talk."}
              </p>
              <ActionLink href={`/${model.locale}/contact`} label={locale === "ar" ? "Ø§Ø¨Ø¯Ø£ Ø§Ù„ØªÙˆØ§ØµÙ„" : "Start the conversation"} primary />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â
   PRIVACY PAGE
Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â */
function PrivacyAccordionItem({ item, index }: { item: string; index: number }) {
  const [open, setOpen] = useState(false);
  // Split into title (before first period/colon) and body
  const colonIdx = item.indexOf(":");
  const periodIdx = item.indexOf(".");
  const splitAt = colonIdx > -1 && colonIdx < 60 ? colonIdx : periodIdx > -1 && periodIdx < 80 ? periodIdx : -1;
  const title = splitAt > -1 ? item.slice(0, splitAt + 1) : item.slice(0, 60) + "â€¦";
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
                ðŸ”’
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground">
                  {locale === "ar"
                    ? "Ø¨ÙŠØ§Ù†Ø§ØªÙƒ ØªØ¨Ù‚Ù‰ Ù…Ø¹Ùƒ. Ù„Ø§ Ù…Ø´Ø§Ø±ÙƒØ©ØŒ Ù„Ø§ Ø¨ÙŠØ¹ØŒ Ù„Ø§ ØªØªØ¨Ø¹ ØªØ¬Ø§Ø±ÙŠ."
                    : "Your data stays with you. No sharing, no selling, no commercial tracking."}
                </p>
                <p className="mt-2 text-sm leading-7 text-foreground-muted">
                  {locale === "ar"
                    ? "Ø¥Ù† ÙƒØ§Ù† Ù„Ø¯ÙŠÙƒ Ø£ÙŠ Ø³Ø¤Ø§Ù„ Ø­ÙˆÙ„ Ø®ØµÙˆØµÙŠØªÙƒØŒ Ø£Ù†Ø§ Ù‡Ù†Ø§ Ù„Ù„Ø¥Ø¬Ø§Ø¨Ø© Ù…Ø¨Ø§Ø´Ø±Ø©."
                    : "If you have any questions about how your data is handled, I'm here to answer directly."}
                </p>
              </div>
              <ActionLink href={`/${locale}/contact`} label={locale === "ar" ? "ØªÙˆØ§ØµÙ„ Ù…Ø¹ÙŠ" : "Contact me"} />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â
   ROUTER
Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â */
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

