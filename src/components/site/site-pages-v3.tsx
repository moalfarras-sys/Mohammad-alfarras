import { rebuildContent } from "@/data/rebuild-content";
import { projects as localProjects } from "@/data/projects";
import { getSiteSetting, readSnapshot, readVideos } from "@/lib/content/store";
import { getLiveYoutubeData } from "@/lib/youtube-live";
import { getLiveWeather } from "@/lib/weather-live";
import { getLiveMatches } from "@/lib/matches-live";
import type { CmsSnapshot, Locale } from "@/types/cms";

import { SiteViewClient, type SiteViewModel } from "./site-view-client";

function safeImageSrc(path: string | null | undefined, fallback: string) {
  if (!path?.trim()) return fallback;
  const value = path.trim();
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://") ? value : fallback;
}

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getProfile(snapshot: CmsSnapshot, locale: Locale) {
  const brand = getSiteSetting(snapshot, "brand_profile", {
    title_ar: "محمد الفراس",
    title_en: "Mohammad Alfarras",
    subtitle_ar: "تنسيق لوجستي، تصميم وتطوير، وصناعة محتوى تقني",
    subtitle_en: "Logistics dispatching, digital design and development, and tech content creation",
    location_ar: "ألمانيا",
    location_en: "Germany",
  });

  return {
    name: locale === "ar" ? String(brand.title_ar) : String(brand.title_en),
    subtitle: locale === "ar" ? String(brand.subtitle_ar ?? "") : String(brand.subtitle_en ?? ""),
    location: locale === "ar" ? String(brand.location_ar ?? "ألمانيا") : String(brand.location_en ?? "Germany"),
  };
}

function getServices(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["services"] {
  const fallback = [
    {
      id: "service-web",
      title: locale === "ar" ? "واجهات ومواقع تشرح القيمة بسرعة" : "Web experiences that explain value fast",
      body:
        locale === "ar"
          ? "نبني صفحات هبوط ومواقع شخصية وتجارية بحضور بصري راقٍ، ورسالة واضحة، وتجربة تشعر المستخدم أن كل شيء هنا مقصود بعناية."
          : "Launch pages and digital surfaces with stronger visual control, sharper hierarchy, and a clearer commercial message from the first screen.",
      bullets: locale === "ar" ? ["صفحات إطلاق", "حضور رقمي", "تركيز على التحويل"] : ["Launch pages", "Brand presence", "Conversion focus"],
      image: "/images/service_web.png",
    },
    {
      id: "service-ops",
      title: locale === "ar" ? "تنفيذ منضبط بعقلية لوجستية" : "Execution shaped by logistics discipline",
      body:
        locale === "ar"
          ? "الخبرة في التشغيل والضغط اليومي تنعكس هنا على شكل سرعة أعلى، تنظيم أوضح، وتجربة مستقرة لا تنهار عند أول تعديل."
          : "Operational pressure from logistics becomes faster turnaround, cleaner systems, and frontend execution that stays reliable under change.",
      bullets: locale === "ar" ? ["Speed", "Reliability", "Structured delivery"] : ["Speed", "Reliability", "Structured delivery"],
      image: "/images/service-logistics-ops.png",
    },
    {
      id: "service-creator",
      title: locale === "ar" ? "محتوى تقني يصنع الثقة" : "Creator-grade content that builds trust",
      body:
        locale === "ar"
          ? "من اليوتيوب إلى عرض المنتجات، نحول المحتوى من مجرد شرح إلى طبقة ثقة حقيقية ترفع صورة المشروع وتدعمه بصريًا."
          : "From YouTube to product storytelling, content becomes a trust layer that strengthens brand perception instead of just filling space.",
      bullets: locale === "ar" ? ["YouTube", "Product storytelling", "Audience trust"] : ["YouTube", "Product storytelling", "Audience trust"],
      image: "/images/service-content-creator.png",
    },
  ];

  const active = snapshot.service_offerings
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry, index) => {
      const translation = snapshot.service_offering_translations.find((item) => item.service_id === entry.id && item.locale === locale);
      const asset = entry.cover_media_id ? snapshot.media_assets.find((item) => item.id === entry.cover_media_id) : null;
      const base = fallback[index] ?? fallback[fallback.length - 1];

      return {
        id: entry.id,
        title: translation?.title ?? base.title,
        body: translation?.description ?? base.body,
        bullets: translation?.bullets_json ?? base.bullets,
        image: safeImageSrc(asset?.path, base.image),
      };
    });

  return active.length ? active : fallback;
}

function getProjects(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["projects"] {
  const active = snapshot.work_projects
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const translation = snapshot.work_project_translations.find((item) => item.project_id === entry.id && item.locale === locale);
      const asset = entry.cover_media_id ? snapshot.media_assets.find((item) => item.id === entry.cover_media_id) : null;
      const fallbackImage = entry.slug.includes("schnell") ? "/images/schnell-home-case.png" : "/images/seel-home-case.png";
      return {
        id: entry.id,
        title: translation?.title ?? entry.slug,
        summary: translation?.summary ?? "",
        description: translation?.description ?? translation?.summary ?? "",
        image: safeImageSrc(asset?.path, fallbackImage),
        href: entry.project_url || undefined,
        repoUrl: entry.repo_url || undefined,
      };
    });

  if (active.length) return active;

  return [
    {
      id: "wp-seel",
      title: "SEEL Transport",
      summary: locale === "ar" ? "دراسة حالة لموقع خدمات أكثر هدوءًا وثقة." : "A service-site case study built for trust and clarity.",
      description:
        locale === "ar"
          ? "مشهد بصري أنظف وهيكل أوضح لعرض الخدمة بطريقة تبدو أكثر رقيًا ومباشرة."
          : "A calmer digital surface and stronger hierarchy for a service brand that needs to feel premium and dependable.",
      image: "/images/seel-home-case.png",
      href: undefined,
    },
    {
      id: "wp-schnell",
      title: "Schnell Sicher Umzug",
      summary: locale === "ar" ? "إعادة تقديم رقمي تمنح المشروع انطباعًا أكثر جدية." : "A digital repositioning with a stronger first impression.",
      description:
        locale === "ar"
          ? "مثال على كيف يرفع العرض الهادئ والرسالة الأقوى قيمة المشروع في أول زيارة."
          : "A stronger first-visit experience where structure and tone increase perceived value immediately.",
      image: "/images/schnell-home-case.png",
      href: undefined,
    },
    {
      id: "moplayer",
      title: locale === "ar" ? localProjects[0].nameAR : localProjects[0].nameEN,
      summary: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
      description: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
      image: localProjects[0].coverImage,
      repoUrl: localProjects[0].downloadLinks.github,
    },
  ];
}

function getExperience(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["experience"] {
  return snapshot.experiences
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const translation = snapshot.experience_translations.find((item) => item.experience_id === entry.id && item.locale === locale);
      return {
        id: entry.id,
        role: translation?.role_title ?? entry.company,
        description: translation?.description ?? "",
        highlights: translation?.highlights_json ?? [],
        company: entry.company,
        location: entry.location,
        period: `${formatDate(locale, entry.start_date)} - ${entry.end_date ? formatDate(locale, entry.end_date) : rebuildContent[locale].common.now}`,
      };
    });
}

function getContact(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["contact"] {
  const channels = snapshot.contact_channels
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const translation = snapshot.contact_channel_translations.find((item) => item.channel_id === entry.id && item.locale === locale);
      return {
        id: entry.id,
        type: entry.channel_type,
        label: translation?.label ?? entry.label_default,
        description: translation?.description ?? "",
        value: entry.value,
        icon: entry.icon,
        isPrimary: entry.is_primary,
      };
    });

  const email = channels.find((entry) => entry.type === "email");
  const whatsapp = channels.find((entry) => entry.type === "whatsapp");

  return {
    channels,
    emailAddress: String(email?.value ?? "mohammad.alfarras@gmail.com").replace(/^mailto:/, ""),
    whatsappUrl: whatsapp?.value ?? "https://wa.me/4917623419358",
  };
}

function getYoutube(snapshot: CmsSnapshot) {
  return getSiteSetting(snapshot, "youtube_channel", {
    views: 1494029,
    subscribers: 6130,
    videos: 162,
    handle: "@Moalfarras",
    title: "Mohammad Alfarras",
  });
}

function getGallery(): SiteViewModel["gallery"] {
  return [
    {
      id: "gallery-portrait",
      title: "Digital Ecosystem",
      image: "/images/cv-mosaic-tech.png",
      ratio: "portrait" as const,
    },
    {
      id: "gallery-brand",
      title: "Brand Story",
      image: "/images/logo-unboxing.png",
      ratio: "wide" as const,
    },
    {
      id: "gallery-operations",
      title: "Logistics Ops",
      image: "/images/cv-mosaic-ops.png",
      ratio: "wide" as const,
    },
    {
      id: "gallery-youtube",
      title: "Media Layer",
      image: "/images/yt-hero-2026.png",
      ratio: "square" as const,
    },
  ];
}

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const [snapshot, videos, liveYoutube, liveWeather, liveMatches] = await Promise.all([
    readSnapshot(),
    readVideos(),
    getLiveYoutubeData(),
    getLiveWeather(),
    getLiveMatches()
  ]);

  const pageSlug = slug || "home";
  const profile = getProfile(snapshot, locale);
  const projects = getProjects(snapshot, locale);
  const experience = getExperience(snapshot, locale);
  const contact = getContact(snapshot, locale);
  const services = getServices(snapshot, locale);
  const youtube = getYoutube(snapshot);
  const featuredVideo = videos.find((item) => item.is_featured) ?? videos[0] ?? null;

  const model: SiteViewModel = {
    locale,
    pageSlug,
    t: rebuildContent[locale],
    profile,
    projects,
    services,
    experience,
    contact,
    youtube,
    featuredVideo,
    latestVideos: videos.slice(0, 6),
    gallery: getGallery(),
    live: {
      youtube: liveYoutube,
      weather: liveWeather,
      matches: liveMatches,
    },
    settings: snapshot.site_settings.reduce((acc, s) => ({ ...acc, [s.key]: s }), {}),
  };

  return <SiteViewClient model={model} />;
}
