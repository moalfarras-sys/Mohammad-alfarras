import Link from "next/link";

import type { Locale, WorkProjectView } from "@/types/cms";

function copy(locale: Locale) {
  if (locale === "ar") {
    return {
      title: "أعمالي الرقمية",
      body: "نماذج لمشاريع حقيقية نفذتها من الفكرة إلى الإطلاق.",
      cta: "تواصل معي لتنفيذ مشروعك",
      ctaHref: "/ar/contact",
      projectLabel: "زيارة المشروع",
      noProjects: "لا توجد مشاريع مفعلة حاليًا.",
      liveSite: "موقع حي على الإنترنت",
    };
  }

  return {
    title: "Featured Work",
    body: "Selected production projects built and polished end-to-end.",
    cta: "Need a website or app like this? Contact me.",
    ctaHref: "/en/contact",
    projectLabel: "Open project",
    noProjects: "No active projects yet.",
    liveSite: "Live production project",
  };
}

export function WorkShowcase({ locale, projects, title, body }: { locale: Locale; projects: WorkProjectView[]; title?: string; body?: string }) {
  const t = copy(locale);

  return (
    <section className="page-section">
      <div className="container section-stack">
        <h2>{title || t.title}</h2>
        <p>{body || t.body}</p>

        {projects.length ? (
          <div className="work-grid">
            {projects.map((project) => (
              <article className="card work-card" key={project.id}>
                {project.cover ? (
                  <div className="moplayer-logo-wrap">
                    <img src={project.cover.path} alt={locale === "ar" ? project.cover.alt_ar : project.cover.alt_en} width={project.cover.width || 900} height={project.cover.height || 900} />
                  </div>
                ) : null}
                <h3>{project.title}</h3>
                <p>{project.summary || t.liveSite}</p>
                <p className="muted">{project.description}</p>
                <div className="actions-row">
                  {project.projectUrl ? (
                    <a href={project.projectUrl} target="_blank" rel="noreferrer noopener" className="btn secondary">
                      {project.ctaLabel || t.projectLabel}
                    </a>
                  ) : null}
                  {project.repoUrl ? (
                    <a href={project.repoUrl} target="_blank" rel="noreferrer noopener" className="btn secondary">
                      GitHub
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
