import { getPdfRegistry, resolveBrandAssetPaths, resolveRebuildLocaleContent } from "@/lib/cms-documents";
import { getSiteSetting, readSnapshot, readVideos } from "@/lib/content/store";
import { buildCvPresentationModel } from "@/lib/cv-presenter";
import { formatMonthYear } from "@/lib/locale-format";
import { getProjectStudioItem, resolveMediaPath, translateMetric } from "@/lib/projects-studio";
import { getLiveMatches } from "@/lib/matches-live";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import { getLiveWeather } from "@/lib/weather-live";
import { getLiveYoutubeData } from "@/lib/youtube-live";
import type { CmsSnapshot, Locale } from "@/types/cms";

import { PortfolioPrivacyPage } from "./portfolio-pages";
import { DigitalOsPage } from "./digital-os-vnext";
import type { SiteViewModel } from "./site-view-model";
import { projects as localProjects } from "@/data/projects";

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
    subtitle_ar: "تطوير ويب، تصميم واجهات، وصناعة محتوى تقني",
    subtitle_en: "Web development, interface design, and Arabic tech content creation",
    location_ar: "ألمانيا",
    location_en: "Germany",
  });

  return repairMojibakeDeep({
    name: locale === "ar" ? String(brand.title_ar) : String(brand.title_en),
    subtitle: locale === "ar" ? String(brand.subtitle_ar ?? "") : String(brand.subtitle_en ?? ""),
    location: locale === "ar" ? String(brand.location_ar ?? "ألمانيا") : String(brand.location_en ?? "Germany"),
  });
}

function getServices(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["services"] {
  const fallback = [
    {
      id: "service-web",
      title: locale === "ar" ? "مواقع وواجهات تشرح القيمة بسرعة" : "Web experiences that explain value fast",
      body:
        locale === "ar"
          ? "مواقع أعمال وصفحات إطلاق وحضور رقمي ثنائي اللغة مبني على وضوح الرسالة والثقة من أول شاشة."
          : "Business websites, launches, and bilingual digital surfaces built around clarity, trust, and first-screen hierarchy.",
      bullets: locale === "ar" ? ["مواقع أعمال", "واجهات حديثة", "ثنائية اللغة"] : ["Business sites", "Modern UI", "Bilingual delivery"],
      image: "/images/service_web.png",
    },
    {
      id: "service-ops",
      title: locale === "ar" ? "تنفيذ منضبط بعقلية تشغيلية" : "Execution shaped by operational discipline",
      body:
        locale === "ar"
          ? "الخبرة في اللوجستيات والتشغيل تنعكس على شكل بنية أوضح، قرارات أسرع، وتجربة أكثر استقراراً."
          : "Logistics experience becomes clearer systems, faster decisions, and more stable frontend delivery.",
      bullets: locale === "ar" ? ["تشغيل", "بنية", "اعتمادية"] : ["Operations", "Structure", "Reliability"],
      image: "/images/service_logistics.png",
    },
    {
      id: "service-media",
      title: locale === "ar" ? "محتوى تقني يرفع الثقة" : "Technical storytelling that raises trust",
      body:
        locale === "ar"
          ? "من يوتيوب إلى صفحات المنتجات، المحتوى هنا جزء من التجربة وليس طبقة منفصلة عنها."
          : "From YouTube to product pages, content here is part of the product experience rather than a separate layer.",
      bullets: locale === "ar" ? ["يوتيوب", "سرد منتجات", "ثقة الجمهور"] : ["YouTube", "Product storytelling", "Audience trust"],
      image: "/images/yt-channel-hero.png",
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

  return repairMojibakeDeep(active.length ? active : fallback);
}

function moplayerFallback(locale: Locale): SiteViewModel["projects"][number] {
  return repairMojibakeDeep({
    id: "moplayer-fallback",
    slug: "moplayer",
    title: locale === "ar" ? localProjects[0].nameAR : localProjects[0].nameEN,
    ctaLabel: locale === "ar" ? "استكشف التطبيق" : "Explore app",
    summary: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
    description: locale === "ar" ? localProjects[0].descriptionAR : localProjects[0].descriptionEN,
    image: "/images/moplayer-hero-3d-final.png",
    href: `/${locale}/apps/moplayer`,
    repoUrl: localProjects[0].downloadLinks.github,
    featured: true,
    featuredRank: 3,
    accent: "blue",
    highlightStyle: "app",
    deviceFrame: "phone",
    eyebrow: locale === "ar" ? "منتج Android TV" : "Android TV product",
    challenge:
      locale === "ar"
        ? "بناء واجهة منتج حقيقية مع تنشيط وإصدارات ودعم وقصة واضحة حول المنتج."
        : "Build a real product surface with activation, releases, support, and a clear product story.",
    solution:
      locale === "ar"
        ? "تجميع الهوية والتحميل والتفعيل والدعم داخل موقع واحد واضح."
        : "Bring identity, release delivery, activation, and support into one coherent website surface.",
    result:
      locale === "ar"
        ? "منظومة منتج أوضح عبر الموقع والتطبيق."
        : "A clearer product ecosystem across site and app.",
    tags: locale === "ar" ? ["Android TV", "واجهة منتج", "MoPlayer"] : ["Android TV", "Product UI", "MoPlayer"],
    gallery: ["/images/moplayer-hero-3d-final.png", "/images/moplayer_ui_now_playing-final.png", "/images/moplayer-activation-flow.webp"],
    metrics: locale === "ar"
      ? [
          { value: "API 24+", label: "الحد الأدنى" },
          { value: "TV", label: "سياق Android TV" },
          { value: "VLC", label: "محرك التشغيل" },
        ]
      : [
          { value: "API 24+", label: "Minimum SDK" },
          { value: "TV", label: "Android TV focus" },
          { value: "VLC", label: "Playback engine" },
        ],
  });
}

function moplayer2Fallback(locale: Locale): SiteViewModel["projects"][number] {
  const isAr = locale === "ar";
  return repairMojibakeDeep({
    id: "moplayer2-fallback",
    slug: "moplayer2",
    title: "MoPlayer Pro",
    ctaLabel: isAr ? "استكشف التطبيق الجديد" : "Explore new app",
    summary: isAr
      ? "الجيل الجديد من MoPlayer كمنتج مستقل داخل نفس موقع محمد الفراس، مع صفحة وإصدارات وإدارة منفصلة."
      : "The new MoPlayer generation as a separate product inside the same Mohammad Alfarras site, with its own page, releases, and admin control.",
    description: isAr
      ? "MoPlayer Pro يبقى تحت نفس الدومين ونفس Supabase، لكنه يظهر كمنتج مستقل عن MoPlayer القديم."
      : "MoPlayer Pro stays under the same domain and Supabase system, but appears as its own product separate from classic MoPlayer.",
    image: "/images/moplayer-tv-hero.png",
    href: `/${locale}/apps/moplayer2`,
    featured: true,
    featuredRank: 4,
    accent: "blue",
    highlightStyle: "app",
    deviceFrame: "phone",
    eyebrow: isAr ? "تطبيق Android TV جديد" : "New Android TV app",
    challenge: isAr ? "فصل التطبيق الجديد عن القديم بدون إنشاء مشاريع Vercel زائدة." : "Separate the new app from the old one without adding extra Vercel projects.",
    solution: isAr ? "منتجان داخل نفس صفحة التطبيقات ونفس لوحة الإدارة مع product switcher." : "Two products inside the same Apps page and admin, controlled by a product switcher.",
    result: isAr ? "هيكلة أوضح للنشر والإدارة والفهرسة." : "A clearer structure for publishing, admin, and indexing.",
    tags: isAr ? ["MoPlayer Pro", "Android TV", "إدارة موحدة"] : ["MoPlayer Pro", "Android TV", "Unified admin"],
    gallery: ["/images/moplayer-tv-hero.png", "/images/moplayer-tv-banner-final.png", "/images/moplayer-release-panel.webp"],
    metrics: isAr
      ? [
          { value: "2", label: "تطبيقات منفصلة" },
          { value: "1", label: "لوحة إدارة" },
          { value: "SEO", label: "صفحة مستقلة" },
        ]
      : [
          { value: "2", label: "Separate apps" },
          { value: "1", label: "Admin panel" },
          { value: "SEO", label: "Standalone page" },
        ],
  });
}

function businessShowcaseProjects(locale: Locale): SiteViewModel["projects"] {
  const isAr = locale === "ar";
  return [
    {
      id: "wp-ad-fahrzeugtransporte",
      slug: "ad-fahrzeugtransporte",
      title: "A&D Fahrzeugtransporte",
      ctaLabel: isAr ? "عرض المشروع" : "View project",
      summary: isAr
        ? "حضور رقمي ألماني لخدمات نقل المركبات والجر، مبني على الوضوح والاتصال السريع."
        : "A German towing and vehicle transport surface built around clarity, speed, and direct contact.",
      description: isAr
        ? "موقع يقدّم الخدمات بسرعة ويقود الزائر إلى الهاتف أو واتساب بدون تشتت."
        : "A service site that explains the offer quickly and moves visitors toward phone or WhatsApp without friction.",
      image: "/images/projects/adtransporte-home.png",
      href: "https://www.adtransporte.de/",
      featured: true,
      featuredRank: 1,
      accent: "blue",
      highlightStyle: "operations",
      deviceFrame: "browser",
      eyebrow: isAr ? "نقل وجر سيارات" : "Transport and towing",
      challenge: isAr ? "بناء ثقة سريعة في سوق خدمات يعتمد على القرار الفوري." : "Create fast trust inside a service market that depends on immediate contact.",
      solution: isAr ? "ترتيب العرض والخدمات والـ CTA بشكل أوضح." : "Clarify services, hierarchy, and CTA flow.",
      result: isAr ? "واجهة عملية وواضحة مناسبة للجوال." : "A practical, mobile-ready service surface.",
      tags: isAr ? ["ألمانيا", "موقع خدمات", "نقل مركبات"] : ["Germany", "Service site", "Vehicle transport"],
      gallery: ["/images/projects/adtransporte-home.png", "/images/projects/adtransporte-mobile.png"],
      metrics: isAr
        ? [
            { value: "24/7", label: "تموضع الخدمة" },
            { value: "DE", label: "سوق ألماني" },
            { value: "CTA", label: "اتصال مباشر" },
          ]
        : [
            { value: "24/7", label: "Service positioning" },
            { value: "DE", label: "German market" },
            { value: "CTA", label: "Direct contact" },
          ],
    },
    {
      id: "wp-intelligent-umzuege",
      slug: "intelligent-umzuege",
      title: "Intelligent Umzuege",
      ctaLabel: isAr ? "عرض المشروع" : "View project",
      summary: isAr
        ? "حضور رقمي لشركة نقل وانتقال يشرح الخدمة بسرعة ويوجّه نحو الطلب."
        : "A moving company site that explains the service fast and guides users toward inquiry.",
      description: isAr
        ? "المشروع يركّز على الوضوح والثقة وبنية طلب سهلة على الجوال."
        : "The build focuses on clarity, trust, and a mobile-friendly request path.",
      image: "/images/projects/intelligent-umzuege-home.png",
      href: "https://intelligent-umzuege.vercel.app/",
      featured: true,
      featuredRank: 2,
      accent: "amber",
      highlightStyle: "trust",
      deviceFrame: "browser",
      eyebrow: isAr ? "موقع شركة انتقال" : "Moving company site",
      challenge: isAr ? "الزائر يقارن بسرعة ويحتاج وضوحاً فورياً." : "Visitors compare quickly and need instant clarity.",
      solution: isAr ? "بنية أوضح للعرض والخدمات والطلب." : "A clearer structure for services and quote flow.",
      result: isAr ? "تجربة أخف وأوضح على الجوال والكمبيوتر." : "A clearer experience across phone and desktop.",
      tags: isAr ? ["نقل", "خدمات محلية", "برلين"] : ["Moving", "Local services", "Berlin"],
      gallery: ["/images/projects/intelligent-umzuege-home.png", "/images/projects/intelligent-umzuege-mobile.png"],
      metrics: isAr
        ? [
            { value: "Mobile", label: "طلب سريع" },
            { value: "Berlin", label: "سوق محلي" },
            { value: "Form", label: "مسار الطلب" },
          ]
        : [
            { value: "Mobile", label: "Fast request path" },
            { value: "Berlin", label: "Local market" },
            { value: "Form", label: "Quote flow" },
          ],
    },
  ];
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
      const fallbackImage = entry.slug.includes("moplayer") ? "/images/moplayer-hero-3d-final.png" : "/images/projects/seel-home-case.png";

      return {
        id: entry.id,
        slug: entry.slug,
        title: translation?.title ?? entry.slug,
        ctaLabel: translation?.cta_label ?? (locale === "ar" ? "عرض المشروع" : "Open project"),
        summary: translation?.summary ?? "",
        description: translation?.description ?? translation?.summary ?? "",
        image: safeImageSrc(resolveMediaPath(snapshot.media_assets, coverAsset?.media_id ?? entry.cover_media_id, fallbackImage), fallbackImage),
        href: entry.project_url || (entry.slug.includes("moplayer") ? `/${locale}/apps/moplayer` : undefined),
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

  if (!active.some((project) => project.slug === "moplayer")) active.push(moplayerFallback(locale));
  if (!active.some((project) => project.slug === "moplayer2")) active.push(moplayer2Fallback(locale));
  for (const showcase of businessShowcaseProjects(locale)) {
    if (!active.some((project) => project.slug === showcase.slug)) active.push(showcase);
  }

  const visualOverrides: Record<string, { image: string; gallery: string[] }> = {
    "ad-fahrzeugtransporte": {
      image: "/images/projects/adtransporte-home.png",
      gallery: ["/images/projects/adtransporte-home.png", "/images/projects/adtransporte-mobile.png"],
    },
    "intelligent-umzuege": {
      image: "/images/projects/intelligent-umzuege-home.png",
      gallery: ["/images/projects/intelligent-umzuege-home.png", "/images/projects/intelligent-umzuege-mobile.png"],
    },
    moplayer: {
      image: "/images/moplayer-hero-3d-final.png",
      gallery: ["/images/moplayer-hero-3d-final.png", "/images/moplayer_ui_playlist-final.png", "/images/moplayer-release-panel.webp"],
    },
    moplayer2: {
      image: "/images/moplayer-pro-hero.webp",
      gallery: ["/images/moplayer-pro-hero.webp", "/images/moplayer-pro-home.webp", "/images/moplayer-pro-activation.webp", "/images/moplayer-pro-player.webp"],
    },
  };

  for (const project of active) {
    const override = visualOverrides[project.slug];
    if (override) {
      project.image = override.image;
      project.gallery = override.gallery;
    }
  }

  return repairMojibakeDeep(active);
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

  return repairMojibakeDeep({
    channels,
    emailAddress: String(email?.value ?? "mohammad.alfarras@gmail.com").replace(/^mailto:/, ""),
    whatsappUrl: whatsapp?.value ?? "https://wa.me/4917623419358",
  });
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
  const pdfRegistry = getPdfRegistry(snapshot);
  const youtube = getYoutube(snapshot);

  const [videos, liveYoutube, liveWeather, liveMatches] = await Promise.all([
    readVideos(),
    getLiveYoutubeData(typeof youtube.channel_id === "string" ? youtube.channel_id : undefined),
    getLiveWeather(),
    getLiveMatches(),
  ]);

  const pageSlug = slug || "home";
  const cvPresentation = buildCvPresentationModel(snapshot, locale);
  const brandedDownload =
    pdfRegistry.active.branded === "uploaded" && pdfRegistry.uploads.branded?.url
      ? pdfRegistry.uploads.branded.url
      : `/api/cv-pdf?locale=${locale}&variant=branded`;
  const atsDownload =
    pdfRegistry.active.ats === "uploaded" && pdfRegistry.uploads.ats?.url
      ? pdfRegistry.uploads.ats.url
      : `/api/cv-pdf?locale=${locale}&variant=ats`;

  return repairMojibakeDeep({
    locale,
    pageSlug,
    t: copy,
    profile: getProfile(snapshot, locale),
    projects: getProjects(snapshot, locale),
    services: getServices(snapshot, locale),
    experience: getExperience(snapshot, locale, locale === "ar" ? "الآن" : "Now"),
    certifications: getCertifications(snapshot, locale),
    contact: getContact(snapshot, locale),
    youtube,
    featuredVideo: videos.find((item) => item.is_featured) ?? videos[0] ?? null,
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
    portraitImage: safeImageSrc("/images/protofeilnew.jpeg", "/images/protofeilnew.jpeg"),
    brandMedia,
    downloads: {
      branded: brandedDownload,
      ats: atsDownload,
      docx: `/api/cv-docx?locale=${locale}`,
    },
  });
}

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const model = await buildSiteModel({ locale, slug });
  if (model.pageSlug === "privacy") {
    return <PortfolioPrivacyPage locale={model.locale} />;
  }
  return <DigitalOsPage model={model} />;
}
