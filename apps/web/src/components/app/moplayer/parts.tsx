import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, BadgeCheck, Check, ChevronRight, Plus, QrCode, ShieldCheck, Tv } from "lucide-react";
import type { ReactNode } from "react";

import { CopyButton } from "./copy-button";
import styles from "./moplayer.module.css";
import { formatFileSize, formatReleaseDate, type Lang, type ReleaseFacts } from "@/lib/moplayer-release-facts";
import { tvInstallPagePath } from "@moalfarras/shared/app-releases";

export { styles };

export type Shot = { src: string; width: number; height: number; alt: { en: string; ar: string } };

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ── Layout ── */

export function Page({
  tone,
  locale,
  children,
}: {
  tone: "classic" | "pro" | "pc" | "ios" | "hub";
  locale: Lang;
  children: ReactNode;
}) {
  return (
    <main className={styles.page} data-tone={tone} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className={styles.ambient} aria-hidden />
      {children}
    </main>
  );
}

export function Section({
  id,
  children,
  className,
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cx("relative py-16 md:py-24", className)}>
      <div className={styles.container}>{children}</div>
    </section>
  );
}

export function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  center = false,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  center?: boolean;
}) {
  return (
    <header className={cx("mb-10 max-w-3xl md:mb-14", center && "mx-auto text-center", styles.reveal)}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 id={id} className={cx(styles.h2, "mt-4")}>
        {title}
      </h2>
      {lead ? <p className={cx(styles.lead, "mt-4")}>{lead}</p> : null}
    </header>
  );
}

/* ── Device frames ── */

export function TvFrame({
  shot,
  locale,
  priority = false,
  sizes,
  stand = true,
}: {
  shot: Shot;
  locale: Lang;
  priority?: boolean;
  sizes: string;
  stand?: boolean;
}) {
  return (
    <figure className={styles.tv}>
      <div className={styles.tvBezel}>
        <div className={styles.tvScreen}>
          <Image
            src={shot.src}
            alt={shot.alt[locale]}
            width={shot.width}
            height={shot.height}
            sizes={sizes}
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            quality={75}
          />
          <span className={styles.glare} aria-hidden />
        </div>
        <span className={styles.tvLed} aria-hidden />
      </div>
      {stand ? <div className={styles.tvStand} aria-hidden /> : null}
    </figure>
  );
}

/** A close-up crop of a real screenshot (same pixels, no editing). */
export function DetailShot({
  shot,
  locale,
  sizes,
  position = "50% 50%",
  aspect = "4 / 3",
}: {
  shot: Shot;
  locale: Lang;
  sizes: string;
  position?: string;
  aspect?: string;
}) {
  return (
    <figure className={cx(styles.tvBezel, "!p-2")}>
      <div className="relative overflow-hidden rounded-[14px] bg-black" style={{ aspectRatio: aspect }}>
        <Image
          src={shot.src}
          alt={shot.alt[locale]}
          fill
          sizes={sizes}
          quality={75}
          className="object-cover"
          style={{ objectPosition: position }}
        />
        <span className={styles.glare} aria-hidden />
      </div>
    </figure>
  );
}

export function MonitorFrame({ shot, locale, sizes, priority = false }: { shot: Shot; locale: Lang; sizes: string; priority?: boolean }) {
  return (
    <figure className={cx(styles.tv, styles.monitor)}>
      <div className={styles.tvBezel}>
        <div className={styles.tvScreen} style={{ aspectRatio: `${shot.width} / ${shot.height}` }}>
          <Image src={shot.src} alt={shot.alt[locale]} width={shot.width} height={shot.height} sizes={sizes} loading={priority ? "eager" : undefined} quality={75} />
          <span className={styles.glare} aria-hidden />
        </div>
      </div>
      <div className={styles.monitorStand} aria-hidden />
    </figure>
  );
}

export function PhoneFrame({ shot, locale, sizes, priority = false }: { shot: Shot; locale: Lang; sizes: string; priority?: boolean }) {
  return (
    <figure className={styles.phone}>
      <div className={styles.phoneScreen} style={{ aspectRatio: `${shot.width} / ${shot.height}` }}>
        <Image src={shot.src} alt={shot.alt[locale]} width={shot.width} height={shot.height} sizes={sizes} loading={priority ? "eager" : undefined} quality={75} />
        <span className={styles.glare} aria-hidden />
      </div>
    </figure>
  );
}

/* ── Calls to action ── */

const t2 = (locale: Lang, en: string, ar: string) => (locale === "ar" ? ar : en);

export function releaseMeta(facts: ReleaseFacts, locale: Lang) {
  return [
    `v${facts.version}`,
    formatFileSize(facts.sizeBytes, locale),
    locale === "ar" ? `أندرويد ${facts.minAndroid}+` : `Android ${facts.minAndroid}+`,
  ].filter(Boolean) as string[];
}

export function formatSizeOrDash(facts: ReleaseFacts, locale: Lang) {
  return formatFileSize(facts.sizeBytes, locale) ?? "—";
}

export function DownloadButton({ facts, locale, label }: { facts: ReleaseFacts; locale: Lang; label?: string }) {
  if (!facts.available) {
    return (
      <span className={cx(styles.btn, styles.btnDisabled)} aria-disabled="true">
        {facts.unavailableMessage || t2(locale, "Downloads paused for maintenance", "التنزيل متوقف مؤقتاً للصيانة")}
      </span>
    );
  }
  return (
    <a href={facts.downloadHref} className={cx(styles.btn, styles.btnPrimary)}>
      <ArrowDownToLine className="h-5 w-5 shrink-0" aria-hidden />
      <span className={styles.btnStack}>
        <span>{label ?? t2(locale, "Download APK", "نزّل ملف APK")}</span>
        <span className={styles.btnSub}>
          {releaseMeta(facts, locale).map((item, index) => (
            <span key={item}>
              {index > 0 ? " · " : ""}
              <bdi>{item}</bdi>
            </span>
          ))}
        </span>
      </span>
    </a>
  );
}

export function GhostLink({ href, children, prefetch }: { href: string; children: ReactNode; prefetch?: boolean }) {
  return (
    <Link href={href} prefetch={prefetch} className={cx(styles.btn, styles.btnGhost)}>
      {children}
    </Link>
  );
}

export function TvCodeChip({ facts, locale }: { facts: ReleaseFacts; locale: Lang }) {
  return (
    <a
      href="#install-tv"
      className={cx(
        styles.focusRing,
        "group mt-6 inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 transition hover:border-white/25",
      )}
    >
      <Tv className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
      <span>{t2(locale, "On a TV? Type in Downloader:", "على التلفزيون؟ اكتب في Downloader:")}</span>
      <span className={cx(styles.code, "text-base font-extrabold text-white")} dir="ltr">
        {facts.downloaderCode}
      </span>
      <span className="text-white/40">{t2(locale, "or", "أو")}</span>
      <span className={cx(styles.code, "font-bold text-[var(--accent)]")} dir="ltr">
        {facts.shortUrl}
      </span>
    </a>
  );
}

/* ── Install on Android TV / Fire TV ── */

export function InstallOnTv({
  facts,
  locale,
  productName,
  extra,
}: {
  facts: ReleaseFacts;
  locale: Lang;
  productName: string;
  extra?: ReactNode;
}) {
  const steps = [
    {
      title: t2(locale, "Install Downloader", "ثبّت Downloader"),
      body: t2(
        locale,
        "Open the app store on your Android TV, Google TV or Fire TV, search for “Downloader” by AFTVnews and install it. It is free.",
        "افتح متجر التطبيقات على Android TV أو Google TV أو Fire TV، وابحث عن “Downloader” من AFTVnews وثبّته. التطبيق مجاني.",
      ),
    },
    {
      title: t2(locale, "Type the code", "اكتب الرمز"),
      body: t2(
        locale,
        `Type the code below in Downloader and press Go — or type the short link. The ${productName} APK downloads and Android offers to install it. If it asks, allow Downloader to install unknown apps.`,
        `اكتب الرمز أدناه في Downloader واضغط Go، أو اكتب الرابط القصير. يُنزَّل ملف ${productName} ويعرض أندرويد تثبيته. إن طُلب منك، اسمح لـ Downloader بتثبيت التطبيقات غير المعروفة.`,
      ),
    },
    {
      title: t2(locale, "Install and activate", "ثبّت وفعّل"),
      body: t2(
        locale,
        "Open the app, scan the QR code with your phone and add your own Xtream or M3U source at moalfarras.space/activate.",
        "افتح التطبيق، وامسح رمز QR بهاتفك، ثم أضف مصدر Xtream أو M3U الخاص بك عبر moalfarras.space/activate.",
      ),
    },
  ];

  return (
    <Section id="install-tv" labelledBy="install-tv-title">
      <div className={cx(styles.panelAccent, "overflow-hidden p-6 md:p-10 lg:p-12", styles.reveal)}>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <p className={styles.eyebrow}>{t2(locale, "Android TV · Google TV · Fire TV", "Android TV · Google TV · Fire TV")}</p>
            <h2 id="install-tv-title" className={cx(styles.h2, "mt-4")}>
              {t2(locale, `Install ${productName} on your TV in a minute`, `ثبّت ${productName} على تلفزيونك في دقيقة`)}
            </h2>
            <ol className="mt-8 grid gap-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className={styles.stepNum} aria-hidden>
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{step.title}</h3>
                    <p className="mt-1 text-[15px] leading-7 text-white/70">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-center md:p-8">
              <p className={styles.factLabel}>{t2(locale, "Downloader code", "رمز Downloader")}</p>
              <p className={cx(styles.bigCode, "mt-3")} dir="ltr">
                {facts.downloaderCode}
              </p>
              <div className="mx-auto my-6 h-px w-24 bg-white/10" />
              <p className={styles.factLabel}>{t2(locale, "Or type this short link", "أو اكتب هذا الرابط القصير")}</p>
              <p className={cx(styles.code, "mt-2 whitespace-nowrap text-[clamp(1.1rem,5.4vw,1.9rem)] font-extrabold text-[var(--accent)]")} dir="ltr">
                {facts.shortUrl}
              </p>
              <p className="mt-3 text-sm text-white/55">
                {t2(locale, "Always the latest version — the link never changes.", "دائماً أحدث إصدار، والرابط لا يتغير أبداً.")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/65">
              <span className="inline-flex items-center gap-2">
                <QrCode className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                {t2(locale, "Both apps on one TV page:", "التطبيقان في صفحة واحدة للتلفزيون:")}
              </span>
              <a href={tvInstallPagePath} className={cx(styles.focusRing, styles.code, "rounded-lg px-1 font-bold text-white underline-offset-4 hover:underline")} dir="ltr">
                moalfarras.space/tv
              </a>
            </div>
            {extra}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── Release facts ── */

export function ReleaseFactsPanel({
  facts,
  locale,
  productName,
  devices,
  sources,
  downloads,
}: {
  facts: ReleaseFacts;
  locale: Lang;
  productName: string;
  devices: string;
  sources: string;
  downloads?: string | null;
}) {
  const size = formatFileSize(facts.sizeBytes, locale);
  const date = formatReleaseDate(facts.publishedAt, locale);
  const items = [
    { label: t2(locale, "Version", "الإصدار"), value: facts.versionCode ? `${facts.version} (${facts.versionCode})` : facts.version, ltr: true },
    size ? { label: t2(locale, "APK size", "حجم الملف"), value: size } : null,
    { label: t2(locale, "Requires", "يتطلب"), value: t2(locale, `Android ${facts.minAndroid} or newer`, `أندرويد ${facts.minAndroid} أو أحدث`) },
    { label: t2(locale, "Devices", "الأجهزة"), value: devices },
    { label: t2(locale, "Sources", "المصادر"), value: sources },
    date ? { label: t2(locale, "Released", "تاريخ الإصدار"), value: date } : null,
    downloads ? { label: t2(locale, "Official downloads", "التنزيلات الرسمية"), value: downloads } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; ltr?: boolean }>;

  return (
    <Section id="release" labelledBy="release-title">
      <SectionHead
        id="release-title"
        eyebrow={t2(locale, "Release", "الإصدار")}
        title={t2(locale, `${productName} ${facts.version}`, `${productName} ${facts.version}`)}
        lead={t2(
          locale,
          "Every number on this page comes from the published release, so it always matches the file you download.",
          "كل رقم في هذه الصفحة مأخوذ من الإصدار المنشور، فيطابق دائماً الملف الذي تنزّله.",
        )}
      />
      <div
        className={cx(
          styles.panel,
          "grid gap-px overflow-hidden bg-white/[0.06] p-0 sm:grid-cols-2",
          items.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4",
          styles.reveal,
        )}
      >
        {items.map((item) => (
          <div key={item.label} className="bg-[#070a11] p-6">
            <p className={styles.factLabel}>{item.label}</p>
            <p className={cx(styles.factValue, "mt-2")} dir={item.ltr ? "ltr" : undefined}>
              {item.value}
            </p>
          </div>
        ))}
        <div className="bg-[#070a11] p-6 sm:col-span-2 lg:col-span-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className={styles.factLabel}>SHA-256</p>
              {facts.sha256 ? (
                <p className={cx(styles.code, "mt-2 truncate text-[15px] font-bold text-white/90")} dir="ltr" title={facts.sha256}>
                  {facts.sha256.slice(0, 16)}…{facts.sha256.slice(-12)}
                </p>
              ) : (
                <p className="mt-2 text-white/60">{t2(locale, "Not published for this file", "غير منشور لهذا الملف")}</p>
              )}
              <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
                {facts.hostedOnGithub ? <BadgeCheck className="h-4 w-4" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
                {facts.hostedOnGithub
                  ? t2(locale, "Signed APK, served from GitHub Releases", "ملف APK موقّع، يُنزَّل من GitHub Releases")
                  : t2(locale, "Signed APK from the official release", "ملف APK موقّع من الإصدار الرسمي")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {facts.sha256 ? (
                <CopyButton value={facts.sha256} label={t2(locale, "Copy SHA-256", "انسخ SHA-256")} copiedLabel={t2(locale, "Copied", "تم النسخ")} />
              ) : null}
              <DownloadButton facts={facts} locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── FAQ ── */

export type FaqItem = { q: string; a: ReactNode };

export function Faq({ items, id = "faq-title", title, eyebrow, aside }: { items: FaqItem[]; id?: string; title: string; eyebrow: string; aside?: ReactNode }) {
  return (
    <Section id="faq" labelledBy={id}>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHead id={id} eyebrow={eyebrow} title={title} />
          {aside}
        </div>
        <div className={cx("border-t border-white/10", styles.reveal)}>
          {items.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary>
                <span>{item.q}</span>
                <Plus className={cx(styles.faqIcon, "h-5 w-5")} aria-hidden />
              </summary>
              <div className="pb-6 pe-8 text-[15px] leading-7 text-white/70">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── Feature row ── */

export function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  media,
  flip = false,
  titleId,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  bullets?: string[];
  media: ReactNode;
  flip?: boolean;
  titleId: string;
}) {
  return (
    <article aria-labelledby={titleId} className={cx("grid items-center gap-10 lg:grid-cols-2 lg:gap-16", styles.reveal)}>
      <div className={cx(flip && "lg:order-2")}>{media}</div>
      <div className={cx(flip && "lg:order-1")}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h3 id={titleId} className={cx(styles.h2, "mt-4 !text-[clamp(1.6rem,2.8vw,2.4rem)]")}>
          {title}
        </h3>
        <div className={cx(styles.lead, "mt-4")}>{body}</div>
        {bullets?.length ? (
          <ul className="mt-6 grid gap-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-[15px] leading-7 text-white/80">
                <Check className="mt-1 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

/* ── Legal ── */

export function LegalNote({ locale }: { locale: Lang }) {
  return (
    <Section className="!pt-0">
      <div className={cx(styles.panel, "flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8")}>
        <div className="flex items-start gap-4">
          <span className={styles.iconTile}>
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <p className="max-w-3xl text-[15px] leading-7 text-white/70">
            {t2(
              locale,
              "MoPlayer is a media player only. It does not sell or include channels, playlists, subscriptions or copyrighted media. You add a source you own or are legally allowed to use.",
              "MoPlayer مشغّل وسائط فقط. لا يبيع ولا يتضمن قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمياً بحقوق النشر. أنت من يضيف مصدراً تملكه أو يحق لك استخدامه قانونياً.",
            )}
          </p>
        </div>
        <Link href={`/${locale}/app-disclaimer`} className={cx(styles.focusRing, "inline-flex shrink-0 items-center gap-1 rounded-lg px-1 text-sm font-bold text-[var(--accent)] hover:underline")}>
          {t2(locale, "Read the app disclaimer", "اقرأ إخلاء المسؤولية")}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </Section>
  );
}
