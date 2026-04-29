"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Boxes, Code2, Filter, MonitorPlay, PlayCircle, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

type ProjectCategory = "all" | "web" | "apps" | "logistics";
type ProjectTone = "cyan" | "red" | "violet" | "gold";
type MockupKind = "desktop" | "tv" | "phone";

type ExhibitionProject = {
  id: string;
  title: string;
  label: string;
  description: string;
  image: string;
  href: string;
  categories: ProjectCategory[];
  tags: string[];
  tone: ProjectTone;
  mockup: MockupKind;
  featured?: boolean;
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

function copy(locale: Locale) {
  const ar = locale === "ar";
  return {
    eyebrow: ar ? "Digital Exhibition" : "Digital Exhibition",
    title: ar ? "أعمال هندسية مختارة." : "Selected Engineering Work.",
    subtitle: ar
      ? "دراسات حالة بوضوح في المشكلة، الدور، القرارات، والنتيجة الرقمية."
      : "Case studies with clear problems, roles, decisions, and outcomes.",
    scroll: ar ? "مرّر للاستكشاف" : "Scroll to explore",
    view: ar ? "عرض التفاصيل" : "View Case Study",
    live: ar ? "زيارة المشروع" : "Live project",
    filter: ar ? "تصفية" : "Filter",
    ctaTitle: ar ? "جاهز لبناء تواجدك الرقمي؟" : "Ready to build your digital presence?",
    ctaBody: ar
      ? "إذا كان مشروعك يحتاج موقعًا مقنعًا، تجربة منتج، أو واجهة تجعل الخطوة التالية واضحة، أرسل لي الفكرة."
      : "If your project needs a convincing website, product surface, or interface that makes the next step obvious, send the idea.",
    ctaPrimary: ar ? "ابدأ مشروعك" : "Start a project",
    ctaSecondary: ar ? "شاهد MoPlayer" : "Explore MoPlayer",
    projects: [
      {
        id: "moplayer",
        title: "MoPlayer",
        label: ar ? "Android TV / IPTV Product" : "Android TV / IPTV Product",
        description: ar
          ? "منظومة منتج تجمع تطبيق Android TV، التفعيل، مصادر IPTV، الإصدارات، والدعم ضمن تجربة واضحة."
          : "A product ecosystem connecting Android TV, activation, IPTV sources, release flow, and support into one clear experience.",
        image: "/images/moplayer-tv-banner-final.png",
        href: withLocale(locale, "apps/moplayer"),
        categories: ["all", "apps"],
        tags: ["Android TV", "IPTV", "Activation", "Product UI"],
        tone: "red",
        mockup: "tv",
        featured: true,
      },
      {
        id: "seel",
        title: "SEEL Transport",
        label: ar ? "Transport / Service Website" : "Transport / Service Website",
        description: ar
          ? "موقع خدمات نقل منظم يعرض الخدمة، الثقة، الصور، والتواصل بطريقة مناسبة للجوال والعملاء."
          : "A structured transport service website shaped around service clarity, trust, visual proof, and mobile-friendly contact.",
        image: "/images/projects/seel-home-case.png",
        href: withLocale(locale, "work"),
        categories: ["all", "web", "logistics"],
        tags: ["Service UX", "Responsive", "Logistics", "Trust"],
        tone: "cyan",
        mockup: "desktop",
      },
      {
        id: "schnell",
        title: "Schnell Sicher Umzug",
        label: ar ? "Moving Company Website" : "Moving Company Website",
        description: ar
          ? "تجربة موقع لشركة نقل تشرح الخدمات بسرعة وتوجه العميل نحو طلب عرض أو تواصل مباشر."
          : "A moving-company experience that explains services quickly and guides visitors toward quote requests and direct contact.",
        image: "/images/projects/schnell-home-case.png",
        href: "https://schnellsicherumzug.de/",
        categories: ["all", "web", "logistics"],
        tags: ["Next.js", "Moving", "Lead Flow", "Mobile UX"],
        tone: "gold",
        mockup: "desktop",
      },
      {
        id: "intelligent",
        title: "Intelligent Umzüge",
        label: ar ? "Relocation Website" : "Relocation Website",
        description: ar
          ? "صفحة نقل تركز على وضوح الأسعار، المعاينة، واتساب، والثقة قبل طلب العرض."
          : "A relocation website focused on pricing clarity, inspection flow, WhatsApp contact, and trust before inquiry.",
        image: "/images/projects/intelligent-umzuege-home.png",
        href: "https://www.intelligent-umzuege.de/",
        categories: ["all", "web", "logistics"],
        tags: ["Pricing UX", "WhatsApp", "Conversion", "Service Design"],
        tone: "violet",
        mockup: "desktop",
      },
      {
        id: "adtransporte",
        title: "A&D Fahrzeugtransporte",
        label: ar ? "Towing / Vehicle Logistics" : "Towing / Vehicle Logistics",
        description: ar
          ? "موقع مباشر لخدمات السحب ونقل السيارات، مصمم للسرعة والثقة والتواصل في الحالات العاجلة."
          : "A direct-response website for towing and vehicle logistics, designed for urgency, trust, and fast contact.",
        image: "/images/projects/adtransporte-home.png",
        href: "https://www.adtransporte.de/",
        categories: ["all", "web", "logistics"],
        tags: ["Emergency UX", "Transport", "Local SEO", "Direct CTA"],
        tone: "cyan",
        mockup: "desktop",
      },
      {
        id: "ecosystem",
        title: "moalfarras.space",
        label: ar ? "Personal Digital OS" : "Personal Digital OS",
        description: ar
          ? "منظومة شخصية تربط الأعمال، يوتيوب، MoPlayer، التفعيل، السيرة، والتواصل ضمن هوية واحدة."
          : "A personal digital OS connecting work, YouTube, MoPlayer, activation, CV, and contact into one identity.",
        image: "/images/hero_tech.png",
        href: withLocale(locale, ""),
        categories: ["all", "web", "apps"],
        tags: ["Next.js", "RTL/LTR", "Design System", "Admin"],
        tone: "violet",
        mockup: "phone",
      },
    ] as ExhibitionProject[],
  };
}

const toneIcon: Record<ProjectTone, typeof Code2> = {
  cyan: Code2,
  red: MonitorPlay,
  violet: Boxes,
  gold: Truck,
};

export function WorkDigitalExhibition({ locale }: { locale: Locale }) {
  const t = copy(locale);
  const [active, setActive] = useState<ProjectCategory>("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const visibleProjects = useMemo(
    () => t.projects.filter((project) => active === "all" || project.categories.includes(active)),
    [active, t.projects],
  );

  return (
    <main className="work-exhibition">
      <section className="work-exhibition-hero">
        <motion.p className="fresh-eyebrow" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          {t.eyebrow}
        </motion.p>
        <motion.h1 initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
          {t.title.split(" ").map((word) => (
            <motion.span key={word} variants={{ hidden: { opacity: 0, y: 38, filter: "blur(10px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } }}>
              {word}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.55 }}>
          {t.subtitle}
        </motion.p>
        <motion.div className="work-scroll-cue" animate={{ y: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
          <ArrowDown size={16} />
          <span>{t.scroll}</span>
        </motion.div>
      </section>

      <FilterBar locale={locale} active={active} onChange={setActive} label={t.filter} />

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
          <Link href={withLocale(locale, "contact")} className="fresh-button fresh-button-primary magnetic-surface">
            {t.ctaPrimary}
            <ArrowUpRight size={17} />
          </Link>
          <Link href={withLocale(locale, "apps/moplayer")} className="fresh-button magnetic-surface">
            {t.ctaSecondary}
          </Link>
        </div>
      </section>
    </main>
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
          <button key={item.id} type="button" role="tab" aria-selected={active === item.id} onClick={() => onChange(item.id)} className={active === item.id ? "work-filter-active" : ""}>
            {active === item.id ? <motion.span layoutId="work-filter-active" className="work-filter-active-bg" /> : null}
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
  const external = project.href.startsWith("http");

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

      <MockupFrame project={project} viewLabel={viewLabel} liveLabel={liveLabel} external={external} />

      <div className="work-card-copy">
        <h2>{project.title}</h2>
        <p>{project.description}</p>
      </div>

      <div className="work-card-tags">
        {project.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <Link href={project.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="work-card-link">
        {project.id === "moplayer" || project.id === "ecosystem" ? viewLabel : liveLabel}
        <ArrowUpRight size={16} />
      </Link>
    </motion.article>
  );
}

function MockupFrame({
  project,
  viewLabel,
  liveLabel,
  external,
}: {
  project: ExhibitionProject;
  viewLabel: string;
  liveLabel: string;
  external: boolean;
}) {
  return (
    <div className={`work-mockup work-mockup-${project.mockup}`}>
      <div className="work-mockup-toolbar" aria-hidden="true">
        <span />
        <span />
        <span />
        <small>{project.title}</small>
      </div>
      <div className="work-mockup-screen">
        <Image src={project.image} alt={project.title} fill sizes={project.featured ? "(max-width: 900px) 92vw, 760px" : "(max-width: 900px) 92vw, 520px"} className="work-project-image" />
        <div className="work-image-overlay">
          <PlayCircle size={30} />
          <span>{external ? liveLabel : viewLabel}</span>
        </div>
      </div>
    </div>
  );
}
