import Image from "next/image";
import Link from "next/link";

import type { CmsSnapshot, Locale, PageView } from "@/types/cms";

import { findBlock, getGallery, getProjects, getServices } from "./cms-views";

export function BlogPage({ locale, page, snapshot }: { locale: Locale; page: PageView; snapshot: CmsSnapshot }) {
  const projects = getProjects(snapshot, locale);
  const services = getServices(snapshot, locale);
  const gallery = getGallery(snapshot, findBlock(page, "media-gallery")).slice(0, 6);

  const lead =
    locale === "ar"
      ? "هذه الصفحة تشرح ما أعمل عليه فعلياً: مواقع، خبرة تشغيل، محتوى تقني، وتعاونات مع منتجات وخدمات."
      : "This page explains what I actually work on: websites, operations experience, tech content, and collaborations with products and services.";

  const sectors =
    locale === "ar"
      ? [
          {
            title: "مواقع وصفحات هبوط",
            body: "تصميم صفحات تعريفية وتجارية سريعة وواضحة، مع تركيز على الرسالة والتحويل وسهولة الوصول.",
          },
          {
            title: "لوجستيات وتنظيم",
            body: "فهم حقيقي لمسارات العمل اليومي، توزيع المهام، والتواصل العملي مع الفرق والعملاء.",
          },
          {
            title: "محتوى وتقنية",
            body: "مراجعات وتجارب وشروحات تبدأ من الاستخدام الفعلي لا من الكلام التسويقي الجاهز.",
          },
        ]
      : [
          {
            title: "Websites and landing pages",
            body: "Fast and clear business pages focused on message, conversion, and usability.",
          },
          {
            title: "Logistics and organization",
            body: "A real understanding of day-to-day operations, task distribution, and practical communication.",
          },
          {
            title: "Content and tech",
            body: "Reviews, tutorials, and product stories that start from real use instead of marketing noise.",
          },
        ];

  const process =
    locale === "ar"
      ? [
          "أفهم الهدف أولاً: ما الذي تريد أن تشرحه أو تبيعه أو تنظمه؟",
          "أرتب الرسالة والبنية حتى تصبح واضحة بصرياً وعملياً.",
          "أنفذ النتيجة بشكل نظيف ثم أراجعها على الموبايل والديسكتوب.",
        ]
      : [
          "First I understand the goal: what exactly should be explained, sold, or organized?",
          "Then I shape the structure and message so they become clear visually and practically.",
          "Finally I deliver a clean result and review it across desktop and mobile.",
        ];

  return (
    <div className="premium-page">
      <section className="hero-stage">
        <div className="container hero-stage-grid">
          <div className="hero-stage-copy glass-card">
            <span className="section-kicker">{locale === "ar" ? "الأعمال والمشاريع" : "Work and projects"}</span>
            <h1 className="display-title">{page.title}</h1>
            <p className="hero-lead">{lead}</p>
            <p>
              {locale === "ar"
                ? "المهم عندي ليس أن يبدو المشروع جيداً فقط، بل أن يكون مفهوماً، سريعاً، وقريباً من الشخص أو الشركة التي يمثّلها."
                : "What matters is not only that a project looks good, but that it feels clear, fast, and close to the person or business it represents."}
            </p>
            <div className="hero-action-row">
              <Link href={`/${locale}/contact`} className="btn primary">
                {locale === "ar" ? "تعاون معي" : "Work with me"}
              </Link>
              <Link href={`/${locale}/cv`} className="btn secondary">
                {locale === "ar" ? "السيرة الذاتية" : "Resume"}
              </Link>
            </div>
          </div>

          {gallery[0] ? (
            <aside className="hero-stage-visual glass-card">
              <div className="portrait-shell">
                <div className="portrait-frame">
                  <Image
                    src={gallery[0].path}
                    alt={locale === "ar" ? gallery[0].alt_ar : gallery[0].alt_en}
                    width={gallery[0].width}
                    height={gallery[0].height}
                    priority
                    sizes="(max-width: 768px) 70vw, 28rem"
                    className="portrait-image"
                  />
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "مجالات التركيز" : "Focus areas"}</span>
            <h2>{locale === "ar" ? "ما الذي أعمل عليه فعلياً؟" : "What do I actually work on?"}</h2>
          </div>
          <div className="feature-card-grid">
            {sectors.map((sector) => (
              <article key={sector.title} className="glass-card service-rich-card">
                <h3>{sector.title}</h3>
                <p>{sector.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "المشاريع" : "Projects"}</span>
            <h2>{locale === "ar" ? "نماذج منشورة وقابلة للزيارة" : "Published work you can visit"}</h2>
          </div>
          <div className="feature-card-grid">
            {projects.map((project) => (
              <article key={project.id} className="glass-card project-spotlight-card">
                {project.cover ? (
                  <div className="card-media-shell">
                    <Image
                      src={project.cover.path}
                      alt={locale === "ar" ? project.cover.alt_ar : project.cover.alt_en}
                      width={project.cover.width}
                      height={project.cover.height}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="card-media"
                    />
                  </div>
                ) : null}
                <div className="project-spotlight-body">
                  <h3>{project.title}</h3>
                  <p className="muted">{project.summary}</p>
                  <p>{project.description}</p>
                  <div className="actions-row">
                    {project.projectUrl ? (
                      <a href={project.projectUrl} className="btn secondary" target="_blank" rel="noreferrer noopener">
                        {project.ctaLabel}
                      </a>
                    ) : null}
                    {project.repoUrl ? (
                      <a href={project.repoUrl} className="btn ghost" target="_blank" rel="noreferrer noopener">
                        GitHub
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "الخدمات" : "Services"}</span>
            <h2>{locale === "ar" ? "مزيج بين التشغيل والمحتوى والتنفيذ الرقمي" : "A mix of operations, content, and digital execution"}</h2>
          </div>
          <div className="feature-card-grid">
            {services.map((service) => (
              <article key={service.id} className="glass-card service-rich-card">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                {service.bullets.length ? (
                  <ul className="bullet-list">
                    {service.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "طريقة العمل" : "Workflow"}</span>
            <h2>{locale === "ar" ? "كيف أرتب المشروع من الفكرة إلى النتيجة" : "How I move a project from idea to result"}</h2>
          </div>
          <div className="feature-card-grid">
            {process.map((item) => (
              <article key={item} className="glass-card service-rich-card">
                <h3>{locale === "ar" ? "خطوة واضحة" : "Clear step"}</h3>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {gallery.length > 1 ? (
        <section className="page-section">
          <div className="container section-stack">
            <div className="section-heading">
              <span className="section-kicker">{locale === "ar" ? "أجواء العمل والمحتوى" : "Work and content atmosphere"}</span>
              <h2>{locale === "ar" ? "صور من الهوية والمحتوى" : "Visual moments from the brand and the content"}</h2>
            </div>
            <div className="visual-gallery-grid">
              {gallery.slice(1).map((item) => (
                <article key={item.id} className="visual-gallery-card">
                  <Image
                    src={item.path}
                    alt={locale === "ar" ? item.alt_ar : item.alt_en}
                    width={item.width}
                    height={item.height}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="visual-gallery-image"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
