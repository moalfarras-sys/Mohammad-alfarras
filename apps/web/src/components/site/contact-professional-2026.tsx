"use client";

import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCheck,
  CircleDollarSign,
  Clock3,
  Mail,
  MessageCircleMore,
  Send,
  Sparkles,
  Star,
  Zap,
  Globe2,
  Shield,
} from "lucide-react";
import { useSyncExternalStore, useState } from "react";

import { useThemeMode } from "@/components/layout/use-theme-mode";
import { cn } from "@/lib/cn";

import { ContactForm } from "./contact-form";
import type { SiteViewModel } from "./site-view-client";

/* ─────────────────────────────────────────────
   SVG Social Icons — pure SVG, no dependencies
───────────────────────────────────────────── */
function WhatsAppSVG({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramSVG({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedInSVG({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeSVG({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TelegramSVG({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function FacebookSVG({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GitHubSVG({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Channel Config
───────────────────────────────────────────── */
type ChannelDef = {
  id: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  borderColor: string;
  bgColor: string;
  label_ar: string;
  label_en: string;
  desc_ar: string;
  desc_en: string;
  href: string;
  badge_ar?: string;
  badge_en?: string;
  isPrimary?: boolean;
};

const CHANNELS: ChannelDef[] = [
  {
    id: "whatsapp",
    icon: <WhatsAppSVG size={24} />,
    color: "#25d366",
    glowColor: "rgba(37,211,102,0.35)",
    borderColor: "rgba(37,211,102,0.35)",
    bgColor: "rgba(37,211,102,0.1)",
    label_ar: "واتساب",
    label_en: "WhatsApp",
    desc_ar: "الافضل للبدء الفوري · رد خلال ساعات",
    desc_en: "Best for fast start · Reply within hours",
    href: "https://wa.me/4917623419358",
    badge_ar: "الأسرع",
    badge_en: "Fastest",
    isPrimary: true,
  },
  {
    id: "email",
    icon: <Mail size={24} />,
    color: "#4285f4",
    glowColor: "rgba(66,133,244,0.3)",
    borderColor: "rgba(66,133,244,0.3)",
    bgColor: "rgba(66,133,244,0.08)",
    label_ar: "البريد الإلكتروني",
    label_en: "Email",
    desc_ar: "للتفاصيل الرسمية والعروض والتعاون",
    desc_en: "For formal details, offers & collaboration",
    href: "mailto:Mohammad.Alfarras@gmail.com",
    badge_ar: "رسمي",
    badge_en: "Official",
    isPrimary: true,
  },
  {
    id: "telegram",
    icon: <TelegramSVG size={24} />,
    color: "#2aabee",
    glowColor: "rgba(42,171,238,0.25)",
    borderColor: "rgba(42,171,238,0.25)",
    bgColor: "rgba(42,171,238,0.07)",
    label_ar: "تيليغرام",
    label_en: "Telegram",
    desc_ar: "تواصل مباشر وسريع",
    desc_en: "Fast direct contact",
    href: "https://t.me/MoalFarras",
  },
  {
    id: "instagram",
    icon: <InstagramSVG size={24} />,
    color: "#e1306c",
    glowColor: "rgba(225,48,108,0.25)",
    borderColor: "rgba(225,48,108,0.25)",
    bgColor: "rgba(225,48,108,0.07)",
    label_ar: "إنستغرام",
    label_en: "Instagram",
    desc_ar: "صور يومية وحضور شخصي",
    desc_en: "Daily visuals & personal brand",
    href: "https://www.instagram.com/moalfarras",
  },
  {
    id: "youtube",
    icon: <YouTubeSVG size={24} />,
    color: "#ff0000",
    glowColor: "rgba(255,0,0,0.22)",
    borderColor: "rgba(255,0,0,0.25)",
    bgColor: "rgba(255,0,0,0.07)",
    label_ar: "يوتيوب",
    label_en: "YouTube",
    desc_ar: "القناة الرسمية · 1.5M+ مشاهدة",
    desc_en: "Official channel · 1.5M+ views",
    href: "https://www.youtube.com/@Moalfarras",
  },
  {
    id: "linkedin",
    icon: <LinkedInSVG size={24} />,
    color: "#0a66c2",
    glowColor: "rgba(10,102,194,0.25)",
    borderColor: "rgba(10,102,194,0.25)",
    bgColor: "rgba(10,102,194,0.07)",
    label_ar: "لينكدإن",
    label_en: "LinkedIn",
    desc_ar: "تواصل مهني وشراكات",
    desc_en: "Professional networking & partnerships",
    href: "https://de.linkedin.com/in/mohammad-alfarras-525531262",
  },
  {
    id: "github",
    icon: <GitHubSVG size={24} />,
    color: "#f0f6fc",
    glowColor: "rgba(240,246,252,0.15)",
    borderColor: "rgba(240,246,252,0.18)",
    bgColor: "rgba(240,246,252,0.05)",
    label_ar: "GitHub",
    label_en: "GitHub",
    desc_ar: "الكود والمشاريع التقنية",
    desc_en: "Code repositories & technical work",
    href: "https://github.com/moalfarras-sys",
  },
  {
    id: "facebook",
    icon: <FacebookSVG size={24} />,
    color: "#1877f2",
    glowColor: "rgba(24,119,242,0.22)",
    borderColor: "rgba(24,119,242,0.25)",
    bgColor: "rgba(24,119,242,0.07)",
    label_ar: "فيسبوك",
    label_en: "Facebook",
    desc_ar: "تواصل ومتابعة إضافية",
    desc_en: "Additional social presence",
    href: "https://www.facebook.com/share/14TQSSocNQG/",
  },
];

/* ─────────────────────────────────────────────
   Trust metrics strip
───────────────────────────────────────────── */
const trustItems = [
  { icon: Zap, ar: "رد خلال 24 ساعة", en: "< 24h Response", color: "#00E5FF" },
  { icon: Star, ar: "+40 مشروع حقيقي", en: "40+ Real Projects", color: "#ff8c00" },
  { icon: Globe2, ar: "ألمانيا · متاح قولباً", en: "Germany · Available Now", color: "#D946EF" },
  { icon: Shield, ar: "ضمان الجودة الكاملة", en: "Full Quality Guarantee", color: "#06b6d4" },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function ContactProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale } = model;
  const { theme } = useThemeMode();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLight = mounted && theme === "light";
  const isRTL = locale === "ar";
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ opacity: mounted ? 1 : 0 }}
      dir={isRTL ? "rtl" : "ltr"}
      data-testid="contact-page"
    >
      {/* ── AMBIENT ORBS ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full opacity-20 blur-[140px]"
          style={{ background: "radial-gradient(circle, #00E5FF, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-20 h-[600px] w-[600px] rounded-full opacity-15 blur-[120px]"
          style={{ background: "radial-gradient(circle, #6366F1, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full opacity-12 blur-[100px]"
          style={{ background: "radial-gradient(circle, #D946EF, transparent 70%)" }}
        />
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 overflow-hidden">
        {/* Hero background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/contact-hero-2026.png"
            alt="contact background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-[var(--background)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-orange-500/10" />
        </div>

        <div className="section-frame relative z-10 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            {/* Status badge */}
            <div
              className="mb-8 inline-flex items-center gap-3 rounded-full border px-5 py-2.5 backdrop-blur-xl"
              style={{
                borderColor: "rgba(0,229,255,0.4)",
                background: "rgba(0,0,0,0.45)",
                boxShadow: "0 0 40px rgba(0,229,255,0.15)",
              }}
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E5FF] opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#00E5FF]" />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.28em] text-white">
                {locale === "ar" ? "متاح الآن للمشاريع الجديدة" : "Available now for new projects"}
              </span>
            </div>

            <h1 className="headline-arabic text-5xl font-black leading-[1.0] tracking-tight text-white md:text-7xl lg:text-8xl">
              {locale === "ar" ? (
                <>
                  دعنا نبني شيئًا
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #00E5FF, #06b6d4)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    يستحق الحديث
                  </span>
                </>
              ) : (
                <>
                  Let&apos;s build something
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #00E5FF, #06b6d4)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    worth talking about
                  </span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-9 text-white/80">
              {locale === "ar"
                ? "مشاريع ويب، تصميم، محتوى، أو شراكة. أرسل الفكرة عبر الفورم أو واتساب — وستصلك رسالة ترحيب فورية ثم نبدأ."
                : "Web projects, design, content, or partnerships. Send your idea via form or WhatsApp — you'll get an instant welcome and then we start."}
            </p>

            {/* Hero CTA buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <motion.a
                href="https://wa.me/4917623419358"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 rounded-full px-8 py-4 text-base font-black text-black"
                style={{
                  background: "linear-gradient(135deg, #25d366, #128c7e)",
                  boxShadow: "0 0 50px rgba(37,211,102,0.45)",
                }}
              >
                <WhatsAppSVG size={20} />
                {locale === "ar" ? "ابدأ الآن عبر واتساب" : "Start on WhatsApp now"}
              </motion.a>
              <motion.a
                href="mailto:Mohammad.Alfarras@gmail.com"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 rounded-full border border-white/25 px-8 py-4 text-base font-black text-white backdrop-blur-xl"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <Mail size={20} />
                {locale === "ar" ? "أرسل بريدًا رسميًا" : "Send formal email"}
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative z-10 border-y border-white/8"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)" }}
      >
        <div className="section-frame">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            {trustItems.map((t) => (
              <div key={t.ar} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${t.color}15`, border: `1px solid ${t.color}30` }}
                >
                  <t.icon size={16} style={{ color: t.color }} />
                </div>
                <span className="text-sm font-bold text-foreground">{locale === "ar" ? t.ar : t.en}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="section-frame relative z-10 space-y-12 py-16 md:py-24">

        {/* ── SOCIAL CHANNELS GRID — PREMIUM SVG ICONS ── */}
        <motion.section variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-10 text-center">
            <span className="text-xs font-black uppercase tracking-[0.28em] text-primary">
              {locale === "ar" ? "كل قنوات التواصل" : "All contact channels"}
            </span>
            <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">
              {locale === "ar" ? "تواصل بالطريقة التي تريحك" : "Connect your way"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-foreground-muted">
              {locale === "ar"
                ? "من واتساب وإيميل إلى يوتيوب ولينكدإن — كل منصاتي في مكان واحد"
                : "From WhatsApp and email to YouTube and LinkedIn — all platforms in one place"}
            </p>
          </motion.div>

          {/* Primary channels — large cards */}
          <motion.div variants={item} className="mb-4 grid gap-4 sm:grid-cols-2">
            {CHANNELS.filter((c) => c.isPrimary).map((ch) => (
              <motion.a
                key={ch.id}
                href={ch.href}
                target={ch.href.startsWith("http") ? "_blank" : undefined}
                rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
                onHoverStart={() => setHoveredChannel(ch.id)}
                onHoverEnd={() => setHoveredChannel(null)}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300"
                style={{
                  borderColor: hoveredChannel === ch.id ? ch.borderColor : "rgba(255,255,255,0.1)",
                  background: hoveredChannel === ch.id ? ch.bgColor : "rgba(255,255,255,0.03)",
                  boxShadow: hoveredChannel === ch.id ? `0 20px 60px ${ch.glowColor}` : "none",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Glow orb */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${ch.glowColor}, transparent 60%)` }}
                />

                <div className="relative flex items-start gap-5">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: ch.bgColor,
                      border: `1.5px solid ${ch.borderColor}`,
                      color: ch.color,
                      boxShadow: hoveredChannel === ch.id ? `0 0 30px ${ch.glowColor}` : "none",
                    }}
                  >
                    {ch.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-foreground">{locale === "ar" ? ch.label_ar : ch.label_en}</h3>
                      {(ch.badge_ar || ch.badge_en) && (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-black"
                          style={{ background: ch.bgColor, color: ch.color, border: `1px solid ${ch.borderColor}` }}
                        >
                          {locale === "ar" ? ch.badge_ar : ch.badge_en}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-foreground-muted">{locale === "ar" ? ch.desc_ar : ch.desc_en}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: ch.color }}>
                      {locale === "ar" ? "تواصل الآن" : "Connect now"}
                      <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>

          {/* Secondary channels — smaller grid */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CHANNELS.filter((c) => !c.isPrimary).map((ch) => (
              <motion.a
                key={ch.id}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                onHoverStart={() => setHoveredChannel(ch.id)}
                onHoverEnd={() => setHoveredChannel(null)}
                whileHover={{ y: -5, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-[1.8rem] border p-5 text-center transition-all duration-300"
                style={{
                  borderColor: hoveredChannel === ch.id ? ch.borderColor : "rgba(255,255,255,0.09)",
                  background: hoveredChannel === ch.id ? ch.bgColor : "rgba(255,255,255,0.03)",
                  boxShadow: hoveredChannel === ch.id ? `0 16px 48px ${ch.glowColor}` : "none",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{
                    color: ch.color,
                    background: ch.bgColor,
                    border: `1px solid ${ch.borderColor}`,
                    boxShadow: hoveredChannel === ch.id ? `0 0 24px ${ch.glowColor}` : "none",
                  }}
                >
                  {ch.icon}
                </div>
                <span className="text-sm font-black text-foreground">{locale === "ar" ? ch.label_ar : ch.label_en}</span>
                <ArrowUpRight
                  size={12}
                  className="opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ color: ch.color }}
                />
              </motion.a>
            ))}
          </motion.div>
        </motion.section>

        {/* ── DIVIDER ── */}
        <div className="relative flex items-center gap-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div
            className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-foreground-muted"
            style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}
          >
            <Sparkles size={12} className="text-primary" />
            {locale === "ar" ? "أو أرسل طلبك بشكل مرتب" : "Or send a structured inquiry"}
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/15 to-transparent" />
        </div>

        {/* ── FORM + INFO GRID ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-8 xl:grid-cols-[1fr_1.1fr]"
        >
          {/* LEFT — Info cards */}
          <motion.div variants={item} className="space-y-5">

            {/* How it works */}
            <div
              className="rounded-[2.2rem] border border-white/10 p-6 md:p-8"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <CheckCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
                    {locale === "ar" ? "كيف يعمل النظام" : "How it works"}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-foreground">
                    {locale === "ar" ? "ثلاث خطوات بسيطة" : "Three simple steps"}
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {(locale === "ar"
                  ? [
                      { n: "01", title: "اختر نوع الطلب", body: "موقع، صفحة هبوط، محتوى، أو استشارة — حدد الهدف ويتشكل الملخص تلقائيًا." },
                      { n: "02", title: "أرسل عبر الفورم أو واتساب", body: "نفس الملخص المرتب يصلني سواء بعثته رسميًا أو عبر واتساب." },
                      { n: "03", title: "استقبل ردًا فوريًا", body: "يصلك على الفور رسالة ترحيب احترافية، ثم أتواصل معك بخطوة تنفيذ واضحة." },
                    ]
                  : [
                      { n: "01", title: "Pick your request type", body: "Website, landing page, content, or consultation — the brief shapes itself automatically." },
                      { n: "02", title: "Send via form or WhatsApp", body: "The same structured brief reaches me whether you send formally or via WhatsApp." },
                      { n: "03", title: "Get an instant reply", body: "You receive a professional welcome email immediately, then I follow up with a clear next step." },
                    ]
                ).map((step) => (
                  <div
                    key={step.n}
                    className="flex items-start gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                      style={{ background: "rgba(0,229,255,0.1)", color: "#00E5FF", border: "1px solid rgba(0,229,255,0.2)" }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <p className="font-black text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm leading-7 text-foreground-muted">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Value cards */}
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  Icon: BriefcaseBusiness,
                  color: "#00E5FF",
                  ar: { t: "عروض مواقع وخدمات", b: "مناسب لطلبات المواقع، صفحات الهبوط، أنظمة البيع الرقمية." },
                  en: { t: "Web & digital services", b: "Best for websites, landing pages, and digital sales systems." },
                },
                {
                  Icon: CircleDollarSign,
                  color: "#ff8c00",
                  ar: { t: "تسعير واضح وسريع", b: "الفورم يحول الطلب إلى اتجاه واضح وقابل للتسعير مباشرة." },
                  en: { t: "Clear & fast pricing", b: "The form turns the request into a clear, priceable direction." },
                },
                {
                  Icon: Clock3,
                  color: "#06b6d4",
                  ar: { t: "رد خلال 24 ساعة", b: "يصلك رد انتظار فورًا، ثم متابعة مفصلة للمشروع." },
                  en: { t: "Reply within 24h", b: "Instant holding reply, then full project follow-up." },
                },
              ].map(({ Icon, color, ar, en }) => (
                <div
                  key={ar.t}
                  className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5"
                  style={{ backdropFilter: "blur(16px)" }}
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="font-black text-foreground">{locale === "ar" ? ar.t : en.t}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground-muted">{locale === "ar" ? ar.b : en.b}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Form */}
          <motion.div variants={item}>
            <div
              className="relative overflow-hidden rounded-[2.8rem] border border-white/10 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.4)] md:p-8"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)), rgba(5,8,16,0.88)",
                backdropFilter: "blur(28px)",
              }}
            >
              {/* Top glow */}
              <div className="pointer-events-none absolute end-0 top-0 h-48 w-1/2 rounded-full bg-primary/10 blur-[140px]" />
              <div className="pointer-events-none absolute -start-10 bottom-0 h-48 w-72 rounded-full bg-orange-500/8 blur-[120px]" />

              <div className="relative mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-primary/10 text-primary">
                  <Send size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                    {locale === "ar" ? "استقبال الطلبات" : "Inquiry intake"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-foreground">
                    {locale === "ar" ? "فورم + واتساب + رد فوري" : "Form + WhatsApp + Instant reply"}
                  </h2>
                </div>
              </div>

              <ContactForm locale={locale} whatsappUrl={model.contact.whatsappUrl} />
            </div>
          </motion.div>
        </motion.div>

        {/* ── EMAIL AUTO-REPLY BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-[#4285f4]/25 p-8 md:p-10"
          style={{
            background: "linear-gradient(135deg, rgba(66,133,244,0.08), rgba(0,229,255,0.05))",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="pointer-events-none absolute end-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#4285f4]/10 to-transparent" />

          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.3)", color: "#4285f4" }}
                >
                  <Mail size={20} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-[#4285f4]">Gmail Auto-Reply</span>
                  <h3 className="mt-0.5 text-xl font-black text-foreground">
                    {locale === "ar" ? "رد ترحيب تلقائي احترافي" : "Automatic professional welcome reply"}
                  </h3>
                </div>
              </div>
              <p className="text-sm leading-8 text-foreground-muted max-w-2xl">
                {locale === "ar"
                  ? "عند إرسال الفورم، يصل للعميل فورًا رسالة ترحيب احترافية كاملة من Gmail تتضمن ملخص طلبه، رقم متابعة، وتفاصيل العرض — بمستوى شركات التسويق الكبرى."
                  : "When the form is submitted, the client instantly receives a full professional Gmail welcome including their request summary, tracking number, and offer details — at the level of major marketing agencies."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {(locale === "ar"
                  ? ["رد فوري <60 ثانية", "رقم تتبع فريد", "ملخص الطلب كامل", "تفاصيل العرض والخطوات"]
                  : ["Reply in <60 seconds", "Unique tracking ID", "Full request summary", "Offer details & next steps"]
                ).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-4 py-2 text-xs font-bold"
                    style={{ background: "rgba(66,133,244,0.12)", color: "#4285f4", border: "1px solid rgba(66,133,244,0.2)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <motion.a
              href="mailto:Mohammad.Alfarras@gmail.com"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex shrink-0 items-center gap-3 rounded-2xl px-7 py-4 text-sm font-black text-white"
              style={{
                background: "linear-gradient(135deg, #4285f4, #34a853)",
                boxShadow: "0 8px 32px rgba(66,133,244,0.35)",
              }}
            >
              <Mail size={16} />
              {locale === "ar" ? "راسلني الآن" : "Email me now"}
            </motion.a>
          </div>
        </motion.div>

        {/* ── FINAL CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative overflow-hidden rounded-[3rem] border border-white/10 p-10 text-center md:p-16"
          style={{
            background: "linear-gradient(135deg, rgba(0,229,255,0.08), rgba(168,85,247,0.06), rgba(255,107,0,0.06))",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="pointer-events-none absolute inset-0" style={{
            background: "radial-gradient(circle at 50% 0%, rgba(0,229,255,0.12), transparent 60%)",
          }} />

          <div className="relative">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">
              {locale === "ar" ? "جاهز للبدء؟" : "Ready to start?"}
            </span>
            <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-5xl">
              {locale === "ar" ? "فكرتك تستحق حضورًا أقوى." : "Your idea deserves a stronger presence."}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-9 text-foreground-muted">
              {locale === "ar"
                ? "لا قوالب، لا حلول نصفية. نبني من الصفر بعناية وإبداع واحترافية."
                : "No templates, no half solutions. Built from scratch with care, creativity, and professionalism."}
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <motion.a
                href="https://wa.me/4917623419358"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 rounded-full px-10 py-4 text-base font-black text-black"
                style={{
                  background: "linear-gradient(135deg, #00E5FF, #00B8D4)",
                  boxShadow: "0 0 60px rgba(0,229,255,0.4)",
                }}
              >
                <WhatsAppSVG size={20} />
                {locale === "ar" ? "واتساب مباشر" : "Direct WhatsApp"}
              </motion.a>
              <motion.a
                href="mailto:Mohammad.Alfarras@gmail.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 rounded-full border border-white/20 px-10 py-4 text-base font-black text-foreground"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}
              >
                <Mail size={20} />
                {locale === "ar" ? "بريد إلكتروني" : "Email"}
              </motion.a>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
