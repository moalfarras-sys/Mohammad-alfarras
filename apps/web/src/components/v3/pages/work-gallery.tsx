"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { SiteProject } from "@/components/site/site-view-model";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { categoryOf, hostOf, mobileShotOf, orderProjects, type WorkCategory } from "./work-data";

const labels = {
  en: {
    filter: "Filter projects",
    categories: { all: "All", websites: "Websites", platforms: "Platforms", products: "Products" },
    count: (n: number) => `${n} ${n === 1 ? "project" : "projects"}`,
    view: "Read the case",
    visit: "Visit",
    inDev: "In development",
    live: "Live",
  },
  ar: {
    filter: "تصفية المشاريع",
    categories: { all: "الكل", websites: "مواقع", platforms: "منصّات", products: "منتجات" },
    count: (n: number) => (n === 1 ? "مشروع واحد" : n === 2 ? "مشروعان" : n <= 10 ? `${n} مشاريع` : `${n} مشروعاً`),
    view: "اقرأ دراسة الحالة",
    visit: "زيارة",
    inDev: "قيد التطوير",
    live: "يعمل الآن",
  },
} as const;

export function WorkGallery({ locale, projects }: { locale: Locale; projects: SiteProject[] }) {
  const t = labels[locale];
  const reduce = useReducedMotion();
  const [active, setActive] = useState<WorkCategory>("all");

  const ordered = useMemo(() => orderProjects(projects), [projects]);

  const available = (["all", "websites", "platforms", "products"] as const).filter(
    (category) => category === "all" || ordered.some((project) => categoryOf(project) === category),
  );
  const visible = active === "all" ? ordered : ordered.filter((project) => categoryOf(project) === active);

  return (
    <div className="v3w-gallery-wrap">
      <div className="v3w-filter" role="group" aria-label={t.filter}>
        {available.map((category) => {
          const count = category === "all" ? ordered.length : ordered.filter((project) => categoryOf(project) === category).length;
          const on = active === category;
          return (
            <button key={category} type="button" aria-pressed={on} onClick={() => setActive(category)} className={on ? "v3w-chip is-on" : "v3w-chip"}>
              {on ? <motion.span layoutId="v3w-chip-bg" className="v3w-chip-bg" transition={{ type: "spring", stiffness: 380, damping: 32 }} /> : null}
              <span className="v3w-chip-label">{t.categories[category]}</span>
              <span className="v3w-chip-count">{count}</span>
            </button>
          );
        })}
        <span className="v3w-count" aria-live="polite">
          {t.count(visible.length)}
        </span>
      </div>

      <motion.ul className="v3w-grid" layout={!reduce}>
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project, index) => {
            const caseHref = withLocale(locale, `work/${project.slug}`);
            const host = hostOf(project.href);
            const external = Boolean(host);
            const mobile = mobileShotOf(project);
            const product = categoryOf(project) === "products";
            const lead = index === 0 && active === "all";
            const inset = mobile ?? (product ? project.gallery.find((src) => src !== project.image) : undefined);
            return (
              <motion.li
                key={project.id}
                layout={!reduce}
                className={["v3w-card", lead && "v3w-card--lead", product && "v3w-card--product"].filter(Boolean).join(" ")}
                initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={caseHref} prefetch={false} className="v3w-media" tabIndex={-1} aria-hidden="true">
                  <span className="v3w-screen">
                    {!product ? (
                      <span className="v3w-bar">
                        <i />
                        <i />
                        <i />
                        {host ? <bdi>{host}</bdi> : null}
                      </span>
                    ) : null}
                    <span className="v3w-shot">
                      <Image
                        src={project.image}
                        alt=""
                        fill
                        sizes={lead ? "(max-width: 900px) 92vw, 760px" : "(max-width: 900px) 92vw, 600px"}
                        quality={70}
                        className={product ? "v3-cover v3w-shot-img" : "v3-cover v3-top v3w-shot-img"}
                        priority={index === 0}
                      />
                    </span>
                  </span>
                  {inset ? (
                    <span className={mobile ? "v3w-inset v3w-inset--phone" : "v3w-inset v3w-inset--screen"}>
                      <Image src={inset} alt="" fill sizes="200px" quality={65} className="v3-cover v3-top" />
                    </span>
                  ) : null}
                  {project.status === "in-development" ? (
                    <span className="v3w-badge v3w-badge--dev">{t.inDev}</span>
                  ) : external ? (
                    <span className="v3w-badge">
                      <span className="v3w-live-dot" aria-hidden="true" />
                      {t.live}
                    </span>
                  ) : null}
                </Link>
                <div className="v3w-body">
                  <p className="v3w-kicker">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {project.eyebrow || t.categories[categoryOf(project)]}
                  </p>
                  <h2 className="v3w-title">
                    <Link href={caseHref} prefetch={false}>
                      {project.title}
                    </Link>
                  </h2>
                  <p className="v3w-summary">{project.summary || project.description}</p>
                  {project.tags.length ? (
                    <ul className="v3w-tags">
                      {project.tags.slice(0, 3).map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="v3w-links">
                    <Link href={caseHref} prefetch={false} className="v3w-link">
                      {t.view}
                      <ArrowUpRight size={15} aria-hidden />
                      <span className="sr-only"> — {project.title}</span>
                    </Link>
                    {external ? (
                      <a href={project.href} target="_blank" rel="noopener noreferrer" className="v3w-link v3w-link--quiet">
                        {t.visit} <bdi>{host}</bdi>
                      </a>
                    ) : null}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
