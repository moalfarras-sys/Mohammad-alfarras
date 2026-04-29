"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Download,
  KeyRound,
  MonitorPlay,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv2,
  Workflow,
} from "lucide-react";

import { moPlayerCopy } from "@/content/apps";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(locale: Locale, value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function MoPlayerLanding({ ecosystem, locale = "en" }: { ecosystem: AppEcosystemData; locale?: Locale }) {
  const isAr = locale === "ar";
  const t = repairMojibakeDeep(moPlayerCopy[locale]);
  const latest = ecosystem.releases[0] ?? null;
  const primaryAsset = latest?.assets.find((item) => item.is_primary) ?? latest?.assets[0] ?? null;
  const advancedAssets = latest?.assets.filter((item) => item.id !== primaryAsset?.id) ?? [];
  const size = formatBytes(primaryAsset?.file_size_bytes);
  const releaseDate = formatDate(locale, latest?.published_at ?? ecosystem.product.last_updated_at);
  const downloadHref = latest ? `/api/app/releases/${latest.slug}/download` : null;
  const updateHref = "/api/app/releases/latest";
  const screenshots = ecosystem.screenshots.length
    ? ecosystem.screenshots
    : [
        { id: "hero", title: "MoPlayer", alt_text: "MoPlayer Android TV product", image_path: "/images/moplayer-hero-3d-final.png", product_slug: "moplayer", device_frame: "tv", sort_order: 0, is_featured: true, created_at: "" },
      ];

  const specs = [
    { icon: Download, label: t.specsLabels.version, value: latest?.version_name ? `v${latest.version_name}` : "2.x" },
    { icon: Cpu, label: t.specsLabels.size, value: size ?? "APK" },
    { icon: Smartphone, label: t.specsLabels.minSdk, value: `API ${ecosystem.product.android_min_sdk}` },
    { icon: MonitorPlay, label: t.specsLabels.targetSdk, value: `API ${ecosystem.product.android_target_sdk}` },
    { icon: Workflow, label: t.specsLabels.abi, value: primaryAsset?.abi ?? "arm64-v8a" },
    { icon: Tv2, label: t.specsLabels.tv, value: ecosystem.product.android_tv_ready ? "Ready" : "Android" },
  ];

  const stats = [
    { label: isAr ? "أحدث إصدار" : "Latest release", value: latest?.version_name ? `v${latest.version_name}` : "2.x" },
    { label: isAr ? "آخر تحديث" : "Updated", value: releaseDate ?? (isAr ? "حديثًا" : "Recently") },
    { label: isAr ? "التشغيل" : "Playback", value: "VLC / libVLC" },
    { label: isAr ? "التلفزيون" : "TV", value: ecosystem.product.android_tv_ready ? "Ready" : "Android" },
  ];

  return (
    <main className="moplayer-page" dir={isAr ? "rtl" : "ltr"}>
      <section className="moplayer-hero">
        <div className="moplayer-hero-copy">
          <span className="moplayer-kicker">
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroBody}</p>
          <div className="moplayer-actions">
            {downloadHref ? (
              <Link href={downloadHref} className="moplayer-button moplayer-button-primary">
                <ArrowDownToLine className="h-4 w-4" />
                {t.download}
              </Link>
            ) : (
              <span className="moplayer-button">{t.releasePending}</span>
            )}
            <Link href={`/${locale}/activate`} className="moplayer-button">
              <KeyRound className="h-4 w-4" />
              {isAr ? "التفعيل" : "Activate"}
            </Link>
            <Link href={updateHref} className="moplayer-button">
              <ArrowUpRight className="h-4 w-4" />
              {isAr ? "بيانات التحديث" : "Update info"}
            </Link>
          </div>
        </div>

        <div className="moplayer-device-stage">
          <div className="moplayer-device-glow" />
          <div className="moplayer-tv-frame">
            <Image src="/images/moplayer-hero-3d-final.png" alt="MoPlayer Android TV product visual" fill sizes="(max-width: 900px) 92vw, 620px" className="moplayer-image" priority />
          </div>
          <div className="moplayer-floating-card">
            <Image src="/images/moplayer-icon-512.png" alt="" width={44} height={44} />
            <div>
              <strong>MoPlayer</strong>
              <span>{isAr ? "جاهز للتلفزيون والتفعيل" : "TV and activation ready"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moplayer-stats">
        {stats.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <section className="moplayer-section">
        <div className="moplayer-section-head">
          <span className="moplayer-kicker">
            <Cpu className="h-4 w-4" />
            {isAr ? "معلومات الإصدار" : "Release system"}
          </span>
          <h2>{isAr ? "كل ما يحتاجه المستخدم قبل التحميل واضح في مكان واحد." : "Everything a user needs before downloading, clear in one place."}</h2>
        </div>
        <div className="moplayer-spec-grid">
          {specs.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="moplayer-spec">
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            );
          })}
        </div>
        {latest && primaryAsset ? (
          <div className="moplayer-download-chooser">
            <div>
              <span className="moplayer-kicker">{isAr ? "التنزيل الموصى به" : "Recommended TV download"}</span>
              <h3>{isAr ? "استخدم ملف Universal APK أولًا لتجنب خطأ التثبيت على التلفزيون." : "Use the Universal APK first to avoid TV install mismatch."}</h3>
              <p>
                {isAr
                  ? "إذا ظهرت رسالة App not installed، احذف أي نسخة قديمة من MoPlayer ثم ثبّت هذا الملف من جديد."
                  : "If Android shows “App not installed”, remove any older MoPlayer build first, then install this recommended package again."}
              </p>
            </div>
            <div className="moplayer-download-list">
              <Link href={`/api/app/releases/${latest.slug}/download`} className="moplayer-download-row is-primary">
                <span>{primaryAsset.label || (isAr ? "ملف التلفزيون الموصى به" : "Recommended TV APK")}</span>
                <strong>{primaryAsset.abi ?? "universal"} · {formatBytes(primaryAsset.file_size_bytes) ?? "APK"}</strong>
              </Link>
              {advancedAssets.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.external_url || `/api/app/releases/${latest.slug}/download`}
                  className="moplayer-download-row"
                >
                  <span>{asset.label || asset.abi || "APK"}</span>
                  <strong>{asset.abi ?? "APK"} · {formatBytes(asset.file_size_bytes) ?? "APK"}</strong>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="moplayer-section moplayer-showcase">
        <div className="moplayer-section-head">
          <span className="moplayer-kicker">
            <MonitorPlay className="h-4 w-4" />
            {t.featuresEyebrow}
          </span>
          <h2>{t.featuresTitle}</h2>
        </div>
        <div className="moplayer-feature-grid">
          {t.features.map((feature, index) => {
            const icons = [Tv2, MonitorPlay, ShieldCheck, CheckCircle2];
            const Icon = icons[index] ?? CheckCircle2;
            return (
              <article key={feature.title} className="moplayer-feature-card">
                <Icon className="h-5 w-5" />
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            );
          })}
        </div>
        <div className="moplayer-gallery">
          {screenshots.slice(0, 4).map((shot, index) => (
            <figure key={shot.id} className={index === 0 ? "is-wide" : ""}>
              <Image src={shot.image_path} alt={shot.alt_text || shot.title || "MoPlayer screenshot"} fill sizes={index === 0 ? "(max-width: 900px) 92vw, 58vw" : "(max-width: 900px) 92vw, 28vw"} className="moplayer-image" />
              <figcaption>{shot.title || "MoPlayer"}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="moplayer-section moplayer-two-col">
        <article className="moplayer-info-card">
          <Workflow className="h-6 w-6" />
          <h2>{t.philosophyTitle}</h2>
          <p>{t.philosophy}</p>
        </article>
        <article className="moplayer-info-card">
          <ShieldCheck className="h-6 w-6" />
          <h2>{t.privacyTitle}</h2>
          <div className="moplayer-check-list">
            {t.privacyBullets.map((item) => (
              <span key={item}>
                <CheckCircle2 className="h-4 w-4" />
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="moplayer-section moplayer-install">
        <div>
          <span className="moplayer-kicker">{isAr ? "خطوات التثبيت" : "Install steps"}</span>
          <h2>{t.installTitle}</h2>
          <div className="moplayer-step-list">
            {t.installSteps.map((step, index) => (
              <article key={step.title}>
                <span>{`0${index + 1}`}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <span className="moplayer-kicker">{t.faqTitle}</span>
          <div className="moplayer-faq-list">
            {t.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="moplayer-final">
        <span className="moplayer-kicker">{t.disclaimerTitle}</span>
        <h2>{t.finalTitle}</h2>
        <p>{t.finalBody}</p>
        <div className="moplayer-actions">
          {downloadHref ? (
            <Link href={downloadHref} className="moplayer-button moplayer-button-primary">
              <ArrowDownToLine className="h-4 w-4" />
              {t.download}
            </Link>
          ) : null}
          <Link href={`/${locale}/activate`} className="moplayer-button">
            <KeyRound className="h-4 w-4" />
            {isAr ? "فعّل التطبيق" : "Activate the app"}
          </Link>
          <Link href={`/${locale}/support`} className="moplayer-button">
            {t.support}
          </Link>
        </div>
      </section>
    </main>
  );
}
