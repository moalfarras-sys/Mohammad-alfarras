"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Boxes,
  Code2,
  ExternalLink,
  Filter,
  Lightbulb,
  MessageCircle,
  MonitorPlay,
  PlayCircle,
  Target,
  Trophy,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";
import type { SiteProject } from "./site-view-model";

type ProjectCategory = "all" | "web" | "apps" | "logistics";
type ProjectTone = "cyan" | "red" | "violet" | "gold";
type MockupKind = "desktop" | "tv" | "phone";

type ExhibitionProject = {
  id: string;
  slug: string;
  title: string;
  label: string;
  description: string;
  image: string;
  caseStudyHref: string;
  liveHref?: string;
  challenge?: string;
  solution?: string;
  result?: string;
  metrics?: Array<{ value: string; label: string }>;
  categories: ProjectCategory[];
  tags: string[];
  tone: ProjectTone;
  mockup: MockupKind;
  featured?: boolean;
  status?: "live" | "in-development";
};

const categories: Record<Locale, Array<{ id: ProjectCategory; label: string }>> = {
  en: [
    { id: "all", label: "All Work" },
    { id: "web", label: "Web & Interfaces" },
    { id: "apps", label: "Android & Apps" },
    { id: "logistics", label: "Logistics Tech" },
  ],
  ar: [
    { id: "all", label: "كل الأعمال" },
    { id: "web", label: "الويب والواجهات" },
    { id: "apps", label: "أندرويد والتطبيقات" },
    { id: "logistics", label: "تقنية اللوجستيات" },
  ],
};

function projectCategory(project: SiteProject): ProjectCategory[] {
  if (project.slug.includes("moplayer") || project.highlightStyle === "app") return ["all", "apps"];
  if (project.highlightStyle === "operations") return ["all", "web", "logistics"];
  return ["all", "web"];
}

function projectTone(project: SiteProject): ProjectTone {
  if (project.accent === "amber") return "gold";
  if (project.accent === "rose") return "red";
  if (project.accent === "ink") return "violet";
  return "cyan";
}

function projectMockup(project: SiteProject): MockupKind {
  if (project.deviceFrame === "phone") return "phone";
  if (project.highlightStyle === "app") return "tv";
  return "desktop";
}

function cmsProjectToExhibition(project: SiteProject, locale: Locale): ExhibitionProject {
  const caseStudyHref = withLocale(locale, `work/${project.slug}`);
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    label: project.eyebrow || project.slug,
    description: project.summary || project.description,
    image: project.image,
    caseStudyHref,
    liveHref: project.href && project.href !== caseStudyHref ? project.href : undefined,
    challenge: project.challenge,
    solution: project.solution,
    result: project.result,
    metrics: project.metrics,
    categories: projectCategory(project),
    tags: project.tags.length ? project.tags : [project.slug],
    tone: projectTone(project),
    mockup: projectMockup(project),
    featured: project.featured,
    status: project.status,
  };
}

function copy(locale: Locale, cmsProjects: SiteProject[]) {
  const ar = locale === "ar";
  return {
    eyebrow: ar ? "معرض الأعمال" : "Digital Exhibition",
    title: ar ? "مشاريع وأعمال مختارة." : "Selected Engineering Work.",
    subtitle: ar
      ? "دراسات حالة واضحة: المشكلة، دوري فيها، القرارات، والنتيجة."
      : "Case studies with clear problems, roles, decisions, and outcomes.",
    scroll: ar ? "مرّر للاستكشاف" : "Scroll to explore",
    view: ar ? "عرض التفاصيل" : "View Case Study",
    live: ar ? "زيارة المشروع" : "Live project",
    filter: ar ? "تصفية" : "Filter",
    spotlightEyebrow: ar ? "المشروع تحت المجهر" : "Project lens",
    spotlightTitle: ar
      ? "اكتشف القرارات خلف الواجهة."
      : "Explore the decisions behind the interface.",
    spotlightBody: ar
      ? "اختر مشروعاً لترى المشكلة والقرار والنتيجة قبل فتح دراسة الحالة الكاملة."
      : "Choose a project to see the problem, decision, and outcome before opening the full case study.",
    challenge: ar ? "المشكلة" : "Problem",
    solution: ar ? "القرار" : "Decision",
    result: ar ? "النتيجة" : "Outcome",
    askAi: ar ? "اسأل المساعد عن المشروع" : "Ask the assistant about this project",
    selectedProject: ar ? "مشروع مختار" : "Selected project",
    ctaTitle: ar ? "جاهز لبناء تواجدك الرقمي؟" : "Ready to build your digital presence?",
    ctaBody: ar
      ? "إذا كان مشروعك يحتاج موقعًا مقنعًا، تجربة منتج، أو واجهة تجعل الخطوة التالية واضحة، أرسل لي الفكرة."
      : "If your project needs a convincing website, product surface, or interface that makes the next step obvious, send the idea.",
    ctaPrimary: ar ? "ابدأ مشروعك" : "Start a project",
    ctaSecondary: ar ? "شاهد MoPlayer" : "Explore MoPlayer",
    projects: cmsProjects.map((project) => cmsProjectToExhibition(project, locale)),
  };
}

const toneIcon: Record<ProjectTone, typeof Code2> = {
  cyan: Code2,
  red: MonitorPlay,
  violet: Boxes,
  gold: Truck,
};

export function WorkDigitalExhibition({
  locale,
  projects,
}: {
  locale: Locale;
  projects: SiteProject[];
}) {
  const t = useMemo(() => copy(locale, projects), [locale, projects]);
  const [active, setActive] = useState<ProjectCategory>("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(
    () => t.projects.find((project) => project.featured)?.id ?? t.projects[0]?.id ?? "",
  );
  const visibleProjects = useMemo(
    () => t.projects.filter((project) => active === "all" || project.categories.includes(active)),
    [active, t.projects],
  );
  const selectedProject =
    visibleProjects.find((project) => project.id === selectedId) ?? visibleProjects[0];

  return (
    <main className="work-exhibition">
      <section className="work-exhibition-hero">
        <motion.p
          className="fresh-eyebrow"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {t.eyebrow}
        </motion.p>
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {t.title.split(" ").map((word) => (
            <motion.span
              key={word}
              variants={{
                hidden: { opacity: 0, y: 38, filter: "blur(10px)" },
                show: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55 }}
        >
          {t.subtitle}
        </motion.p>
        <motion.div
          className="work-scroll-cue"
          animate={{ y: [0, 9, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ArrowDown size={16} />
          <span>{t.scroll}</span>
        </motion.div>
      </section>

      <FilterBar locale={locale} active={active} onChange={setActive} label={t.filter} />
      {selectedProject ? (
        <ProjectSpotlight
          locale={locale}
          projects={visibleProjects}
          project={selectedProject}
          onSelect={setSelectedId}
          copy={{
            eyebrow: t.spotlightEyebrow,
            title: t.spotlightTitle,
            body: t.spotlightBody,
            challenge: t.challenge,
            solution: t.solution,
            result: t.result,
            view: t.view,
            live: t.live,
            askAi: t.askAi,
            selectedProject: t.selectedProject,
          }}
        />
      ) : null}
      <motion.section className="work-gallery" layout>
        <AnimatePresence mode="popLayout">
          {visibleProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              viewLabel={t.view}
              liveLabel={t.live}
              hovered={hovered === project.id}
              onHover={setHovered}
            />
          ))}
        </AnimatePresence>
      </motion.section>

      <section className="work-exhibition-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaBody}</p>
        <div className="fresh-actions">
          <Link
            href={withLocale(locale, "contact")}
            className="fresh-button fresh-button-primary magnetic-surface"
          >
            {t.ctaPrimary}
            <ArrowUpRight size={17} />
          </Link>
          <Link
            href={withLocale(locale, "apps/moplayer")}
            className="fresh-button magnetic-surface"
          >
            {t.ctaSecondary}
          </Link>
        </div>
      </section>
    </main>
  );
}

function ProjectSpotlight({
  locale,
  projects,
  project,
  onSelect,
  copy,
}: {
  locale: Locale;
  projects: ExhibitionProject[];
  project: ExhibitionProject;
  onSelect: (id: string) => void;
  copy: {
    eyebrow: string;
    title: string;
    body: string;
    challenge: string;
    solution: string;
    result: string;
    view: string;
    live: string;
    askAi: string;
    selectedProject: string;
  };
}) {
  const external = project.liveHref?.startsWith("http") ?? false;
  const narrative = [
    { label: copy.challenge, body: project.challenge || project.description, icon: Target },
    { label: copy.solution, body: project.solution || project.description, icon: Lightbulb },
    { label: copy.result, body: project.result || project.description, icon: Trophy },
  ];

  function openAssistant() {
    const prompt =
      locale === "ar"
        ? `اشرح لي مشروع ${project.title}: ما المشكلة التي حلها، وما أهم القرارات والنتيجة؟`
        : `Explain the ${project.title} project: what problem did it solve, which decisions mattered, and what was the outcome?`;
    window.dispatchEvent(new CustomEvent("mo-ai:open", { detail: { prompt } }));
  }

  return (
    <section
      className={`work-spotlight work-card-${project.tone}`}
      aria-labelledby="work-spotlight-title"
    >
      <header className="work-spotlight-head">
        <div>
          <p className="fresh-eyebrow">{copy.eyebrow}</p>
          <h2 id="work-spotlight-title">{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
        <span>
          {String(projects.findIndex((item) => item.id === project.id) + 1).padStart(2, "0")} /{" "}
          {String(projects.length).padStart(2, "0")}
        </span>
      </header>

      <div className="work-spotlight-tabs" role="tablist" aria-label={copy.selectedProject}>
        {projects.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === project.id}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.title}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={project.id}
          className="work-spotlight-stage"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.24 }}
        >
          <Link
            href={project.caseStudyHref}
            className="work-spotlight-media"
            aria-label={`${copy.view}: ${project.title}`}
          >
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 900px) 94vw, 640px"
              className="work-project-image"
              priority
            />
            <span>
              <PlayCircle size={22} />
              {copy.view}
            </span>
            {project.status === "in-development" ? (
              <em className="work-status-badge">{locale === "ar" ? "قيد التطوير" : "In development"}</em>
            ) : null}
          </Link>

          <div className="work-spotlight-copy">
            <div className="work-spotlight-title">
              <span>{project.label}</span>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>

            <div className="work-spotlight-narrative">
              {narrative.map(({ label, body, icon: Icon }) => (
                <article key={label}>
                  <span>
                    <Icon size={15} />
                    {label}
                  </span>
                  <p>{body}</p>
                </article>
              ))}
            </div>

            {project.metrics?.length ? (
              <div className="work-spotlight-metrics">
                {project.metrics.slice(0, 3).map((metric) => (
                  <div key={`${metric.value}-${metric.label}`}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="work-spotlight-actions">
              <Link href={project.caseStudyHref} className="fresh-button fresh-button-primary">
                {copy.view}
                <ArrowUpRight size={16} />
              </Link>
              {project.liveHref ? (
                <Link
                  href={project.liveHref}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="fresh-button"
                >
                  {copy.live}
                  <ExternalLink size={15} />
                </Link>
              ) : null}
              <button
                type="button"
                className="fresh-button work-spotlight-ai"
                onClick={openAssistant}
              >
                <MessageCircle size={16} />
                {copy.askAi}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function FilterBar({
  locale,
  active,
  onChange,
  label,
}: {
  locale: Locale;
  active: ProjectCategory;
  onChange: (category: ProjectCategory) => void;
  label: string;
}) {
  return (
    <div className="work-filter-shell">
      <span className="work-filter-label">
        <Filter size={15} />
        {label}
      </span>
      <div className="work-filter-pills" role="tablist" aria-label={label}>
        {categories[locale].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            onClick={() => onChange(item.id)}
            className={active === item.id ? "work-filter-active" : ""}
          >
            {active === item.id ? (
              <motion.span layoutId="work-filter-active" className="work-filter-active-bg" />
            ) : null}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  viewLabel,
  liveLabel,
  hovered,
  onHover,
}: {
  project: ExhibitionProject;
  index: number;
  viewLabel: string;
  liveLabel: string;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const Icon = toneIcon[project.tone];
  const external = project.liveHref?.startsWith("http") ?? false;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.92, y: 34 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.86, y: 20 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 140, damping: 22, delay: index * 0.025 }}
      className={`work-project-card work-card-${project.tone} ${project.featured ? "work-project-featured" : ""} ${hovered ? "work-project-hovered" : ""}`}
      onMouseEnter={() => onHover(project.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="work-card-chrome">
        <div>
          <Icon size={17} />
          <span>{project.label}</span>
        </div>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>

      <Link href={project.caseStudyHref} aria-label={`${viewLabel}: ${project.title}`}>
        <MockupFrame project={project} viewLabel={viewLabel} />
      </Link>

      <div className="work-card-copy">
        <h2>{project.title}</h2>
        <p>{project.description}</p>
      </div>

      <div className="work-card-tags">
        {project.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="work-card-actions">
        <Link href={project.caseStudyHref} className="work-card-link">
          {viewLabel}
          <ArrowUpRight size={16} />
        </Link>
        {project.liveHref ? (
          <Link
            href={project.liveHref}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="work-card-live-link"
          >
            {liveLabel}
            <ExternalLink size={14} />
          </Link>
        ) : null}
      </div>
    </motion.article>
  );
}

function MockupFrame({ project, viewLabel }: { project: ExhibitionProject; viewLabel: string }) {
  return (
    <div className={`work-mockup work-mockup-${project.mockup}`}>
      <div className="work-mockup-toolbar" aria-hidden="true">
        <span />
        <span />
        <span />
        <small>{project.title}</small>
      </div>
      <div className="work-mockup-screen">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes={
            project.featured ? "(max-width: 900px) 92vw, 760px" : "(max-width: 900px) 92vw, 520px"
          }
          className="work-project-image"
        />
        <div className="work-image-overlay">
          <PlayCircle size={30} />
          <span>{viewLabel}</span>
        </div>
      </div>
    </div>
  );
}
