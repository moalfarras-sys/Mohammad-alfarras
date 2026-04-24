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
    <div dir={isAr ? "rtl" : "ltr"} className="bg-[#050607] text-white">
      <section className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#77d0db]">{t.badge}</p>
            <h1 className="mt-4 text-[clamp(2.4rem,7vw,5.8rem)] font-black leading-[1.02] tracking-normal">
              {t.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68 md:text-lg">{t.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {downloadHref ? (
                <Link href={downloadHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/88">
                  <ArrowDownToLine className="h-4 w-4" />
                  {t.download}
                </Link>
              ) : (
                <span className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] border border-white/10 px-5 py-3 text-sm font-semibold text-white/62">
                  {t.releasePending}
                </span>
              )}
              <Link href={supportHref} className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">
                {t.support}
              </Link>
              <Link href={`/${locale}/work/moplayer`} className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">
                {t.caseStudy}
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {releaseDate ? <Chip>{releaseDate}</Chip> : null}
              <Chip>Android</Chip>
              <Chip>Android TV</Chip>
              <Chip>API {product.android_min_sdk}+</Chip>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04]">
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
      </section>

      <section className="px-4 py-12 md:px-6 md:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">{spec.label}</p>
                <p className="mt-2 text-lg font-bold text-white">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-18">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#77d0db]">{t.featuresEyebrow}</p>
          <h2 className="mt-3 max-w-3xl text-[clamp(1.9rem,4vw,3.4rem)] font-black leading-tight tracking-normal">
            {t.featuresTitle}
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {t.features.map((feature) => (
              <article key={feature.title} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6">
                <MonitorSmartphone className="h-5 w-5 text-[#77d0db]" />
                <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/62">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-18">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#77d0db]">{t.philosophyTitle}</p>
            <p className="mt-4 text-base leading-8 text-white/68">{t.philosophy}</p>
          </article>
          <article className="rounded-[var(--radius-lg)] border border-[#77d0db]/28 bg-[#77d0db]/[0.06] p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#77d0db]">{t.disclaimerTitle}</p>
            <h2 className="mt-3 text-2xl font-black">{t.privacyTitle}</h2>
            <ul className="mt-5 grid gap-3">
              {t.privacyBullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm leading-7 text-white/72">
                  <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#77d0db]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {(screenshots.length ? screenshots : [
              { id: "now", title: "Now playing", image_path: "/images/moplayer_ui_now_playing-final.png", alt_text: "MoPlayer now playing" },
              { id: "playlist", title: "Playlist", image_path: "/images/moplayer_ui_playlist-final.png", alt_text: "MoPlayer playlist" },
              { id: "tv", title: "Android TV", image_path: "/images/moplayer-tv-banner-final.png", alt_text: "MoPlayer Android TV" },
            ]).slice(0, 3).map((screenshot) => (
              <figure key={screenshot.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04]">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={screenshot.image_path}
                    alt={screenshot.alt_text || screenshot.title}
                    fill
                    className="object-contain p-5"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <figcaption className="px-4 py-3 text-sm font-medium text-white/68">{screenshot.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-18">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#77d0db]">{t.installTitle}</p>
            <div className="mt-6 grid gap-4">
              {t.installSteps.map((step, index) => (
                <div key={step.title} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-black">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-white/62">{step.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#77d0db]">{t.faqTitle}</p>
            <div className="mt-6 grid gap-4">
              {t.faqs.map((faq) => (
                <article key={faq.question} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-5">
                  <HelpCircle className="h-5 w-5 text-[#77d0db]" />
                  <h3 className="mt-3 font-bold">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/62">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-black leading-tight tracking-normal">{t.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/65">{t.finalBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {downloadHref ? (
              <Link href={downloadHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/88">
                <ArrowDownToLine className="h-4 w-4" />
                {t.download}
              </Link>
            ) : null}
            <Link href={supportHref} className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">
              {t.support}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
