import { getSiteSetting } from "@/lib/content/store";
import type { CmsSnapshot, Locale, MediaAsset, WorkProject } from "@/types/cms";

export type ProjectStudioMetric = {
  value: string;
  label_ar: string;
  label_en: string;
};

export type ProjectStudioItem = {
  project_id: string;
  is_featured: boolean;
  featured_rank: number;
  accent: "green" | "orange" | "cyan" | "purple";
  highlight_style: "operations" | "trust" | "app" | "editorial";
  device_frame: "browser" | "phone" | "floating";
  eyebrow_ar: string;
  eyebrow_en: string;
  challenge_ar: string;
  challenge_en: string;
  solution_ar: string;
  solution_en: string;
  result_ar: string;
  result_en: string;
  tags_ar: string[];
  tags_en: string[];
  metrics: ProjectStudioMetric[];
  gallery_media_ids: string[];
};

export type ProjectsStudioSetting = {
  version: 1;
  items: ProjectStudioItem[];
};

const DEFAULT_METRICS: Record<string, ProjectStudioMetric[]> = {
  seel: [
    { value: "24/7", label_ar: "إيقاع تشغيلي", label_en: "Operations rhythm" },
    { value: "TMS", label_ar: "تنسيق المسارات", label_en: "Route management" },
    { value: "B2B", label_ar: "ثقة الخدمة", label_en: "Service trust" },
  ],
  schnell: [
    { value: "< 60s", label_ar: "وضوح العرض", label_en: "First-screen clarity" },
    { value: "Lead", label_ar: "تركيز على الطلب", label_en: "Lead-first structure" },
    { value: "Trust", label_ar: "بناء الثقة", label_en: "Trust layer" },
  ],
  moplayer: [
    { value: "Mobile", label_ar: "أولوية الهاتف", label_en: "Mobile first" },
    { value: "Flow", label_ar: "إيقاع ناعم", label_en: "Smooth flow" },
    { value: "UI", label_ar: "واجهة مركزة", label_en: "Focused interface" },
  ],
};

function projectKey(project: Pick<WorkProject, "slug">) {
  const slug = project.slug.toLowerCase();
  if (slug.includes("seel")) return "seel";
  if (slug.includes("schnell")) return "schnell";
  if (slug.includes("moplayer")) return "moplayer";
  return "default";
}

function fallbackGalleryIds(project: Pick<WorkProject, "slug">): string[] {
  const key = projectKey(project);
  if (key === "seel") return ["m20", "m21", "m50"];
  if (key === "schnell") return ["m22", "m23", "m51"];
  if (key === "moplayer") return ["m34", "m50", "m1"];
  return [];
}

export function createDefaultProjectStudioItem(project: WorkProject): ProjectStudioItem {
  const key = projectKey(project);
  if (key === "seel") {
    return {
      project_id: project.id,
      is_featured: true,
      featured_rank: 1,
      accent: "green",
      highlight_style: "operations",
      device_frame: "browser",
      eyebrow_ar: "منصة خدمات وتشغيل",
      eyebrow_en: "Operations-led service platform",
      challenge_ar: "كان المطلوب أن تبدو الخدمة أكثر ثقة وتنظيماً من أول شاشة، لا أن تبدو مجرد موقع نقل عادي.",
      challenge_en: "The goal was to make the service feel more credible and structured from the first screen, not like a generic transport site.",
      solution_ar: "أعدت بناء التسلسل البصري ومسار القراءة حول الوضوح التشغيلي، سرعة الفهم، وإحساس الثقة التجاري.",
      solution_en: "I rebuilt the hierarchy around operational clarity, faster comprehension, and stronger commercial trust.",
      result_ar: "النتيجة كانت واجهة أكثر هدوءاً، أوضح في القرار، وأقرب لطبيعة شركة تعمل تحت ضغط يومي حقيقي.",
      result_en: "The result is calmer, clearer, and much closer to how a real high-pressure logistics business should present itself.",
      tags_ar: ["لوجستيات", "واجهة تشغيل", "ثقة الخدمة"],
      tags_en: ["Logistics", "Operations UI", "Service trust"],
      metrics: DEFAULT_METRICS.seel,
      gallery_media_ids: fallbackGalleryIds(project),
    };
  }

  if (key === "schnell") {
    return {
      project_id: project.id,
      is_featured: true,
      featured_rank: 2,
      accent: "orange",
      highlight_style: "trust",
      device_frame: "browser",
      eyebrow_ar: "موقع حجز وتحويل",
      eyebrow_en: "Lead-generation service site",
      challenge_ar: "في هذا النوع من الخدمات، القرار سريع، وأي تشويش في الرسالة أو الترتيب يضيع الطلب فوراً.",
      challenge_en: "In this category, decisions are fast, and any noise in the message or structure costs the conversion immediately.",
      solution_ar: "تم بناء الصفحة حول عرض واضح، CTA مباشر، وتسلسل يقود الزائر نحو الطلب بدون ضجيج بصري.",
      solution_en: "The page was rebuilt around a clearer offer, a direct CTA, and a visual sequence that drives the visitor toward action.",
      result_ar: "واجهة أكثر إقناعاً، أقرب للحجز الفعلي، وأقوى في الانطباع والثقة من أول زيارة.",
      result_en: "A more persuasive interface with stronger booking intent and a sharper first-visit trust signal.",
      tags_ar: ["حجز", "واجهة مبيعات", "تحويل"],
      tags_en: ["Booking", "Sales UI", "Conversion"],
      metrics: DEFAULT_METRICS.schnell,
      gallery_media_ids: fallbackGalleryIds(project),
    };
  }

  if (key === "moplayer") {
    return {
      project_id: project.id,
      is_featured: true,
      featured_rank: 3,
      accent: "cyan",
      highlight_style: "app",
      device_frame: "phone",
      eyebrow_ar: "تجربة تطبيق ومنتج",
      eyebrow_en: "App and product experience",
      challenge_ar: "الفكرة كانت تقديم تجربة ترفيهية أسرع وأوضح، مع واجهة تشعر أنها منتج حقيقي وليس مجرد mockup.",
      challenge_en: "The challenge was to present a cleaner entertainment experience that feels like a real product, not just a concept screen.",
      solution_ar: "تم التركيز على framing للهاتف، إيقاع واجهة ناعم، ورسالة بصرية توحي بمنتج جاهز للتوسع.",
      solution_en: "The build focuses on mobile framing, a smoother UI rhythm, and a presentation that feels launch-ready and scalable.",
      result_ar: "هوية تطبيق أوضح، عرض أقوى للمزايا، وتجربة أقرب إلى منتج قابل للتسويق والتطوير.",
      result_en: "A clearer app identity, stronger feature communication, and a product story that feels ready for growth.",
      tags_ar: ["تطبيق", "واجهة هاتف", "منتج رقمي"],
      tags_en: ["App", "Mobile UI", "Digital product"],
      metrics: DEFAULT_METRICS.moplayer,
      gallery_media_ids: fallbackGalleryIds(project),
    };
  }

  return {
    project_id: project.id,
    is_featured: false,
    featured_rank: 99,
    accent: "purple",
    highlight_style: "editorial",
    device_frame: "floating",
    eyebrow_ar: "دراسة حالة رقمية",
    eyebrow_en: "Digital case study",
    challenge_ar: "كل مشروع يحتاج عرضاً أوضح يشرح الفكرة ويقود الانطباع من أول شاشة.",
    challenge_en: "Every project needs a clearer story that explains the idea and shapes the impression from the first screen.",
    solution_ar: "تمت معاملة المشروع كدراسة حالة: ما الذي كان ضعيفاً، وما الذي تغيّر، وكيف أصبح العرض أقوى.",
    solution_en: "The project is treated as a case study: what was weak, what changed, and how the final presentation became stronger.",
    result_ar: "واجهة أنظف، قراءة أسرع، وثقة أعلى في النتيجة النهائية.",
    result_en: "Cleaner visuals, faster reading, and stronger confidence in the final result.",
    tags_ar: ["واجهة", "هوية", "وضوح"],
    tags_en: ["Interface", "Identity", "Clarity"],
    metrics: [
      { value: "Live", label_ar: "مشروع فعلي", label_en: "Real delivery" },
      { value: "UX", label_ar: "ترتيب بصري", label_en: "Visual hierarchy" },
      { value: "Brand", label_ar: "هوية أوضح", label_en: "Sharper brand" },
    ],
    gallery_media_ids: fallbackGalleryIds(project),
  };
}

export function createDefaultProjectsStudio(snapshot: CmsSnapshot): ProjectsStudioSetting {
  return {
    version: 1,
    items: snapshot.work_projects.map((project) => createDefaultProjectStudioItem(project)),
  };
}

export function getProjectsStudioData(snapshot: CmsSnapshot): ProjectsStudioSetting {
  const fallback = createDefaultProjectsStudio(snapshot);
  const raw = getSiteSetting<ProjectsStudioSetting>(snapshot, "projects_studio", fallback);
  const byProjectId = new Map(raw.items.map((item) => [item.project_id, item]));

  return {
    version: 1,
    items: snapshot.work_projects.map((project) => {
      const saved = byProjectId.get(project.id);
      return saved ? { ...createDefaultProjectStudioItem(project), ...saved } : createDefaultProjectStudioItem(project);
    }),
  };
}

export function getProjectStudioItem(snapshot: CmsSnapshot, project: WorkProject): ProjectStudioItem {
  return (
    getProjectsStudioData(snapshot).items.find((item) => item.project_id === project.id) ??
    createDefaultProjectStudioItem(project)
  );
}

export function resolveMediaPath(mediaAssets: MediaAsset[], mediaId: string | null | undefined, fallback: string) {
  if (!mediaId) return fallback;
  return mediaAssets.find((item) => item.id === mediaId)?.path ?? fallback;
}

export function translateMetric(locale: Locale, metric: ProjectStudioMetric) {
  return {
    value: metric.value,
    label: locale === "ar" ? metric.label_ar : metric.label_en,
  };
}
