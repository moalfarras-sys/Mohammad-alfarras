import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink, Mail } from "lucide-react";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { Reveal, SplitHeadline, Stagger, TiltCard } from "@/components/v3/motion-kit";
import { caseStudyCopy } from "@/content/work";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

import { AskAssistantButton } from "./ask-assistant-button";
import { Eyebrow, PhoneShot, SectionHead } from "./v3-page-parts";
import { LoadSequence, ScrollLayer } from "./v3-page-motion";
import { categoryOf, hostOf, mobileShotOf } from "./work-data";

const copy = {
  en: {
    back: "Back to work",
    similar: "Start a similar project",
    ask: "Ask the assistant",
    signals: "Project signals",
    storyLabel: "From brief to outcome",
    storyTitle: "What actually *changed*?",
    storyBody: "This case study explains the thinking and execution, not only the final screens.",
    summary: "Delivery summary",
    focus: "Focus",
    galleryLabel: "Screens",
    galleryTitle: "The real *screens*.",
    nav: "Project navigation",
    previous: "Previous project",
    next: "Next project",
    more: "Explore more",
    all: "All work",
  },
  ar: {
    back: "العودة إلى الأعمال",
    similar: "ابدأ مشروعاً مشابهاً",
    ask: "اسأل المساعد",
    signals: "مؤشرات المشروع",
    storyLabel: "من الفكرة إلى النتيجة",
    storyTitle: "ما الذي *تغيّر* فعلياً؟",
    storyBody: "دراسة الحالة هنا تشرح التفكير والتنفيذ، ولا تكتفي بعرض لقطة جميلة.",
    summary: "ملخص التنفيذ",
    focus: "التركيز",
    galleryLabel: "الشاشات",
    galleryTitle: "الشاشات *الحقيقية*.",
    nav: "التنقل بين المشاريع",
    previous: "المشروع السابق",
    next: "المشروع التالي",
    more: "اكتشف المزيد",
    all: "كل الأعمال",
  },
} as const;

export function CaseV3({ model, slug }: { model: SiteViewModel; slug: string }) {
  const locale = model.locale;
  const ar = locale === "ar";
  const t = copy[locale];
  const story = repairMojibakeDeep(caseStudyCopy[locale]);
  const project = model.projects.find((item) => item.id === slug || item.slug === slug);
  if (!project) return null;

  const index = model.projects.findIndex((item) => item.id === project.id);
  const previous = index > 0 ? model.projects[index - 1] : null;
  const next = index < model.projects.length - 1 ? model.projects[index + 1] : null;
  const external = /^https?:\/\//.test(project.href ?? "");
  const host = hostOf(project.href);
  const mobile = mobileShotOf(project);
  const product = categoryOf(project) === "products";
  const secondary = project.gallery.find((src) => src !== project.image && src !== mobile);
  const narrative = [
    { number: "01", label: story.challenge, body: project.challenge },
    { number: "02", label: story.solution, body: project.solution },
    { number: "03", label: story.result, body: project.result },
  ].filter((item) => item.body);
  const gallery = [...new Set(project.gallery)].filter(Boolean);
  const prompt = ar
    ? `اشرح لي دراسة حالة ${project.title} وساعدني أفهم المشكلة والقرار والنتيجة.`
    : `Walk me through the ${project.title} case study and explain the problem, decision, and outcome.`;

  return (
    <div className="st-page v3p v3p-case">
      <section className="v3p-hero v3c-hero">
        <div className="st-container v3c-hero-grid">
          <div className="v3c-hero-copy">
            <Reveal y={10}>
              <Link href={`/${locale}/work`} prefetch={false} className="v3c-back">
                <ArrowLeft size={16} aria-hidden />
                {t.back}
              </Link>
              <Eyebrow>{project.eyebrow || project.tags[0]}</Eyebrow>
            </Reveal>
            <SplitHeadline text={project.title} className="v3p-h1" />
            <Reveal delay={0.25} y={18}>
              <p className="v3p-lead">{project.description}</p>
              <div className="v3p-actions v3c-actions">
                {project.href ? (
                  <a
                    href={project.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="st-btn st-btn--primary"
                  >
                    {external ? <ExternalLink size={17} aria-hidden /> : <ArrowUpRight size={17} aria-hidden />}
                    {project.ctaLabel}
                  </a>
                ) : null}
                <Link href={`/${locale}/contact`} prefetch={false} className="st-btn st-btn--ghost">
                  <Mail size={17} aria-hidden />
                  {t.similar}
                </Link>
                <AskAssistantButton prompt={prompt} label={t.ask} className="st-btn st-btn--ghost" />
              </div>
            </Reveal>
          </div>

          <LoadSequence className="v3c-stage" delay={0.12}>
            {product ? (
              <ScrollLayer speed={18} className="v3c-laptop">
                <TiltCard className="v3c-float-card v3c-product-card" max={5}>
                  <Image src={project.image} alt={project.title} fill priority sizes="(max-width: 900px) 84vw, 600px" className="v3-cover" />
                </TiltCard>
              </ScrollLayer>
            ) : (
              <ScrollLayer speed={18} className="v3c-laptop">
                <div className="v3c-laptop-screen">
                  <Image src={project.image} alt={project.title} fill priority sizes="(max-width: 900px) 84vw, 600px" className="v3-cover v3-top" />
                </div>
                <div className="v3c-laptop-base" aria-hidden="true" />
              </ScrollLayer>
            )}
            {mobile ? (
              <ScrollLayer speed={-52} rotate={3} className="v3c-phone">
                <PhoneShot src={mobile} alt="" sizes="(max-width: 900px) 26vw, 170px" priority />
              </ScrollLayer>
            ) : secondary ? (
              <ScrollLayer speed={-46} rotate={3} className="v3c-float">
                <div className="v3c-float-card">
                  <Image src={secondary} alt="" fill sizes="(max-width: 900px) 44vw, 300px" className="v3-cover" />
                </div>
              </ScrollLayer>
            ) : null}
          </LoadSequence>
        </div>
      </section>

      {project.metrics.length ? (
        <section className="v3p-section v3c-metrics-section" aria-label={t.signals}>
          <div className="st-container">
            <Reveal y={20}>
              <dl className="v3c-metrics">
                {project.metrics.slice(0, 4).map((metric) => (
                  <div key={`${metric.label}-${metric.value}`}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>
      ) : null}

      {narrative.length ? (
        <section className="v3p-section">
          <div className="st-container">
            <SectionHead eyebrow={t.storyLabel} title={t.storyTitle} body={t.storyBody} />
            <Stagger className="v3c-story" gap={0.1}>
              {narrative.map((item) => (
                <article key={item.number} className="v3c-story-card">
                  <span className="v3c-story-num">{item.number}</span>
                  <p className="v3c-story-label">{item.label}</p>
                  <h3>{item.body}</h3>
                </article>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      <section className="v3p-section">
        <div className="st-container">
          <Reveal className="v3c-summary" y={24}>
            <div>
              <p className="v3c-label">{t.summary}</p>
              <h3>{project.summary}</h3>
              {host ? (
                <p>
                  <a className="v3-link" href={project.href} target="_blank" rel="noopener noreferrer">
                    <bdi>{host}</bdi>
                  </a>
                </p>
              ) : null}
            </div>
            <div>
              <p className="v3c-label">{t.focus}</p>
              <ul className="v3p-chips v3p-chips--solid">
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {gallery.length ? (
        <section className="v3p-section">
          <div className="st-container">
            <SectionHead eyebrow={t.galleryLabel} title={t.galleryTitle} />
            <ul className="v3c-gallery">
              {gallery.map((image, galleryIndex) => {
                const isPhone = /-mobile\./.test(image);
                const wide = !isPhone && galleryIndex === 0 && gallery.length % 2 === 1;
                return (
                  <li key={image} className={isPhone ? "is-phone" : wide ? "is-wide" : undefined}>
                    <Reveal y={30} delay={galleryIndex * 0.06} amount={0.15}>
                      <div className="v3c-gallery-card">
                        <Image
                          src={image}
                          alt={`${project.title} ${galleryIndex + 1}`}
                          fill
                          sizes={wide ? "(max-width: 1240px) 92vw, 1240px" : "(max-width: 900px) 92vw, 620px"}
                          quality={70}
                          className="v3-cover v3-top"
                        />
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="v3p-section v3p-cta-section">
        <nav className="st-container v3c-nav" aria-label={t.nav}>
          {previous ? (
            <Link href={`/${locale}/work/${previous.slug}`} prefetch={false}>
              <span className="v3c-nav-thumb">
                <Image src={previous.image} alt="" fill sizes="120px" className="v3-cover v3-top" />
              </span>
              <span>
                <small>{t.previous}</small>
                <strong>{previous.title}</strong>
              </span>
              <ArrowLeft size={18} aria-hidden />
            </Link>
          ) : null}
          {next ? (
            <Link href={`/${locale}/work/${next.slug}`} prefetch={false} className="is-next">
              <span className="v3c-nav-thumb">
                <Image src={next.image} alt="" fill sizes="120px" className="v3-cover v3-top" />
              </span>
              <span>
                <small>{t.next}</small>
                <strong>{next.title}</strong>
              </span>
              <ArrowRight size={18} aria-hidden />
            </Link>
          ) : (
            <Link href={`/${locale}/work`} prefetch={false} className="is-next">
              <span className="v3c-nav-thumb">
                <Image src={project.image} alt="" fill sizes="120px" className="v3-cover v3-top" />
              </span>
              <span>
                <small>{t.more}</small>
                <strong>{t.all}</strong>
              </span>
              <ArrowRight size={18} aria-hidden />
            </Link>
          )}
        </nav>
      </section>
    </div>
  );
}
