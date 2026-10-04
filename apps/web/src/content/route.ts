import type { Localized } from "./site-data";

/**
 * The owner's real path, used by the home "route" timeline and the About
 * page. Dates match the CV data in `data/rebuild-content.ts`.
 * Tuple: [when, title, body]
 */
export const routeSteps = {
  en: [
    ["Origin", "Al-Hasakah, Syria", "Where the urge to make complicated things clearer started."],
    ["2015", "Germany", "A new country, a new language and sharper standards."],
    ["2019 – 2022", "Stocubo GmbH", "Production work: simple for the user always means rigorous systems behind it."],
    ["2023 – now", "Rhenus Home Delivery", "Disposition — routes, drivers, TMS and customers under daily pressure."],
    ["Now", "Web & product studio", "Websites for real businesses in Germany and Syria, built end to end."],
    ["Now", "YouTube · MoPlayer · MoOS", "Arabic tech content, two Android TV players and an Arabic-first OS."],
  ],
  ar: [
    ["البداية", "الحسكة، سوريا", "هنا بدأت الرغبة في جعل الأشياء المعقّدة أوضح."],
    ["2015", "ألمانيا", "بلد جديد، لغة جديدة، ومعايير أدق."],
    ["2019 – 2022", "Stocubo GmbH", "عمل في الإنتاج: البساطة للمستخدم تعني دائماً نظاماً صارماً خلفها."],
    ["2023 – الآن", "Rhenus Home Delivery", "ديسبوزيشن — مسارات، سائقون، نظام TMS وعملاء تحت ضغط يومي."],
    ["الآن", "استوديو ويب ومنتجات", "مواقع لشركات حقيقية في ألمانيا وسوريا، من الفكرة حتى الإطلاق."],
    ["الآن", "يوتيوب · MoPlayer · MoOS", "محتوى تقني عربي، مشغّلا Android TV، ونظام تشغيل عربي أولاً."],
  ],
} satisfies Localized<Array<[string, string, string]>>;
