import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, Tv } from "lucide-react";

import { cx, releaseMeta, styles } from "./parts";
import { classicShots, pcShots, proShots } from "./shots";
import { formatFileSize, type Lang, type ReleaseFacts } from "@/lib/moplayer-release-facts";
import type { WindowsRelease } from "@/lib/windows-release";
import { tvInstallPagePath } from "@moalfarras/shared/app-releases";

export type PcFacts = {
  version: string | null;
  sizeBytes: number | null;
  available: boolean;
  downloadHref: string;
  requirement: string;
};

export function pcFactsFrom(release: WindowsRelease | null): PcFacts {
  return {
    version: release?.version ?? null,
    sizeBytes: release?.fileSizeBytes ?? null,
    available: Boolean(release && !release.maintenance && release.file),
    downloadHref: "/api/app/download/latest?product=moplayer-pc&platform=windows",
    requirement: release?.systemRequirements || "Windows 10 / 11 (64-bit)",
  };
}

type Card = {
  key: "classic" | "pro" | "pc" | "ios";
  name: string;
  platform: string;
  status: "available" | "soon";
  statusLabel: string;
  body: string;
  meta: string[];
  href: string;
  download?: { href: string; label: string };
  image?: { src: string; alt: string; width: number; height: number };
  glow: string;
};

/** The four MoPlayer editions, with live release data and an honest status. */
export function familyCards(locale: Lang, classic: ReleaseFacts, pro: ReleaseFacts, pc: PcFacts): Card[] {
  const isAr = locale === "ar";
  const available = isAr ? "متاح الآن" : "Available";
  const pcSize = formatFileSize(pc.sizeBytes, locale);
  return [
    {
      key: "classic",
      name: "MoPlayer Classic",
      platform: "Android TV · Fire TV",
      status: "available",
      statusLabel: available,
      body: isAr
        ? "خفيف وسريع ومألوف، ويعمل حتى على صناديق أندرويد 7 القديمة بدقة 720p."
        : "Light, fast and familiar — it runs even on older Android 7 boxes at 720p.",
      meta: releaseMeta(classic, locale),
      href: `/${locale}/apps/moplayer/classic`,
      download: classic.available ? { href: classic.downloadHref, label: isAr ? "نزّل APK" : "Download APK" } : undefined,
      image: { ...classicShots.liveBrowser, alt: classicShots.liveBrowser.alt[locale] },
      glow: "rgba(56, 189, 248, 0.22)",
    },
    {
      key: "pro",
      name: "MoPlayer Pro",
      platform: "Android TV · Fire TV",
      status: "available",
      statusLabel: available,
      body: isAr
        ? "التطبيق الأحدث: واجهة كهرمانية دافئة، مكتبة مفهرسة سريعة ومشغّل أغنى."
        : "The newer app: warm amber interface, a fast indexed library and a richer player.",
      meta: releaseMeta(pro, locale),
      href: `/${locale}/apps/moplayer2`,
      download: pro.available ? { href: pro.downloadHref, label: isAr ? "نزّل APK" : "Download APK" } : undefined,
      image: { ...proShots.signIn, alt: proShots.signIn.alt[locale] },
      glow: "rgba(255, 122, 61, 0.22)",
    },
    {
      key: "pc",
      name: "MoPlayer PC",
      platform: "Windows 10 · 11",
      status: pc.available ? "available" : "soon",
      statusLabel: pc.available ? available : isAr ? "قيد الصيانة" : "Under maintenance",
      body: isAr
        ? "MoPlayer على الكمبيوتر: بث مباشر وأفلام ومسلسلات وعرض متعدد، مع تفعيل QR."
        : "MoPlayer on the desktop: Live TV, movies, series and multi-view, with QR activation.",
      meta: [pc.version ? `v${pc.version}` : null, pcSize, "Windows x64"].filter(Boolean) as string[],
      href: `/${locale}/apps/moplayer-pc`,
      download: pc.available ? { href: pc.downloadHref, label: isAr ? "نزّل المثبّت" : "Download installer" } : undefined,
      image: { ...pcShots.settings, alt: pcShots.settings.alt[locale] },
      glow: "rgba(45, 212, 191, 0.2)",
    },
    {
      key: "ios",
      name: "MoPlayer iOS",
      platform: "iPhone",
      status: "soon",
      statusLabel: isAr ? "قيد التحضير" : "In preparation",
      body: isAr
        ? "نسخة iPhone قيد التحضير لـ App Store. ليست متاحة للتنزيل بعد."
        : "An iPhone version is being prepared for the App Store. It is not available to download yet.",
      meta: [isAr ? "غير منشور بعد" : "Not published yet"],
      href: `/${locale}/apps/moplayer-ios`,
      glow: "rgba(148, 163, 184, 0.18)",
    },
  ];
}

export function FamilyGrid({ cards, locale, headingLevel = "h3" }: { cards: Card[]; locale: Lang; headingLevel?: "h2" | "h3" }) {
  const isAr = locale === "ar";
  const Heading = headingLevel;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {cards.map((card) => (
        <article key={card.key} className={cx(styles.familyCard, styles.reveal)} style={{ ["--card-glow" as string]: card.glow }}>
          <div className={styles.familyMedia}>
            {card.image ? (
              <div className="relative overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-black" style={{ aspectRatio: "16 / 9" }}>
                <Image src={card.image.src} alt={card.image.alt} fill sizes="(max-width: 768px) 90vw, 560px" quality={75} className="object-cover object-top" />
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-t-2xl border border-b-0 border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent"
                style={{ aspectRatio: "16 / 9" }}
                aria-hidden
              >
                <div className="flex h-[78%] w-[22%] min-w-[90px] flex-col items-center justify-center gap-2 rounded-[22px] border border-white/15 bg-black/60 text-center">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">iOS</span>
                  <span className="px-2 text-[11px] text-white/40">{isAr ? "قريباً" : "Coming"}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-6 md:p-7">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
              <span className="inline-flex items-center gap-2 text-white/80">
                <span className={cx(styles.statusDot, card.status === "soon" && styles.statusDotSoon)} aria-hidden />
                {card.statusLabel}
              </span>
              <span className="text-white/40">{card.platform}</span>
            </div>
            <Heading className="mt-3 text-2xl font-extrabold tracking-tight">{card.name}</Heading>
            <p className="mt-2 text-[15px] leading-7 text-white/70">{card.body}</p>
            <p className="mt-3 text-sm font-semibold text-white/55">
              {card.meta.map((item, index) => (
                <span key={item}>
                  {index > 0 ? " · " : ""}
                  <bdi>{item}</bdi>
                </span>
              ))}
            </p>
            <div className="mt-auto flex flex-wrap gap-3 pt-6">
              <Link href={card.href} className={cx(styles.btn, styles.btnGhost, "!min-h-11 !px-4 !text-sm")}>
                {isAr ? `صفحة ${card.name}` : `About ${card.name}`}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
              {card.download ? (
                <a href={card.download.href} className={cx(styles.btn, styles.btnGhost, "!min-h-11 !px-4 !text-sm")}>
                  <ArrowDownToLine className="h-4 w-4" aria-hidden />
                  {card.download.label}
                </a>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/** Both Android apps' Downloader codes and short links, side by side. */
export function DualTvInstall({ classic, pro, locale }: { classic: ReleaseFacts; pro: ReleaseFacts; locale: Lang }) {
  const isAr = locale === "ar";
  const steps = isAr
    ? [
        "ثبّت تطبيق Downloader من AFTVnews من متجر التلفزيون (مجاني).",
        "اكتب رمز التطبيق الذي تريده واضغط Go، أو اكتب الرابط القصير.",
        "اضغط تثبيت، ثم افتح التطبيق وفعّله عبر QR من هاتفك.",
      ]
    : [
        "Install Downloader by AFTVnews from your TV's app store (free).",
        "Type the code of the app you want and press Go — or type the short link.",
        "Press Install, open the app and activate it with QR from your phone.",
      ];
  const items = [
    { name: "MoPlayer Classic", facts: classic, tone: "text-sky-300", ring: "border-sky-400/30" },
    { name: "MoPlayer Pro", facts: pro, tone: "text-orange-300", ring: "border-orange-400/30" },
  ];
  return (
    <section id="install-tv" aria-labelledby="install-tv-title" className="relative py-16 md:py-24">
      <div className={styles.container}>
        <div className={cx(styles.panelAccent, "p-6 md:p-10 lg:p-12", styles.reveal)}>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className={styles.eyebrow}>
                <Tv className="h-3.5 w-3.5" aria-hidden /> Android TV · Google TV · Fire TV
              </p>
              <h2 id="install-tv-title" className={cx(styles.h2, "mt-4")}>
                {isAr ? "على التلفزيون؟ رقم واحد يكفي." : "On a TV? One number is all it takes."}
              </h2>
              <ol className="mt-8 grid gap-4">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-4 text-[15px] leading-7 text-white/75">
                    <span className={styles.stepNum} aria-hidden>
                      {index + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm text-white/60">
                {isAr ? "صفحة واحدة للتلفزيون فيها التطبيقان:" : "One TV page with both apps:"}{" "}
                <a href={tvInstallPagePath} className={cx(styles.focusRing, styles.code, "rounded px-1 font-bold text-white hover:underline")} dir="ltr">
                  moalfarras.space/tv
                </a>
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.name} className={cx("rounded-3xl border bg-black/40 p-6 text-center", item.ring)}>
                  <p className="text-sm font-extrabold text-white">{item.name}</p>
                  <p className={cx(styles.factLabel, "mt-4")}>{isAr ? "رمز Downloader" : "Downloader code"}</p>
                  <p className={cx(styles.bigCode, "mt-2 !text-[clamp(2rem,4.4vw,3rem)]")} dir="ltr">
                    {item.facts.downloaderCode}
                  </p>
                  <p className={cx(styles.factLabel, "mt-5")}>{isAr ? "أو الرابط" : "Or the link"}</p>
                  <p className={cx(styles.code, "mt-1 text-lg font-extrabold", item.tone)} dir="ltr">
                    {item.facts.shortUrl}
                  </p>
                  <p className="mt-3 text-xs text-white/50">
                    {releaseMeta(item.facts, locale).map((meta, index) => (
                      <span key={meta}>
                        {index > 0 ? " · " : ""}
                        <bdi>{meta}</bdi>
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
