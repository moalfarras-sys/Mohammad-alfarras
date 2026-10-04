import {
  ArrowDown,
  ArrowUpRight,
  BriefcaseBusiness,
  Download,
  FileText,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Printer,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { SiteProject } from "@/components/site/site-view-model";
import {
  CvModeRoot,
  CvModeSwitch,
  CvModeText,
  CvPortrait,
  CvProjects,
  CvSkills,
  CvTerminal,
  type CvMode,
  type CvProjectCard,
  type CvSkillGroup,
} from "@/components/v3/cv-mode";
import { Reveal, SplitHeadline, Stagger } from "@/components/v3/motion-kit";
import { socialLinks } from "@/content/site";
import { languageLevels } from "@/content/site-data";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

type CvExperience = {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
};

type CvEducation = {
  id: string;
  school: string;
  degree: string;
  period: string;
  location: string;
};

export type CvPageV3Props = {
  locale: Locale;
  profileName: string;
  portrait: string;
  downloads: { branded: string; docx: string };
  experience: CvExperience[];
  education: CvEducation[];
  projects: SiteProject[];
  liveSites: number;
};

const FLAGS: Record<string, string> = {
  ar: "/icons/flag-sy-new.svg",
  de: "/icons/flag-de.svg",
  en: "/icons/flag-gb.svg",
};

/** Which client projects each mode puts forward (real projects from the site model). */
const PROJECT_PICKS: Record<CvMode, string[]> = {
  developer: ["qamishli", "alhasakah", "ad-fahrzeugtransporte"],
  designer: ["mbkservice", "seel", "intelligent-umzuege"],
};

function copy(locale: Locale, liveSites: number, domains: Record<CvMode, string[]>) {
  if (locale === "ar") {
    return {
      pill: "السيرة الذاتية · ألمانيا",
      role: "مطوّر ومصمّم مواقع ومنتجات رقمية",
      switchLabel: "اختر طريقة عرض السيرة",
      switchHint: "بدّل الوضع — يتغيّر اللون، المهارات، المشاريع ونص الطرفية.",
      tabs: {
        developer: { title: "وضع المطوّر", body: "مواقع وتطبيقات سريعة، أنظمة واضحة، وكود قابل للنمو." },
        designer: { title: "وضع المصمّم", body: "واجهات مقنعة، أنظمة تصميم، ونص يحكي قصة المنتج." },
      },
      hook: {
        developer: "أبني المنتج كنظام كامل: سريع، واضح، وقابل للنمو — من الصفحة الأولى حتى الإصدار الموقّع.",
        designer: "أصمّم تجربة تُفهم من أول شاشة: هيكل واضح، عربية وإنجليزية بنفس المستوى، وحركة هادئة.",
      },
      badge: { developer: "وضع المطوّر · مفعّل", designer: "وضع المصمّم · مفعّل" },
      chips: {
        developer: ["Next.js · React · TypeScript", "Android TV · Kotlin", "Supabase · Vercel"],
        designer: ["UI/UX · أنظمة تصميم", "واجهات عربية RTL", "حركة وتفاعل"],
      },
      location: "مقيم في ألمانيا · من الحسكة، سوريا",
      pdf: "تحميل PDF",
      allFormats: "كل الصيغ",
      summaryLabel: "ملخص مهني",
      summary: [
        "مطوّر ومصمّم ويب مقيم في ألمانيا، أبني مواقع وصفحات منتجات عربية وإنجليزية لشركات حقيقية في ألمانيا وسوريا.",
        "مالك ومطوّر MoPlayer — مشغّلات لأجهزة Android و Android TV و Windows مع تفعيل QR وإصدارات موقّعة — وأعمل على MoOS، نظام تشغيل عربي أولاً.",
        "عملي اليومي في الديسبوزيشن لدى Rhenus علّمني التنفيذ الهادئ تحت الضغط، وأشرح التقنية بالعربية على يوتيوب.",
      ],
      terminalTitle: "terminal — moalfarras",
      terminal: {
        developer: [
          "> whoami",
          "Mohammad Alfarras — web developer · Germany",
          "> stack --main",
          "Next.js · React · TypeScript · Supabase · Kotlin",
          "> ls ./shipped",
          `moplayer-classic  moplayer-pro  moplayer-pc  ${liveSites} client sites`,
          "> status",
          "open to web & product roles · AR / DE / EN",
        ],
        designer: [
          "> whoami --mode designer",
          "Mohammad Alfarras — digital designer · Germany",
          "> focus",
          "UI/UX · design systems · Arabic RTL · motion",
          "> open ./portfolio",
          domains.designer.join("  "),
          "> status",
          "designing for trust from the first screen",
        ],
      },
      experienceLabel: "الخبرة",
      experienceTitle: "الأدوار *والتواريخ*.",
      educationLabel: "التعليم والتدريب",
      skillsLabel: "المهارات",
      skillsTitle: "المهارات *حسب الوضع*.",
      skillsLead: "في المقدمة",
      skills: [
        { id: "web", title: "هندسة الويب", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase / Postgres", "Vercel"], lead: ["developer"] },
        { id: "android", title: "Android و Android TV", items: ["Kotlin", "Jetpack Compose", "Media3 / ExoPlayer", "تفعيل QR", "إصدارات موقّعة وتحديثات"], lead: ["developer"] },
        { id: "ui", title: "تصميم الواجهات", items: ["UI/UX", "أنظمة تصميم", "تصميم للجوال أولاً", "واجهات عربية RTL", "حركة Framer Motion"], lead: ["designer"] },
        { id: "story", title: "المحتوى والمنتج", items: ["صفحات منتجات", "دراسات حالة", "نصوص عربية/إنجليزية", "بيانات SEO", "فيديوهات تقنية"], lead: ["designer"] },
        { id: "ops", title: "التشغيل والتسليم", items: ["ديسبوزيشن", "TMS", "تنسيق المسارات والسائقين", "خدمة العملاء", "محاسبة DATEV"], lead: [] },
      ] satisfies CvSkillGroup[],
      languagesLabel: "اللغات",
      projectsLabel: "مشاريع مختارة",
      projectsTitle: "ثلاثة مشاريع *حقيقية* — تتغيّر مع الوضع.",
      caseStudy: "دراسة الحالة",
      visit: "زيارة الموقع",
      downloadsLabel: "التحميل",
      downloadsTitle: "السيرة بكل *الصيغ*.",
      downloads: {
        pdf: ["PDF مصمّم", "للقراءة والطباعة"],
        docx: ["DOCX", "قابلة للتعديل وأنظمة ATS"],
        de: ["Lebenslauf (DE)", "النسخة الألمانية بصيغة PDF"],
        print: ["نسخة الطباعة", "صفحة نظيفة للطباعة من المتصفح"],
      },
      ctaLabel: "توظيف أو مشروع؟",
      ctaTitle: "لنتحدث عن *الدور* أو المشروع.",
      ctaBody: "أرسل الدور، النطاق، المدة، وما الذي يجب أن يثبته العمل — أردّ بالعربية أو الألمانية أو الإنجليزية.",
      contact: "تواصل معي",
      about: "القصة الشخصية",
      portraitAlt: "صورة محمد الفراس في الاستوديو",
      moplayer: {
        id: "moplayer",
        role: "MoPlayer — مالك المنتج ومطوّره",
        company: "منتج خاص · Android و Android TV و Windows",
        period: "2024 – الآن",
        location: "عن بُعد",
        description: "مشغّلات وسائط لمصادر M3U/Xtream التي يضيفها المستخدم، مع تفعيل QR وإصدارات موقّعة وتحديثات داخل التطبيق.",
        highlights: ["Android TV", "تفعيل QR", "نظام إصدارات", "دعم"],
      },
    };
  }
  return {
    pill: "Curriculum vitae · Germany",
    role: "Web developer & digital designer",
    switchLabel: "Choose how to read this CV",
    switchHint: "Switch the mode — colour, skills, projects and the terminal change with it.",
    tabs: {
      developer: { title: "Developer Mode", body: "Fast web apps, clean systems and code that can grow." },
      designer: { title: "Designer Mode", body: "Convincing interfaces, design systems and copy that tells the story." },
    },
    hook: {
      developer: "I build the product as a complete system — fast, clear and ready to grow, from the first page to the signed release.",
      designer: "I design experiences people understand on the first screen — clear structure, Arabic and English at the same level, calm motion.",
    },
    badge: { developer: "Developer mode · on", designer: "Designer mode · on" },
    chips: {
      developer: ["Next.js · React · TypeScript", "Android TV · Kotlin", "Supabase · Vercel"],
      designer: ["UI/UX · design systems", "Arabic RTL interfaces", "Motion & interaction"],
    },
    location: "Based in Germany · from Al-Hasakah, Syria",
    pdf: "Download PDF",
    allFormats: "All formats",
    summaryLabel: "Professional summary",
    summary: [
      "Web developer and digital designer in Germany, building bilingual Arabic/English websites and product pages for real businesses in Germany and Syria.",
      "Product owner and developer of MoPlayer — players for Android, Android TV and Windows with QR activation and signed releases — and builder of MoOS, an Arabic-first OS.",
      "Daily disposition work at Rhenus keeps my delivery calm under pressure; on YouTube I explain technology in Arabic.",
    ],
    terminalTitle: "terminal — moalfarras",
    terminal: {
      developer: [
        "> whoami",
        "Mohammad Alfarras — web developer · Germany",
        "> stack --main",
        "Next.js · React · TypeScript · Supabase · Kotlin",
        "> ls ./shipped",
        `moplayer-classic  moplayer-pro  moplayer-pc  ${liveSites} client sites`,
        "> status",
        "open to web & product roles · AR / DE / EN",
      ],
      designer: [
        "> whoami --mode designer",
        "Mohammad Alfarras — digital designer · Germany",
        "> focus",
        "UI/UX · design systems · Arabic RTL · motion",
        "> open ./portfolio",
        domains.designer.join("  "),
        "> status",
        "designing for trust from the first screen",
      ],
    },
    experienceLabel: "Experience",
    experienceTitle: "Roles and *dates*.",
    educationLabel: "Education & training",
    skillsLabel: "Skills",
    skillsTitle: "Skills, *by mode*.",
    skillsLead: "Leading",
    skills: [
      { id: "web", title: "Web engineering", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase / Postgres", "Vercel"], lead: ["developer"] },
      { id: "android", title: "Android & Android TV", items: ["Kotlin", "Jetpack Compose", "Media3 / ExoPlayer", "QR activation", "Signed releases & updates"], lead: ["developer"] },
      { id: "ui", title: "Interface design", items: ["UI/UX", "Design systems", "Mobile-first layouts", "Arabic RTL interfaces", "Framer Motion"], lead: ["designer"] },
      { id: "story", title: "Content & product", items: ["Product pages", "Case studies", "Arabic/English copy", "Search metadata", "Tech videos"], lead: ["designer"] },
      { id: "ops", title: "Operations & delivery", items: ["Disposition", "TMS", "Route & driver coordination", "Customer service", "DATEV accounting"], lead: [] },
    ] satisfies CvSkillGroup[],
    languagesLabel: "Languages",
    projectsLabel: "Selected projects",
    projectsTitle: "Three *real* projects — they change with the mode.",
    caseStudy: "Case study",
    visit: "Visit site",
    downloadsLabel: "Downloads",
    downloadsTitle: "The CV in every *format*.",
    downloads: {
      pdf: ["Designed PDF", "For reading and printing"],
      docx: ["DOCX", "Editable, ATS-friendly"],
      de: ["Lebenslauf (DE)", "German version as PDF"],
      print: ["Print view", "A clean page to print from the browser"],
    },
    ctaLabel: "Hiring or briefing?",
    ctaTitle: "Let's talk about the *role* or project.",
    ctaBody: "Send the role, the scope, the timeline and what needs to be proven — I reply in Arabic, German or English.",
    contact: "Contact me",
    about: "The personal story",
    portraitAlt: "Studio portrait of Mohammad Alfarras",
    moplayer: {
      id: "moplayer",
      role: "MoPlayer — product owner & developer",
      company: "Own product · Android, Android TV, Windows",
      period: "2024 – now",
      location: "Remote",
      description: "Media players for user-provided M3U/Xtream sources, with QR activation, signed releases and in-app updates.",
      highlights: ["Android TV", "QR activation", "Release pipeline", "Support"],
    },
  };
}

function domainOf(href?: string) {
  if (!href) return undefined;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function firstYear(period: string) {
  const match = period.match(/(\d{4})/);
  return match ? Number(match[1]) : 0;
}

/** Splits "*accent*" words for headings rendered without SplitHeadline. */
function Accent({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, index) =>
        part.startsWith("*") ? (
          <span key={index} className="v3-accent">
            {part.replace(/\*/g, "")}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function SectionHead({ index, label, title }: { index: string; label: string; title: string }) {
  return (
    <Reveal className="v3cv-head">
      <p className="v3cv-kicker">
        <span>{index}</span>
        {label}
      </p>
      <h2 className="v3cv-h2">
        <Accent text={title} />
      </h2>
    </Reveal>
  );
}

export function CvPageV3({ locale, profileName, portrait, downloads, experience, education, projects, liveSites }: CvPageV3Props) {
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const cards = (Object.keys(PROJECT_PICKS) as CvMode[]).reduce(
    (acc, mode) => {
      acc[mode] = PROJECT_PICKS[mode]
        .map((slug) => bySlug.get(slug))
        .filter((project): project is SiteProject => Boolean(project && project.image))
        .map((project) => ({
          slug: project.slug,
          title: project.title,
          eyebrow: project.eyebrow,
          summary: project.summary,
          desktop: project.image,
          mobile: project.gallery.find((src) => /mobile/i.test(src)),
          domain: domainOf(project.href),
          caseHref: withLocale(locale, `work/${project.slug}`),
          external: project.href,
        }));
      return acc;
    },
    { developer: [], designer: [] } as Record<CvMode, CvProjectCard[]>,
  );
  const domains = {
    developer: cards.developer.map((card) => card.domain).filter(Boolean) as string[],
    designer: cards.designer.map((card) => card.domain).filter(Boolean) as string[],
  };
  const t = copy(locale, liveSites, domains);
  const roles = [...experience, { ...t.moplayer, highlights: [...t.moplayer.highlights] }].sort(
    (a, b) => firstYear(b.period) - firstYear(a.period),
  );
  const languages = languageLevels[locale];
  const germanPdf = "/api/cv-pdf?locale=de&variant=branded";
  const printView = `/cv-print/${locale}`;

  return (
    <CvModeRoot className="st-page">
      {/* ── Hero: the mode switch is the centrepiece ── */}
      <section className="v3cv-hero">
        <span className="v3cv-hero-grid" aria-hidden />
        <div className="st-container v3cv-hero-inner">
          <div className="v3cv-hero-portrait">
            <CvPortrait src={portrait} alt={t.portraitAlt} chips={t.chips} badge={t.badge} />
          </div>
          <div className="v3cv-hero-copy">
            <Reveal y={16} className="v3cv-o-pill">
              <p className="st-pill">
                <span className="st-pill-dot v3cv-pill-dot" aria-hidden />
                {t.pill}
              </p>
            </Reveal>
            <SplitHeadline as="h1" immediate text={profileName} className="v3cv-name" delay={0.1} />
            <Reveal delay={0.25} y={14} className="v3cv-o-role">
              <p className="v3cv-role">{t.role}</p>
            </Reveal>
            <Reveal delay={0.35} y={18} className="v3cv-o-switch">
              <CvModeSwitch label={t.switchLabel} tabs={t.tabs} hint={t.switchHint} />
            </Reveal>
            <CvModeText values={t.hook} className="v3cv-hook" id="cv-mode-panel" labelled />
            <Reveal delay={0.45} y={14} className="v3cv-o-facts">
              <ul className="v3cv-facts">
                <li>
                  <MapPin size={15} aria-hidden /> {t.location}
                </li>
                <li>
                  <Languages size={15} aria-hidden /> {languages.map((language) => language.label).join(" · ")}
                </li>
                <li>
                  <Mail size={15} aria-hidden /> <a href={`mailto:${socialLinks.email}`}>{socialLinks.email}</a>
                </li>
              </ul>
              <div className="st-actions v3cv-actions">
                <a href={downloads.branded} className="st-btn st-btn--primary" download>
                  <Download size={17} aria-hidden />
                  {t.pdf}
                </a>
                <a href="#cv-downloads" className="st-btn st-btn--ghost">
                  {t.allFormats}
                  <ArrowDown size={16} aria-hidden />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Summary + terminal ── */}
      <section className="v3cv-section">
        <div className="st-container v3cv-summary">
          <Reveal className="v3cv-summary-copy">
            <p className="v3cv-kicker">
              <span>01</span>
              {t.summaryLabel}
            </p>
            <ol className="v3cv-summary-lines">
              {t.summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1} className="v3cv-summary-terminal">
            <CvTerminal lines={t.terminal} title={t.terminalTitle} />
          </Reveal>
        </div>
      </section>

      {/* ── Experience ── */}
      <section className="v3cv-section">
        <div className="st-container">
          <SectionHead index="02" label={t.experienceLabel} title={t.experienceTitle} />
          <div className="v3cv-exp-layout">
            <Stagger className="v3cv-roles" gap={0.09}>
              {roles.map((item) => (
                <article className="v3cv-role-row" key={item.id}>
                  <div className="v3cv-role-when">
                    <span className="v3cv-role-period">{item.period}</span>
                    <span>{item.location}</span>
                  </div>
                  <div className="v3cv-role-body">
                    <h3>
                      <BriefcaseBusiness size={17} aria-hidden />
                      {item.role}
                    </h3>
                    <p className="v3cv-role-company">{item.company}</p>
                    {item.description ? <p className="v3cv-role-desc">{item.description}</p> : null}
                    {item.highlights.length ? (
                      <ul className="v3cv-tags">
                        {item.highlights.slice(0, 4).map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              ))}
            </Stagger>
            {education.length ? (
              <Reveal className="v3cv-edu" delay={0.1}>
                <p className="v3cv-edu-title">
                  <GraduationCap size={17} aria-hidden />
                  {t.educationLabel}
                </p>
                <ul>
                  {education.map((item) => (
                    <li key={item.id}>
                      <span className="v3cv-role-period">{item.period}</span>
                      <strong>{item.school}</strong>
                      <span>{item.degree}</span>
                      <span className="v3cv-edu-loc">{item.location}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Skills (mode-aware) + languages ── */}
      <section className="v3cv-section">
        <div className="st-container">
          <SectionHead index="03" label={t.skillsLabel} title={t.skillsTitle} />
          <CvSkills groups={t.skills} leadLabel={t.skillsLead} />
          <Reveal className="v3cv-langs">
            <p className="v3cv-kicker v3cv-kicker--small">{t.languagesLabel}</p>
            <ul>
              {languages.map((language) => (
                <li key={language.id}>
                  {FLAGS[language.id] ? (
                    <span className="v3cv-flag">
                      <Image src={FLAGS[language.id]} alt="" width={44} height={44} />
                    </span>
                  ) : null}
                  <span>
                    <strong>{language.label}</strong>
                    <span>{language.level}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Selected projects (mode-aware) ── */}
      <section className="v3cv-section">
        <div className="st-container">
          <SectionHead index="04" label={t.projectsLabel} title={t.projectsTitle} />
          <CvProjects projects={cards} labels={{ caseStudy: t.caseStudy, visit: t.visit }} />
        </div>
      </section>

      {/* ── Downloads ── */}
      <section className="v3cv-section" id="cv-downloads">
        <div className="st-container">
          <SectionHead index="05" label={t.downloadsLabel} title={t.downloadsTitle} />
          <Stagger className="v3cv-downloads" gap={0.07}>
            <a href={downloads.branded} className="v3cv-download" download>
              <Download size={22} aria-hidden />
              <strong>{t.downloads.pdf[0]}</strong>
              <span>{t.downloads.pdf[1]}</span>
            </a>
            <a href={downloads.docx} className="v3cv-download" download>
              <FileText size={22} aria-hidden />
              <strong>{t.downloads.docx[0]}</strong>
              <span>{t.downloads.docx[1]}</span>
            </a>
            <a href={germanPdf} className="v3cv-download" download hrefLang="de">
              <Languages size={22} aria-hidden />
              <strong>{t.downloads.de[0]}</strong>
              <span>{t.downloads.de[1]}</span>
            </a>
            <a href={printView} className="v3cv-download" target="_blank" rel="noopener">
              <Printer size={22} aria-hidden />
              <strong>{t.downloads.print[0]}</strong>
              <span>{t.downloads.print[1]}</span>
            </a>
          </Stagger>
        </div>
      </section>

      {/* ── One CTA ── */}
      <section className="v3cv-section v3cv-section--last">
        <div className="st-container">
          <Reveal className="v3cv-cta">
            <p className="v3cv-kicker v3cv-kicker--small">{t.ctaLabel}</p>
            <h2 className="v3cv-h2">
              <Accent text={t.ctaTitle} />
            </h2>
            <p className="v3cv-cta-body">{t.ctaBody}</p>
            <div className="st-actions st-actions--center">
              <Link href={withLocale(locale, "contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
                {t.contact}
                <ArrowUpRight size={18} aria-hidden />
              </Link>
              <Link href={withLocale(locale, "about")} prefetch={false} className="v3-link v3cv-cta-about">
                {t.about}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </CvModeRoot>
  );
}
