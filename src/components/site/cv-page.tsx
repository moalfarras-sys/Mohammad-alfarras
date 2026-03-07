import Image from "next/image";
import Link from "next/link";

import type { CmsSnapshot, Locale, PageView } from "@/types/cms";

import { findBlock, getExperiences, getPortrait, getServices } from "./cms-views";

function formatDateLabel(locale: Locale, value: string | null) {
  if (!value) {
    return locale === "ar" ? "حتى الآن" : "Present";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(date);
}

export function CVPage({ locale, page, snapshot }: { locale: Locale; page: PageView; snapshot: CmsSnapshot }) {
  const portrait = getPortrait(snapshot, locale);
  const experiences = getExperiences(snapshot, locale);
  const services = getServices(snapshot, locale);
  const experienceBlock = findBlock(page, "experience-timeline");
  const certificationBlock = findBlock(page, "certifications-grid");

  const intro =
    locale === "ar"
      ? "أبني مساري بين التشغيل اللوجستي اليومي، متابعة السائقين، حل المشاكل تحت الضغط، وصناعة محتوى تقني يشرح المنتجات والخدمات بطريقة صادقة وواضحة."
      : "My path sits between daily logistics execution, driver coordination, solving problems under pressure, and creating honest tech content that explains products and services clearly.";

  const tools =
    locale === "ar"
      ? ["TMS", "Excel", "Outlook", "Notion", "YouTube Studio", "Canva", "WordPress", "Task tools"]
      : ["TMS", "Excel", "Outlook", "Notion", "YouTube Studio", "Canva", "WordPress", "Task tools"];

  const languageCards =
    locale === "ar"
      ? [
          { flag: "🇸🇾", title: "العربية", level: "اللغة الأم" },
          { flag: "🇩🇪", title: "الألمانية", level: "C1 · مستوى عمل يومي" },
          { flag: "🇬🇧", title: "الإنجليزية", level: "A2 · للتواصل والمحتوى" },
        ]
      : [
          { flag: "🇸🇾", title: "Arabic", level: "Native language" },
          { flag: "🇩🇪", title: "German", level: "C1 · Daily operational level" },
          { flag: "🇬🇧", title: "English", level: "A2 · For collaboration and content" },
        ];

  const softSkills =
    locale === "ar"
      ? [
          { title: "حل المشاكل تحت الضغط", body: "رد سريع على الأعطال والمفاجآت والمواقف التشغيلية اليومية." },
          { title: "تنظيم وتخطيط", body: "تحويل اليوم المزدحم إلى خطوات واضحة قابلة للمتابعة." },
          { title: "تواصل مباشر وواضح", body: "مع السائقين والعملاء والشركاء بدون ضبابية أو تعقيد." },
          { title: "محتوى صادق", body: "شرح وتجربة حقيقية للمنتجات بعيداً عن المبالغات التسويقية." },
        ]
      : [
          { title: "Problem solving under pressure", body: "Fast response to operational surprises and daily exceptions." },
          { title: "Structure and planning", body: "Turning a busy day into clear, trackable actions." },
          { title: "Direct communication", body: "With drivers, clients, and partners without ambiguity." },
          { title: "Honest content", body: "Real testing and clear product storytelling instead of hype." },
        ];

  return (
    <div className="premium-page">
      <section className="hero-stage">
        <div className="container hero-stage-grid">
          <div className="hero-stage-copy glass-card">
            <span className="section-kicker">{locale === "ar" ? "السيرة الذاتية" : "Resume"}</span>
            <h1 className="display-title">{page.title}</h1>
            <p className="hero-lead">{intro}</p>
            <p>
              {locale === "ar"
                ? "أعمل اليوم في Rhenus Home Delivery، وأحمل معي خبرة من IKEA، وفي الوقت نفسه أبني قناة يوتيوب ومشاريع رقمية تعكس نفس الفكرة: وضوح، تفاصيل، وتنفيذ محترم."
                : "I currently work at Rhenus Home Delivery, carry experience from IKEA, and at the same time build a YouTube channel and digital projects shaped by the same principles: clarity, detail, and polished execution."}
            </p>
            <div className="hero-action-row">
              <Link href={`/${locale}/contact`} className="btn primary">
                {locale === "ar" ? "تواصل معي" : "Contact me"}
              </Link>
              <a href="https://www.youtube.com/@Moalfarras" target="_blank" rel="noreferrer noopener" className="btn secondary">
                {locale === "ar" ? "قناة يوتيوب" : "YouTube channel"}
              </a>
            </div>
          </div>

          {portrait ? (
            <aside className="hero-stage-visual glass-card">
              <div className="portrait-shell">
                <div className="portrait-glow-ring" />
                <div className="portrait-frame portrait-frame-cv">
                  <Image
                    src={portrait.path}
                    alt={locale === "ar" ? portrait.alt_ar : portrait.alt_en}
                    width={portrait.width}
                    height={portrait.height}
                    priority
                    sizes="(max-width: 768px) 68vw, 28rem"
                    className="portrait-image"
                  />
                </div>
                <div className="portrait-caption">
                  <strong>Mohammad Alfarras</strong>
                  <span>{locale === "ar" ? "تشغيل · محتوى · حلول رقمية" : "Operations · Content · Digital Delivery"}</span>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "الخبرة" : "Experience"}</span>
            <h2>{String(experienceBlock?.content.title ?? (locale === "ar" ? "محطات الخبرة الأساسية" : "Core professional milestones"))}</h2>
          </div>
          <div className="timeline-grid">
            {experiences.map((item) => (
              <article key={item.id} className="glass-card timeline-entry">
                <div className="timeline-line" />
                <div className="timeline-entry-meta">
                  <strong>{item.roleTitle}</strong>
                  <span>{item.company}</span>
                </div>
                <p className="muted">
                  {item.location} · {formatDateLabel(locale, item.startDate)} - {item.currentRole ? (locale === "ar" ? "حتى الآن" : "Present") : formatDateLabel(locale, item.endDate)}
                </p>
                <p>{item.description}</p>
                {item.highlights.length ? (
                  <ul className="bullet-list">
                    {item.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
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
            <span className="section-kicker">{locale === "ar" ? "القيمة العملية" : "Practical value"}</span>
            <h2>{String(certificationBlock?.content.title ?? (locale === "ar" ? "ما أضيفه عملياً" : "What I bring in practice"))}</h2>
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
            <span className="section-kicker">{locale === "ar" ? "الأدوات" : "Tools"}</span>
            <h2>{locale === "ar" ? "برامج أستخدمها فعلياً" : "The software I actually use"}</h2>
          </div>
          <div className="pillars-grid">
            {tools.map((tool) => (
              <article key={tool} className="glass-card pillar-card">
                <span className="pillar-mark">•</span>
                <p>{tool}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "اللغات" : "Languages"}</span>
            <h2>{locale === "ar" ? "تواصل واضح عبر ثلاث بيئات" : "Clear communication across three working languages"}</h2>
          </div>
          <div className="language-card-grid">
            {languageCards.map((item) => (
              <article key={item.title} className="glass-card language-card">
                <span className="language-flag">{item.flag}</span>
                <h3>{item.title}</h3>
                <p>{item.level}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "أسلوب العمل" : "Work style"}</span>
            <h2>{locale === "ar" ? "المهارات الشخصية التي أشتغل بها يومياً" : "The soft skills behind the day-to-day work"}</h2>
          </div>
          <div className="feature-card-grid">
            {softSkills.map((item) => (
              <article key={item.title} className="glass-card service-rich-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
