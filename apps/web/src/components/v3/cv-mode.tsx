"use client";

/**
 * CV v3 — the client island for the Developer / Designer mode switch.
 *
 * The page shell (summary, experience, languages, downloads, CTA) is rendered on the server and
 * passed in as children; only the pieces that react to the mode live here: the switch itself,
 * the hook line, the portrait chips, the typing terminal, the skill order and the highlighted
 * projects. The accent colour follows the mode through a CSS custom property on the root.
 */

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CodeXml, Palette } from "lucide-react";
import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { TiltCard } from "@/components/v3/motion-kit";
import { cn } from "@/lib/cn";

export type CvMode = "developer" | "designer";
const MODES: CvMode[] = ["developer", "designer"];
const easeOut = [0.16, 1, 0.3, 1] as const;

const CvModeContext = createContext<{ mode: CvMode; setMode: (mode: CvMode) => void }>({
  mode: "developer",
  setMode: () => undefined,
});

function useCvMode() {
  return useContext(CvModeContext);
}

/* ───────────────────────── Root ───────────────────────── */

export function CvModeRoot({ children, className }: { children: ReactNode; className?: string }) {
  const [mode, setModeState] = useState<CvMode>("developer");
  const value = useMemo(() => ({ mode, setMode: setModeState }), [mode]);

  // A shared link can open the CV straight in Designer Mode: /cv#designer
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "designer" || hash === "developer") setModeState(hash);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  return (
    <CvModeContext.Provider value={value}>
      <div className={cn("v3cv", className)} data-mode={mode}>
        {children}
      </div>
    </CvModeContext.Provider>
  );
}

/* ───────────────────────── Switch (tablist) ───────────────────────── */

export function CvModeSwitch({
  label,
  tabs,
  hint,
}: {
  label: string;
  tabs: Record<CvMode, { title: string; body: string }>;
  hint: string;
}) {
  const { mode, setMode } = useCvMode();
  const refs = useRef<Record<CvMode, HTMLButtonElement | null>>({ developer: null, designer: null });

  function select(next: CvMode, focus = false) {
    setMode(next);
    if (focus) refs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = MODES.indexOf(mode);
    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      select(MODES[(index + 1) % MODES.length], true);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(MODES[0], true);
    } else if (event.key === "End") {
      event.preventDefault();
      select(MODES[MODES.length - 1], true);
    }
  }

  return (
    <div className="v3cv-switch-wrap">
      <div className="v3cv-switch" role="tablist" aria-label={label}>
        {MODES.map((item) => {
          const active = item === mode;
          const Icon = item === "developer" ? CodeXml : Palette;
          return (
            <button
              key={item}
              ref={(node) => {
                refs.current[item] = node;
              }}
              id={`cv-tab-${item}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="cv-mode-panel"
              tabIndex={active ? 0 : -1}
              className={cn("v3cv-tab", `v3cv-tab--${item}`, active && "is-active")}
              onClick={() => select(item)}
              onKeyDown={onKeyDown}
            >
              {active ? (
                <motion.span
                  layoutId="v3cv-mode-pill"
                  className="v3cv-tab-pill"
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  aria-hidden
                />
              ) : null}
              <span className="v3cv-tab-icon" aria-hidden>
                <Icon size={20} />
              </span>
              <span className="v3cv-tab-text">
                <strong>{tabs[item].title}</strong>
                <span>{tabs[item].body}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="v3cv-switch-hint">{hint}</p>
    </div>
  );
}

/* ───────────────────────── Mode-dependent text ───────────────────────── */

/** Cross-fades between the two mode variants of a line of copy. */
export function CvModeText({
  values,
  className,
  id,
  labelled,
}: {
  values: Record<CvMode, string>;
  className?: string;
  id?: string;
  labelled?: boolean;
}) {
  const { mode } = useCvMode();
  return (
    <div
      className={cn("v3cv-modetext", className)}
      id={id}
      role={labelled ? "tabpanel" : undefined}
      aria-labelledby={labelled ? `cv-tab-${mode}` : undefined}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={mode}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: easeOut }}
        >
          {values[mode]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Portrait ───────────────────────── */

export function CvPortrait({
  src,
  alt,
  chips,
  badge,
}: {
  src: string;
  alt: string;
  chips: Record<CvMode, string[]>;
  badge: Record<CvMode, string>;
}) {
  const { mode } = useCvMode();
  const reduce = useReducedMotion();
  return (
    <div className="v3cv-portrait">
      <span className="v3cv-portrait-glow" aria-hidden />
      <TiltCard className="v3cv-portrait-tilt" max={6}>
        <div className="v3cv-portrait-frame">
          <motion.div
            className="v3cv-portrait-photo"
            initial={reduce ? false : { opacity: 0, scale: 1.06, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: easeOut }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              priority
              sizes="(max-width: 899px) 88vw, 440px"
              quality={72}
              className="v3-cover v3cv-portrait-img"
            />
          </motion.div>
          <span className="v3cv-portrait-tint" aria-hidden />
          <span className="v3cv-portrait-scanlines" aria-hidden />
          {!reduce ? <span className="v3cv-portrait-scan" aria-hidden /> : null}
          {!reduce ? <span key={mode} className="v3cv-portrait-sweep" aria-hidden /> : null}
          <span className="v3cv-corner v3cv-corner--ts" aria-hidden />
          <span className="v3cv-corner v3cv-corner--te" aria-hidden />
          <span className="v3cv-corner v3cv-corner--bs" aria-hidden />
          <span className="v3cv-corner v3cv-corner--be" aria-hidden />
          <span className="v3cv-portrait-badge">
            <span className="v3cv-dot" aria-hidden />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                {badge[mode]}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
      </TiltCard>
      <div className="v3cv-portrait-chips" aria-hidden>
        <AnimatePresence mode="popLayout" initial={false}>
          {chips[mode].map((chip, index) => (
            <motion.span
              key={`${mode}-${chip}`}
              className={cn("v3cv-float-chip", `v3cv-float-chip--${index}`)}
              initial={{ opacity: 0, scale: 0.6, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.08 * index }}
            >
              {chip}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────────────────────── Terminal ───────────────────────── */

export function CvTerminal({ lines, title }: { lines: Record<CvMode, string[]>; title: string }) {
  const { mode } = useCvMode();
  return (
    <div className="v3cv-terminal">
      <div className="v3cv-terminal-bar" aria-hidden>
        <i />
        <i />
        <i />
        <span>{title}</span>
      </div>
      <TerminalBody key={mode} lines={lines[mode]} />
    </div>
  );
}

function TerminalBody({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  const lengths = lines.map((line) => line.length);
  const total = lengths.reduce((sum, n) => sum + n, 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const ends = new Set<number>();
    lengths.reduce((sum, n) => {
      ends.add(sum + n);
      return sum + n;
    }, 0);
    let typed = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      typed += 1;
      setCount(typed);
      if (typed < total) timer = setTimeout(tick, ends.has(typed) ? 280 : 18);
    };
    timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
    // lengths is derived from lines; total captures changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, total]);

  const shown = reduce ? total : count;
  const starts = lengths.map((_, index) => lengths.slice(0, index).reduce((sum, n) => sum + n, 0));
  return (
    <div className="v3cv-terminal-body" ref={ref}>
      <p className="sr-only">{lines.join(". ")}</p>
      <div aria-hidden>
        {lines.map((line, index) => {
          const start = starts[index];
          const visible = Math.max(0, Math.min(line.length, shown - start));
          const typing = visible > 0 && visible < line.length;
          const isCmd = line.startsWith(">");
          const isLastDone = shown >= total && index === lines.length - 1;
          return (
            <p key={`${index}-${line}`} className={isCmd ? "v3cv-term-cmd" : "v3cv-term-out"} dir="ltr">
              <span>{line.slice(0, visible)}</span>
              {typing || isLastDone ? <span className="v3cv-caret" /> : null}
              <span className="v3cv-term-ghost">{line.slice(visible)}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Skills ───────────────────────── */

export type CvSkillGroup = {
  id: string;
  title: string;
  items: string[];
  /** Modes where this group leads (moves first and takes the accent). */
  lead: CvMode[];
};

export function CvSkills({ groups, leadLabel }: { groups: CvSkillGroup[]; leadLabel: string }) {
  const { mode } = useCvMode();
  const ordered = [...groups].sort((a, b) => Number(b.lead.includes(mode)) - Number(a.lead.includes(mode)));
  return (
    <ul className="v3cv-skills">
      {ordered.map((group) => {
        const lead = group.lead.includes(mode);
        return (
          <motion.li
            layout
            key={group.id}
            className={cn("v3cv-skill", lead && "is-lead")}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
          >
            <div className="v3cv-skill-head">
              <h3>{group.title}</h3>
              {lead ? <span className="v3cv-skill-flag">{leadLabel}</span> : null}
            </div>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ───────────────────────── Projects ───────────────────────── */

export type CvProjectCard = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  desktop: string;
  mobile?: string;
  domain?: string;
  caseHref: string;
  external?: string;
};

export function CvProjects({
  projects,
  labels,
}: {
  projects: Record<CvMode, CvProjectCard[]>;
  labels: { caseStudy: string; visit: string };
}) {
  const { mode } = useCvMode();
  return (
    <div className="v3cv-projects">
      <AnimatePresence mode="popLayout" initial={false}>
        {projects[mode].map((project, index) => (
          <motion.article
            key={`${mode}-${project.slug}`}
            className="v3cv-project"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.55, ease: easeOut, delay: index * 0.07 }}
          >
            <TiltCard className="v3cv-project-media" max={5}>
              <div className="v3cv-project-browser">
                <span className="v3cv-project-dots" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                {project.domain ? <span className="v3cv-project-url">{project.domain}</span> : null}
              </div>
              <div className="v3cv-project-shot">
                <Image
                  src={project.desktop}
                  alt={project.title}
                  fill
                  sizes="(max-width: 899px) 92vw, 420px"
                  className="v3-cover v3-top"
                />
              </div>
              {project.mobile ? (
                <span className="v3cv-project-phone" aria-hidden>
                  <Image src={project.mobile} alt="" fill sizes="110px" className="v3-cover v3-top" />
                </span>
              ) : null}
            </TiltCard>
            <div className="v3cv-project-copy">
              <span className="v3cv-project-eyebrow">{project.eyebrow}</span>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <div className="v3cv-project-links">
                <a href={project.caseHref} className="v3-link">
                  {labels.caseStudy}
                </a>
                {project.external ? (
                  <a href={project.external} target="_blank" rel="noopener noreferrer" className="v3-link v3-link-quiet">
                    {labels.visit}
                    <ArrowUpRight size={14} aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
