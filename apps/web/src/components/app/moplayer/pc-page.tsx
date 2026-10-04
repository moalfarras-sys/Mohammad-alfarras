import Link from "next/link";
import { ArrowDownToLine, KeyRound, LayoutGrid, MonitorSmartphone, Package, ShieldAlert } from "lucide-react";

import { CopyButton } from "./copy-button";
import { ParallaxLayer } from "./hero-motion";
import { cx, FeatureRow, LegalNote, MonitorFrame, Page, Section, SectionHead, styles } from "./parts";
import { pcShots } from "./shots";
import { formatFileSize, formatReleaseDate, type Lang } from "@/lib/moplayer-release-facts";
import type { WindowsRelease } from "@/lib/windows-release";

const copy = {
  en: {
    eyebrow: "MoPlayer PC · Windows",
    title: ["MoPlayer,", "on your desktop."],
    lead:
      "A Windows app for your own Xtream or M3U source: Live TV, movies and series with keyboard and mouse, multi-view, and the same QR activation as the TV apps.",
    installer: "Download installer",
    portable: "Portable version",
    activate: "Activate with QR",
    unavailable: "The Windows download is paused for maintenance. Please check back soon.",
    multi: {
      eyebrow: "Multi-view",
      title: "Up to four channels side by side.",
      body: "Add channels to a grid one tile at a time and watch them together — handy for following several live events.",
    },
    settings: {
      eyebrow: "Settings",
      title: "Your source, your look, your playback.",
      body: "Manage the source, pick an accent color, set playback and library options, and choose Arabic or English.",
    },
    facts: "Release",
    version: "Version",
    released: "Released",
    requires: "Requires",
    installerSize: "Installer",
    portableSize: "Portable",
    sha: "Installer SHA-256",
    copy: "Copy SHA-256",
    copied: "Copied",
    host: "Served from GitHub Releases",
    smartTitle: "About the Windows warning",
    smart:
      "The installer is not code-signed yet, so Windows SmartScreen may show “Windows protected your PC”. Choose More info › Run anyway only if the file came from this page; you can compare its SHA-256 above.",
    activateTitle: "Activate in seconds",
    activateBody: "Open MoPlayer PC, scan the QR code with your phone and add your source at moalfarras.space/activate.",
    androidTitle: "Looking for the TV app?",
    androidBody: "MoPlayer Classic and MoPlayer Pro run on Android TV, Google TV and Fire TV.",
    androidCta: "See all MoPlayer apps",
  },
  ar: {
    eyebrow: "MoPlayer PC · ويندوز",
    title: ["MoPlayer", "على حاسوبك."],
    lead:
      "تطبيق ويندوز لمصدر Xtream أو M3U الخاص بك: بث مباشر وأفلام ومسلسلات بلوحة المفاتيح والفأرة، مع العرض المتعدد، والتفعيل نفسه عبر QR كما في تطبيقات التلفزيون.",
    installer: "نزّل المثبّت",
    portable: "النسخة المحمولة",
    activate: "فعّل عبر QR",
    unavailable: "تنزيل نسخة ويندوز متوقف مؤقتاً للصيانة. عُد لاحقاً.",
    multi: {
      eyebrow: "العرض المتعدد",
      title: "حتى أربع قنوات جنباً إلى جنب.",
      body: "أضف القنوات إلى الشبكة خانة بعد خانة وشاهدها معاً، وهذا مفيد لمتابعة عدة أحداث مباشرة.",
    },
    settings: {
      eyebrow: "الإعدادات",
      title: "مصدرك، ومظهرك، وطريقة تشغيلك.",
      body: "أدِر المصدر، واختر لون الواجهة، واضبط خيارات التشغيل والمكتبة، واختر العربية أو الإنجليزية.",
    },
    facts: "الإصدار",
    version: "الإصدار",
    released: "تاريخ الإصدار",
    requires: "يتطلب",
    installerSize: "المثبّت",
    portableSize: "المحمولة",
    sha: "SHA-256 للمثبّت",
    copy: "انسخ SHA-256",
    copied: "تم النسخ",
    host: "يُنزَّل من GitHub Releases",
    smartTitle: "عن تحذير ويندوز",
    smart:
      "المثبّت غير موقّع رقمياً بعد، لذلك قد يعرض Windows SmartScreen رسالة “Windows protected your PC”. اختر More info ثم Run anyway فقط إذا نزّلت الملف من هذه الصفحة، ويمكنك مطابقة SHA-256 أعلاه.",
    activateTitle: "فعّل خلال ثوانٍ",
    activateBody: "افتح MoPlayer PC، وامسح رمز QR بهاتفك، ثم أضف مصدرك عبر moalfarras.space/activate.",
    androidTitle: "تبحث عن تطبيق التلفزيون؟",
    androidBody: "يعمل MoPlayer Classic و MoPlayer Pro على Android TV و Google TV و Fire TV.",
    androidCta: "كل تطبيقات MoPlayer",
  },
} as const;

export function MoPlayerPcPage({ locale, release }: { locale: Lang; release: WindowsRelease | null }) {
  const t = copy[locale];
  const available = Boolean(release && !release.maintenance && release.file);
  const installerHref = "/api/app/download/latest?product=moplayer-pc&platform=windows";
  const portableHref = `${installerHref}&portable=1`;
  const installerSize = formatFileSize(release?.fileSizeBytes, locale);
  const portableSize = formatFileSize(release?.portableFileSizeBytes, locale);
  const date = formatReleaseDate(release?.releaseDate, locale);
  const onGithub = Boolean(release?.downloadUrl?.startsWith("https://github.com/"));
  const requirement = release?.systemRequirements || "Windows 10 / Windows 11 x64";
  const facts = [
    release?.version ? { label: t.version, value: release.version } : null,
    date ? { label: t.released, value: date } : null,
    { label: t.requires, value: requirement },
    installerSize ? { label: t.installerSize, value: installerSize } : null,
    portableSize ? { label: t.portableSize, value: portableSize } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Page tone="pc" locale={locale}>
      <section aria-labelledby="hero-title" className="relative pb-10 pt-28 md:pb-16 md:pt-36">
        <div className={cx(styles.container, "grid items-center gap-12 lg:grid-cols-[0.95fr_1.2fr]")}>
          <div className="moh-hero-rise">
            <p className={styles.eyebrow}>
              {t.eyebrow}
              {release?.version ? (
                <>
                  {" "}
                  <span className="opacity-60">·</span> <bdi className="normal-case">v{release.version}</bdi>
                </>
              ) : null}
            </p>
            <h1 id="hero-title" className={cx(styles.display, "mt-5")}>
              {t.title[0]}
              <br />
              <span className={styles.accentText}>{t.title[1]}</span>
            </h1>
            <p className={cx(styles.lead, "mt-6 max-w-xl")}>{t.lead}</p>
            {available ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href={installerHref} className={cx(styles.btn, styles.btnPrimary)}>
                  <ArrowDownToLine className="h-5 w-5" aria-hidden />
                  <span className={styles.btnStack}>
                    <span>{t.installer}</span>
                    <span className={styles.btnSub}>
                      {[release?.version ? `v${release.version}` : null, installerSize, "Windows x64"].filter(Boolean).map((item, index) => (
                        <span key={item}>
                          {index > 0 ? " · " : ""}
                          <bdi>{item}</bdi>
                        </span>
                      ))}
                    </span>
                  </span>
                </a>
                {release?.portableFile ? (
                  <a href={portableHref} className={cx(styles.btn, styles.btnGhost)}>
                    <Package className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                    {t.portable}
                  </a>
                ) : null}
              </div>
            ) : (
              <p className={cx(styles.alertCard, "mt-8 max-w-xl text-sm text-amber-100")}>{t.unavailable}</p>
            )}
            <Link
              href={`/${locale}/activate?product=moplayer-pc&platform=windows`}
              className={cx(styles.focusRing, "mt-5 inline-flex items-center gap-2 rounded-lg px-1 text-sm font-bold text-white/75 hover:text-white")}
            >
              <KeyRound className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              {t.activate}
            </Link>
          </div>
          <ParallaxLayer>
            <MonitorFrame shot={pcShots.settings} locale={locale} priority sizes="(max-width: 1024px) 92vw, 700px" />
          </ParallaxLayer>
        </div>
      </section>

      <Section labelledBy="pc-features">
        <h2 id="pc-features" className="sr-only">
          {t.multi.eyebrow}
        </h2>
        <div className="grid gap-24">
          <FeatureRow
            titleId="f-multi"
            eyebrow={t.multi.eyebrow}
            title={t.multi.title}
            body={t.multi.body}
            media={<MonitorFrame shot={pcShots.multi} locale={locale} sizes="(max-width: 1024px) 92vw, 600px" />}
          />
          <FeatureRow
            flip
            titleId="f-settings"
            eyebrow={t.settings.eyebrow}
            title={t.settings.title}
            body={t.settings.body}
            media={
              <div className={cx(styles.panel, "grid gap-4 p-6")}>
                <div className="flex items-start gap-4">
                  <span className={styles.iconTile}>
                    <KeyRound className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{t.activateTitle}</h3>
                    <p className="mt-1 text-[15px] leading-7 text-white/70">{t.activateBody}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className={styles.iconTile}>
                    <LayoutGrid className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{t.androidTitle}</h3>
                    <p className="mt-1 text-[15px] leading-7 text-white/70">{t.androidBody}</p>
                    <Link href={`/${locale}/apps/moplayer`} className={cx(styles.focusRing, "mt-2 inline-flex rounded px-1 text-sm font-bold text-[var(--accent)] hover:underline")}>
                      {t.androidCta}
                    </Link>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </Section>

      <Section id="release" labelledBy="pc-release-title">
        <SectionHead id="pc-release-title" eyebrow={t.facts} title={`MoPlayer PC ${release?.version ?? ""}`.trim()} />
        <div className={cx(styles.panel, "grid gap-px overflow-hidden bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-5", styles.reveal)}>
          {facts.map((item) => (
            <div key={item.label} className="bg-[#070a11] p-6">
              <p className={styles.factLabel}>{item.label}</p>
              <p className={cx(styles.factValue, "mt-2")}>
                <bdi>{item.value}</bdi>
              </p>
            </div>
          ))}
          {release?.sha256 ? (
            <div className="flex flex-col gap-4 bg-[#070a11] p-6 sm:col-span-2 md:flex-row md:items-center md:justify-between lg:col-span-full">
              <div className="min-w-0">
                <p className={styles.factLabel}>{t.sha}</p>
                <p className={cx(styles.code, "mt-2 truncate text-[15px] font-bold text-white/90")} dir="ltr" title={release.sha256}>
                  {release.sha256.slice(0, 16)}…{release.sha256.slice(-12)}
                </p>
                {onGithub ? <p className="mt-2 text-sm text-white/60">{t.host}</p> : null}
              </div>
              <CopyButton value={release.sha256} label={t.copy} copiedLabel={t.copied} />
            </div>
          ) : null}
        </div>
        <div className={cx(styles.alertCard, "mt-4 flex items-start gap-3 p-5")}>
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" aria-hidden />
          <div>
            <h3 className="font-extrabold text-amber-100">{t.smartTitle}</h3>
            <p className="mt-1 text-sm leading-6 text-amber-50/80">{t.smart}</p>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className={cx(styles.panel, "flex items-center gap-4 p-6")}>
          <MonitorSmartphone className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
          <p className="text-sm text-white/70">
            {locale === "ar"
              ? "MoPlayer PC جزء من عائلة MoPlayer Pro ويستخدم خدمة التفعيل نفسها."
              : "MoPlayer PC belongs to the MoPlayer Pro family and uses the same activation service."}
          </p>
        </div>
      </Section>

      <LegalNote locale={locale} />
    </Page>
  );
}
