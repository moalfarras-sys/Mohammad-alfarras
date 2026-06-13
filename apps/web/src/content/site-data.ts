import type { Locale } from "@/types/cms";

export type Localized<T> = Record<Locale, T>;

export const siteIdentity = {
  name: { en: "Mohammad Alfarras", ar: "محمد الفراس" },
  tagline: { en: "Web | Apps | Content | Logistics", ar: "ويب | تطبيقات | محتوى | لوجستيات" },
  shortPositioning: {
    en: "Frontend developer, UI/UX-focused builder, MoPlayer product owner, and Arabic tech creator based in Germany.",
    ar: "مطوّر واجهات ومصمم تجارب وباني MoPlayer وصانع محتوى تقني عربي مقيم في ألمانيا.",
  },
  origin: { en: "From Al-Hasakah, Syria", ar: "من الحسكة، سوريا" },
  location: { en: "Based in Germany", ar: "مقيم في ألمانيا" },
} satisfies Record<string, Localized<string>>;

export const socialLinks = {
  youtube: "https://www.youtube.com/@Moalfarras",
  github: "https://github.com/moalfarras-sys",
  linkedin: "https://de.linkedin.com/in/mohammad-alfarras-525531262",
  instagram: "https://www.instagram.com/moalfarras",
  whatsapp: "https://wa.me/4917623419358",
  telegram: "https://t.me/MoalFarras",
  facebook: "https://www.facebook.com/share/14TQSSocNQG/?mibextid=wwXIfr",
  email: "mohammad.alfarras@gmail.com",
} as const;

export const youtubeChannel = {
  id: "UCfQKyFnNaW026LVb5TGx87g",
  handle: "@Moalfarras",
  title: siteIdentity.name.en,
  revalidateSeconds: 86_400,
  fallback: {
    views: 1_543_472,
    subscribers: 6_230,
    videos: 161,
  },
} as const;

export const siteLastModified = "2026-06-13";

export const languageLevels = {
  en: [
    { id: "ar", label: "Arabic", level: "Native" },
    { id: "de", label: "German", level: "C1 professional" },
    { id: "en", label: "English", level: "Professional working proficiency" },
  ],
  ar: [
    { id: "ar", label: "العربية", level: "اللغة الأم" },
    { id: "de", label: "الألمانية", level: "C1 مهني" },
    { id: "en", label: "الإنجليزية", level: "كفاءة مهنية عملية" },
  ],
} satisfies Localized<Array<{ id: string; label: string; level: string }>>;

export function compactMetric(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
  return String(value);
}
