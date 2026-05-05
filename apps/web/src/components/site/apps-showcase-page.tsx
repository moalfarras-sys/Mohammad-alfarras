"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Box, Download, KeyRound, MonitorPlay, Play, Tv } from "lucide-react";
import { motion } from "framer-motion";

import { PageShell } from "@/components/ui/os-primitives";
import { withLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const copy = {
  en: {
    eyebrow: "MoPlayer App Ecosystem",
    title: "Next-Gen Apps for a Connected World",
    body:
      "A premium product hub for Android TV, activation, official releases, and connected setup flows. Built to make MoPlayer feel simple, cinematic, and ready for normal users.",
    primary: "Activate MoPlayer",
    secondary: "Explore product",
    download: "Download APK",
    heroBadges: ["Android TV-first", "Official APK flow", "Secure website activation", "Remote setup ready"],
    gridTitle: "A compact app store experience, designed around clarity.",
    gridBody:
      "Every surface has a job: explain the product, move people to setup, and keep the activation path obvious on mobile and TV.",
    quickPreview: "Quick preview",
    appCards: [
      {
        title: "MoPlayer",
        label: "Android TV / IPTV player",
        body: "A cinematic TV-first media product with activation, source setup, widgets, and official release handling.",
        badges: ["Official product", "TV interface", "Activation-ready"],
        cta: "Open MoPlayer",
        href: "apps/moplayer",
        image: "/images/moplayer_ui_playlist-final.png",
        icon: "/images/moplayer-icon-512.png",
        accent: "metal",
      },
      {
        title: "MoPlayer2",
        label: "New Android TV app line",
        body: "A separate next-generation product channel with its own public page, releases, and admin controls.",
        badges: ["Separate product", "Same domain", "Admin-ready"],
        cta: "Open MoPlayer2",
        href: "apps/moplayer2",
        image: "/images/moplayer-tv-hero.png",
        icon: "/images/moplayer-icon-512.png",
        accent: "metal",
      },
      {
        title: "Guided Activation",
        label: "Pairing and setup flow",
        body: "A simple step-by-step route that helps users choose MoPlayer, continue with an account layer, and verify their TV code.",
        badges: ["MO code", "One-hand mobile", "Secure source send"],
        cta: "Start activation",
        href: "activate",
        image: "/images/moplayer-activation-flow.webp",
        icon: "/images/moplayer-brand-logo-final.png",
        accent: "metal",
      },
      {
        title: "Release Center",
        label: "APK delivery surface",
        body: "A clear product release path for downloads, metadata, and future version notes without confusing the visitor.",
        badges: ["APK path", "Version clarity", "Website-linked"],
        cta: "Download APK",
        href: "api/app/download/latest",
        image: "/images/moplayer-release-panel.webp",
        icon: "/images/moplayer-icon-512.png",
        accent: "metal",
      },
    ],
    flowTitle: "From interest to activation in seconds.",
    flow: [
      ["Discover", "Understand what MoPlayer does without reading a technical manual."],
      ["Download", "Use the official website path for the latest APK and product information."],
      ["Activate", "Pair the Android TV app with a short MO code and finish setup from the phone."],
    ],
    finalTitle: "Make the app feel premium before the user even opens it.",
    finalBody:
      "The Apps page now acts like a focused product store: clear product value, direct download and activation paths, and a visual language that matches the MoPlayer TV experience.",
  },
  ar: {
    eyebrow: "منظومة تطبيقات MoPlayer",
    title: "تطبيقات الجيل القادم لعالم متصل",
    body:
      "مركز منتجات فاخر لتجربة Android TV، التفعيل، التحميل الرسمي، وخطوات الإعداد المرتبطة بالموقع. الهدف أن يشعر المستخدم أن MoPlayer واضح، سينمائي، وسهل من أول لحظة.",
    primary: "فعّل MoPlayer",
    secondary: "استكشف المنتج",
    download: "تحميل APK",
    heroBadges: ["مصمم للتلفزيون", "تحميل رسمي", "تفعيل آمن من الموقع", "جاهز للإعداد عن بعد"],
    gridTitle: "تجربة متجر تطبيقات صغيرة وواضحة.",
    gridBody:
      "كل جزء له وظيفة واضحة: شرح المنتج، توجيه المستخدم للإعداد، وجعل مسار التفعيل مفهومًا على الجوال والتلفزيون.",
    quickPreview: "معاينة سريعة",
    appCards: [
      {
        title: "MoPlayer",
        label: "مشغل Android TV / IPTV",
        body: "منتج وسائط مخصص للتلفزيون مع تفعيل، إعداد مصادر، ويدجت، ومسار إصدار رسمي.",
        badges: ["منتج رسمي", "واجهة تلفزيونية", "جاهز للتفعيل"],
        cta: "افتح MoPlayer",
        href: "apps/moplayer",
        image: "/images/moplayer-hero-3d-final.png",
        icon: "/images/moplayer-icon-512.png",
        accent: "metal",
      },
      {
        title: "التفعيل الموجّه",
        label: "ربط الجهاز والإعداد",
        body: "مسار بسيط خطوة بخطوة لاختيار MoPlayer، متابعة الحساب، ثم تأكيد كود التلفزيون بسهولة.",
        badges: ["كود MO", "مناسب للجوال", "إرسال مصدر آمن"],
        cta: "ابدأ التفعيل",
        href: "activate",
        image: "/images/moplayer-activation-flow.webp",
        icon: "/images/moplayer-brand-logo-final.png",
        accent: "metal",
      },
      {
        title: "مركز الإصدارات",
        label: "تحميل APK الرسمي",
        body: "مسار واضح للتحميل، معلومات الإصدار، والتحديثات القادمة بدون تشتيت للمستخدم.",
        badges: ["مسار APK", "وضوح الإصدار", "مرتبط بالموقع"],
        cta: "تحميل APK",
        href: "api/app/download/latest",
        image: "/images/moplayer-release-panel.webp",
        icon: "/images/moplayer-icon-512.png",
        accent: "metal",
      },
    ],
    flowTitle: "من الاهتمام إلى التفعيل خلال ثوانٍ.",
    flow: [
      ["اكتشف", "افهم ما يقدمه MoPlayer بدون مصطلحات تقنية معقدة."],
      ["حمّل", "استخدم المسار الرسمي من الموقع للحصول على ملف APK ومعلومات المنتج."],
      ["فعّل", "اربط تطبيق Android TV بكود MO قصير وأنهِ الإعداد من الجوال."],
    ],
    finalTitle: "اجعل التطبيق يبدو فاخرًا قبل أن يفتحه المستخدم.",
    finalBody:
      "صفحة التطبيقات أصبحت مركز منتج واضح: قيمة مفهومة، مسارات تحميل وتفعيل مباشرة، وهوية بصرية مناسبة لتجربة MoPlayer على التلفزيون.",
  },
} as const;

export function AppsShowcasePage({ locale }: { locale: Locale }) {
  const c = repairMojibakeDeep(copy[locale]);
  const isAr = locale === "ar";
  const moplayer2Card = {
    title: "MoPlayer2",
    label: isAr ? "أفضل تطبيق IPTV لـ Android TV" : "Premium IPTV for Android TV",
    body: isAr
      ? "مشغل IPTV جديد بأداء أقوى، واجهة احترافية خاصة، دعم Xtream/M3U، QR Activation، وإدارة أفضل."
      : "A faster IPTV player with a premium warm glass UI, Xtream / M3U / QR activation, and powerful playback controls.",
    badges: isAr ? ["Glass UI", "Xtream + M3U", "QR Activation"] : ["Glass UI", "Xtream + M3U", "QR Activation"],
    cta: isAr ? "افتح MoPlayer2" : "Open MoPlayer2",
    href: "apps/moplayer2",
    image: "/images/moplayer2-hero-banner.png",
    icon: "/images/moplayer-icon-512.png",
    accent: "metal",
  };

  return (
    <PageShell className="apps-lux-page">
      <main className="apps-showcase" dir={isAr ? "rtl" : "ltr"}>
        <section className="apps-hero">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="apps-hero-copy"
          >
            <span className="apps-kicker">
              <BadgeCheck className="h-4 w-4" />
              {c.eyebrow}
            </span>
            <h1>{c.title}</h1>
            <p>{c.body}</p>
            <div className="apps-actions">
              <Link href={withLocale(locale, "activate")} className="apps-button apps-button-primary">
                <KeyRound className="h-4 w-4" />
                {c.primary}
              </Link>
              <Link href={withLocale(locale, "apps/moplayer")} className="apps-button apps-button-ghost">
                <ArrowUpRight className="h-4 w-4" />
                {c.secondary}
              </Link>
            </div>
            <div className="apps-proof-grid">
              {c.heroBadges.map((badge) => (
                <span key={badge}>
                  <BadgeCheck className="h-4 w-4" />
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: isAr ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="apps-hero-device"
          >
            <div className="apps-device-orbit" />
            <Image
              src="/images/moplayer-hero-3d-final.png"
              alt="MoPlayer Android TV product mockup"
              width={900}
              height={700}
              priority
              className="apps-device-image"
            />
            <div className="apps-device-panel">
              <Image src="/images/moplayer-icon-512.png" alt="" width={42} height={42} />
              <div>
                <strong>MoPlayer</strong>
                <span>TV-first product system</span>
              </div>
              <Tv className="h-5 w-5" />
            </div>
          </motion.div>
        </section>

        <section className="apps-section">
          <div className="apps-section-head">
            <span className="apps-kicker">
              <Box className="h-4 w-4" />
              Apps
            </span>
            <h2>{c.gridTitle}</h2>
            <p>{c.gridBody}</p>
          </div>

          <div className="apps-bento">
            {[...c.appCards.filter((app) => app.title !== "MoPlayer2"), moplayer2Card].map((app, index) => (
              <motion.article
                key={app.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 + index * 0.08 }}
                className={`apps-card apps-card-${app.accent} ${index === 0 ? "apps-card-featured" : ""}`}
              >
                <div className="apps-card-media">
                  <Image src={app.image} alt={app.title} fill sizes={index === 0 ? "(max-width: 900px) 100vw, 58vw" : "(max-width: 900px) 100vw, 34vw"} className="apps-card-image" />
                  <div className="apps-preview">
                    <Play className="h-4 w-4" />
                    {c.quickPreview}
                  </div>
                </div>
                <div className="apps-card-body">
                  <div className="apps-card-title-row">
                    <Image src={app.icon} alt="" width={48} height={48} className="apps-card-icon" />
                    <div>
                      <span>{app.label}</span>
                      <h3>{app.title}</h3>
                    </div>
                  </div>
                  <p>{app.body}</p>
                  <div className="apps-badges">
                    {app.badges.map((badge) => (
                      <span key={badge}>{badge}</span>
                    ))}
                  </div>
                  <Link href={app.href.startsWith("api/") ? `/${app.href}` : withLocale(locale, app.href)} className="apps-card-link">
                    {app.href.startsWith("api/") ? <Download className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    {app.cta}
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="apps-flow">
          <div className="apps-section-head">
            <span className="apps-kicker">
              <MonitorPlay className="h-4 w-4" />
              Flow
            </span>
            <h2>{c.flowTitle}</h2>
          </div>
          <div className="apps-flow-grid">
            {c.flow.map(([title, body], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="apps-flow-card"
              >
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="apps-final-cta">
          <h2>{c.finalTitle}</h2>
          <p>{c.finalBody}</p>
          <div className="apps-actions">
            <Link href={withLocale(locale, "activate")} className="apps-button apps-button-primary">
              <KeyRound className="h-4 w-4" />
              {c.primary}
            </Link>
            <Link href="/api/app/download/latest" className="apps-button apps-button-ghost">
              <Download className="h-4 w-4" />
              {c.download}
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
