import { projects as localProjects } from "@/data/projects";
import { getPdfRegistry, resolveBrandAssetPaths, resolveRebuildLocaleContent } from "@/lib/cms-documents";
import { getSiteSetting, readSnapshot, readVideos } from "@/lib/content/store";
import { buildCvPresentationModel } from "@/lib/cv-presenter";
import { formatMonthYear } from "@/lib/locale-format";
import { getProjectStudioItem, resolveMediaPath, translateMetric } from "@/lib/projects-studio";
import { getLiveMatches } from "@/lib/matches-live";
import { getLiveWeather } from "@/lib/weather-live";
import { getLiveYoutubeData } from "@/lib/youtube-live";
import type { CmsSnapshot, Locale } from "@/types/cms";

import type { SiteViewModel } from "./site-view-model";
import {
  PortfolioAppsPage,
  PortfolioContactPage,
  PortfolioCvPage,
  PortfolioHomePage,
  PortfolioPrivacyPage,
  PortfolioWorkPage,
  PortfolioYoutubePage,
} from "./portfolio-pages";

function safeImageSrc(path: string | null | undefined, fallback: string) {
  if (!path?.trim()) return fallback;
  const value = path.trim();
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://") ? value : fallback;
}

function safePortraitSrc(path: string | null | undefined) {
  if (!path) return "/images/portrait.jpg";
  const value = path.trim().toLowerCase();
  if (!value) return "/images/portrait.jpg";
  if (value.includes("service_") || value.includes("moplayer") || value.includes("logo")) {
    return "/images/portrait.jpg";
  }
  return path;
}

function formatDate(locale: Locale, value: string) {
  return formatMonthYear(locale, value);
}

function getProfile(snapshot: CmsSnapshot, locale: Locale) {
  const brand = getSiteSetting(snapshot, "brand_profile", {
    title_ar: "محمد الفراس",
    title_en: "Mohammad Alfarras",
    subtitle_ar: "تطوير ويب، تصميم واجهات، وصناعة محتوى تقني",
    subtitle_en: "Web development, interface design, and Arabic tech content creation",
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
          ? "أبني صفحات إطلاق ومواقع شخصية وتجارية بحضور بصري واضح ورسالة مفهومة وتجربة مرتبة من أول شاشة."
          : "Launch pages and digital surfaces with stronger visual control, sharper hierarchy, and a clearer commercial message from the first screen.",
      bullets: locale === "ar" ? ["صفحات إطلاق", "حضور رقمي", "تحويل أوضح"] : ["Launch pages", "Brand presence", "Conversion focus"],
      image: "/images/service_web.png",
    },
    {
      id: "service-ops",
      title: locale === "ar" ? "تنفيذ منضبط بعقلية تشغيلية" : "Execution shaped by logistics discipline",
      body:
        locale === "ar"
          ? "الخبرة في التشغيل اليومي تنعكس هنا على شكل سرعة أعلى، تنظيم أوضح، وتجربة أكثر ثباتاً."
          : "Operational pressure from logistics becomes faster turnaround, cleaner systems, and frontend execution that stays reliable under change.",
      bullets: locale === "ar" ? ["سرعة", "اعتمادية", "تنفيذ منظم"] : ["Speed", "Reliability", "Structured delivery"],
      image: "/images/service_logistics.png",
    },
    {
      id: "service-creator",
      title: locale === "ar" ? "محتوى تقني يصنع الثقة" : "Creator-grade content that builds trust",
      body:
        locale === "ar"
          ? "من يوتيوب إلى عرض المنتجات، أتعامل مع المحتوى كطبقة ثقة ترفع صورة المشروع وتدعمه بصرياً."
          : "From YouTube to product storytelling, content becomes a trust layer that strengthens brand perception instead of just filling space.",
      bullets: locale === "ar" ? ["يوتيوب", "عرض المنتج", "ثقة الجمهور"] : ["YouTube", "Product storytelling", "Audience trust"],
      image: "/images/yt-hero-2026.png",
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

function moplayerFallback(locale: Locale): SiteViewModel["projects"][number] {
  return {
    id: "moplayer-fallback",
    slug: "moplayer",
    title: locale === "ar" ? localProjects[0].nameAR : localProjects[0].nameEN,
    ctaLabel: locale === "ar" ? "استكشف التطبيق" : "Explore app",
    summary: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
    description: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
    image: localProjects[0].coverImage,
    href: "/app",
    repoUrl: localProjects[0].downloadLinks.github,
    featured: true,
    featuredRank: 3,
    accent: "cyan",
    highlightStyle: "app",
    deviceFrame: "phone",
    eyebrow: locale === "ar" ? "تجربة تطبيق ومنتج" : "App and product experience",
    challenge:
      locale === "ar"
        ? "الهدف كان بناء تجربة تشغيل وسائط أسرع، أوضح، وأكثر اتساقاً كمنتج حقيقي."
        : "The target was a cleaner, faster media flow that feels like a real product.",
    solution:
      locale === "ar"
        ? "تم التركيز على واجهة أوضح، إيقاع تنقل أفضل، وهوية بصرية أكثر تماسكاً بين الهاتف وAndroid TV."
        : "The build focuses on a clearer interface, smoother navigation, and a stronger visual identity across phone and Android TV.",
    result:
      locale === "ar"
        ? "هوية تطبيق أوضح وقصة منتج أنظف داخل الموقع وصفحة تنزيل مستقلة على /app."
        : "A clearer app identity and a cleaner product story across the site and the dedicated /app surface.",
    tags: locale === "ar" ? ["تطبيق", "واجهة هاتف", "منتج رقمي"] : ["App", "Mobile UI", "Digital product"],
    gallery: [...new Set(localProjects[0].screenshots)],
    metrics: locale === "ar"
      ? [
          { value: "API 24+", label: "الحد الأدنى" },
          { value: "TV", label: "جاهزية Android TV" },
          { value: "UI", label: "واجهة مركزة" },
        ]
      : [
          { value: "API 24+", label: "Minimum SDK" },
          { value: "TV", label: "Android TV ready" },
          { value: "UI", label: "Focused interface" },
        ],
  };
}

function getProjects(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["projects"] {
  const active: SiteViewModel["projects"] = snapshot.work_projects
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const translation = snapshot.work_project_translations.find((item) => item.project_id === entry.id && item.locale === locale);
      const studio = getProjectStudioItem(snapshot, entry);
      const projectMedia = snapshot.work_project_media
        .filter((item) => item.project_id === entry.id && item.role === "gallery")
        .sort((a, b) => a.sort_order - b.sort_order);
      const projectMetrics = snapshot.work_project_metrics
        .filter((item) => item.project_id === entry.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const coverAsset = snapshot.work_project_media.find((item) => item.project_id === entry.id && item.role === "cover");
      const fallbackImage = entry.slug.includes("moplayer")
        ? "/images/moplayer-app-cover-final.jpeg"
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
        image: safeImageSrc(resolveMediaPath(snapshot.media_assets, coverAsset?.media_id ?? entry.cover_media_id, fallbackImage), fallbackImage),
        href: entry.project_url || (entry.slug.includes("moplayer") ? "/app" : undefined),
        repoUrl: entry.repo_url || undefined,
        featured: typeof entry.featured_rank === "number" ? entry.featured_rank < 99 : studio.is_featured,
        featuredRank: entry.featured_rank ?? studio.featured_rank,
        accent: studio.accent,
        highlightStyle: studio.highlight_style,
        deviceFrame: studio.device_frame,
        eyebrow: locale === "ar" ? studio.eyebrow_ar : studio.eyebrow_en,
        challenge: translation?.challenge || (locale === "ar" ? studio.challenge_ar : studio.challenge_en),
        solution: translation?.solution || (locale === "ar" ? studio.solution_ar : studio.solution_en),
        result: translation?.result || (locale === "ar" ? studio.result_ar : studio.result_en),
        tags: translation?.tags_json?.length ? translation.tags_json : locale === "ar" ? studio.tags_ar : studio.tags_en,
        gallery: projectMedia.length
          ? [...new Set(projectMedia.map((item) => resolveMediaPath(snapshot.media_assets, item.media_id, "")).filter(Boolean))]
          : [...new Set(studio.gallery_media_ids.map((mediaId) => resolveMediaPath(snapshot.media_assets, mediaId, "")).filter(Boolean))],
        metrics: projectMetrics.length
          ? projectMetrics.map((metric) => ({ value: metric.value, label: locale === "ar" ? metric.label_ar : metric.label_en }))
          : studio.metrics.map((metric) => translateMetric(locale, metric)),
      };
    });

  if (!active.some((project) => project.slug === "moplayer")) {
    active.push(moplayerFallback(locale));
  }

  if (active.length) {
    return active;
  }

  return [
    {
      id: "wp-seel",
      slug: "seel",
      title: "SEEL Transport",
      ctaLabel: locale === "ar" ? "عرض المشروع" : "Open project",
      summary: locale === "ar" ? "دراسة حالة لخدمة لوجستية احتاجت ترتيباً أوضح وصورة أكثر ثقة." : "A logistics service case study built around clarity and trust.",
      description:
        locale === "ar"
          ? "إعادة ترتيب العرض البصري والرسالة لتبدو الخدمة أوضح وأكثر مهنية من أول شاشة."
          : "A visual and messaging reset that makes the service feel more credible from the first screen.",
      image: "/images/seel-home-case.png",
      featured: true,
      featuredRank: 1,
      accent: "green",
      highlightStyle: "operations",
      deviceFrame: "browser",
      eyebrow: locale === "ar" ? "منصة خدمات وتشغيل" : "Operations-led service platform",
      challenge:
        locale === "ar"
          ? "الموقع كان يحتاج ثقة أسرع وترتيباً أوضح لما تعنيه الخدمة فعلاً."
          : "The site needed faster trust and a clearer explanation of what the service actually delivers.",
      solution:
        locale === "ar"
          ? "تم بناء التسلسل حول الوضوح التشغيلي والقراءة الأسرع وإحساس أقوى بالاعتمادية."
          : "The hierarchy was rebuilt around operational clarity, faster reading, and stronger dependability.",
      result:
        locale === "ar"
          ? "واجهة أهدأ وأوضح وأقرب لطبيعة شركة تعمل يومياً تحت ضغط حقيقي."
          : "The result is calmer, clearer, and much closer to a business that operates under real daily pressure.",
      tags: locale === "ar" ? ["لوجستيات", "واجهة تشغيل", "ثقة الخدمة"] : ["Logistics", "Operations UI", "Service trust"],
      gallery: ["/images/seel-home-case.png"],
      metrics: locale === "ar"
        ? [
            { value: "24/7", label: "إيقاع تشغيلي" },
            { value: "TMS", label: "تنسيق المسارات" },
            { value: "B2B", label: "ثقة الخدمة" },
          ]
        : [
            { value: "24/7", label: "Operations rhythm" },
            { value: "TMS", label: "Route management" },
            { value: "B2B", label: "Service trust" },
          ],
    },
    {
      id: "wp-schnell",
      slug: "schnell-sicher",
      title: "Schnell Sicher Umzug",
      ctaLabel: locale === "ar" ? "عرض المشروع" : "Open project",
      summary: locale === "ar" ? "واجهة حجز أوضح وأقوى في دفع الزائر نحو القرار." : "A booking-first redesign that pushes visitors toward action faster.",
      description:
        locale === "ar"
          ? "تقديم رقمي أكثر وضوحاً وحدّة لمشروع يعتمد على الثقة والتحويل من أول زيارة."
          : "A sharper digital presentation for a business that depends on fast trust and conversion.",
      image: "/images/schnell-home-case.png",
      featured: true,
      featuredRank: 2,
      accent: "orange",
      highlightStyle: "trust",
      deviceFrame: "browser",
      eyebrow: locale === "ar" ? "موقع حجز وتحويل" : "Lead-generation service site",
      challenge:
        locale === "ar"
          ? "أي تشويش في الرسالة أو الترتيب يضيع الطلب بسرعة."
          : "Any noise in the message or structure costs the lead quickly.",
      solution:
        locale === "ar"
          ? "تم بناء الصفحة حول عرض مباشر ودعوة واضحة ومسار يقود الزائر نحو الحجز."
          : "The page was rebuilt around a direct offer, clear CTA, and a stronger route toward booking.",
      result:
        locale === "ar"
          ? "واجهة أقوى في الانطباع والثقة والحجز الفعلي من أول زيارة."
          : "A more persuasive interface with stronger trust and booking intent on first visit.",
      tags: locale === "ar" ? ["حجز", "واجهة مبيعات", "تحويل"] : ["Booking", "Sales UI", "Conversion"],
      gallery: ["/images/schnell-home-case.png"],
      metrics: locale === "ar"
        ? [
            { value: "< 60s", label: "وضوح العرض" },
            { value: "Lead", label: "تركيز على الطلب" },
            { value: "Trust", label: "بناء الثقة" },
          ]
        : [
            { value: "< 60s", label: "First-screen clarity" },
            { value: "Lead", label: "Lead-first structure" },
            { value: "Trust", label: "Trust layer" },
          ],
    },
    moplayerFallback(locale),
  ];
}

function getExperience(snapshot: CmsSnapshot, locale: Locale, nowLabel: string): SiteViewModel["experience"] {
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
        period: `${formatDate(locale, entry.start_date)} - ${entry.end_date ? formatDate(locale, entry.end_date) : nowLabel}`,
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
      const translation = snapshot.certification_translations.find((item) => item.certification_id === entry.id && item.locale === locale);
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

function getYoutube(snapshot: CmsSnapshot) {
  return getSiteSetting(snapshot, "youtube_channel", {
    channel_id: "UCfQKyFnNaW026LVb5TGx87g",
    views: 1494029,
    subscribers: 6130,
    videos: 162,
    handle: "@Moalfarras",
    title: "Mohammad Alfarras",
  });
}

function getGallery(snapshot: CmsSnapshot): SiteViewModel["gallery"] {
  const brandMedia = resolveBrandAssetPaths(snapshot);
  return [
    { id: "gallery-portrait", title: "Portrait", image: brandMedia.profilePortrait, ratio: "portrait" },
    { id: "gallery-brand", title: "Brand", image: brandMedia.gallery.brand, ratio: "wide" },
    { id: "gallery-operations", title: "Operations", image: brandMedia.gallery.logistics, ratio: "wide" },
    { id: "gallery-media", title: "Media", image: brandMedia.gallery.media, ratio: "square" },
  ];
}

export async function buildSiteModel({ locale, slug }: { locale: Locale; slug: string }): Promise<SiteViewModel> {
  const snapshot = await readSnapshot();
  const copy = resolveRebuildLocaleContent(snapshot, locale);
  const brandMedia = resolveBrandAssetPaths(snapshot);
  const portraitImage = safePortraitSrc(brandMedia.profilePortrait);
  const pdfRegistry = getPdfRegistry(snapshot);
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
  const experience = getExperience(snapshot, locale, locale === "ar" ? "الآن" : "Now");
  const contact = getContact(snapshot, locale);
  const certifications = getCertifications(snapshot, locale);
  const services = getServices(snapshot, locale);
  const featuredVideo = videos.find((item) => item.is_featured) ?? videos[0] ?? null;
  const cvPresentation = buildCvPresentationModel(snapshot, locale);
  const brandedDownload =
    pdfRegistry.active.branded === "uploaded" && pdfRegistry.uploads.branded?.url
      ? pdfRegistry.uploads.branded.url
      : `/api/cv-pdf?locale=${locale}&variant=branded`;
  const atsDownload =
    pdfRegistry.active.ats === "uploaded" && pdfRegistry.uploads.ats?.url
      ? pdfRegistry.uploads.ats.url
      : `/api/cv-pdf?locale=${locale}&variant=ats`;

  return {
    locale,
    pageSlug,
    t: copy,
    profile,
    projects,
    services,
    experience,
    certifications,
    contact,
    youtube,
    featuredVideo,
    latestVideos: videos.slice(0, 6),
    gallery: getGallery(snapshot),
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
    portraitImage,
    downloads: {
      branded: brandedDownload,
      ats: atsDownload,
    },
  };
}

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const model = await buildSiteModel({ locale, slug });
  switch (model.pageSlug) {
    case "home":
      return <PortfolioHomePage model={model} />;
    case "about":
    case "cv":
      return <PortfolioCvPage model={model} />;
    case "projects":
    case "work":
      return <PortfolioWorkPage model={model} />;
    case "youtube":
      return <PortfolioYoutubePage model={model} />;
    case "contact":
      return <PortfolioContactPage model={model} />;
    case "apps":
      return <PortfolioAppsPage model={model} />;
    case "privacy":
      return <PortfolioPrivacyPage model={model} />;
    default:
      return <PortfolioHomePage model={model} />;
  }
}
