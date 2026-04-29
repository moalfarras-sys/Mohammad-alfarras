"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, CheckCircle2, MonitorPlay, ShieldCheck, Tv2, Workflow } from "lucide-react";

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
  const size = formatBytes(primaryAsset?.file_size_bytes);
  const releaseDate = formatDate(locale, latest?.published_at ?? ecosystem.product.last_updated_at);
  const downloadHref = latest ? `/api/app/releases/${latest.slug}/download` : null;
  const screenshots = ["/images/moplayer-hero-3d-final.png", "/images/moplayer-ui-mock-final.png", "/images/moplayer-tv-banner-final.png"];

  const specs = [
    { label: t.specsLabels.version, value: latest?.version_name ? `v${latest.version_name}` : "2.x" },
    { label: t.specsLabels.size, value: size ?? "APK" },
    { label: t.specsLabels.minSdk, value: `API ${ecosystem.product.android_min_sdk}` },
    { label: t.specsLabels.targetSdk, value: `API ${ecosystem.product.android_target_sdk}` },
    { label: t.specsLabels.abi, value: primaryAsset?.abi ?? "arm64-v8a" },
    { label: t.specsLabels.tv, value: ecosystem.product.android_tv_ready ? "Ready" : "Android" },
  ];

  return (
    <main className="fresh-page" dir={isAr ? "rtl" : "ltr"}>
      <section className="fresh-hero">
        <div className="fresh-hero-copy">
          <p className="fresh-eyebrow">{t.badge}</p>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroBody}</p>
          <div className="fresh-actions">
            {downloadHref ? (
              <Link href={downloadHref} className="fresh-button fresh-button-primary">
                <ArrowDownToLine className="h-4 w-4" />
                {t.download}
              </Link>
            ) : (
              <span className="fresh-button">{t.releasePending}</span>
            )}
            <Link href={`/${locale}/activate`} className="fresh-button">
              {isAr ? "التفعيل" : "Activate"}
            </Link>
            <Link href={`/${locale}/support`} className="fresh-button">
              {t.support}
            </Link>
          </div>
        </div>
        <div className="fresh-product-visual">
          <Image src="/images/moplayer-hero-3d-final.png" alt="MoPlayer" fill sizes="(max-width: 1024px) 92vw, 520px" className="fresh-image" priority />
        </div>
      </section>

      <section className="fresh-stats">
        {[
          { label: isAr ? "أحدث إصدار" : "Latest release", value: latest?.version_name ? `v${latest.version_name}` : "2.x" },
          { label: isAr ? "آخر تحديث" : "Updated", value: releaseDate ?? (isAr ? "حديثا" : "Recently") },
          { label: isAr ? "المحرك" : "Playback", value: "VLC / libVLC" },
          { label: isAr ? "التلفزيون" : "TV", value: ecosystem.product.android_tv_ready ? "Ready" : "Android" },
        ].map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <section className="fresh-section">
        <div className="fresh-grid fresh-grid-4">
          {specs.map((item) => (
            <article key={item.label} className="fresh-card">
              <p className="fresh-eyebrow">{item.label}</p>
              <h3>{item.value}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-section-head">
          <p className="fresh-eyebrow">{t.featuresEyebrow}</p>
          <h1>{t.featuresTitle}</h1>
        </div>
        <div className="fresh-feature">
          <div className="fresh-grid">
            {t.features.map((feature, index) => {
              const icons = [Tv2, MonitorPlay, ShieldCheck, CheckCircle2];
              const Icon = icons[index] ?? CheckCircle2;
              return (
                <article key={feature.title} className="fresh-card fresh-card-quiet">
                  <Icon className="fresh-card-icon" />
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              );
            })}
          </div>
          <div className="fresh-grid">
            {screenshots.map((src) => (
              <div key={src} className="fresh-project-media fresh-gallery-tile">
                <Image src={src} alt="MoPlayer preview" fill sizes="(max-width: 1024px) 92vw, 420px" className="fresh-image" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-grid fresh-grid-2">
          <article className="fresh-card">
            <Workflow className="fresh-card-icon" />
            <h3>{t.philosophyTitle}</h3>
            <p>{t.philosophy}</p>
          </article>
          <article className="fresh-card">
            <ShieldCheck className="fresh-card-icon" />
            <h3>{t.privacyTitle}</h3>
            <div className="fresh-list fresh-list-compact">
              {t.privacyBullets.map((item) => (
                <article key={item}>
                  <span>{item}</span>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-feature">
          <div>
            <p className="fresh-eyebrow">{isAr ? "خطوات التثبيت" : "Install steps"}</p>
            <h2>{t.installTitle}</h2>
            <div className="fresh-list">
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
            <p className="fresh-eyebrow">{t.faqTitle}</p>
            <div className="fresh-list">
              {t.faqs.map((faq) => (
                <details key={faq.question} className="fresh-disclosure">
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-card fresh-final">
          <p className="fresh-eyebrow">{t.disclaimerTitle}</p>
          <h3>{t.finalTitle}</h3>
          <p>{t.finalBody}</p>
          <div className="fresh-actions">
            {downloadHref ? (
              <Link href={downloadHref} className="fresh-button fresh-button-primary">
                <ArrowDownToLine className="h-4 w-4" />
                {t.download}
              </Link>
            ) : null}
            <Link href={`/${locale}/support`} className="fresh-button">
              {t.support}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
