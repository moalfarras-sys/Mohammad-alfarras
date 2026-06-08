"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Download,
  ExternalLink,
  Mail,
} from "lucide-react";
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
              <a
                href={model.downloads.branded}
                download
                className="fresh-button fresh-button-primary"
              >
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
          <Image
            src={model.portraitImage || "/images/portrait.jpg"}
            alt={model.profile.name}
            fill
            sizes="(max-width: 1024px) 92vw, 420px"
            className="fresh-image object-top"
            priority
          />
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

export function PortfolioProjectPage({
  model,
  projectId,
}: {
  model: SiteViewModel;
  projectId: string;
}) {
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

  const projectIndex = model.projects.findIndex((item) => item.id === project.id);
  const previousProject = projectIndex > 0 ? model.projects[projectIndex - 1] : null;
  const nextProject =
    projectIndex < model.projects.length - 1 ? model.projects[projectIndex + 1] : null;
  const projectHrefIsExternal = project.href?.startsWith("http") ?? false;
  const projectTitle = project.title;
  const narrative = [
    { number: "01", label: t.challenge, body: project.challenge },
    { number: "02", label: t.solution, body: project.solution },
    { number: "03", label: t.result, body: project.result },
  ];

  function openProjectAssistant() {
    const prompt = ar
      ? `اشرح لي دراسة حالة ${projectTitle} وساعدني أفهم المشكلة والقرار والنتيجة.`
      : `Walk me through the ${projectTitle} case study and explain the problem, decision, and outcome.`;
    window.dispatchEvent(new CustomEvent("mo-ai:open", { detail: { prompt } }));
  }

  return (
    <PageShell locale={model.locale}>
      <section className="fresh-hero case-study-hero">
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
              <a
                href={project.href}
                target={projectHrefIsExternal ? "_blank" : undefined}
                rel={projectHrefIsExternal ? "noreferrer" : undefined}
                className="fresh-button fresh-button-primary"
              >
                {projectHrefIsExternal ? (
                  <ExternalLink className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
                {project.ctaLabel}
              </a>
            ) : null}
            <Link href={`/${model.locale}/contact`} className="fresh-button">
              <Mail className="h-4 w-4" />
              {ar ? "ابدأ مشروعا مشابها" : "Start a similar project"}
            </Link>
            <button type="button" className="fresh-button" onClick={openProjectAssistant}>
              <Bot className="h-4 w-4" />
              {ar ? "اسأل Mo Ai" : "Ask Mo Ai"}
            </button>
          </div>
        </div>
        <div className="fresh-project-hero-media">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 1024px) 92vw, 520px"
            className="fresh-image"
            priority
          />
        </div>
      </section>

      {project.metrics.length > 0 ? (
        <section
          className="case-study-proof-strip"
          aria-label={ar ? "مؤشرات المشروع" : "Project signals"}
        >
          {project.metrics.slice(0, 4).map((metric) => (
            <div key={`${metric.label}-${metric.value}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="fresh-section case-study-story">
        <div className="fresh-section-head">
          <p className="fresh-eyebrow">{ar ? "من الفكرة إلى النتيجة" : "From brief to outcome"}</p>
          <h2>{ar ? "ما الذي تغيّر فعلياً؟" : "What actually changed?"}</h2>
          <p>
            {ar
              ? "دراسة الحالة هنا تشرح التفكير والتنفيذ، لا تكتفي بعرض لقطة جميلة."
              : "This case study explains the thinking and execution, not only the final screens."}
          </p>
        </div>
        <div className="case-study-story-list">
          {narrative.map((item) => (
            <article key={item.number}>
              <span className="case-study-story-number">{item.number}</span>
              <div>
                <p className="fresh-eyebrow">{item.label}</p>
                <h3>{item.body}</h3>
              </div>
              <CheckCircle2 aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-project-detail-grid">
          <aside className="fresh-card">
            <p className="fresh-eyebrow">{ar ? "ملخص التنفيذ" : "Delivery summary"}</p>
            <h3>{project.summary}</h3>
            <p>{project.description}</p>
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
                <Image
                  src={image}
                  alt={`${project.title} ${index + 1}`}
                  fill
                  sizes="(max-width: 1024px) 92vw, 520px"
                  className="fresh-image"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <nav
        className="case-study-navigator"
        aria-label={ar ? "التنقل بين المشاريع" : "Project navigation"}
      >
        {previousProject ? (
          <Link href={`/${model.locale}/work/${previousProject.slug}`}>
            <ArrowLeft size={18} />
            <span>
              <small>{ar ? "المشروع السابق" : "Previous project"}</small>
              <strong>{previousProject.title}</strong>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nextProject ? (
          <Link href={`/${model.locale}/work/${nextProject.slug}`}>
            <span>
              <small>{ar ? "المشروع التالي" : "Next project"}</small>
              <strong>{nextProject.title}</strong>
            </span>
            <ArrowRight size={18} />
          </Link>
        ) : (
          <Link href={`/${model.locale}/work`}>
            <span>
              <small>{ar ? "اكتشف المزيد" : "Explore more"}</small>
              <strong>{ar ? "كل الأعمال" : "All work"}</strong>
            </span>
            <ArrowRight size={18} />
          </Link>
        )}
      </nav>
    </PageShell>
  );
}
