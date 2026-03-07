import Link from "next/link";
import Image from "next/image";

import type { Locale, WorkProjectView } from "@/types/cms";

function copy(locale: Locale) {
  if (locale === "ar") {
    return {
      title: "أعمالي الرقمية",
      body: "مشاريع حقيقية من التنفيذ إلى الإطلاق، مع تركيز على الجودة والنتيجة.",
      cta: "تواصل معي لتنفيذ مشروعك",
      ctaHref: "/ar/contact",
      projectLabel: "زيارة المشروع",
      noProjects: "لا توجد مشاريع مفعلة حاليًا.",
      liveSite: "مشروع حي على الإنترنت",
      repoLabel: "مستودع المشروع",
    };
  }

  return {
    title: "Featured Work",
    body: "Real production projects from concept to launch, optimized for quality and conversions.",
    cta: "Need a website or app like this? Contact me",
    ctaHref: "/en/contact",
    projectLabel: "Open project",
    noProjects: "No active projects yet.",
    liveSite: "Live production project",
    repoLabel: "Source repository",
  };
}

export function WorkShowcase({ locale, projects, title, body }: { locale: Locale; projects: WorkProjectView[]; title?: string; body?: string }) {
  const t = copy(locale);

  return (
    <section className="page-section">
      <div className="container section-stack">
        <div className="section-heading">
          <h2>{title || t.title}</h2>
          <p>{body || t.body}</p>
        </div>

        {projects.length ? (
          <div className="work-grid">
            {projects.map((project, index) => (
              <article className="card work-card glass-card" key={project.id} style={{ animationDelay: `${Math.min(index, 8) * 80}ms` }}>
                {project.cover ? (
                  <div className="work-media-wrap">
                    <Image
                      src={project.cover.path}
                      alt={locale === "ar" ? project.cover.alt_ar : project.cover.alt_en}
                      width={project.cover.width || 960}
                      height={project.cover.height || 960}
                    />
                  </div>
                ) : null}

                <div className="work-body">
                  <h3>{project.title}</h3>
                  <p className="work-summary">{project.summary || t.liveSite}</p>
                  <p className="muted">{project.description}</p>
                </div>

                <div className="actions-row">
                  {project.projectUrl ? (
                    <a href={project.projectUrl} target="_blank" rel="noreferrer noopener" className="btn secondary">
                      {project.ctaLabel || t.projectLabel}
                    </a>
                  ) : null}
                  {project.repoUrl ? (
                    <a href={project.repoUrl} target="_blank" rel="noreferrer noopener" className="btn ghost">
                      {t.repoLabel}
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card">{t.noProjects}</div>
        )}

        <Link href={t.ctaHref} className="btn primary work-cta">
          {t.cta}
        </Link>
      </div>
    </section>
  );
}
