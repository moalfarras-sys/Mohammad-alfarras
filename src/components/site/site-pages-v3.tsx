import { rebuildContent } from "@/data/rebuild-content";
import { projects as localProjects } from "@/data/projects";
import { getSiteSetting, readSnapshot, readVideos } from "@/lib/content/store";
import { buildCvPresentationModel } from "@/lib/cv-presenter";
import { formatMonthYear } from "@/lib/locale-format";
import { getProjectStudioItem, resolveMediaPath, translateMetric } from "@/lib/projects-studio";
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
  return formatMonthYear(locale, value);
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
      const studio = getProjectStudioItem(snapshot, entry);
      const fallbackImage = entry.slug.includes("moplayer")
        ? "/images/moplayer-app-cover.jpeg"
        : entry.slug.includes("schnell")
          ? "/images/schnell-home-case.png"
          : "/images/seel-home-case.png";

      return {
        id: entry.id,
        slug: entry.slug,
        title: translation?.title ?? entry.slug,
        ctaLabel: translation?.cta_label ?? (locale === "ar" ? "عرض المشروع" : "Open project"),
        summary: translation?.summary ?? "",
        description: translation?.description ?? translation?.summary ?? "",
        image: safeImageSrc(resolveMediaPath(snapshot.media_assets, entry.cover_media_id, fallbackImage), fallbackImage),
        href: entry.project_url || undefined,
        repoUrl: entry.repo_url || undefined,
        featured: studio.is_featured,
        featuredRank: studio.featured_rank,
        accent: studio.accent,
        highlightStyle: studio.highlight_style,
        deviceFrame: studio.device_frame,
        eyebrow: locale === "ar" ? studio.eyebrow_ar : studio.eyebrow_en,
        challenge: locale === "ar" ? studio.challenge_ar : studio.challenge_en,
        solution: locale === "ar" ? studio.solution_ar : studio.solution_en,
        result: locale === "ar" ? studio.result_ar : studio.result_en,
        tags: locale === "ar" ? studio.tags_ar : studio.tags_en,
        gallery: studio.gallery_media_ids
          .map((mediaId) => resolveMediaPath(snapshot.media_assets, mediaId, ""))
          .filter(Boolean),
        metrics: studio.metrics.map((metric) => translateMetric(locale, metric)),
      };
    });

  if (active.length) {
    const hasMoplayer = active.some((project) => project.slug.includes("moplayer"));
    if (!hasMoplayer) {
      active.push({
        id: "moplayer-fallback",
        slug: "moplayer",
        title: locale === "ar" ? localProjects[0].nameAR : localProjects[0].nameEN,
        ctaLabel: locale === "ar" ? "استكشف التطبيق" : "Explore app",
        summary: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
        description: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
        image: localProjects[0].coverImage,
        href: undefined,
        repoUrl: localProjects[0].downloadLinks.github,
        featured: true,
        featuredRank: 3,
        accent: "cyan",
        highlightStyle: "app",
        deviceFrame: "phone",
        eyebrow: locale === "ar" ? "تجربة تطبيق ومنتج" : "App and product experience",
        challenge: locale === "ar" ? "الهدف كان تقديم تجربة ترفيهية واضحة وسريعة تشعر أنها منتج حقيقي." : "The target was a cleaner, faster entertainment flow that feels like a real product.",
        solution: locale === "ar" ? "تم التركيز على framing للهاتف، rhythm ناعم، وهوية واجهة أكثر تماسكاً." : "The build focuses on phone framing, a smoother rhythm, and a more cohesive interface identity.",
        result: locale === "ar" ? "هوية تطبيق أوضح وتجربة أقرب إلى منتج جاهز للتسويق والتطوير." : "A clearer app identity and a product story that feels ready for launch and growth.",
        tags: locale === "ar" ? ["تطبيق", "واجهة هاتف", "منتج رقمي"] : ["App", "Mobile UI", "Digital product"],
        gallery: localProjects[0].screenshots,
        metrics: locale === "ar"
          ? [{ value: "Mobile", label: "أولوية الهاتف" }, { value: "Flow", label: "إيقاع ناعم" }, { value: "UI", label: "واجهة مركزة" }]
          : [{ value: "Mobile", label: "Mobile first" }, { value: "Flow", label: "Smooth flow" }, { value: "UI", label: "Focused interface" }],
      });
    }
    return active;
  }

  return [
    {
      id: "wp-seel",
      slug: "seel",
      title: "SEEL Transport",
      ctaLabel: locale === "ar" ? "عرض المشروع" : "Open project",
      summary: locale === "ar" ? "دراسة حالة لخدمة لوجستية تحتاج صورة أهدأ وأقوى." : "A logistics service case study built around clarity and trust.",
      description:
        locale === "ar"
          ? "إعادة ترتيب العرض البصري والرسالة لتبدو الخدمة أكثر ثقة ووضوحاً من أول شاشة."
          : "A visual and messaging reset that makes the service feel more credible from the first screen.",
      image: "/images/seel-home-case.png",
      href: undefined,
      repoUrl: undefined,
      featured: true,
      featuredRank: 1,
      accent: "green",
      highlightStyle: "operations",
      deviceFrame: "browser",
      eyebrow: locale === "ar" ? "منصة خدمات وتشغيل" : "Operations-led service platform",
      challenge: locale === "ar" ? "الموقع كان يحتاج ثقة أسرع وترتيباً أوضح لما تعنيه الخدمة فعلاً." : "The site needed faster trust and a clearer explanation of what the service actually delivers.",
      solution: locale === "ar" ? "تم بناء التسلسل حول الوضوح التشغيلي، القراءة السريعة، وإحساس أقوى بالاعتماد." : "The hierarchy was rebuilt around operational clarity, faster reading, and stronger dependability.",
      result: locale === "ar" ? "النتيجة واجهة أهدأ وأقرب لطبيعة شركة تعمل يومياً تحت ضغط حقيقي." : "The result is calmer, clearer, and much closer to a business that operates under real daily pressure.",
      tags: locale === "ar" ? ["لوجستيات", "واجهة تشغيل", "ثقة الخدمة"] : ["Logistics", "Operations UI", "Service trust"],
      gallery: ["/images/seel-home-case.png", "/images/seel-service-case.png", "/images/seel-contact-case.png"],
      metrics: locale === "ar"
        ? [{ value: "24/7", label: "إيقاع تشغيلي" }, { value: "TMS", label: "تنسيق المسارات" }, { value: "B2B", label: "ثقة الخدمة" }]
        : [{ value: "24/7", label: "Operations rhythm" }, { value: "TMS", label: "Route management" }, { value: "B2B", label: "Service trust" }],
    },
    {
      id: "wp-schnell",
      slug: "schnell-sicher",
      title: "Schnell Sicher Umzug",
      ctaLabel: locale === "ar" ? "عرض المشروع" : "Open project",
      summary: locale === "ar" ? "واجهة حجز أوضح وأقوى في دفع الزائر نحو القرار." : "A booking-first redesign that pushes visitors toward action faster.",
      description:
        locale === "ar"
          ? "تقديم رقمي أكثر حدة ووضوحاً لمشروع يحتاج الثقة والتحويل من أول زيارة."
          : "A sharper digital presentation for a business that depends on fast trust and conversion.",
      image: "/images/schnell-home-case.png",
      href: undefined,
      repoUrl: undefined,
      featured: true,
      featuredRank: 2,
      accent: "orange",
      highlightStyle: "trust",
      deviceFrame: "browser",
      eyebrow: locale === "ar" ? "موقع حجز وتحويل" : "Lead-generation service site",
      challenge: locale === "ar" ? "أي تشويش في الرسالة أو الترتيب يضيع الطلب سريعاً." : "Any noise in the message or structure costs the lead quickly.",
      solution: locale === "ar" ? "تم بناء الصفحة حول عرض مباشر وCTA واضح ومسار يقود الزائر للحجز." : "The page was rebuilt around a direct offer, clear CTA, and a stronger route toward booking.",
      result: locale === "ar" ? "واجهة أقوى في الانطباع والثقة والحجز الفعلي من أول زيارة." : "A more persuasive interface with stronger trust and booking intent on first visit.",
      tags: locale === "ar" ? ["حجز", "واجهة مبيعات", "تحويل"] : ["Booking", "Sales UI", "Conversion"],
      gallery: ["/images/schnell-home-case.png", "/images/schnell-service-case.png", "/images/schnell-contact-case.png"],
      metrics: locale === "ar"
        ? [{ value: "< 60s", label: "وضوح العرض" }, { value: "Lead", label: "تركيز على الطلب" }, { value: "Trust", label: "بناء الثقة" }]
        : [{ value: "< 60s", label: "First-screen clarity" }, { value: "Lead", label: "Lead-first structure" }, { value: "Trust", label: "Trust layer" }],
    },
    {
      id: "moplayer",
      slug: "moplayer",
      title: locale === "ar" ? localProjects[0].nameAR : localProjects[0].nameEN,
      ctaLabel: locale === "ar" ? "استكشف التطبيق" : "Explore app",
      summary: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
      description: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
      image: localProjects[0].coverImage,
      href: undefined,
      repoUrl: localProjects[0].downloadLinks.github,
      featured: true,
      featuredRank: 3,
      accent: "cyan",
      highlightStyle: "app",
      deviceFrame: "phone",
      eyebrow: locale === "ar" ? "تجربة تطبيق ومنتج" : "App and product experience",
      challenge: locale === "ar" ? "الهدف كان تقديم تجربة ترفيهية واضحة وسريعة تشعر أنها منتج حقيقي." : "The target was a cleaner, faster entertainment flow that feels like a real product.",
      solution: locale === "ar" ? "تم التركيز على framing للهاتف، rhythm ناعم، وهوية واجهة أكثر تماسكاً." : "The build focuses on phone framing, a smoother rhythm, and a more cohesive interface identity.",
      result: locale === "ar" ? "هوية تطبيق أوضح وتجربة أقرب إلى منتج جاهز للتسويق والتطوير." : "A clearer app identity and a product story that feels ready for launch and growth.",
      tags: locale === "ar" ? ["تطبيق", "واجهة هاتف", "منتج رقمي"] : ["App", "Mobile UI", "Digital product"],
      gallery: localProjects[0].screenshots,
      metrics: locale === "ar"
        ? [{ value: "Mobile", label: "أولوية الهاتف" }, { value: "Flow", label: "إيقاع ناعم" }, { value: "UI", label: "واجهة مركزة" }]
        : [{ value: "Mobile", label: "Mobile first" }, { value: "Flow", label: "Smooth flow" }, { value: "UI", label: "Focused interface" }],
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

function getCertifications(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["certifications"] {
  return snapshot.certifications
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const translation = snapshot.certification_translations.find(
        (item) => item.certification_id === entry.id && item.locale === locale,
      );

      return {
        id: entry.id,
        name: translation?.name ?? entry.issuer,
        description: translation?.description ?? "",
        issuer: entry.issuer,
        issueDate: entry.issue_date,
        credentialUrl: entry.credential_url,
      };
    });
}

function getYoutube(snapshot: CmsSnapshot): {
  channel_id?: string;
  views?: number;
  subscribers?: number;
  videos?: number;
  handle?: string;
  title?: string;
} {
  return getSiteSetting(snapshot, "youtube_channel", {
    channel_id: "UCfQKyFnNaW026LVb5TGx87g",
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
      ratio: "portrait",
    },
    {
      id: "gallery-brand",
      title: "Brand Story",
      image: "/images/logo-unboxing.png",
      ratio: "wide",
    },
    {
      id: "gallery-operations",
      title: "Logistics Ops",
      image: "/images/cv-mosaic-ops.png",
      ratio: "wide",
    },
    {
      id: "gallery-youtube",
      title: "Media Layer",
      image: "/images/yt-hero-2026.png",
      ratio: "square",
    },
  ];
}

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const snapshot = await readSnapshot();
  const youtube = getYoutube(snapshot);

  const [videos, liveYoutube, liveWeather, liveMatches] = await Promise.all([
    readVideos(),
    getLiveYoutubeData(typeof youtube.channel_id === "string" ? youtube.channel_id : undefined),
    getLiveWeather(),
    getLiveMatches(),
  ]);

  const pageSlug = slug || "home";
  const profile = getProfile(snapshot, locale);
  const projects = getProjects(snapshot, locale);
  const experience = getExperience(snapshot, locale);
  const contact = getContact(snapshot, locale);
  const certifications = getCertifications(snapshot, locale);
  const services = getServices(snapshot, locale);
  const featuredVideo = videos.find((item) => item.is_featured) ?? videos[0] ?? null;
  const cvPresentation = buildCvPresentationModel(snapshot, locale);

  const model: SiteViewModel = {
    locale,
    pageSlug,
    t: rebuildContent[locale],
    profile,
    projects,
    services,
    experience,
    certifications,
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
    cvBuilder: cvPresentation.builder,
    cvSections: cvPresentation.sections,
    cvProjects: cvPresentation.projects,
    cvExperience: cvPresentation.experience,
  };

  return <SiteViewClient model={model} />;
}
