"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download, Mail } from "lucide-react";
import type { ReactNode } from "react";

import { cvPageCopy } from "@/content/cv";
import { privacyCopy } from "@/content/legal";
import { caseStudyCopy } from "@/content/work";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

import type { SiteViewModel } from "./site-view-model";

function isArabic(locale: string) {
  return locale === "ar";
}

function PageShell({ locale, children }: { locale: string; children: ReactNode }) {
  return (
    <main className="fresh-page" dir={isArabic(locale) ? "rtl" : "ltr"}>
      {children}
    </main>
  );
}

export function PortfolioCvPage({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(cvPageCopy[model.locale]);
  const ar = isArabic(model.locale);

  return (
    <PageShell locale={model.locale}>
      <section className="fresh-hero">
        <div className="fresh-hero-copy">
          <p className="fresh-eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.body}</p>
          <div className="fresh-actions">
            {model.downloads.branded ? (
              <a href={model.downloads.branded} download className="fresh-button fresh-button-primary">
                <Download className="h-4 w-4" />
                {t.downloadDesigned}
              </a>
            ) : null}
            {model.downloads.ats ? (
              <a href={model.downloads.ats} download className="fresh-button">
                <Download className="h-4 w-4" />
                {t.downloadAts}
              </a>
            ) : null}
            {model.downloads.docx ? (
              <a href={model.downloads.docx} download className="fresh-button">
                {ar ? "تنزيل DOCX" : "Download DOCX"}
              </a>
            ) : null}
          </div>
        </div>
        <div className="fresh-portrait">
          <Image src={model.portraitImage || "/images/portrait.jpg"} alt={model.profile.name} fill sizes="(max-width: 1024px) 92vw, 420px" className="fresh-image object-top" priority />
          <div>
            <strong>{model.profile.name}</strong>
            <span>{model.profile.subtitle}</span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function PortfolioPrivacyPage({ locale }: { locale: string }) {
  const t = repairMojibakeDeep(privacyCopy[locale as "en" | "ar"] ?? privacyCopy.en);
  const ar = isArabic(locale);

  return (
    <PageShell locale={locale}>
      <section className="fresh-section fresh-first">
        <div className="fresh-section-head">
          <p className="fresh-eyebrow">{ar ? "الخصوصية" : "Privacy"}</p>
          <h1>{t.title}</h1>
          <p>{t.updated}</p>
        </div>
        <div className="fresh-list">
          {t.sections.map((section) => (
            <article key={section.title}>
              <span>{section.title}</span>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export function PortfolioProjectPage({ model, projectId }: { model: SiteViewModel; projectId: string }) {
  const t = repairMojibakeDeep(caseStudyCopy[model.locale]);
  const ar = isArabic(model.locale);
  const project = model.projects.find((item) => item.id === projectId || item.slug === projectId);

  if (!project) {
    return (
      <PageShell locale={model.locale}>
        <section className="fresh-section fresh-first">
          <div className="fresh-card">
            <p className="fresh-eyebrow">{ar ? "غير موجود" : "Not found"}</p>
            <h3>{ar ? "المشروع غير موجود" : "Project not found"}</h3>
            <Link href={`/${model.locale}/work`} className="fresh-link">
              <ArrowLeft className="h-4 w-4" />
              {ar ? "العودة إلى الأعمال" : "Back to work"}
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell locale={model.locale}>
      <section className="fresh-hero">
        <div className="fresh-hero-copy">
          <Link href={`/${model.locale}/work`} className="fresh-link fresh-link-top">
            <ArrowLeft className="h-4 w-4" />
            {ar ? "العودة إلى الأعمال" : "Back to work"}
          </Link>
          <p className="fresh-eyebrow">{project.eyebrow}</p>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
          <div className="fresh-actions">
            {project.href ? (
              <a href={project.href} target="_blank" rel="noreferrer" className="fresh-button fresh-button-primary">
                <ArrowUpRight className="h-4 w-4" />
                {project.ctaLabel}
              </a>
            ) : null}
            <Link href={`/${model.locale}/contact`} className="fresh-button">
              <Mail className="h-4 w-4" />
              {ar ? "ابدأ مشروعا مشابها" : "Start a similar project"}
            </Link>
          </div>
        </div>
        <div className="fresh-project-hero-media">
          <Image src={project.image} alt={project.title} fill sizes="(max-width: 1024px) 92vw, 520px" className="fresh-image" priority />
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-grid fresh-grid-3">
          {[
            [t.challenge, project.challenge],
            [t.solution, project.solution],
            [t.result, project.result],
          ].map(([label, body]) => (
            <article key={label} className="fresh-card fresh-card-quiet">
              <p className="fresh-eyebrow">{label}</p>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-project-detail-grid">
          <aside className="fresh-card">
            <p className="fresh-eyebrow">{ar ? "الإشارات" : "Signals"}</p>
            <div className="fresh-list fresh-list-compact">
              {project.metrics.map((metric) => (
                <article key={`${metric.label}-${metric.value}`}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </article>
              ))}
            </div>
          </aside>
          <aside className="fresh-card">
            <p className="fresh-eyebrow">{ar ? "التركيز" : "Focus"}</p>
            <div className="fresh-tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {project.gallery.length > 0 ? (
        <section className="fresh-section">
          <div className="fresh-project-grid">
            {project.gallery.map((image, index) => (
              <div key={`${image}-${index}`} className="fresh-project-media fresh-gallery-tile">
                <Image src={image} alt={`${project.title} ${index + 1}`} fill sizes="(max-width: 1024px) 92vw, 520px" className="fresh-image" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
