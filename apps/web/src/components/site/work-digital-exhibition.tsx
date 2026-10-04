"use client";

import { ArrowUpRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrowserFrame, PageHero, StudioCta } from "@/components/studio/primitives";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import type { SiteProject } from "./site-view-model";

type ProjectCategory = "all" | "web" | "apps" | "services";

const categoryLabels: Record<Locale, Record<ProjectCategory, string>> = {
  en: { all: "All work", web: "Websites & platforms", apps: "Apps & products", services: "Service businesses" },
  ar: { all: "كل الأعمال", web: "مواقع ومنصّات", apps: "تطبيقات ومنتجات", services: "شركات خدمات" },
};

function categoriesOf(project: SiteProject): ProjectCategory[] {
  if (project.slug.includes("moplayer") || project.highlightStyle === "app") return ["all", "apps"];
  if (project.highlightStyle === "operations") return ["all", "web", "services"];
  return ["all", "web"];
}

function hostOf(href?: string) {
  if (!href || !/^https?:\/\//.test(href)) return "";
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const copy = {
  en: {
    pill: "Selected work",
    title: "Projects that are *live*, not mock-ups.",
    lead: "Client websites in Germany and Syria and my own products. Each case explains the problem, what I built and the outcome.",
    filter: "Filter projects",
    count: (n: number) => `${n} projects`,
    view: "Read the case",
    live: "Visit",
    inDev: "In development",
    ask: "Ask Mo AI about this",
    ctaLabel: "Your project next",
    ctaTitle: "Ready to build a presence that *works*?",
    ctaBody: "If your project needs a convincing website, a product page or an interface that makes the next step obvious, send the idea.",
    ctaPrimary: "Start a project",
    ctaSecondary: "Explore MoPlayer",
  },
  ar: {
    pill: "أعمال مختارة",
    title: "مشاريع *تعمل فعلاً*، لا تصاميم وهمية.",
    lead: "مواقع لعملاء في ألمانيا وسوريا ومنتجاتي الخاصة. كل دراسة حالة تشرح المشكلة، وما بنيته، والنتيجة.",
    filter: "تصفية المشاريع",
    count: (n: number) => `${n} مشروع`,
    view: "اقرأ دراسة الحالة",
    live: "زيارة",
    inDev: "قيد التطوير",
    ask: "اسأل Mo AI عن المشروع",
    ctaLabel: "مشروعك التالي",
    ctaTitle: "جاهز لبناء حضور رقمي *يعمل*؟",
    ctaBody: "إذا كان مشروعك يحتاج موقعاً مقنعاً، صفحة منتج، أو واجهة تجعل الخطوة التالية واضحة، أرسل لي الفكرة.",
    ctaPrimary: "ابدأ مشروعك",
    ctaSecondary: "استكشف MoPlayer",
  },
} as const;

export function WorkDigitalExhibition({ locale, projects }: { locale: Locale; projects: SiteProject[] }) {
  const t = copy[locale];
  const [active, setActive] = useState<ProjectCategory>("all");
  const ordered = useMemo(() => {
    // Client work first (by featured rank), then the products.
    const isApp = (p: SiteProject) => p.slug.includes("moplayer") || p.highlightStyle === "app";
    return [...projects].sort((a, b) => Number(isApp(a)) - Number(isApp(b)) || a.featuredRank - b.featuredRank);
  }, [projects]);
  const available = (Object.keys(categoryLabels[locale]) as ProjectCategory[]).filter((category) =>
    ordered.some((project) => categoriesOf(project).includes(category)),
  );
  const visible = ordered.filter((project) => categoriesOf(project).includes(active));

  function ask(project: SiteProject) {
    const prompt =
      locale === "ar"
        ? `اشرح لي مشروع ${project.title}: ما المشكلة التي حلها، وما أهم القرارات والنتيجة؟`
        : `Explain the ${project.title} project: what problem did it solve, which decisions mattered, and what was the outcome?`;
    window.dispatchEvent(new CustomEvent("mo-ai:open", { detail: { prompt } }));
  }

  return (
    <div className="st-page">
      <PageHero pill={t.pill} title={t.title} lead={t.lead} />

      <section className="st-section st-section--tight">
        <div className="st-container">
          <div className="st-filter" role="group" aria-label={t.filter}>
            {available.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={active === category}
                onClick={() => setActive(category)}
                className={active === category ? "st-filter-btn is-active" : "st-filter-btn"}
              >
                {categoryLabels[locale][category]}
              </button>
            ))}
            <span className="st-filter-count st-mono" aria-live="polite">
              {t.count(visible.length)}
            </span>
          </div>

          <div className="st-work st-work--gallery">
            {visible.map((project, index) => {
              const caseHref = withLocale(locale, `work/${project.slug}`);
              const external = /^https?:\/\//.test(project.href ?? "");
              const liveHref = project.href && project.href !== caseHref ? project.href : undefined;
              const lead = index === 0 && active === "all";
              return (
                <article className={lead ? "st-work-card st-work-card--lead" : "st-work-card"} key={project.id}>
                  <Link href={caseHref} prefetch={false} className="st-work-media" tabIndex={-1} aria-hidden="true">
                    <BrowserFrame label={hostOf(project.href) || project.title}>
                      <Image
                        src={project.image}
                        alt=""
                        fill
                        sizes={lead ? "(max-width: 900px) 92vw, 720px" : "(max-width: 900px) 92vw, 420px"}
                        quality={70}
                        className="st-cover"
                        preload={lead}
                      />
                      {project.status === "in-development" ? <span className="st-badge">{t.inDev}</span> : null}
                    </BrowserFrame>
                  </Link>
                  <div className="st-work-body">
                    <p className="st-meta">
                      <span className="st-mono">{String(index + 1).padStart(2, "0")}</span>
                      {project.eyebrow || project.tags[0]}
                    </p>
                    <h2 className="st-work-title">
                      <Link href={caseHref} prefetch={false}>
                        {project.title}
                      </Link>
                    </h2>
                    <p>{project.summary || project.description}</p>
                    {project.tags.length ? (
                      <ul className="st-tags st-work-tags">
                        {project.tags.slice(0, 4).map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="st-work-links">
                      <Link href={caseHref} prefetch={false} className="st-link">
                        {t.view}
                        <ArrowUpRight size={15} aria-hidden />
                        <span className="sr-only"> — {project.title}</span>
                      </Link>
                      {liveHref ? (
                        external ? (
                          <a href={liveHref} target="_blank" rel="noopener noreferrer" className="st-link st-link--quiet">
                            {t.live} {hostOf(liveHref)}
                          </a>
                        ) : (
                          <Link href={liveHref} prefetch={false} className="st-link st-link--quiet">
                            {t.live}
                            <span className="sr-only"> — {project.title}</span>
                          </Link>
                        )
                      ) : null}
                      {lead ? (
                        <button type="button" className="st-link st-link--quiet st-link-button" onClick={() => ask(project)}>
                          <MessageCircle size={15} aria-hidden />
                          {t.ask}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <StudioCta label={t.ctaLabel} title={t.ctaTitle} body={t.ctaBody}>
        <Link href={withLocale(locale, "contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
          {t.ctaPrimary}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        <Link href={withLocale(locale, "apps/moplayer")} prefetch={false} className="st-btn st-btn--ghost">
          {t.ctaSecondary}
        </Link>
      </StudioCta>
    </div>
  );
}
