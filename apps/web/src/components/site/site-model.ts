import { getPdfRegistry, resolveBrandAssetPaths, resolveRebuildLocaleContent } from "@/lib/cms-documents";
import { siteIdentity, youtubeChannel } from "@/content/site-data";
import { getSiteSetting, readSnapshot, readVideos } from "@/lib/content/store";
import { buildCvPresentationModel } from "@/lib/cv-presenter";
import { formatMonthYear } from "@/lib/locale-format";
import { getProjectStudioItem, resolveMediaPath, translateMetric } from "@/lib/projects-studio";
import { resolveSiteImages } from "@/lib/site-images";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import { getLiveYoutubeChannelStats, getLiveYoutubeData } from "@/lib/youtube-live";
import type { CmsSnapshot, Locale } from "@/types/cms";

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
    title_en: siteIdentity.name.en,
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
      title: locale === "ar" ? "مواقع ومواقع تعريفية احترافية" : "Professional business websites",
      body:
        locale === "ar"
          ? "مواقع أعمال وحضور رقمي ثنائي اللغة مبني على وضوح الرسالة والثقة من أول شاشة."
          : "Business websites and bilingual digital presence built around clarity, trust, and first-screen hierarchy.",
      bullets: locale === "ar" ? ["مواقع أعمال", "واجهات حديثة", "ثنائية اللغة"] : ["Business sites", "Modern UI", "Bilingual delivery"],
      image: "/images/service_web.png",
    },
    {
      id: "service-landing",
      title: locale === "ar" ? "صفحات هبوط للحملات والمنتجات" : "Landing pages for campaigns & products",
      body:
        locale === "ar"
          ? "صفحة مركّزة لإطلاق منتج أو خدمة، بترتيب بصري قوي ونص مقنع ومسار واضح يحوّل الزائر إلى خطوة فعلية."
          : "A focused page for a launch or service, with strong hierarchy, persuasive copy, and a direct conversion path.",
      bullets: locale === "ar" ? ["هدف واحد", "نص مقنع", "تحويل مباشر"] : ["One goal", "Persuasive copy", "Direct conversion"],
      image: "/images/hero_tech.png",
    },
    {
      id: "service-platform",
      title: locale === "ar" ? "منصّات ودلائل وأسواق إلكترونية" : "Directories, marketplaces & platforms",
      body:
        locale === "ar"
          ? "منصّات كاملة فيها بحث وفلاتر وخريطة وصفحات تفصيلية ولوحة إدارة — مثل دليل مدينة، أو منصّة عقارات، أو متجر إلكتروني."
          : "Full platforms with search, filters, a map, detail pages, and an admin panel — like a city directory, a property marketplace, or an online store.",
      bullets: locale === "ar" ? ["بحث وفلاتر", "خرائط وقوائم", "لوحة إدارة"] : ["Search & filters", "Maps & listings", "Admin panel"],
      image: "/images/projects/qamishli-home.webp",
    },
    {
      id: "service-uiux",
      title: locale === "ar" ? "واجهات وتطبيقات ويب" : "Web apps & interfaces",
      body:
        locale === "ar"
          ? "واجهات منظمة لمنتج، لوحة تحكم، أو تجربة تفاعلية مع تصميم قابل للتوسع وسهل الإدارة."
          : "Structured interfaces for a product, dashboard, or interactive experience, designed to scale cleanly.",
      bullets: locale === "ar" ? ["UI/UX حديث", "لوحات تحكم", "بنية قابلة للنمو"] : ["Modern UI/UX", "Dashboards", "Scalable architecture"],
      image: "/images/service_tech.png",
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
    {
      id: "service-product",
      title: locale === "ar" ? "دعم منتج MoPlayer و Android TV" : "MoPlayer & Android TV product support",
      body:
        locale === "ar"
          ? "تموضع المنتج، صفحات التفعيل والتحميل، بيانات الإصدارات، الدعم والخصوصية، وتجربة عرض مناسبة لـ Android TV."
          : "Product positioning, activation and download flows, release metadata, support, privacy, and a TV-first presentation.",
      bullets: locale === "ar" ? ["تموضع منتج", "تفعيل وتحميل", "Android TV"] : ["Positioning", "Activation & download", "Android TV"],
      image: "/images/moplayer-hero-3d-final.png",
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

type OffersSetting = {
  items?: Array<{
    id?: string;
    isActive?: boolean;
    placement?: string;
    style?: string;
    sortOrder?: number;
    badge?: { ar?: string; en?: string };
    title?: { ar?: string; en?: string };
    body?: { ar?: string; en?: string };
    ctaLabel?: { ar?: string; en?: string };
    ctaHref?: string;
    image?: string;
  }>;
};

function getOffers(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["offers"] {
  const setting = getSiteSetting<OffersSetting>(snapshot, "site_offers", { items: [] });
  const items = Array.isArray(setting.items) ? setting.items : [];
  const allowedPlacement = new Set(["home", "services", "apps", "contact", "all"]);
  const allowedStyle = new Set(["banner", "cards", "strip"]);

  return repairMojibakeDeep(
    items
      .filter((item) => item.isActive !== false)
      .map((item, index) => {
        const placement = allowedPlacement.has(String(item.placement)) ? String(item.placement) : "home";
        const style = allowedStyle.has(String(item.style)) ? String(item.style) : "banner";
        return {
          id: item.id || `offer-${index + 1}`,
          isActive: item.isActive !== false,
          placement: placement as SiteViewModel["offers"][number]["placement"],
          style: style as SiteViewModel["offers"][number]["style"],
          title: locale === "ar" ? item.title?.ar || item.title?.en || "" : item.title?.en || item.title?.ar || "",
          body: locale === "ar" ? item.body?.ar || item.body?.en || "" : item.body?.en || item.body?.ar || "",
          badge: locale === "ar" ? item.badge?.ar || item.badge?.en || "" : item.badge?.en || item.badge?.ar || "",
          ctaLabel: locale === "ar" ? item.ctaLabel?.ar || item.ctaLabel?.en || "" : item.ctaLabel?.en || item.ctaLabel?.ar || "",
          ctaHref: safeImageSrc(item.ctaHref, `/${locale}/contact`),
          image: safeImageSrc(item.image, "/images/hero_tech.png"),
          sortOrder: Number(item.sortOrder ?? index + 1),
        };
      })
      .filter((item) => item.title || item.body)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );
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
          { value: "Android 7+", label: "الحد الأدنى" },
          { value: "TV", label: "سياق Android TV" },
          { value: "VLC", label: "محرك التشغيل" },
        ]
      : [
          { value: "Android 7+", label: "Minimum version" },
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
      ? "MoPlayer Pro يبقى تحت نفس الدومين ونفس لوحة الإدارة، لكنه يظهر كمنتج مستقل عن MoPlayer القديم."
      : "MoPlayer Pro stays under the same domain and management flow, but appears as its own product separate from classic MoPlayer.",
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

function moplayerPcFallback(locale: Locale): SiteViewModel["projects"][number] {
  const isAr = locale === "ar";
  return repairMojibakeDeep({
    id: "moplayer-pc-fallback",
    slug: "moplayer-pc",
    title: "MoPlayer PC",
    ctaLabel: isAr ? "قريباً" : "Coming soon",
    summary: isAr
      ? "نسخة ويندوز من MoPlayer تنقل تجربة المشاهدة إلى الكمبيوتر بنفس الهوية — قيد التطوير حالياً."
      : "The Windows edition of MoPlayer, bringing the playback experience to desktop with the same identity — currently in development.",
    description: isAr
      ? "تطبيق سطح مكتب لويندوز يكمل منظومة MoPlayer (أندرويد وAndroid TV) ليغطّي الكمبيوتر بواجهة سريعة وواضحة."
      : "A Windows desktop app extending the MoPlayer ecosystem (Android and Android TV) to the computer with a fast, clear interface.",
    image: "/images/moplayer-pro-showcase-1.png",
    href: undefined,
    featured: true,
    featuredRank: 5,
    accent: "blue",
    highlightStyle: "app",
    deviceFrame: "browser",
    eyebrow: isAr ? "تطبيق ويندوز · قيد التطوير" : "Windows app · In development",
    challenge: isAr ? "توسيع MoPlayer من الموبايل والتلفاز إلى الكمبيوتر بنفس الجودة." : "Extend MoPlayer from mobile and TV to desktop with the same quality.",
    solution: isAr ? "تطبيق ويندوز أصلي يشارك نفس الهوية ومنطق التشغيل والتفعيل." : "A native Windows app sharing the same identity, playback, and activation logic.",
    result: isAr ? "منظومة MoPlayer تغطّي كل الشاشات قريباً." : "A MoPlayer ecosystem covering every screen — soon.",
    tags: isAr ? ["MoPlayer", "ويندوز", "كمبيوتر", "قيد التطوير"] : ["MoPlayer", "Windows", "Desktop", "In development"],
    gallery: ["/images/moplayer-pro-showcase-1.png", "/images/moplayer-pro-showcase-2.png"],
    metrics: isAr
      ? [
          { value: "Windows", label: "المنصة" },
          { value: "قريباً", label: "الإطلاق" },
          { value: "Desktop", label: "تجربة الكمبيوتر" },
        ]
      : [
          { value: "Windows", label: "Platform" },
          { value: "Soon", label: "Release" },
          { value: "Desktop", label: "Experience" },
        ],
    status: "in-development",
  });
}

function moplayerIosFallback(locale: Locale): SiteViewModel["projects"][number] {
  const isAr = locale === "ar";
  return repairMojibakeDeep({
    id: "moplayer-ios-fallback",
    slug: "moplayer-ios",
    title: "MoPlayer iOS",
    ctaLabel: isAr ? "قريباً" : "Coming soon",
    summary: isAr
      ? "نسخة آيفون من MoPlayer لتجربة مشاهدة سلسة على iOS بنفس منطق التفعيل — قيد التطوير حالياً."
      : "The iPhone edition of MoPlayer for a smooth iOS playback experience with the same activation logic — currently in development.",
    description: isAr
      ? "تطبيق iPhone يكمل منظومة MoPlayer ليصل المحتوى إلى مستخدمي iOS بواجهة أنيقة وسريعة."
      : "An iPhone app extending the MoPlayer ecosystem to iOS users with a clean, fast interface.",
    image: "/images/moplayer-pro-home.webp",
    href: `/${locale}/apps/moplayer-ios`,
    featured: true,
    featuredRank: 6,
    accent: "blue",
    highlightStyle: "app",
    deviceFrame: "phone",
    eyebrow: isAr ? "تطبيق آيفون · قيد التطوير" : "iPhone app · In development",
    challenge: isAr ? "إيصال تجربة MoPlayer إلى منظومة iOS بمعاييرها." : "Bring the MoPlayer experience to the iOS ecosystem and its standards.",
    solution: isAr ? "تطبيق iPhone أصلي بنفس الهوية ومنطق التفعيل والتشغيل." : "A native iPhone app with the same identity, activation, and playback logic.",
    result: isAr ? "MoPlayer على الآيفون قريباً ضمن نفس المنظومة." : "MoPlayer on iPhone soon, inside the same ecosystem.",
    tags: isAr ? ["MoPlayer", "iPhone", "iOS", "قيد التطوير"] : ["MoPlayer", "iPhone", "iOS", "In development"],
    gallery: ["/images/moplayer-pro-home.webp", "/images/moplayer_ui_now_playing-final.png"],
    metrics: isAr
      ? [
          { value: "iPhone", label: "المنصة" },
          { value: "قريباً", label: "الإطلاق" },
          { value: "iOS", label: "تجربة أصلية" },
        ]
      : [
          { value: "iPhone", label: "Platform" },
          { value: "Soon", label: "Release" },
          { value: "iOS", label: "Native experience" },
        ],
    status: "in-development",
  });
}

function businessShowcaseProjects(locale: Locale): SiteViewModel["projects"] {
  const isAr = locale === "ar";
  return [
    {
      id: "wp-alhasakah",
      slug: "alhasakah",
      title: isAr ? "دليل الحسكة" : "Alhasakah City Guide",
      ctaLabel: isAr ? "عرض المشروع" : "View project",
      summary: isAr
        ? "دليل مدينة متكامل يجمع المطاعم والمحلات والأطباء والخدمات مع بحث ذكي وخريطة."
        : "A complete city directory bringing together restaurants, shops, doctors and services with smart search and a map.",
      description: isAr
        ? "منصّة دليل محلي لمدينة الحسكة: تصنيفات واضحة، بحث، خريطة، إضافة نشاطك، ومساعد ذكي — بتصميم عصري سريع."
        : "A local directory platform for Al-Hasakah: clear categories, search, an interactive map, self-serve business listings, and a smart assistant — modern and fast.",
      image: "/images/projects/alhasakah-home.webp",
      href: "https://alhasakah.net/",
      featured: true,
      featuredRank: 1,
      accent: "amber",
      highlightStyle: "editorial",
      deviceFrame: "browser",
      eyebrow: isAr ? "دليل مدينة" : "City directory",
      challenge: isAr ? "تجميع أنشطة مدينة كاملة في مكان واحد سهل البحث والتصفّح." : "Bring a whole city's businesses into one easy, searchable place.",
      solution: isAr ? "بحث ذكي، تصنيفات واضحة، خريطة تفاعلية، ولوحة لإضافة الأنشطة." : "Smart search, clear categories, an interactive map, and a self-serve listing flow.",
      result: isAr ? "منصّة محلية حيّة سهلة الاستخدام على الجوال والكمبيوتر." : "A living local platform, easy to use on phone and desktop.",
      tags: isAr ? ["دليل محلي", "بحث", "خريطة", "سوريا"] : ["Local directory", "Search", "Map", "Syria"],
      gallery: ["/images/projects/alhasakah-home.webp", "/images/projects/alhasakah-mobile.webp"],
      metrics: isAr
        ? [
            { value: "+44", label: "فئة" },
            { value: "بحث", label: "ذكي" },
            { value: "خريطة", label: "تفاعلية" },
          ]
        : [
            { value: "44+", label: "Categories" },
            { value: "Smart", label: "Search" },
            { value: "Map", label: "Interactive" },
          ],
    },
    {
      id: "wp-qamishli",
      slug: "qamishli",
      title: isAr ? "عقارات القامشلي" : "Qamishli Real Estate",
      ctaLabel: isAr ? "عرض المشروع" : "View project",
      summary: isAr
        ? "منصّة عقارية تجمع الشقق والبيوت والأراضي في القامشلي مع بحث وفلاتر وخريطة."
        : "A real-estate marketplace for apartments, houses and land in Qamishli with search, filters and a map.",
      description: isAr
        ? "منصّة عقارات: بيع وإيجار، فلاتر سعر ونوع، خريطة، إضافة عقارك، وتواصل مباشر — بتصميم عصري سريع."
        : "A property platform: sale and rent, price and type filters, a map, self-listing, and direct contact — modern and fast.",
      image: "/images/projects/qamishli-home.webp",
      href: "https://qamishli.net/",
      featured: true,
      featuredRank: 2,
      accent: "ink",
      highlightStyle: "app",
      deviceFrame: "browser",
      eyebrow: isAr ? "منصّة عقارات" : "Real-estate platform",
      challenge: isAr ? "تنظيم سوق العقارات المحلي في تجربة واحدة واضحة وموثوقة." : "Organize a local property market into one clear, trustworthy experience.",
      solution: isAr ? "بحث وفلاتر دقيقة، خريطة، صفحات عقار واضحة، ومسار تواصل مباشر." : "Precise search and filters, a map, clean listing pages, and a direct contact path.",
      result: isAr ? "منصّة عقارية عصرية سريعة مبنية للجوال أولاً." : "A modern, fast property platform built mobile-first.",
      tags: isAr ? ["عقارات", "بحث وفلاتر", "خريطة", "سوريا"] : ["Real estate", "Search & filters", "Map", "Syria"],
      gallery: ["/images/projects/qamishli-home.webp", "/images/projects/qamishli-mobile.webp"],
      metrics: isAr
        ? [
            { value: "عقارات", label: "بيع وإيجار" },
            { value: "فلاتر", label: "بحث دقيق" },
            { value: "خريطة", label: "مواقع" },
          ]
        : [
            { value: "Sale/Rent", label: "Listings" },
            { value: "Filters", label: "Precise search" },
            { value: "Map", label: "Locations" },
          ],
    },
    {
      id: "wp-mbkservice",
      slug: "mbkservice",
      title: "MBK Service",
      ctaLabel: isAr ? "عرض المشروع" : "View project",
      summary: isAr
        ? "حضور رقمي فاخر لخدمات النقل والليموزين والتوصيل في برلين، مبني على الثقة والأناقة."
        : "A premium digital presence for mobility, limousine and courier services in Berlin, built on trust and elegance.",
      description: isAr
        ? "موقع خدمات راقٍ: سيارات مع سائق، ليموزين، وتوصيل طرود — مع مسار طلب واتصال واضح وهوية أسود/ذهبي."
        : "An upscale service site: chauffeured cars, limousine, and parcel courier — with a clear inquiry/call path and a black-gold identity.",
      image: "/images/projects/mbkservice-home.webp",
      href: "https://mbkservice.de/de",
      featured: true,
      featuredRank: 3,
      accent: "ink",
      highlightStyle: "trust",
      deviceFrame: "browser",
      eyebrow: isAr ? "نقل وتوصيل فاخر" : "Premium mobility",
      challenge: isAr ? "تقديم خدمة نقل فاخرة بثقة وأناقة تليق بالعملاء." : "Present a premium transport service with the trust and elegance its clients expect.",
      solution: isAr ? "هوية بصرية فاخرة (أسود/ذهبي)، خدمات واضحة، وأزرار طلب واتصال بارزة." : "A luxury black-gold identity, clear service blocks, and prominent inquiry/call actions.",
      result: isAr ? "واجهة راقية تبني الثقة وتسهّل الطلب والحجز." : "A refined surface that builds trust and makes inquiry and booking easy.",
      tags: isAr ? ["برلين", "نقل فاخر", "ليموزين", "توصيل"] : ["Berlin", "Premium mobility", "Limousine", "Courier"],
      gallery: ["/images/projects/mbkservice-home.webp", "/images/projects/mbkservice-mobile.webp"],
      metrics: isAr
        ? [
            { value: "Premium", label: "تموضع فاخر" },
            { value: "Berlin", label: "سوق محلي" },
            { value: "24/7", label: "خدمة" },
          ]
        : [
            { value: "Premium", label: "Positioning" },
            { value: "Berlin", label: "Local market" },
            { value: "24/7", label: "Service" },
          ],
    },
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
      image: "/images/projects/adtransporte-home.webp",
      href: "https://www.adtransporte.de/",
      featured: true,
      featuredRank: 4,
      accent: "blue",
      highlightStyle: "operations",
      deviceFrame: "browser",
      eyebrow: isAr ? "نقل وجر سيارات" : "Transport and towing",
      challenge: isAr ? "بناء ثقة سريعة في سوق خدمات يعتمد على القرار الفوري." : "Create fast trust inside a service market that depends on immediate contact.",
      solution: isAr ? "ترتيب العرض والخدمات والـ CTA بشكل أوضح." : "Clarify services, hierarchy, and CTA flow.",
      result: isAr ? "واجهة عملية وواضحة مناسبة للجوال." : "A practical, mobile-ready service surface.",
      tags: isAr ? ["ألمانيا", "موقع خدمات", "نقل مركبات"] : ["Germany", "Service site", "Vehicle transport"],
      gallery: ["/images/projects/adtransporte-home.webp", "/images/projects/adtransporte-mobile.webp"],
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
      image: "/images/projects/intelligent-umzuege-home.webp",
      href: "https://www.intelligent-umzuege.de/",
      featured: true,
      featuredRank: 5,
      accent: "amber",
      highlightStyle: "trust",
      deviceFrame: "browser",
      eyebrow: isAr ? "موقع شركة انتقال" : "Moving company site",
      challenge: isAr ? "الزائر يقارن بسرعة ويحتاج وضوحاً فورياً." : "Visitors compare quickly and need instant clarity.",
      solution: isAr ? "بنية أوضح للعرض والخدمات والطلب." : "A clearer structure for services and quote flow.",
      result: isAr ? "تجربة أخف وأوضح على الجوال والكمبيوتر." : "A clearer experience across phone and desktop.",
      tags: isAr ? ["نقل", "خدمات محلية", "برلين"] : ["Moving", "Local services", "Berlin"],
      gallery: ["/images/projects/intelligent-umzuege-home.webp", "/images/projects/intelligent-umzuege-mobile.webp"],
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
    {
      id: "wp-seel",
      slug: "seel",
      title: "SEEL Transport & Reinigung",
      ctaLabel: isAr ? "عرض المشروع" : "View project",
      summary: isAr
        ? "حضور رقمي فاخر لشركة نقل وتنظيف وإخلاء في برلين وبراندنبورغ، مبني على التنظيم والثقة."
        : "A premium digital presence for a Berlin moving, cleaning and clearance company, built on organization and trust.",
      description: isAr
        ? "موقع خدمات أنيق بهوية داكنة وسماوية: نقل، تنظيف، وإخلاء — مع أسعار شفافة، حجز أونلاين، ومسار اتصال واضح وسريع."
        : "An elegant service site with a dark-cyan identity: moving, cleaning, and clearance — with transparent pricing, online booking, and a clear, fast contact path.",
      image: "/images/projects/seel-home.webp",
      href: "https://seeltransport.de/",
      featured: true,
      featuredRank: 6,
      accent: "blue",
      highlightStyle: "trust",
      deviceFrame: "browser",
      eyebrow: isAr ? "نقل · تنظيف · إخلاء" : "Moving · Cleaning · Clearance",
      challenge: isAr ? "تقديم خدمات نقل وتنظيف وإخلاء بثقة وتنظيم يطمئن العميل." : "Present moving, cleaning, and clearance services with the trust and order a client needs.",
      solution: isAr ? "هوية فاخرة، خدمات واضحة، أسعار شفافة، وحجز أونلاين مباشر." : "A premium identity, clear services, transparent pricing, and direct online booking.",
      result: isAr ? "واجهة هادئة واحترافية تبني الثقة وتسهّل الحجز." : "A calm, professional surface that builds trust and makes booking easy.",
      tags: isAr ? ["برلين", "نقل", "تنظيف", "إخلاء"] : ["Berlin", "Moving", "Cleaning", "Clearance"],
      gallery: ["/images/projects/seel-home.webp", "/images/projects/seel-mobile.webp"],
      metrics: isAr
        ? [
            { value: "24/7", label: "خدمة" },
            { value: "Berlin", label: "وبراندنبورغ" },
            { value: "حجز", label: "أونلاين" },
          ]
        : [
            { value: "24/7", label: "Service" },
            { value: "Berlin", label: "& Brandenburg" },
            { value: "Booking", label: "Online" },
          ],
    },
    {
      id: "wp-schnell",
      slug: "schnell",
      title: "Schnell Sicher Umzug",
      ctaLabel: isAr ? "عرض المشروع" : "View project",
      summary: isAr
        ? "خدمة نقل ألمانية متكاملة (نقل · تخلّص · تركيب) مع نظام حجز عصري وتغطية على مستوى ألمانيا."
        : "A full German moving service (moving · disposal · assembly) with a modern booking system and nationwide coverage.",
      description: isAr
        ? "موقع نقل احترافي بتصميم أزرق فاتح فخم: عرض سريع وواضح، حجز موعد أونلاين، أسعار عادلة، وتغطية في كل ألمانيا."
        : "A professional moving site with a premium light-blue design: a fast, clear pitch, online appointment booking, fair pricing, and Germany-wide coverage.",
      image: "/images/projects/schnell-home.webp",
      href: "https://schnellsicherumzug.de/",
      featured: true,
      featuredRank: 7,
      accent: "ink",
      highlightStyle: "operations",
      deviceFrame: "browser",
      eyebrow: isAr ? "نقل · تخلّص · تركيب" : "Moving · Disposal · Assembly",
      challenge: isAr ? "تحويل خدمة نقل إلى تجربة بلا توتر مع حجز سهل وثقة فورية." : "Turn a moving service into a stress-free experience with easy booking and instant trust.",
      solution: isAr ? "عرض واضح، نظام حجز موعد عصري، ومؤشرات ثقة (24/7، أسعار عادلة، كل ألمانيا)." : "A clear pitch, a modern booking system, and trust signals (24/7, fair pricing, nationwide).",
      result: isAr ? "تجربة حجز نقل عصرية وسلسة على الجوال والكمبيوتر." : "A modern, smooth moving-booking experience on phone and desktop.",
      tags: isAr ? ["ألمانيا", "نقل", "حجز أونلاين", "نظام مواعيد"] : ["Germany", "Moving", "Online booking", "Scheduling"],
      gallery: ["/images/projects/schnell-home.webp", "/images/projects/schnell-mobile.webp"],
      metrics: isAr
        ? [
            { value: "24/7", label: "تواصل" },
            { value: "DE", label: "كل ألمانيا" },
            { value: "حجز", label: "نظام عصري" },
          ]
        : [
            { value: "24/7", label: "Reachable" },
            { value: "DE", label: "Nationwide" },
            { value: "Booking", label: "Modern system" },
          ],
    },
  ];
}

function getProjects(snapshot: CmsSnapshot, locale: Locale): SiteViewModel["projects"] {
  // CMS projects only present well once they have media. When none is configured
  // (the static seed snapshot, or while the database is unavailable), use the
  // curated showcase — it carries the real client projects with proper images and
  // case-study copy. Once projects are configured with media in the admin, that
  // CMS data takes over automatically.
  if (snapshot.work_project_media.length === 0) {
    return repairMojibakeDeep([moplayerFallback(locale), moplayer2Fallback(locale), moplayerPcFallback(locale), moplayerIosFallback(locale), ...businessShowcaseProjects(locale)]);
  }
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

  if (active.length) return repairMojibakeDeep(active);

  return repairMojibakeDeep([moplayerFallback(locale), moplayer2Fallback(locale), moplayerPcFallback(locale), moplayerIosFallback(locale), ...businessShowcaseProjects(locale)]);
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
    views: youtubeChannel.fallback.views,
    subscribers: youtubeChannel.fallback.subscribers,
    videos: youtubeChannel.fallback.videos,
    handle: youtubeChannel.handle,
    title: youtubeChannel.title,
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
  const siteImages = resolveSiteImages(snapshot);
  const pdfRegistry = getPdfRegistry(snapshot);
  const youtube = getYoutube(snapshot);
  const pageSlug = slug || "home";
  const needsYoutubeDetails = pageSlug === "youtube";

  const [videos, liveYoutube] = await Promise.all([
    readVideos(),
    needsYoutubeDetails
      ? getLiveYoutubeData(typeof youtube.channel_id === "string" ? youtube.channel_id : undefined)
      : getLiveYoutubeChannelStats(typeof youtube.channel_id === "string" ? youtube.channel_id : undefined),
  ]);

  const cvPresentation = buildCvPresentationModel(snapshot, locale);
  const brandedDownload =
    pdfRegistry.active.branded === "uploaded" && pdfRegistry.uploads.branded?.url
      ? pdfRegistry.uploads.branded.url
      : `/api/cv-pdf?locale=${locale}&variant=branded`;
  const atsDownload =
    pdfRegistry.active.ats === "uploaded" && pdfRegistry.uploads.ats?.url
      ? pdfRegistry.uploads.ats.url
      : `/api/cv-pdf?locale=${locale}&variant=ats`;

  // Admin-managed YouTube curation: hide videos, choose/order which to show,
  // optionally sort by views, and pin a featured one.
  const youtubeCuration = getSiteSetting<{ excludedIds?: string[]; featuredId?: string; pinnedIds?: string[]; sortByViews?: boolean }>(
    snapshot,
    "youtube_curation",
    {},
  );
  const cleanIds = (value: unknown) => (Array.isArray(value) ? value : []).map((id) => String(id).trim()).filter(Boolean);
  const excludedVideoIds = new Set(cleanIds(youtubeCuration.excludedIds));
  const pinnedIds = cleanIds(youtubeCuration.pinnedIds);
  const pinnedOrder = new Map(pinnedIds.map((id, index) => [id, index] as const));
  const sortByViews = youtubeCuration.sortByViews === true;
  const orderVideos = <T>(list: T[], idOf: (video: T) => string, viewsOf: (video: T) => number): T[] => {
    if (!pinnedOrder.size && !sortByViews) return list;
    return [...list].sort((a, b) => {
      const pa = pinnedOrder.has(idOf(a)) ? (pinnedOrder.get(idOf(a)) as number) : Number.POSITIVE_INFINITY;
      const pb = pinnedOrder.has(idOf(b)) ? (pinnedOrder.get(idOf(b)) as number) : Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return sortByViews ? viewsOf(b) - viewsOf(a) : 0;
    });
  };
  const visibleVideos = orderVideos(
    excludedVideoIds.size ? videos.filter((video) => !excludedVideoIds.has(video.youtube_id)) : videos,
    (video) => video.youtube_id,
    (video) => video.views,
  );
  const curatedLiveYoutube = liveYoutube
    ? {
        ...liveYoutube,
        videos: orderVideos(
          liveYoutube.videos.filter((video) => !excludedVideoIds.has(video.id)),
          (video) => video.id,
          (video) => video.views,
        ),
        popularVideos: liveYoutube.popularVideos.filter((video) => !excludedVideoIds.has(video.id)),
      }
    : liveYoutube;
  const pinnedFeatured = youtubeCuration.featuredId
    ? visibleVideos.find((video) => video.youtube_id === String(youtubeCuration.featuredId).trim())
    : undefined;
  const featuredVideo = pinnedFeatured ?? visibleVideos.find((item) => item.is_featured) ?? visibleVideos[0] ?? null;

  return repairMojibakeDeep({
    locale,
    pageSlug,
    t: copy,
    profile: getProfile(snapshot, locale),
    projects: getProjects(snapshot, locale),
    services: getServices(snapshot, locale),
    offers: getOffers(snapshot, locale),
    experience: getExperience(snapshot, locale, locale === "ar" ? "الآن" : "Now"),
    certifications: getCertifications(snapshot, locale),
    contact: getContact(snapshot, locale),
    youtube,
    featuredVideo,
    latestVideos: visibleVideos.slice(0, 6),
    gallery: getGallery(snapshot),
    live: {
      youtube: curatedLiveYoutube,
    },
    settings: snapshot.site_settings.reduce((acc, s) => ({ ...acc, [s.key]: s }), {}),
    cvBuilder: cvPresentation.builder,
    cvSections: cvPresentation.sections,
    cvProjects: cvPresentation.projects,
    cvExperience: cvPresentation.experience,
    portraitImage: safeImageSrc(siteImages.home_portrait || "/images/protofeilnew.jpeg", "/images/protofeilnew.jpeg"),
    siteImages,
    brandMedia,
    downloads: {
      branded: brandedDownload,
      ats: atsDownload,
      docx: `/api/cv-docx?locale=${locale}`,
    },
  });
}

