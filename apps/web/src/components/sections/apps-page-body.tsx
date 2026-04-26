import { ArrowUpRight, Download, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { appsPageCopy, moPlayerCopy } from "@/content/apps";

function sortedProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => a.featuredRank - b.featuredRank);
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-2)]">
      {children}
    </span>
  );
}

export function AppsPageBody({ model }: { model: SiteViewModel }) {
  const t = appsPageCopy[model.locale];
  const product = moPlayerCopy[model.locale];
  const projects = sortedProjects(model);
  const moPlayer = projects.find((p) => p.slug === "moplayer");
  const isAr = model.locale === "ar";

  return (
    <div data-testid="apps-page">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 10%, rgba(99,102,241,0.08) 0%, transparent 60%)" }} />
        
        <div className="section-frame relative z-10">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.eyebrow}</p>
              <h1 className="mt-4 overflow-visible pb-2 font-black leading-[1.1] text-[var(--text-1)]" style={{ fontSize: "clamp(2rem,4.5vw,3.8rem)" }}>
                {t.title}
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-2)] md:text-lg">{t.body}</p>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-primary inline-flex items-center gap-2">
                  {t.openProduct}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                {moPlayer ? (
                  <Link href={`/${model.locale}/work/${moPlayer.slug}`} className="button-liquid-secondary">
                    {t.viewCase}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] glass" style={{ boxShadow: "var(--shadow-hero)" }}>
              <Image
                src="/images/moplayer-hero-3d-final.png"
                alt="MoPlayer"
                fill
                priority
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 620px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FLAGSHIP ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <article className="glass overflow-hidden rounded-[var(--radius-xl)]" style={{ boxShadow: "var(--shadow-elevated)" }}>
            <div className="grid gap-0 lg:grid-cols-[0.45fr_0.55fr]">
              <div className="p-8 md:p-12">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.flagship}</p>
                <h2 className="mt-4 overflow-visible pb-1 font-black leading-[1.1] text-[var(--text-1)]" style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}>
                  MoPlayer
                </h2>
                <p className="mt-5 text-[15px] leading-relaxed" style={{ color: "var(--text-2)" }}>{product.heroBody}</p>
                
                <div className="mt-8 flex flex-wrap gap-2">
                  {["Android", "Android TV", "API 24+", "APK", "Support"].map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
                
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-primary inline-flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {t.download}
                  </Link>
                  {moPlayer ? (
                    <Link href={`/${model.locale}/work/${moPlayer.slug}`} className="button-liquid-secondary">
                      {t.viewCase}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="relative min-h-[360px] bg-[var(--bg-elevated)] border-l border-[var(--glass-border)]">
                <Image
                  src="/images/moplayer-ui-mock-final.png"
                  alt="MoPlayer interface"
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 56vw"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{product.featuresEyebrow}</p>
          <h2 className="mt-3 overflow-visible pb-1 font-black leading-[1.2] text-[var(--text-1)] max-w-3xl" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)" }}>
            {product.featuresTitle}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {product.features.map((feature) => (
              <div key={feature.title} className="glass rounded-[var(--radius-lg)] p-8 transition-transform hover:-translate-y-1" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                  <ShieldCheck className="h-5 w-5" style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="mt-6 text-xl font-bold" style={{ color: "var(--text-1)" }}>{feature.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { src: "/images/moplayer_ui_now_playing-final.png", label: isAr ? "شاشة التشغيل" : "Now playing" },
              { src: "/images/moplayer_ui_playlist-final.png", label: isAr ? "قائمة التشغيل" : "Playlist" },
              { src: "/images/moplayer-tv-banner-final.png", label: "Android TV" },
            ].map((item) => (
              <figure key={item.src} className="glass overflow-hidden rounded-[var(--radius-lg)]" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="relative aspect-[4/5] bg-[var(--bg-elevated)]">
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-contain p-5"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <figcaption className="px-5 py-4 text-sm font-bold" style={{ color: "var(--text-1)" }}>{item.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
