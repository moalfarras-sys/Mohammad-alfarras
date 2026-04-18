import type { CmsSnapshot, Locale } from "@/types/cms";

export type CvBuilderSkill = {
  id: string;
  label_ar: string;
  label_en: string;
  level: number;
  category: "product" | "design" | "operations" | "tools";
};

export type CvBuilderLanguage = {
  id: string;
  label_ar: string;
  label_en: string;
  level_ar: string;
  level_en: string;
  proficiency: number;
};

export type CvBuilderEducation = {
  id: string;
  school_ar: string;
  school_en: string;
  degree_ar: string;
  degree_en: string;
  period: string;
  location_ar: string;
  location_en: string;
  details_ar: string;
  details_en: string;
};

export type CvBuilderExperience = {
  id: string;
  company: string;
  role_ar: string;
  role_en: string;
  period_ar: string;
  period_en: string;
  location_ar: string;
  location_en: string;
  summary_ar: string;
  summary_en: string;
  highlights_ar: string[];
  highlights_en: string[];
};

export type CvBuilderLink = {
  id: string;
  label_ar: string;
  label_en: string;
  url: string;
};

export type CvBuilderTheme = {
  template: "signal" | "studio" | "minimal";
  accent: string;
  secondary: string;
  layoutScale: "compact" | "balanced" | "airy";
  showPhoto: boolean;
  showMetrics: boolean;
  defaultVariant: "branded" | "ats";
};

export type CvBuilderSection = {
  id:
    | "summary"
    | "experience"
    | "education"
    | "skills"
    | "languages"
    | "projects"
    | "certifications"
    | "links";
  label_ar: string;
  label_en: string;
  enabled: boolean;
};

export type CvBuilderData = {
  profile: {
    name_ar: string;
    name_en: string;
    headline_ar: string;
    headline_en: string;
    location_ar: string;
    location_en: string;
    availability_ar: string;
    availability_en: string;
    email: string;
    phone: string;
    website: string;
    portrait: string;
  };
  summary: {
    body_ar: string;
    body_en: string;
  };
  experience: CvBuilderExperience[];
  skills: CvBuilderSkill[];
  languages: CvBuilderLanguage[];
  education: CvBuilderEducation[];
  links: CvBuilderLink[];
  sections: CvBuilderSection[];
  selectedProjectIds: string[];
  theme: CvBuilderTheme;
};

type PartialCvBuilderData = Partial<CvBuilderData> & {
  profile?: Partial<CvBuilderData["profile"]>;
  summary?: Partial<CvBuilderData["summary"]>;
  experience?: Array<Partial<CvBuilderExperience> & { period?: string }>;
  skills?: Partial<CvBuilderSkill>[];
  languages?: Partial<CvBuilderLanguage>[];
  education?: Partial<CvBuilderEducation>[];
  links?: Array<Partial<CvBuilderLink> & { label?: string }>;
  sections?: Partial<CvBuilderSection>[];
  theme?: Partial<CvBuilderTheme>;
};

const defaultSections: CvBuilderSection[] = [
  { id: "summary", label_ar: "الملخص التنفيذي", label_en: "Executive Summary", enabled: true },
  { id: "experience", label_ar: "الخبرات", label_en: "Experience", enabled: true },
  { id: "projects", label_ar: "الأعمال المختارة", label_en: "Selected Projects", enabled: true },
  { id: "skills", label_ar: "المهارات", label_en: "Skills", enabled: true },
  { id: "languages", label_ar: "اللغات", label_en: "Languages", enabled: true },
  { id: "education", label_ar: "التعليم", label_en: "Education", enabled: true },
  { id: "certifications", label_ar: "الشهادات", label_en: "Certifications", enabled: true },
  { id: "links", label_ar: "الروابط", label_en: "Links", enabled: true },
];

function getSetting(snapshot: CmsSnapshot, key: string) {
  return snapshot.site_settings.find((item) => item.key === key)?.value_json ?? null;
}

function normalizeArray<T>(items: T[] | undefined, fallback: T[]): T[] {
  return Array.isArray(items) && items.length > 0 ? items : fallback;
}

export function createDefaultCvBuilder(snapshot: CmsSnapshot): CvBuilderData {
  const brandProfile = (getSetting(snapshot, "brand_profile") ?? {}) as Record<string, unknown>;
  const contact = (getSetting(snapshot, "contact") ?? {}) as Record<string, unknown>;
  const availability = (getSetting(snapshot, "availability") ?? {}) as Record<string, unknown>;
  const cvLinks = (getSetting(snapshot, "cv_links") ?? {}) as Record<string, unknown>;

  const projectIds = snapshot.work_projects
    .filter((project) => project.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 4)
    .map((project) => project.id);

  return {
    profile: {
      name_ar: String(brandProfile.title_ar ?? "محمد الفراس"),
      name_en: String(brandProfile.title_en ?? "Mohammad Alfarras"),
      headline_ar: String(
        brandProfile.subtitle_ar ?? "مصمم ومطور ويب ومحتوى تقني يعرف كيف يرتب الفكرة وينفذها بثقة",
      ),
      headline_en: String(
        brandProfile.subtitle_en ?? "Digital experiences, Arabic tech content, and execution shaped by operational discipline",
      ),
      location_ar: String(brandProfile.location_ar ?? "ألمانيا"),
      location_en: String(brandProfile.location_en ?? "Germany"),
      availability_ar: String(
        availability.ar ?? "متاح لمشاريع مواقع احترافية، صفحات هبوط، وصياغة حضور رقمي أكثر وضوحاً وتأثيراً.",
      ),
      availability_en: String(
        availability.en ?? "Available for premium websites, landing pages, and digital presence systems with sharper clarity.",
      ),
      email: String(contact.email ?? "mohammad.alfarras@gmail.com"),
      phone: String(contact.phone ?? "+49 176 23419358"),
      website: "https://moalfarras.space",
      portrait: String(cvLinks.portrait ?? "/images/portrait.jpg"),
    },
    summary: {
      body_ar:
        "أجمع بين عقلية العمليات اليومية، والقدرة على بناء واجهات أوضح وأسرع وأكثر إقناعاً. خبرتي جاءت من بيئات تتطلب دقة وسرعة ومسؤولية مباشرة، ثم انتقلت بهذه العقلية إلى تصميم التجارب الرقمية، المحتوى التقني، وصفحات الويب التي تُشعر الزائر بأن كل شيء مدروس من أول شاشة.",
      body_en:
        "I combine operational discipline with visual judgment to build digital experiences that feel sharper, faster, and more convincing from the first screen. My work is shaped by execution-heavy environments, then translated into web design, product storytelling, and Arabic tech content.",
    },
    experience: [
      {
        id: "exp-rhenus",
        company: "Rhenus Home Delivery GmbH",
        role_ar: "مسؤول توزيع وتشغيل يومي",
        role_en: "Disposition Coordinator",
        period_ar: "نوفمبر 2023 - الآن",
        period_en: "Nov 2023 - Present",
        location_ar: "ألمانيا",
        location_en: "Germany",
        summary_ar:
          "إدارة حركة التوصيل اليومية في بيئة ضغط عالية، تنسيق السائقين والمسارات، العمل على أنظمة TMS، والتعامل المباشر مع خدمة العملاء لضمان تنفيذ منظم وسريع.",
        summary_en:
          "Managing high-pressure home delivery operations, coordinating routes and drivers, operating TMS workflows, and handling customer-facing service execution with speed and structure.",
        highlights_ar: ["تخطيط يومي", "TMS", "تنسيق التوزيع", "خدمة العملاء"],
        highlights_en: ["Daily dispatch", "TMS", "Route coordination", "Customer service"],
      },
      {
        id: "exp-stocubo",
        company: "Stocubo GmbH",
        role_ar: "عامل إنتاج",
        role_en: "Produktionmitarbeiter",
        period_ar: "أكتوبر 2019 - نوفمبر 2022",
        period_en: "Oct 2019 - Nov 2022",
        location_ar: "ألمانيا",
        location_en: "Germany",
        summary_ar:
          "تنفيذ أعمال الإنتاج اليومية ضمن بيئة تشغيل تتطلب دقة وثباتاً في الجودة، مع التزام عالٍ بالوتيرة والانضباط داخل خطوط العمل.",
        summary_en:
          "Handled daily production tasks in a structured environment where consistency, quality, and disciplined execution were essential.",
        highlights_ar: ["جودة التشغيل", "التزام بالوتيرة", "تنفيذ منظم"],
        highlights_en: ["Production quality", "Operational discipline", "Fast-paced execution"],
      },
      {
        id: "exp-malak",
        company: "Internet Café Malak Net",
        role_ar: "مدير عام",
        role_en: "General Manager",
        period_ar: "أغسطس 2014 - يوليو 2015",
        period_en: "Aug 2014 - Jul 2015",
        location_ar: "سوريا",
        location_en: "Syria",
        summary_ar:
          "إدارة العمليات اليومية للمقهى، الإشراف على الفريق، متابعة خدمة العملاء والمبيعات، وتنظيم التشغيل المباشر في بيئة تعتمد على المرونة والسرعة.",
        summary_en:
          "Managed daily operations, supervised staff, handled customer service and sales, and kept the business running through direct hands-on coordination.",
        highlights_ar: ["إدارة عمليات", "إشراف فريق", "خدمة العملاء", "مبيعات"],
        highlights_en: ["Operations management", "Team supervision", "Customer service", "Sales"],
      },
    ],
    skills: [
      {
        id: "skill-nav",
        label_ar: "Microsoft Dynamics NAV",
        label_en: "Microsoft Dynamics NAV",
        level: 88,
        category: "product",
      },
      { id: "skill-datev", label_ar: "DATEV Pro", label_en: "DATEV Pro", level: 86, category: "tools" },
      { id: "skill-lexware", label_ar: "Lexware Pro", label_en: "Lexware Pro", level: 82, category: "tools" },
      { id: "skill-photoshop", label_ar: "Photoshop", label_en: "Photoshop", level: 84, category: "design" },
    ],
    languages: [
      {
        id: "lang-ar",
        label_ar: "العربية",
        label_en: "Arabic",
        level_ar: "لغة أم",
        level_en: "Native",
        proficiency: 100,
      },
      {
        id: "lang-de",
        label_ar: "الألمانية",
        label_en: "German",
        level_ar: "بطلاقة",
        level_en: "Fluent",
        proficiency: 88,
      },
      {
        id: "lang-en",
        label_ar: "الإنجليزية",
        label_en: "English",
        level_ar: "احترافية",
        level_en: "Professional",
        proficiency: 82,
      },
      {
        id: "lang-fr",
        label_ar: "الفرنسية",
        label_en: "French",
        level_ar: "أساسية",
        level_en: "Basic",
        proficiency: 58,
      },
    ],
    education: [
      {
        id: "edu-comhard",
        school_ar: "Comhard GmbH",
        school_en: "Comhard GmbH",
        degree_ar: "Finanzbuchführung 1, 2, 3 مع DATEV + Deutsch B2",
        degree_en: "Finanzbuchführung 1, 2, 3 with DATEV + German B2",
        period: "2023",
        location_ar: "ألمانيا",
        location_en: "Germany",
        details_ar:
          "مسار تدريبي يركّز على المحاسبة العملية واستخدام DATEV مع تطوير اللغة الألمانية للمستوى المهني اليومي.",
        details_en:
          "Practical accounting training focused on DATEV workflows alongside German language development at B2 level.",
      },
      {
        id: "edu-sandbox",
        school_ar: "Sandbox Berlin GmbH",
        school_en: "Sandbox Berlin GmbH",
        degree_ar: "برامج تطوير مهني ومهارات رقمية",
        degree_en: "Professional upskilling and digital development",
        period: "2022",
        location_ar: "ألمانيا",
        location_en: "Germany",
        details_ar:
          "ورش مكثفة لتطوير الجاهزية المهنية، الانضباط العملي، والانتقال إلى مسارات رقمية أكثر وضوحاً.",
        details_en:
          "Intensive workshops focused on professional readiness, practical discipline, and transition into digital-oriented tracks.",
      },
      {
        id: "edu-furat",
        school_ar: "جامعة الفرات",
        school_en: "Al Furat University",
        degree_ar: "دراسات جامعية",
        degree_en: "University studies",
        period: "2011 - 2014",
        location_ar: "سوريا",
        location_en: "Syria",
        details_ar: "مرحلة أكاديمية سبقت التحول إلى العمل التشغيلي ثم إلى العالم الرقمي وصناعة الويب.",
        details_en: "Academic foundation before moving into operational work and later into digital experience building.",
      },
    ],
    links: [
      { id: "link-site", label_ar: "الموقع", label_en: "Website", url: "https://moalfarras.space" },
      { id: "link-youtube", label_ar: "يوتيوب", label_en: "YouTube", url: "https://www.youtube.com/@Moalfarras" },
      { id: "link-github", label_ar: "غيت هب", label_en: "GitHub", url: "https://github.com/moalfarras-sys" },
      { id: "link-whatsapp", label_ar: "واتساب", label_en: "WhatsApp", url: "https://wa.me/4917623419358" },
    ],
    sections: defaultSections,
    selectedProjectIds: projectIds,
    theme: {
      template: "signal",
      accent: "#00E5FF",
      secondary: "#6366F1",
      layoutScale: "balanced",
      showPhoto: true,
      showMetrics: true,
      defaultVariant: "branded",
    },
  };
}

function normalizeExperience(
  items: Array<Partial<CvBuilderExperience> & { period?: string }> | undefined,
  fallback: CvBuilderExperience[],
) {
  return normalizeArray(items, fallback).map((entry, index) => {
    const defaults = fallback[index % fallback.length];

    return {
      ...defaults,
      ...entry,
      id: entry.id || `exp-${index + 1}`,
      period_ar: entry.period_ar || entry.period || defaults.period_ar,
      period_en: entry.period_en || entry.period || defaults.period_en,
      highlights_ar: entry.highlights_ar ?? defaults.highlights_ar,
      highlights_en: entry.highlights_en ?? defaults.highlights_en,
    };
  });
}

function normalizeSkills(items: Partial<CvBuilderSkill>[] | undefined, fallback: CvBuilderSkill[]) {
  return normalizeArray(items, fallback).map((entry, index) => {
    const defaults = fallback[index % fallback.length];
    return {
      ...defaults,
      ...entry,
      id: entry.id || `skill-${index + 1}`,
      level: Number(entry.level ?? defaults.level),
      category: entry.category ?? defaults.category,
    };
  });
}

function normalizeLanguages(items: Partial<CvBuilderLanguage>[] | undefined, fallback: CvBuilderLanguage[]) {
  return normalizeArray(items, fallback).map((entry, index) => {
    const defaults = fallback[index % fallback.length];
    return {
      ...defaults,
      ...entry,
      id: entry.id || `lang-${index + 1}`,
      proficiency: Number(entry.proficiency ?? defaults.proficiency),
    };
  });
}

function normalizeEducation(items: Partial<CvBuilderEducation>[] | undefined, fallback: CvBuilderEducation[]) {
  return normalizeArray(items, fallback).map((entry, index) => ({
    ...fallback[index % fallback.length],
    ...entry,
    id: entry.id || `edu-${index + 1}`,
  }));
}

function normalizeLinks(
  items: Array<Partial<CvBuilderLink> & { label?: string }> | undefined,
  fallback: CvBuilderLink[],
) {
  return normalizeArray(items, fallback).map((entry, index) => {
    const defaults = fallback[index % fallback.length];
    return {
      ...defaults,
      ...entry,
      id: entry.id || `link-${index + 1}`,
      label_ar: entry.label_ar || entry.label || defaults.label_ar,
      label_en: entry.label_en || entry.label || defaults.label_en,
    };
  });
}

function normalizeSections(items: Partial<CvBuilderSection>[] | undefined, fallback: CvBuilderSection[]) {
  return normalizeArray(items, fallback).map((entry, index) => ({
    ...fallback[index % fallback.length],
    ...entry,
    id: entry.id || fallback[index % fallback.length].id,
    enabled: entry.enabled ?? fallback[index % fallback.length].enabled,
  }));
}

export function getCvBuilderData(snapshot: CmsSnapshot): CvBuilderData {
  const defaults = createDefaultCvBuilder(snapshot);
  const stored = (getSetting(snapshot, "cv_builder") ?? {}) as PartialCvBuilderData;

  return {
    profile: { ...defaults.profile, ...(stored.profile ?? {}) },
    summary: { ...defaults.summary, ...(stored.summary ?? {}) },
    experience: normalizeExperience(stored.experience, defaults.experience),
    skills: normalizeSkills(stored.skills, defaults.skills),
    languages: normalizeLanguages(stored.languages, defaults.languages),
    education: normalizeEducation(stored.education, defaults.education),
    links: normalizeLinks(stored.links, defaults.links),
    sections: normalizeSections(stored.sections, defaults.sections),
    selectedProjectIds: normalizeArray(stored.selectedProjectIds, defaults.selectedProjectIds),
    theme: { ...defaults.theme, ...(stored.theme ?? {}) },
  };
}

export function localizeCvText(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export function getOrderedCvSections(data: CvBuilderData) {
  return data.sections.filter((section) => section.enabled);
}
