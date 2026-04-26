import { ArrowDownToLine, HelpCircle, MonitorSmartphone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { moPlayerCopy } from "@/content/apps";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(locale: Locale, value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/78">
      {children}
    </span>
  );
}

export function MoPlayerLanding({ ecosystem, locale = "en" }: { ecosystem: AppEcosystemData; locale?: Locale }) {
  const { product, screenshots, releases } = ecosystem;
  const t = moPlayerCopy[locale];
  const latestRelease = releases[0] ?? null;
  const primaryAsset = latestRelease?.assets.find((asset) => asset.is_primary) ?? latestRelease?.assets[0] ?? null;
  const releaseDate = formatDate(locale, latestRelease?.published_at ?? product.last_updated_at);
  const fileSize = formatBytes(primaryAsset?.file_size_bytes);
  const downloadHref = latestRelease ? `/api/app/releases/${latestRelease.slug}/download` : null;
  const supportHref = `/${locale}/support`;
  const isAr = locale === "ar";

  const specs = [
    { label: t.specsLabels.version, value: latestRelease?.version_name ? `v${latestRelease.version_name}` : "—" },
    { label: t.specsLabels.size, value: fileSize ?? "—" },
    { label: t.specsLabels.minSdk, value: `API ${product.android_min_sdk}` },
    { label: t.specsLabels.targetSdk, value: `API ${product.android_target_sdk}` },
    { label: t.specsLabels.abi, value: primaryAsset?.abi ?? "—" },
    { label: t.specsLabels.tv, value: product.android_tv_ready ? "Ready" : "—" },
  ];

  return (
    <div dir={isAr ? "rtl" : "ltr"} data-testid="moplayer-landing">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 10%, rgba(0,200,212,0.08) 0%, transparent 60%)" }} />
        
        <div className="section-frame relative z-10">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.badge}</p>
              <h1 className="mt-4 overflow-visible pb-2 font-black leading-[1.1] text-[var(--text-1)]" style={{ fontSize: "clamp(2rem,4.5vw,3.8rem)" }}>
                {t.heroTitle}
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-2)] md:text-lg">{t.heroBody}</p>
              
              <div className="mt-8 flex flex-wrap gap-4">
                {downloadHref ? (
                  <Link href={downloadHref} className="button-liquid-primary inline-flex items-center gap-2">
                    <ArrowDownToLine className="h-4 w-4" />
                    {t.download}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-12 items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-6 py-3 text-sm font-semibold" style={{ color: "var(--text-3)" }}>
                    {t.releasePending}
                  </span>
                )}
                <Link href={supportHref} className="button-liquid-secondary inline-flex items-center gap-2">
                  {t.support}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {releaseDate ? <Chip>{releaseDate}</Chip> : null}
                <Chip>Android</Chip>
                <Chip>Android TV</Chip>
                <Chip>API {product.android_min_sdk}+</Chip>
              </div>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] glass" style={{ boxShadow: "var(--shadow-hero)" }}>
              <Image
                src={product.hero_image_path || "/images/moplayer-hero-3d-final.png"}
                alt="MoPlayer interface preview"
                fill
                priority
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 620px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECS ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="glass rounded-[var(--radius-md)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>{spec.label}</p>
                <p className="mt-2 text-lg font-bold" style={{ color: "var(--text-1)" }}>{spec.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.featuresEyebrow}</p>
          <h2 className="mt-3 overflow-visible pb-1 font-black leading-[1.2] text-[var(--text-1)] max-w-3xl" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)" }}>
            {t.featuresTitle}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {t.features.map((feature) => (
              <article key={feature.title} className="glass rounded-[var(--radius-lg)] p-8 transition-transform hover:-translate-y-1" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                  <MonitorSmartphone className="h-6 w-6" style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="mt-6 text-xl font-bold" style={{ color: "var(--text-1)" }}>{feature.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY & PRIVACY ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="glass rounded-[var(--radius-lg)] p-8 md:p-10" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.philosophyTitle}</p>
            <p className="mt-5 text-[15px] leading-relaxed" style={{ color: "var(--text-2)" }}>{t.philosophy}</p>
          </article>
          
          <article className="glass rounded-[var(--radius-lg)] p-8 md:p-10 border border-[var(--accent)]" style={{ background: "rgba(0, 200, 212, 0.03)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.disclaimerTitle}</p>
            <h2 className="mt-4 text-2xl font-black" style={{ color: "var(--text-1)" }}>{t.privacyTitle}</h2>
            <ul className="mt-6 grid gap-4">
              {t.privacyBullets.map((bullet) => (
                <li key={bullet} className="flex gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                  </div>
                  <span className="text-[14px] leading-relaxed pt-0.5" style={{ color: "var(--text-2)" }}>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <div className="grid gap-6 md:grid-cols-3">
            {(screenshots.length ? screenshots : [
              { id: "now", title: "Now playing", image_path: "/images/moplayer_ui_now_playing-final.png", alt_text: "MoPlayer now playing" },
              { id: "playlist", title: "Playlist", image_path: "/images/moplayer_ui_playlist-final.png", alt_text: "MoPlayer playlist" },
              { id: "tv", title: "Android TV", image_path: "/images/moplayer-tv-banner-final.png", alt_text: "MoPlayer Android TV" },
            ]).slice(0, 3).map((screenshot) => (
              <figure key={screenshot.id} className="glass overflow-hidden rounded-[var(--radius-lg)]" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="relative aspect-[4/5] bg-[var(--bg-elevated)]">
                  <Image
                    src={screenshot.image_path}
                    alt={screenshot.alt_text || screenshot.title}
                    fill
                    className="object-contain p-5"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <figcaption className="px-5 py-4 text-sm font-bold" style={{ color: "var(--text-1)" }}>{screenshot.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTALL & FAQ ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame grid gap-12 lg:grid-cols-2">
          
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.installTitle}</p>
            <div className="mt-8 grid gap-6">
              {t.installSteps.map((step, index) => (
                <div key={step.title} className="glass rounded-[var(--radius-lg)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] text-sm font-black" style={{ color: "var(--accent)" }}>
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold pt-2" style={{ color: "var(--text-1)" }}>{step.title}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{step.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.faqTitle}</p>
            <div className="mt-8 grid gap-6">
              {t.faqs.map((faq) => (
                <article key={faq.question} className="glass rounded-[var(--radius-lg)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-start gap-4">
                    <HelpCircle className="h-6 w-6 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                    <div>
                      <h3 className="font-bold" style={{ color: "var(--text-1)" }}>{faq.question}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{faq.answer}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="py-16 md:py-24 border-t border-[var(--glass-border)]">
        <div className="section-frame text-center max-w-4xl mx-auto">
          <h2 className="overflow-visible pb-1 text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight text-[var(--text-1)]">
            {t.finalTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--text-2)] md:text-lg">
            {t.finalBody}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {downloadHref ? (
              <Link href={downloadHref} className="button-liquid-primary inline-flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                {t.download}
              </Link>
            ) : null}
            <Link href={supportHref} className="button-liquid-secondary inline-flex items-center gap-2">
              {t.support}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
