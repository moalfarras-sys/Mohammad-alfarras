"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, Check, ExternalLink, FileText, Globe, ImageIcon, Inbox, Power, Search, Settings2, Trash2, UploadCloud, X } from "lucide-react";

import {
  deleteWebsiteMessageAction,
  deleteWebsiteMediaAction,
  deleteWebsiteProjectAction,
  deleteWebsiteServiceAction,
  saveWebsiteBrandAction,
  saveWebsiteContactAction,
  saveLegalPagesAction,
  saveWebsiteOffersAction,
  saveSiteStatusAction,
  saveWebsiteThemeAction,
  saveWebsiteHeroAction,
  saveWebsitePageAction,
  saveWebsiteProjectAction,
  saveWebsiteServiceAction,
  saveSiteImagesAction,
  saveWebsiteServicesAction,
  saveYoutubeCurationAction,
  updateWebsiteMessageStatusAction,
  uploadWebsiteMediaAction,
} from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";
import { ReplyComposer } from "@/components/admin/reply-composer";
import { Accordion, EmptyState, PageHeader, StatCard, Toggle } from "@/components/admin/ui";
import { HelpTip } from "@/components/admin/ui";
import { UpdatedToast } from "@/components/admin/updated-toast";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
import type { WebsiteCmsData, WebsiteSetting } from "@/lib/website-cms";

const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");

function mediaUsageLabels(item: WebsiteCmsData["mediaAssets"][number], data: WebsiteCmsData) {
  const usage = new Set<string>();
  const needles = [item.id, item.path].filter(Boolean);

  for (const service of data.services) {
    if (service.cover_media_id === item.id) usage.add(`Service: ${service.id}`);
  }
  for (const project of data.projects) {
    if (project.cover_media_id === item.id) usage.add(`Project: ${project.id}`);
  }
  for (const setting of data.settings) {
    const text = JSON.stringify(setting.value_json);
    if (needles.some((needle) => text.includes(needle))) usage.add(`Settings: ${setting.key}`);
  }
  for (const page of data.pages) {
    const text = JSON.stringify(page);
    if (needles.some((needle) => text.includes(needle))) usage.add(`Page: ${page.slug}`);
  }
  for (const translation of data.pageTranslations) {
    const text = JSON.stringify(translation);
    if (needles.some((needle) => text.includes(needle))) usage.add(`Page copy: ${translation.page_id}/${translation.locale}`);
  }

  return [...usage];
}

const pageFallbacks = {
  home: {
    ar: {
      title: "الرئيسية",
      meta_title: "محمد الفراس | تصميم مواقع وتطبيقات وتسويق منتجات رقمية",
      meta_description: "موقع محمد الفراس الرسمي لخدمات تصميم المواقع والتطبيقات وتسويق المنتجات وصناعة حضور رقمي واضح.",
      og_title: "محمد الفراس | موقع شخصي احترافي",
      og_description: "تصميم مواقع وتطبيقات ومحتوى تقني بهوية بصرية واضحة.",
    },
    en: {
      title: "Home",
      meta_title: "Mohammad Alfarras | Websites, Apps, and Product Marketing",
      meta_description: "Official website for premium websites, app experiences, and creator-led product marketing.",
      og_title: "Mohammad Alfarras | Premium personal brand website",
      og_description: "Website and app design, digital execution, and product storytelling.",
    },
  },
  contact: {
    ar: {
      title: "تواصل",
      meta_title: "تواصل مع محمد الفراس",
      meta_description: "ابدأ مشروع موقع أو تطبيق أو حملة منتج مع محمد الفراس.",
      og_title: "تواصل مع محمد الفراس",
      og_description: "طلبات المشاريع والدعم تظهر مباشرة في لوحة الإدارة.",
    },
    en: {
      title: "Contact",
      meta_title: "Contact Mohammad Alfarras",
      meta_description: "Start a website, app, or product promotion project with Mohammad Alfarras.",
      og_title: "Contact Mohammad Alfarras",
      og_description: "Project requests and support messages appear directly in the admin panel.",
    },
  },
  work: {
    ar: {
      title: "الأعمال والدراسات",
      meta_title: "الأعمال ودراسات الحالة | محمد الفراس",
      meta_description: "مشاريع مواقع وخدمات رقمية وتجارب واجهات قابلة للتخصيص من لوحة الإدارة.",
      og_title: "الأعمال ودراسات الحالة",
      og_description: "أمثلة حقيقية على مشاريع مواقع وتجارب رقمية.",
    },
    en: {
      title: "Work",
      meta_title: "Work & Case Studies | Mohammad Alfarras",
      meta_description: "Selected case studies and digital work across websites, apps, and product experiences.",
      og_title: "Work & Case Studies",
      og_description: "Real websites, product experiences, and conversion-focused execution.",
    },
  },
  about: {
    ar: {
      title: "من أنا",
      meta_title: "من أنا | محمد الفراس",
      meta_description: "تعرف على خبرة محمد الفراس في بناء المواقع والتطبيقات والمحتوى التقني.",
      og_title: "من أنا | محمد الفراس",
      og_description: "خلفية عملية تجمع بين التشغيل والتصميم وبناء المنتجات الرقمية.",
    },
    en: {
      title: "About",
      meta_title: "About | Mohammad Alfarras",
      meta_description: "Learn about Mohammad Alfarras and his work across websites, apps, and technical storytelling.",
      og_title: "About | Mohammad Alfarras",
      og_description: "A practical background across operations, design, and digital product execution.",
    },
  },
  services: {
    ar: {
      title: "الخدمات",
      meta_title: "خدمات تصميم المواقع والتجارب الرقمية | محمد الفراس",
      meta_description: "خدمات مواقع وصفحات هبوط وتجارب رقمية قابلة للتخصيص من لوحة الإدارة.",
      og_title: "الخدمات | محمد الفراس",
      og_description: "مواقع، واجهات، صفحات منتجات، ومحتوى تقني مرتب.",
    },
    en: {
      title: "Services",
      meta_title: "Web Design and Digital Experience Services | Mohammad Alfarras",
      meta_description: "Websites, landing pages, and digital experiences that can be managed from the admin panel.",
      og_title: "Services | Mohammad Alfarras",
      og_description: "Websites, interfaces, product pages, and technical content with clear execution.",
    },
  },
  apps: {
    ar: {
      title: "التطبيقات",
      meta_title: "تطبيقات MoPlayer | محمد الفراس",
      meta_description: "صفحات تطبيقات MoPlayer وMoPlayer Pro مع التفعيل والتحميل والدعم.",
      og_title: "تطبيقات MoPlayer",
      og_description: "تحكم بصفحات التطبيقات والتفعيل والدعم من لوحة الإدارة.",
    },
    en: {
      title: "Apps",
      meta_title: "MoPlayer Apps | Mohammad Alfarras",
      meta_description: "MoPlayer and MoPlayer Pro app pages with activation, download, and support.",
      og_title: "MoPlayer Apps",
      og_description: "Manage app pages, activation, and support from the admin control center.",
    },
  },
  activate: {
    ar: {
      title: "تفعيل التطبيق",
      meta_title: "تفعيل MoPlayer | محمد الفراس",
      meta_description: "صفحة تفعيل MoPlayer وMoPlayer Pro وربط الطلبات بلوحة الإدارة.",
      og_title: "تفعيل MoPlayer",
      og_description: "طلبات التفعيل تظهر مباشرة في لوحة التحكم.",
    },
    en: {
      title: "Activate",
      meta_title: "Activate MoPlayer | Mohammad Alfarras",
      meta_description: "Activation page for MoPlayer and MoPlayer Pro linked to the admin panel.",
      og_title: "Activate MoPlayer",
      og_description: "Activation requests appear directly in the control center.",
    },
  },
  support: {
    ar: {
      title: "الدعم",
      meta_title: "دعم MoPlayer | محمد الفراس",
      meta_description: "صفحة دعم تطبيقات MoPlayer مع رسائل تصل إلى لوحة الإدارة والبريد.",
      og_title: "دعم MoPlayer",
      og_description: "دعم التطبيقات والطلبات من مكان واحد.",
    },
    en: {
      title: "Support",
      meta_title: "MoPlayer Support | Mohammad Alfarras",
      meta_description: "Support page for MoPlayer apps with messages routed to email and admin.",
      og_title: "MoPlayer Support",
      og_description: "App support and requests in one control center.",
    },
  },
  youtube: {
    ar: {
      title: "يوتيوب",
      meta_title: "قناة يوتيوب | محمد الفراس",
      meta_description: "صفحة قناة محمد الفراس على يوتيوب مع فيديوهات ومحتوى تقني.",
      og_title: "يوتيوب | محمد الفراس",
      og_description: "مراجعات وتجارب ومنتجات تقنية عربية.",
    },
    en: {
      title: "YouTube",
      meta_title: "YouTube Channel | Mohammad Alfarras",
      meta_description: "YouTube hub for product reviews, creator content, and technical storytelling.",
      og_title: "YouTube | Mohammad Alfarras",
      og_description: "Electronics reviews, creator-led promotion, and channel highlights.",
    },
  },
  cv: {
    ar: {
      title: "السيرة الذاتية",
      meta_title: "السيرة الذاتية | محمد الفراس",
      meta_description: "سيرة ذاتية احترافية وخبرات محمد الفراس في التشغيل والتصميم الرقمي.",
      og_title: "السيرة الذاتية | محمد الفراس",
      og_description: "خبرات ومهارات وجاهزية لمشاريع جديدة.",
    },
    en: {
      title: "CV",
      meta_title: "CV | Mohammad Alfarras",
      meta_description: "Professional CV and timeline across operations, digital design, and creator work.",
      og_title: "CV | Mohammad Alfarras",
      og_description: "Professional timeline, capabilities, and project readiness.",
    },
  },
  privacy: {
    ar: {
      title: "الخصوصية",
      meta_title: "سياسة الخصوصية | محمد الفراس",
      meta_description: "سياسة الخصوصية الخاصة بموقع محمد الفراس.",
      og_title: "سياسة الخصوصية",
      og_description: "تفاصيل الخصوصية وملفات تعريف الارتباط.",
    },
    en: {
      title: "Privacy",
      meta_title: "Privacy Policy | Mohammad Alfarras",
      meta_description: "Privacy policy for the official Mohammad Alfarras website.",
      og_title: "Privacy Policy",
      og_description: "Privacy, cookie usage, and data handling information.",
    },
  },
  "404": {
    ar: {
      title: "الصفحة غير موجودة",
      meta_title: "404 | محمد الفراس",
      meta_description: "الصفحة المطلوبة غير متوفرة.",
      og_title: "404",
      og_description: "ارجع إلى الصفحة الرئيسية.",
    },
    en: {
      title: "Page Not Found",
      meta_title: "404 | Mohammad Alfarras",
      meta_description: "The requested page could not be found.",
      og_title: "404",
      og_description: "Return to the homepage.",
    },
  },
} as const;

const homeFallback: HomeContent = {
  ar: {
    hero: {
      title: "حضور رقمي واضح من أول شاشة",
      body: "مواقع وتطبيقات وصفحات منتجات مصممة لتشرح القيمة بسرعة وتحوّل الزائر إلى طلب حقيقي.",
      primary: "ابدأ مشروعك",
      secondary: "شاهد الأعمال",
    },
    services: {
      title: "خدمات رقمية مترابطة",
      body: "من تصميم الموقع والصور والنصوص إلى صفحات التطبيقات والدعم والرسائل، كل شيء قابل للإدارة من لوحة واحدة.",
    },
  },
  en: {
    hero: {
      title: "A clear digital presence from the first screen",
      body: "Websites, app pages, and product experiences designed to explain value fast and turn visitors into real requests.",
      primary: "Start your project",
      secondary: "View work",
    },
    services: {
      title: "Connected digital services",
      body: "From website design, images, and copy to app pages, support, and messages, everything can be managed from one control panel.",
    },
  },
};

const contactFallback: ContactContent = {
  ar: {
    eyebrow: "تواصل مباشر",
    title: "احكِ لي عن مشروعك",
    body: "أرسل تفاصيل الموقع أو التطبيق أو الحملة، وسأراجع طلبك وأرد عليك بخطوة واضحة.",
    directTitle: "تريد رداً أسرع؟",
    directBody: "اكتب الهدف والميزانية والموعد التقريبي حتى أستطيع فهم الطلب بسرعة.",
    primaryCta: "إرسال الطلب",
    chips: ["موقع جديد", "صفحة تطبيق", "تحسين صور", "دعم MoPlayer"],
  },
  en: {
    eyebrow: "Direct contact",
    title: "Tell me about your project",
    body: "Send the website, app, or campaign details. I will review your request and reply with a clear next step.",
    directTitle: "Need a faster reply?",
    directBody: "Include the goal, budget, and rough timeline so the request is easy to review.",
    primaryCta: "Send request",
    chips: ["New website", "App page", "Image refresh", "MoPlayer support"],
  },
};

function setting<T>(settings: WebsiteSetting[], key: string, fallback: T): T {
  const found = settings.find((item) => item.key === key)?.value_json;
  return (found ?? fallback) as T;
}

function nonEmpty(value: string | undefined, fallback: string | undefined) {
  return value && value.trim() ? value : fallback;
}

function nonEmptyLines(value: string[] | undefined, fallback: string[] | undefined) {
  return value?.length ? value : fallback;
}

type HomeContent = {
  ar?: { hero?: { title?: string; body?: string; primary?: string; secondary?: string }; services?: { title?: string; body?: string } };
  en?: { hero?: { title?: string; body?: string; primary?: string; secondary?: string }; services?: { title?: string; body?: string } };
};

type SiteStatus = { maintenance?: boolean; message_ar?: string; message_en?: string };
type LegalPagesSetting = {
  published?: boolean;
  responsibleName?: string;
  businessName?: string;
  address?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  register?: string;
  privacyExtra?: string;
  termsExtra?: string;
  appDisclaimerExtra?: string;
  downloadDisclaimerExtra?: string;
  updatedAt?: string;
};
type BrandAssets = {
  siteName?: { ar?: string; en?: string };
  navTagline?: { ar?: string; en?: string };
  logo?: { mediaId?: string | null; path?: string };
  profilePortrait?: { mediaId?: string | null; path?: string };
  contactHero?: { mediaId?: string | null; path?: string };
};
type SiteTheme = { accent?: string; background?: string; panel?: string };
type ContactContent = {
  ar?: { eyebrow?: string; title?: string; body?: string; directTitle?: string; directBody?: string; primaryCta?: string; chips?: string[] };
  en?: { eyebrow?: string; title?: string; body?: string; directTitle?: string; directBody?: string; primaryCta?: string; chips?: string[] };
};
type OffersContent = {
  items?: WebsiteOffer[];
};
type WebsiteOffer = {
  id?: string;
  isActive?: boolean;
  placement?: "home" | "services" | "apps" | "contact" | "all";
  style?: "banner" | "cards" | "strip";
  sortOrder?: number;
  badge?: { ar?: string; en?: string };
  title?: { ar?: string; en?: string };
  body?: { ar?: string; en?: string };
  ctaLabel?: { ar?: string; en?: string };
  ctaHref?: string;
  image?: string;
};

function lines(items?: string[]) {
  return (items ?? []).join("\n");
}

function metricLines(metrics: WebsiteCmsData["projectMetrics"]) {
  return metrics.map((metric) => `${metric.value} | ${metric.label_ar} | ${metric.label_en}`).join("\n");
}

export function WebsiteControl({ data, updated }: { data: WebsiteCmsData; updated?: string }) {
  const { t } = useLocale();
  const home = setting<HomeContent>(data.settings, "home_content", homeFallback);
  const status = setting<SiteStatus>(data.settings, "site_status", {});
  const legal = setting<LegalPagesSetting>(data.settings, "legal_pages", {});
  const brand = setting<BrandAssets>(data.settings, "brand_assets", {});
  const theme = setting<SiteTheme>(data.settings, "site_theme", {});
  const contact = setting<ContactContent>(data.settings, "contact_page_content", contactFallback);
  const offers = setting<OffersContent>(data.settings, "site_offers", { items: [] });
  const youtubeCuration = setting<{ excludedIds?: string[]; featuredId?: string; pinnedIds?: string[]; sortByViews?: boolean }>(data.settings, "youtube_curation", {});
  const siteImages = setting<Record<string, string>>(data.settings, "site_images", {});
  const homeHeroAr = { ...homeFallback.ar?.hero, ...(home.ar?.hero ?? {}) };
  const homeHeroEn = { ...homeFallback.en?.hero, ...(home.en?.hero ?? {}) };
  const homeServicesAr = { ...homeFallback.ar?.services, ...(home.ar?.services ?? {}) };
  const homeServicesEn = { ...homeFallback.en?.services, ...(home.en?.services ?? {}) };
  const contactAr = { ...contactFallback.ar, ...(contact.ar ?? {}) };
  const contactEn = { ...contactFallback.en, ...(contact.en ?? {}) };
  const activeServices = data.services.filter((service) => service.is_active).length;
  const activeProjects = data.projects.filter((project) => project.is_active).length;
  const publishedPages = data.pages.filter((page) => page.status === "published").length;

  return (
    <>
      <UpdatedToast code={updated} />
      <PageHeader
        eyebrow={t({ en: "Supabase website CMS", ar: "إدارة محتوى الموقع" })}
        title={t({ en: "Website Control", ar: "إدارة الموقع" })}
        subtitle={t({
          en: "The public website is controlled here only: words, images, colors, SEO, services, projects, maintenance, and visitor messages.",
          ar: "الموقع العام يتحكم به من هنا فقط: النصوص، الصور، الألوان، الفهرسة، الخدمات، المشاريع، الصيانة، ورسائل الزوار.",
        })}
        icon={<Globe className="h-7 w-7" />}
        actions={
          <Link href={`${webBaseUrl}/ar`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Open site", ar: "فتح الموقع" })}
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t({ en: "Pages", ar: "صفحات" })} value={`${publishedPages}/${data.pages.length}`} icon={<FileText className="h-5 w-5" />} href="/website#pages" />
        <StatCard label={t({ en: "Services", ar: "خدمات" })} value={`${activeServices}/${data.services.length}`} icon={<Settings2 className="h-5 w-5" />} href="/website#services" />
        <StatCard label={t({ en: "Media", ar: "صور" })} value={data.mediaAssets.length} icon={<ImageIcon className="h-5 w-5" />} tone="violet" href="/website#media" />
        <StatCard label={t({ en: "Projects", ar: "مشاريع" })} value={`${activeProjects}/${data.projects.length}`} icon={<Briefcase className="h-5 w-5" />} tone="success" href="/website#projects" />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <QuickJump
          href="/website#brand"
          title={t({ en: "Change logo, colors, and main images", ar: "تبديل الشعار والألوان والصور الرئيسية" })}
          body={t({ en: "Use Brand first when you want the whole website to feel different.", ar: "ابدأ من الهوية عندما تريد تغيير شكل الموقع كله." })}
        />
        <QuickJump
          href="/website#media"
          title={t({ en: "Upload a new image once", ar: "ارفع صورة جديدة مرة واحدة" })}
          body={t({ en: "Then choose it in pages, services, projects, logo, or contact hero.", ar: "ثم اخترها في الصفحات أو الخدمات أو المشاريع أو الشعار أو صورة التواصل." })}
        />
        <QuickJump
          href="/website#maintenance"
          title={t({ en: "Put site in maintenance", ar: "تشغيل صيانة الموقع" })}
          body={t({ en: "Use only when visitors should temporarily see a maintenance message.", ar: "استخدمها فقط عندما تريد أن يرى الزوار رسالة صيانة مؤقتة." })}
        />
        <QuickJump
          href="/website#legal"
          title={t({ en: "Publish legal pages", ar: "نشر الصفحات القانونية" })}
          body={t({ en: "Impressum, terms, and app disclaimers stay hidden until required owner details are filled.", ar: "تبقى البيانات القانونية والشروط والتنبيهات مخفية حتى تكتمل بيانات المالك المطلوبة." })}
        />
        <QuickJump
          href="/website#offers"
          title={t({ en: "Create website offers", ar: "إدارة عروض الموقع" })}
          body={t({ en: "Choose where an offer appears and whether it is banner, cards, or strip.", ar: "اختر أين يظهر العرض وهل يكون بانر أو بطاقات أو شريط." })}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <QuickJump
          href="/website#services"
          title={t({ en: "Manage all services", ar: "إدارة كل الخدمات" })}
          body={t({ en: "Add a service, edit text, replace image, hide it, or delete it.", ar: "أضف خدمة، عدّل النص، بدّل الصورة، أخفها، أو احذفها." })}
        />
        <QuickJump
          href="/website#projects"
          title={t({ en: "Manage all projects", ar: "إدارة كل المشاريع" })}
          body={t({ en: "Control cards, case-study text, links, metrics, and covers.", ar: "تحكم بالبطاقات، النصوص، الروابط، المقاييس، والأغلفة." })}
        />
        <QuickJump
          href="/website#pages"
          title={t({ en: "Manage every page title", ar: "إدارة عناوين كل الصفحات" })}
          body={t({ en: "Edit public status, SEO, Google preview, and social image.", ar: "عدّل النشر، SEO، معاينة Google، وصورة المشاركة." })}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <GuideCard
          title={t({ en: "Need to replace a site image?", ar: "تريد تبديل صورة بالموقع؟" })}
          body={t({ en: "Upload the image once in Media library. After that, select it from the image chooser in the exact section you want.", ar: "ارفع الصورة مرة واحدة في مكتبة الصور. بعدها اخترها من مكان الصورة داخل القسم المطلوب." })}
        />
        <GuideCard
          title={t({ en: "Need to edit page titles?", ar: "تريد تعديل عناوين الصفحات؟" })}
          body={t({ en: "Open Pages & SEO. This controls what visitors see in Google and when the page is shared.", ar: "افتح الصفحات و SEO. هذا يتحكم بما يظهر في Google وعند مشاركة الصفحة." })}
        />
        <GuideCard
          title={t({ en: "Need to handle a request?", ar: "تريد معالجة طلب؟" })}
          body={t({ en: "Open Messages inbox. Reply, mark status, archive, or delete the message.", ar: "افتح صندوق الرسائل. رد، غيّر الحالة، أرشف، أو احذف الرسالة." })}
        />
      </section>

      <Accordion
        id="brand"
        title={t({ en: "Brand, logo & colors", ar: "الهوية والشعار والألوان" })}
        description={t({ en: "Control the public logo, core brand text, contact hero, and visual palette.", ar: "تحكم بالشعار العام، نص الهوية، صورة التواصل، ولوحة الألوان." })}
        icon={<ImageIcon className="h-5 w-5" />}
        defaultOpen
      >
        <SectionHelp
          title={t({ en: "What this changes", ar: "ماذا يغيّر هذا القسم؟" })}
          body={t({
            en: "Logo and profile images affect the whole site. Contact hero affects the contact page. Colors affect the public website palette.",
            ar: "الشعار والصورة الشخصية تؤثر على الموقع كله. صورة التواصل تخص صفحة التواصل. الألوان تغيّر شكل الموقع العام.",
          })}
        />
        <form action={saveWebsiteBrandAction} className="grid gap-4 lg:grid-cols-2">
          <Inp label={t({ en: "Arabic site name", ar: "اسم الموقع عربي" })} name="site_name_ar" defaultValue={brand.siteName?.ar ?? "محمد الفراس"} />
          <Inp label={t({ en: "English site name", ar: "اسم الموقع إنجليزي" })} name="site_name_en" defaultValue={brand.siteName?.en ?? "Mohammad Alfarras"} />
          <Inp label={t({ en: "Arabic nav tagline", ar: "وصف الشريط عربي" })} name="nav_tagline_ar" defaultValue={brand.navTagline?.ar ?? ""} />
          <Inp label={t({ en: "English nav tagline", ar: "وصف الشريط إنجليزي" })} name="nav_tagline_en" defaultValue={brand.navTagline?.en ?? ""} />
          <ImageControl
            label={t({ en: "Logo image", ar: "صورة الشعار" })}
            selectName="logo_media_id"
            fileName="logo_file"
            assets={data.mediaAssets}
            value={brand.logo?.mediaId ?? ""}
            fallbackPath={brand.logo?.path ?? "/images/logo.png"}
          />
          <Inp label={t({ en: "Logo fallback path", ar: "مسار الشعار الاحتياطي" })} name="logo_path" defaultValue={brand.logo?.path ?? "/images/logo.png"} />
          <ImageControl
            label={t({ en: "Profile image", ar: "الصورة الشخصية" })}
            selectName="profile_media_id"
            fileName="profile_file"
            assets={data.mediaAssets}
            value={brand.profilePortrait?.mediaId ?? ""}
            fallbackPath={brand.profilePortrait?.path ?? "/images/protofeilnew.jpeg"}
          />
          <Inp label={t({ en: "Profile fallback path", ar: "مسار الصورة الاحتياطي" })} name="profile_path" defaultValue={brand.profilePortrait?.path ?? "/images/protofeilnew.jpeg"} />
          <ImageControl
            label={t({ en: "Contact hero image", ar: "صورة صفحة التواصل" })}
            selectName="contact_hero_media_id"
            fileName="contact_hero_file"
            assets={data.mediaAssets}
            value={brand.contactHero?.mediaId ?? ""}
            fallbackPath={brand.contactHero?.path ?? "/images/hero_tech.png"}
          />
          <Inp label={t({ en: "Contact hero fallback path", ar: "مسار صورة التواصل" })} name="contact_hero_path" defaultValue={brand.contactHero?.path ?? "/images/hero_tech.png"} />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save brand", ar: "حفظ الهوية" })}</button>
          </div>
        </form>
        <form action={saveWebsiteThemeAction} className="mt-5 grid gap-4 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4 md:grid-cols-3">
          <Inp label={t({ en: "Accent color", ar: "اللون المميز" })} name="accent" type="color" defaultValue={theme.accent ?? "#22d3ee"} />
          <Inp label={t({ en: "Background", ar: "الخلفية" })} name="background" type="color" defaultValue={theme.background ?? "#060a18"} />
          <Inp label={t({ en: "Panel color", ar: "لون البطاقات" })} name="panel" type="color" defaultValue={theme.panel ?? "#0f172a"} />
          <button type="submit" className="btn btn-primary md:col-span-3">{t({ en: "Save colors", ar: "حفظ الألوان" })}</button>
        </form>
      </Accordion>

      {/* Site status / maintenance */}
      <Accordion
        id="maintenance"
        title={t({ en: "Site status & maintenance", ar: "حالة الموقع والصيانة" })}
        description={t({ en: "Put the public website into maintenance mode", ar: "وضع الموقع العام في حالة الصيانة" })}
        icon={<Power className="h-5 w-5" />}
        tone="accent"
        count={status.maintenance ? t({ en: "MAINTENANCE", ar: "صيانة" }) : t({ en: "LIVE", ar: "يعمل" })}
        defaultOpen={Boolean(status.maintenance)}
      >
        <SectionHelp
          title={t({ en: "Use carefully", ar: "استخدمها بحذر" })}
          body={t({
            en: "Maintenance hides the public website behind a friendly message. It does not delete content and does not affect the admin panel.",
            ar: "وضع الصيانة يخفي الموقع العام خلف رسالة واضحة. لا يحذف أي محتوى ولا يؤثر على لوحة الأدمن.",
          })}
          tone="warning"
        />
        <form action={saveSiteStatusAction} className="grid gap-4">
          <Toggle
            name="maintenance"
            label={t({ en: "Maintenance mode", ar: "وضع الصيانة" })}
            description={t({ en: "When ON, visitors see a maintenance page instead of the site.", ar: "عند التفعيل، يرى الزوار صفحة صيانة بدل الموقع." })}
            checked={Boolean(status.maintenance)}
          />
          <Area label={t({ en: "Arabic message", ar: "رسالة الصيانة (عربي)" })} name="message_ar" defaultValue={status.message_ar} placeholder="نقوم بأعمال صيانة، نعود قريباً." />
          <Area label={t({ en: "English message", ar: "رسالة الصيانة (إنجليزي)" })} name="message_en" defaultValue={status.message_en} placeholder="We are doing maintenance, back soon." />
          <div>
            <button type="submit" className="btn btn-primary">{t({ en: "Save site status", ar: "حفظ حالة الموقع" })}</button>
          </div>
        </form>
      </Accordion>

      <Accordion
        id="legal"
        title={t({ en: "Legal pages", ar: "الصفحات القانونية" })}
        description={t({ en: "Control Impressum, terms, app disclaimer, and download disclaimer visibility.", ar: "تحكم بظهور البيانات القانونية والشروط وتنبيه التطبيق وتنبيه التحميل." })}
        icon={<FileText className="h-5 w-5" />}
        tone="accent"
        count={legal.published ? t({ en: "PUBLISHED", ar: "منشور" }) : t({ en: "HIDDEN", ar: "مخفي" })}
        defaultOpen={Boolean(legal.published)}
      >
        <SectionHelp
          title={t({ en: "Publish only when complete", ar: "انشر فقط عند اكتمال البيانات" })}
          body={t({
            en: "The public legal routes are hidden until publishing is enabled and responsible name, address, and email are filled. This prevents incomplete legal pages from appearing to visitors.",
            ar: "تبقى الروابط القانونية العامة مخفية حتى يتم تفعيل النشر وتعبئة اسم المسؤول والعنوان والبريد. هذا يمنع ظهور صفحات قانونية ناقصة للزوار.",
          })}
          tone="warning"
        />
        <form action={saveLegalPagesAction} className="grid gap-4 lg:grid-cols-2">
          <Toggle
            name="published"
            label={t({ en: "Publish legal pages", ar: "نشر الصفحات القانونية" })}
            description={t({ en: "Required before footer and sitemap links appear.", ar: "مطلوب حتى تظهر الروابط في التذييل وملف sitemap." })}
            checked={Boolean(legal.published)}
          />
          <Inp label={t({ en: "Responsible name", ar: "اسم المسؤول" })} name="responsibleName" defaultValue={legal.responsibleName ?? ""} required />
          <Inp label={t({ en: "Business name", ar: "الاسم التجاري" })} name="businessName" defaultValue={legal.businessName ?? ""} />
          <Inp label={t({ en: "Email", ar: "البريد الإلكتروني" })} name="email" type="email" defaultValue={legal.email ?? ""} required />
          <Area label={t({ en: "Address", ar: "العنوان" })} name="address" defaultValue={legal.address ?? ""} required rows={4} />
          <Inp label={t({ en: "Phone", ar: "الهاتف" })} name="phone" defaultValue={legal.phone ?? ""} />
          <Inp label={t({ en: "Tax ID / VAT", ar: "الرقم الضريبي / VAT" })} name="taxId" defaultValue={legal.taxId ?? ""} />
          <Inp label={t({ en: "Register entry", ar: "بيانات السجل" })} name="register" defaultValue={legal.register ?? ""} />
          <Area label={t({ en: "Privacy extra note", ar: "ملاحظة إضافية للخصوصية" })} name="privacyExtra" defaultValue={legal.privacyExtra ?? ""} rows={4} />
          <Area label={t({ en: "Terms extra note", ar: "ملاحظة إضافية للشروط" })} name="termsExtra" defaultValue={legal.termsExtra ?? ""} rows={4} />
          <Area label={t({ en: "App disclaimer extra note", ar: "ملاحظة إضافية لتنبيه التطبيق" })} name="appDisclaimerExtra" defaultValue={legal.appDisclaimerExtra ?? ""} rows={4} />
          <Area label={t({ en: "Download disclaimer extra note", ar: "ملاحظة إضافية لتنبيه التحميل" })} name="downloadDisclaimerExtra" defaultValue={legal.downloadDisclaimerExtra ?? ""} rows={4} />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save legal pages", ar: "حفظ الصفحات القانونية" })}</button>
          </div>
        </form>
      </Accordion>

      {/* Homepage story */}
      <Accordion
        id="home"
        title={t({ en: "Homepage story", ar: "نص الصفحة الرئيسية" })}
        description={t({ en: "Headline, subheadline, and call-to-action buttons", ar: "العنوان والوصف وأزرار الدعوة" })}
        icon={<FileText className="h-5 w-5" />}
        defaultOpen
      >
        <SectionHelp
          title={t({ en: "This is the first screen", ar: "هذه أول شاشة" })}
          body={t({
            en: "Write simple visitor-facing text. Avoid technical words. The buttons should tell the visitor exactly what to do next.",
            ar: "اكتب كلاماً بسيطاً للزائر. تجنب الكلمات التقنية. الأزرار لازم تقول للزائر ماذا يفعل بعدها.",
          })}
        />
        <form action={saveWebsiteHeroAction} className="grid gap-4 lg:grid-cols-2">
          <Area label={t({ en: "Arabic headline", ar: "العنوان (عربي)" })} name="hero_ar_headline" defaultValue={nonEmpty(homeHeroAr.title, homeFallback.ar?.hero?.title)} />
          <Area label={t({ en: "English headline", ar: "العنوان (إنجليزي)" })} name="hero_en_headline" defaultValue={nonEmpty(homeHeroEn.title, homeFallback.en?.hero?.title)} />
          <Area label={t({ en: "Arabic subheadline", ar: "الوصف (عربي)" })} name="hero_ar_subheadline" defaultValue={nonEmpty(homeHeroAr.body, homeFallback.ar?.hero?.body)} />
          <Area label={t({ en: "English subheadline", ar: "الوصف (إنجليزي)" })} name="hero_en_subheadline" defaultValue={nonEmpty(homeHeroEn.body, homeFallback.en?.hero?.body)} />
          <Inp label={t({ en: "Arabic primary CTA", ar: "زر أساسي (عربي)" })} name="hero_ar_primary_cta" defaultValue={nonEmpty(homeHeroAr.primary, homeFallback.ar?.hero?.primary)} />
          <Inp label={t({ en: "English primary CTA", ar: "زر أساسي (إنجليزي)" })} name="hero_en_primary_cta" defaultValue={nonEmpty(homeHeroEn.primary, homeFallback.en?.hero?.primary)} />
          <Inp label={t({ en: "Arabic secondary CTA", ar: "زر ثانوي (عربي)" })} name="hero_ar_secondary_cta" defaultValue={nonEmpty(homeHeroAr.secondary, homeFallback.ar?.hero?.secondary)} />
          <Inp label={t({ en: "English secondary CTA", ar: "زر ثانوي (إنجليزي)" })} name="hero_en_secondary_cta" defaultValue={nonEmpty(homeHeroEn.secondary, homeFallback.en?.hero?.secondary)} />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save homepage", ar: "حفظ الصفحة الرئيسية" })}</button>
          </div>
        </form>
      </Accordion>

      {/* Services */}
      <Accordion
        id="services"
        title={t({ en: "Services page", ar: "صفحة الخدمات" })}
        description={t({ en: "Hero copy plus every service card, image, and visibility state.", ar: "نص أعلى الصفحة مع كل بطاقة خدمة وصورتها وحالة ظهورها." })}
        icon={<Settings2 className="h-5 w-5" />}
        count={data.services.length}
      >
        <SectionHelp
          title={t({ en: "How services work", ar: "كيف تعمل الخدمات؟" })}
          body={t({
            en: "Each service card can have its own image, title, description, bullets, order, and visible/hidden state.",
            ar: "كل بطاقة خدمة لها صورة وعنوان ووصف ونقاط وترتيب وحالة ظهور أو إخفاء.",
          })}
        />
        <form action={saveWebsiteServicesAction} className="grid gap-4 lg:grid-cols-2">
          <Inp label={t({ en: "Arabic title", ar: "العنوان (عربي)" })} name="services_ar_title" defaultValue={nonEmpty(homeServicesAr.title, homeFallback.ar?.services?.title)} />
          <Inp label={t({ en: "English title", ar: "العنوان (إنجليزي)" })} name="services_en_title" defaultValue={nonEmpty(homeServicesEn.title, homeFallback.en?.services?.title)} />
          <Area label={t({ en: "Arabic body", ar: "النص (عربي)" })} name="services_ar_body" defaultValue={nonEmpty(homeServicesAr.body, homeFallback.ar?.services?.body)} />
          <Area label={t({ en: "English body", ar: "النص (إنجليزي)" })} name="services_en_body" defaultValue={nonEmpty(homeServicesEn.body, homeFallback.en?.services?.body)} />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save services", ar: "حفظ الخدمات" })}</button>
          </div>
        </form>
        <details className="mt-5 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-black text-[var(--text-1)]">{t({ en: "Add a new service", ar: "إضافة خدمة جديدة" })}</span>
              <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Keep this closed until you need it, so the panel stays simple.", ar: "يبقى مغلقاً حتى تحتاجه لتظل اللوحة بسيطة." })}</span>
            </span>
            <span className="btn btn-sm">{t({ en: "Create", ar: "إنشاء" })}</span>
          </summary>
          <form action={saveWebsiteServiceAction} className="mt-5 grid gap-4 border-t border-[var(--line)] pt-4 lg:grid-cols-3">
            <Inp label={t({ en: "Service ID / slug", ar: "معرّف الخدمة" })} name="id" placeholder="custom-websites" />
            <Inp label={t({ en: "Sort order", ar: "الترتيب" })} name="sort_order" type="number" defaultValue={String(data.services.length + 1)} />
            <Inp label={t({ en: "Icon", ar: "الأيقونة" })} name="icon" defaultValue="sparkles" />
            <Inp label={t({ en: "Color token", ar: "رمز اللون" })} name="color_token" defaultValue="accent" />
            <MediaSelect label={t({ en: "Service image", ar: "صورة الخدمة" })} name="cover_media_id" assets={data.mediaAssets} value="" />
            <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-black/20 px-4 py-3">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{t({ en: "Upload service image", ar: "رفع صورة الخدمة" })}</span>
                <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Optional direct image upload.", ar: "رفع مباشر اختياري." })}</span>
              </span>
              <UploadCloud className="h-5 w-5 text-[var(--accent)]" />
              <input type="file" name="service_file" accept="image/*" className="sr-only" />
            </label>
            <Inp label={t({ en: "Arabic title", ar: "عنوان الخدمة عربي" })} name="title_ar" />
            <Inp label={t({ en: "English title", ar: "عنوان الخدمة إنجليزي" })} name="title_en" />
            <Area label={t({ en: "Arabic description", ar: "وصف الخدمة عربي" })} name="description_ar" />
            <Area label={t({ en: "English description", ar: "وصف الخدمة إنجليزي" })} name="description_en" />
            <Area label={t({ en: "Arabic bullets, one per line", ar: "نقاط الخدمة عربي، سطر لكل نقطة" })} name="bullets_ar" />
            <Area label={t({ en: "English bullets, one per line", ar: "نقاط الخدمة إنجليزي، سطر لكل نقطة" })} name="bullets_en" />
            <label className="switch lg:col-span-2">
              <span>
                <strong>{t({ en: "Active on site", ar: "ظاهرة في الموقع" })}</strong>
                <small>{t({ en: "Show this service publicly.", ar: "إظهار هذه الخدمة للعامة." })}</small>
              </span>
              <input type="checkbox" name="is_active" defaultChecked />
              <i aria-hidden />
            </label>
            <button type="submit" className="btn btn-primary">{t({ en: "Add service", ar: "إضافة خدمة" })}</button>
          </form>
        </details>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {data.services.map((service) => {
            const ar = data.serviceTranslations.find((item) => item.service_id === service.id && item.locale === "ar");
            const en = data.serviceTranslations.find((item) => item.service_id === service.id && item.locale === "en");
            const asset = data.mediaAssets.find((item) => item.id === service.cover_media_id);
            return (
              <details key={service.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
                <summary className="cursor-pointer list-none">
                  <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/20">
                      {asset?.path ? <SafeImage src={asset.path} alt={en?.title || service.id} className="aspect-video h-full w-full object-cover" /> : <ImageFallback label={service.id} />}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="badge">{service.is_active ? t({ en: "Active", ar: "ظاهرة" }) : t({ en: "Hidden", ar: "مخفية" })}</span>
                        <span className="badge">{service.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">#{service.sort_order}</span>
                      </div>
                      <p className="text-sm font-black text-[var(--text-1)]">{ar?.title || en?.title || service.id}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--text-3)]">{ar?.description || en?.description}</p>
                    </div>
                    <span className="btn btn-sm">{t({ en: "Customize", ar: "تخصيص" })}</span>
                  </div>
                </summary>
                <form action={saveWebsiteServiceAction} className="mt-4 grid gap-4 border-t border-[var(--line)] pt-4 lg:grid-cols-2">
                  <input type="hidden" name="id" value={service.id} />
                  <input type="hidden" name="current_cover_media_id" value={service.cover_media_id ?? ""} />
                  <Inp label={t({ en: "Sort order", ar: "الترتيب" })} name="sort_order" type="number" defaultValue={String(service.sort_order)} />
                  <Inp label={t({ en: "Icon", ar: "الأيقونة" })} name="icon" defaultValue={service.icon} />
                  <Inp label={t({ en: "Color token", ar: "رمز اللون" })} name="color_token" defaultValue={service.color_token} />
                  <MediaSelect label={t({ en: "Service image", ar: "صورة الخدمة" })} name="cover_media_id" assets={data.mediaAssets} value={service.cover_media_id ?? ""} />
                  <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-black/20 px-4 py-3">
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{t({ en: "Upload replacement image", ar: "رفع صورة بديلة" })}</span>
                      <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Optional direct image upload.", ar: "رفع مباشر اختياري." })}</span>
                    </span>
                    <UploadCloud className="h-5 w-5 text-[var(--accent)]" />
                    <input type="file" name="service_file" accept="image/*" className="sr-only" />
                  </label>
                  <Inp label={t({ en: "Arabic title", ar: "عنوان الخدمة عربي" })} name="title_ar" defaultValue={ar?.title} />
                  <Inp label={t({ en: "English title", ar: "عنوان الخدمة إنجليزي" })} name="title_en" defaultValue={en?.title} />
                  <Area label={t({ en: "Arabic description", ar: "وصف الخدمة عربي" })} name="description_ar" defaultValue={ar?.description} />
                  <Area label={t({ en: "English description", ar: "وصف الخدمة إنجليزي" })} name="description_en" defaultValue={en?.description} />
                  <Area label={t({ en: "Arabic bullets, one per line", ar: "نقاط الخدمة عربي، سطر لكل نقطة" })} name="bullets_ar" defaultValue={lines(ar?.bullets_json)} />
                  <Area label={t({ en: "English bullets, one per line", ar: "نقاط الخدمة إنجليزي، سطر لكل نقطة" })} name="bullets_en" defaultValue={lines(en?.bullets_json)} />
                  <label className="switch lg:col-span-2">
                    <span>
                      <strong>{t({ en: "Active on site", ar: "ظاهرة في الموقع" })}</strong>
                      <small>{t({ en: "Show this service publicly.", ar: "إظهار هذه الخدمة للعامة." })}</small>
                    </span>
                    <input type="checkbox" name="is_active" defaultChecked={service.is_active} />
                    <i aria-hidden />
                  </label>
                  <button type="submit" className="btn btn-primary">{t({ en: "Save service", ar: "حفظ الخدمة" })}</button>
                </form>
                <div className="mt-4 flex justify-end">
                  <form action={deleteWebsiteServiceAction}>
                    <input type="hidden" name="id" value={service.id} />
                    <button type="submit" className="btn btn-sm btn-danger" aria-label="Delete service">
                      <Trash2 className="h-4 w-4" />
                      {t({ en: "Delete service", ar: "حذف الخدمة" })}
                    </button>
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      </Accordion>

      <Accordion
        id="contact"
        title={t({ en: "Contact page", ar: "صفحة التواصل" })}
        description={t({ en: "Edit the public contact page copy and chips.", ar: "تحرير نصوص صفحة التواصل العامة والوسوم." })}
        icon={<Inbox className="h-5 w-5" />}
      >
        <form action={saveWebsiteContactAction} className="grid gap-4 lg:grid-cols-2">
          <Inp label={t({ en: "Arabic eyebrow", ar: "عنوان صغير عربي" })} name="contact_ar_eyebrow" defaultValue={nonEmpty(contactAr.eyebrow, contactFallback.ar?.eyebrow)} />
          <Inp label={t({ en: "English eyebrow", ar: "عنوان صغير إنجليزي" })} name="contact_en_eyebrow" defaultValue={nonEmpty(contactEn.eyebrow, contactFallback.en?.eyebrow)} />
          <Area label={t({ en: "Arabic title", ar: "العنوان عربي" })} name="contact_ar_title" defaultValue={nonEmpty(contactAr.title, contactFallback.ar?.title)} />
          <Area label={t({ en: "English title", ar: "العنوان إنجليزي" })} name="contact_en_title" defaultValue={nonEmpty(contactEn.title, contactFallback.en?.title)} />
          <Area label={t({ en: "Arabic body", ar: "النص عربي" })} name="contact_ar_body" defaultValue={nonEmpty(contactAr.body, contactFallback.ar?.body)} />
          <Area label={t({ en: "English body", ar: "النص إنجليزي" })} name="contact_en_body" defaultValue={nonEmpty(contactEn.body, contactFallback.en?.body)} />
          <Inp label={t({ en: "Arabic direct title", ar: "عنوان مباشر عربي" })} name="contact_ar_direct_title" defaultValue={nonEmpty(contactAr.directTitle, contactFallback.ar?.directTitle)} />
          <Inp label={t({ en: "English direct title", ar: "عنوان مباشر إنجليزي" })} name="contact_en_direct_title" defaultValue={nonEmpty(contactEn.directTitle, contactFallback.en?.directTitle)} />
          <Area label={t({ en: "Arabic direct body", ar: "نص مباشر عربي" })} name="contact_ar_direct_body" defaultValue={nonEmpty(contactAr.directBody, contactFallback.ar?.directBody)} />
          <Area label={t({ en: "English direct body", ar: "نص مباشر إنجليزي" })} name="contact_en_direct_body" defaultValue={nonEmpty(contactEn.directBody, contactFallback.en?.directBody)} />
          <Inp label={t({ en: "Arabic CTA", ar: "زر عربي" })} name="contact_ar_cta" defaultValue={nonEmpty(contactAr.primaryCta, contactFallback.ar?.primaryCta)} />
          <Inp label={t({ en: "English CTA", ar: "زر إنجليزي" })} name="contact_en_cta" defaultValue={nonEmpty(contactEn.primaryCta, contactFallback.en?.primaryCta)} />
          <Area label={t({ en: "Arabic chips, one per line", ar: "وسوم عربي، سطر لكل وسم" })} name="contact_ar_chips" defaultValue={lines(nonEmptyLines(contactAr.chips, contactFallback.ar?.chips))} />
          <Area label={t({ en: "English chips, one per line", ar: "وسوم إنجليزي، سطر لكل وسم" })} name="contact_en_chips" defaultValue={lines(nonEmptyLines(contactEn.chips, contactFallback.en?.chips))} />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save contact page", ar: "حفظ صفحة التواصل" })}</button>
          </div>
        </form>
      </Accordion>

      <Accordion
        id="offers"
        title={t({ en: "Website offers", ar: "عروض الموقع" })}
        description={t({ en: "Promos you can place on home, services, apps, contact, or everywhere.", ar: "عروض تظهر في الرئيسية أو الخدمات أو التطبيقات أو التواصل أو كل الموقع." })}
        icon={<UploadCloud className="h-5 w-5" />}
        count={offers.items?.filter((item) => item.isActive !== false).length ?? 0}
        defaultOpen
      >
        <SectionHelp
          title={t({ en: "How offers work", ar: "كيف تعمل العروض؟" })}
          body={t({
            en: "Use this only for real promotions. First choose the page where visitors should see it, then choose the shape: banner for a big hero offer, card for compact sections, strip for a small reminder. Upload one clear image, write short text, then save. Turn Show offer off to hide it without deleting.",
            ar: "استخدم هذا القسم للعروض الحقيقية فقط. أولاً اختر الصفحة التي سيظهر فيها العرض، ثم اختر الشكل: بانر لعرض كبير، بطاقة لقسم متوسط، شريط لتذكير صغير. ارفع صورة واضحة، اكتب نصاً قصيراً، ثم احفظ. لإخفاء العرض أطفئ إظهار العرض بدون حذفه.",
          })}
        />
        <details className="mb-5 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-black text-[var(--text-1)]">{t({ en: "Add a new offer", ar: "إضافة عرض جديد" })}</span>
              <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Create a lightweight promotion with image and button.", ar: "أنشئ عرضاً خفيفاً مع صورة وزر." })}</span>
            </span>
            <span className="btn btn-sm">{t({ en: "Create", ar: "إنشاء" })}</span>
          </summary>
          <OfferForm assets={data.mediaAssets} />
        </details>
        <div className="grid gap-3">
          {(offers.items ?? []).map((offer, index) => (
            <details key={offer.id || index} className="rounded-3xl border border-[var(--line)] bg-white/[0.025] p-4">
              <summary className="cursor-pointer list-none">
                <div className="grid gap-3 md:grid-cols-[150px_1fr_auto] md:items-center">
                  <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-black/20">
                    {offer.image ? <SafeImage src={offer.image} alt={offer.title?.en || offer.title?.ar || "Offer"} className="aspect-video h-full w-full object-cover" /> : <ImageFallback label="Offer" />}
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="badge">{offer.isActive === false ? t({ en: "Hidden", ar: "مخفي" }) : t({ en: "Active", ar: "ظاهر" })}</span>
                      <span className="badge">{offer.placement || "home"}</span>
                      <span className="badge">{offer.style || "banner"}</span>
                    </div>
                    <p className="text-sm font-black text-[var(--text-1)]">{offer.title?.ar || offer.title?.en || offer.id}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-3)]">{offer.body?.ar || offer.body?.en}</p>
                  </div>
                  <span className="btn btn-sm">{t({ en: "Edit", ar: "تعديل" })}</span>
                </div>
              </summary>
              <OfferForm offer={offer} assets={data.mediaAssets} index={index} />
            </details>
          ))}
          {!(offers.items ?? []).length ? <EmptyState icon={<UploadCloud className="h-5 w-5" />} title={t({ en: "No offers yet", ar: "لا توجد عروض بعد" })} body={t({ en: "Add your first offer above.", ar: "أضف أول عرض من الأعلى." })} /> : null}
        </div>
      </Accordion>

      {/* Media library */}
      <Accordion
        id="media"
        title={t({ en: "Media library", ar: "مكتبة الصور" })}
        description={t({ en: "Upload and manage website images", ar: "رفع وإدارة صور الموقع" })}
        icon={<ImageIcon className="h-5 w-5" />}
        count={data.mediaAssets.length}
      >
        <SectionHelp
          title={t({ en: "Before uploading", ar: "قبل الرفع" })}
          body={t({
            en: "Use clear names and alt text. The image can then be reused across the website without uploading again.",
            ar: "استخدم اسماً ووصفاً واضحين. بعدها يمكن استخدام الصورة في أكثر من مكان بدون رفعها مرة ثانية.",
          })}
        />
        <form action={uploadWebsiteMediaAction} className="mb-6 grid gap-4 lg:grid-cols-3">
          <Inp label={t({ en: "Arabic alt text", ar: "وصف الصورة (عربي)" })} name="alt_ar" />
          <Inp label={t({ en: "English alt text", ar: "وصف الصورة (إنجليزي)" })} name="alt_en" />
          <Inp label={t({ en: "Kind", ar: "النوع" })} name="kind" defaultValue="site" />
          <label className="group relative flex min-h-20 cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--accent-soft)] px-5 py-4 lg:col-span-2">
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{t({ en: "Select image", ar: "اختر صورة" })}</span>
              <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Stored in Supabase Storage.", ar: "تُخزَّن في Supabase Storage." })}</span>
            </span>
            <UploadCloud className="h-6 w-6 text-[var(--accent)]" />
            <input type="file" name="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <button type="submit" className="btn btn-primary">{t({ en: "Upload", ar: "رفع" })}</button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.mediaAssets.map((item) => {
            const usage = mediaUsageLabels(item, data);
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/[0.02]">
                <div className="aspect-video bg-black/30">
                  <SafeImage src={item.path} alt={item.alt_en || item.id} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-xs font-black text-[var(--text-1)]">{item.id}</p>
                  <p className="line-clamp-2 text-[11px] leading-5 text-[var(--text-3)]">{item.alt_en || item.alt_ar || t({ en: "No alt text", ar: "لا يوجد وصف" })}</p>
                  <div className="rounded-xl border border-[var(--line)] bg-black/10 p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-3)]">{t({ en: "Used in", ar: "مستخدمة في" })}</p>
                    {usage.length ? (
                      <ul className="mt-1 space-y-1 text-[11px] leading-5 text-[var(--text-2)]">
                        {usage.slice(0, 4).map((entry) => <li key={entry}>{entry}</li>)}
                        {usage.length > 4 ? <li>+{usage.length - 4}</li> : null}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[11px] text-[var(--success)]">{t({ en: "Unused", ar: "غير مستخدمة" })}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="badge">{item.type}</span>
                    <form
                      action={deleteWebsiteMediaAction}
                      onSubmit={(event) => {
                        const message = usage.length
                          ? t({ en: "This image is still used. The server will block deletion until you replace it. Continue?", ar: "هذه الصورة مستخدمة. سيمنع السيرفر حذفها حتى تستبدلها. هل تتابع؟" })
                          : t({ en: "Delete this unused image?", ar: "حذف هذه الصورة غير المستخدمة؟" });
                        if (!window.confirm(message)) event.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-[var(--danger)] opacity-70 transition hover:opacity-100" aria-label="Delete media">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
          {!data.mediaAssets.length ? <div className="sm:col-span-2 xl:col-span-4"><EmptyState icon={<ImageIcon className="h-5 w-5" />} title={t({ en: "No media yet", ar: "لا صور بعد" })} /></div> : null}
        </div>
      </Accordion>

      <Accordion
        id="site-images"
        title={t({ en: "Key site images", ar: "صور الموقع الرئيسية" })}
        description={t({ en: "Change the big images that used to be fixed in code — homepage photo and product visuals", ar: "غيّر الصور الكبيرة التي كانت ثابتة في الكود — صورة الرئيسية وصور المنتج" })}
        icon={<ImageIcon className="h-5 w-5" />}
      >
        <SectionHelp
          title={t({ en: "Now editable from here", ar: "صارت قابلة للتعديل من هنا" })}
          body={t({
            en: "These are images that were previously hard-coded on the site. Pick any image from the library or upload a new file directly from your device, then Save. Leave empty to use the original.",
            ar: "هذه صور كانت مثبّتة في الكود سابقاً. اختر أي صورة من المكتبة أو ارفع ملفاً جديداً مباشرة من جهازك ثم احفظ. اتركها فارغة لاستخدام الصورة الأصلية.",
          })}
        />
        <form action={saveSiteImagesAction} className="grid gap-4 lg:grid-cols-3">
          <ImageControl label={t({ en: "Homepage photo (portrait)", ar: "صورة الرئيسية (البورتريه)" })} selectName="home_portrait_media_id" fileName="home_portrait_file" assets={data.mediaAssets} value={siteImages.home_portrait ?? ""} fallbackPath="/images/protofeilnew.jpeg" />
          <ImageControl label={t({ en: "Homepage product image", ar: "صورة المنتج في الرئيسية" })} selectName="home_product_hero_media_id" fileName="home_product_hero_file" assets={data.mediaAssets} value={siteImages.home_product_hero ?? ""} fallbackPath="/images/moplayer-hero-3d-final.png" />
          <ImageControl label={t({ en: "Homepage activation image", ar: "صورة التفعيل في الرئيسية" })} selectName="home_product_secondary_media_id" fileName="home_product_secondary_file" assets={data.mediaAssets} value={siteImages.home_product_secondary ?? ""} fallbackPath="/images/moplayer-activation-flow.webp" />
          <ImageControl label={t({ en: "Activation page social image", ar: "صورة مشاركة صفحة التفعيل" })} selectName="activation_hero_media_id" fileName="activation_hero_file" assets={data.mediaAssets} value={siteImages.activation_hero ?? ""} fallbackPath="/images/moplayer-activation-flow.webp" />
          <ImageControl label={t({ en: "Apps page hero image", ar: "صورة بطل صفحة التطبيقات" })} selectName="apps_hero_media_id" fileName="apps_hero_file" assets={data.mediaAssets} value={siteImages.apps_hero ?? ""} fallbackPath="/images/moplayer-hero-3d-final.png" />
          <ImageControl label={t({ en: "AI page hero image", ar: "صورة صفحة الذكاء الاصطناعي" })} selectName="ai_hero_media_id" fileName="ai_hero_file" assets={data.mediaAssets} value={siteImages.ai_hero ?? ""} fallbackPath="/images/hero_tech.png" />
          <ImageControl label={t({ en: "Support page hero image", ar: "صورة صفحة الدعم" })} selectName="support_hero_media_id" fileName="support_hero_file" assets={data.mediaAssets} value={siteImages.support_hero ?? ""} fallbackPath="/images/moplayer-activation-flow.webp" />
          <ImageControl label={t({ en: "Legal pages hero image", ar: "صورة الصفحات القانونية" })} selectName="legal_hero_media_id" fileName="legal_hero_file" assets={data.mediaAssets} value={siteImages.legal_hero ?? ""} fallbackPath="/images/hero_tech.png" />
          <div className="lg:col-span-3">
            <button type="submit" className="btn btn-primary">{t({ en: "Save site images", ar: "حفظ صور الموقع" })}</button>
          </div>
        </form>
      </Accordion>

      <Accordion
        id="youtube"
        title={t({ en: "YouTube videos", ar: "فيديوهات يوتيوب" })}
        description={t({ en: "Hide videos and pin a featured one on the public YouTube page", ar: "إخفاء فيديوهات وتثبيت فيديو مميز في صفحة يوتيوب العامة" })}
        icon={<Globe className="h-5 w-5" />}
      >
        <SectionHelp
          title={t({ en: "How the YouTube page works", ar: "كيف تعمل صفحة يوتيوب" })}
          body={t({
            en: "By default the page auto-pulls the latest videos from your channel via the YouTube API. To remove a specific video (for example one you no longer want shown), paste its link or ID below — one per line. Optionally pin one video as the big featured one at the top.",
            ar: "تلقائياً تجلب الصفحة أحدث فيديوهات قناتك عبر YouTube API. لإخفاء فيديو معيّن (مثلاً فيديو ما عدت تريده يظهر)، الصق رابطه أو معرّفه بالأسفل — واحد بكل سطر. واختياريّاً ثبّت فيديو واحد ليظهر كالفيديو المميز الكبير في الأعلى.",
          })}
        />
        <form action={saveYoutubeCurationAction} className="grid gap-4">
          <label className="field">
            <span>{t({ en: "Chosen videos — shown first, in this order (links or IDs, one per line)", ar: "الفيديوهات المختارة — تظهر أولاً بهذا الترتيب (روابط أو معرّفات، واحد بكل سطر)" })}</span>
            <textarea
              name="pinnedIds"
              rows={4}
              className="input font-mono"
              defaultValue={(youtubeCuration.pinnedIds ?? []).join("\n")}
              placeholder={"https://youtu.be/XXXXXXXXXXX\nXXXXXXXXXXX"}
            />
          </label>
          <label className="field">
            <span>{t({ en: "Hidden videos (links or IDs, one per line)", ar: "الفيديوهات المخفية (روابط أو معرّفات، واحد بكل سطر)" })}</span>
            <textarea
              name="excludedIds"
              rows={4}
              className="input font-mono"
              defaultValue={(youtubeCuration.excludedIds ?? []).join("\n")}
              placeholder={"https://youtu.be/XXXXXXXXXXX\nXXXXXXXXXXX"}
            />
          </label>
          <Inp
            label={t({ en: "Featured video (link or ID, optional)", ar: "الفيديو المميز (رابط أو معرّف، اختياري)" })}
            name="featuredId"
            defaultValue={youtubeCuration.featuredId ?? ""}
            placeholder="https://youtu.be/XXXXXXXXXXX"
          />
          <Toggle
            name="sortByViews"
            label={t({ en: "Auto-sort the rest by views (most watched first)", ar: "ترتيب الباقي تلقائياً حسب المشاهدات (الأكثر مشاهدة أولاً)" })}
            description={t({ en: "Chosen videos still come first; everything else is ordered by view count.", ar: "الفيديوهات المختارة تبقى أولاً، والباقي يُرتّب حسب عدد المشاهدات." })}
            checked={youtubeCuration.sortByViews === true}
          />
          <div>
            <button type="submit" className="btn btn-primary">{t({ en: "Save YouTube settings", ar: "حفظ إعدادات يوتيوب" })}</button>
          </div>
        </form>
      </Accordion>

      <Accordion
        id="pages"
        title={t({ en: "Pages & SEO", ar: "الصفحات و SEO" })}
        description={t({ en: "Control every public page title, status, metadata, and social preview.", ar: "تحكم بعنوان كل صفحة وحالتها وبيانات SEO والمعاينة الاجتماعية." })}
        icon={<FileText className="h-5 w-5" />}
        count={data.pages.length}
      >
        <SectionHelp
          title={t({ en: "SEO in plain words", ar: "SEO بكلام بسيط" })}
          body={t({
            en: "Page title is the visitor name. SEO title and description are what Google and sharing previews read. The social image appears when the link is shared.",
            ar: "عنوان الصفحة هو اسمها للزائر. عنوان ووصف SEO تقرأهم Google ومعاينة المشاركة. صورة المشاركة تظهر عند إرسال الرابط.",
          })}
        />
        <details className="mb-4 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-black text-[var(--text-1)]">{t({ en: "Add a page record", ar: "إضافة صفحة جديدة" })}</span>
              <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Use this when a new public route needs title, SEO, and share image control.", ar: "استخدمها عندما تحتاج صفحة عامة جديدة إلى عنوان وSEO وصورة مشاركة." })}</span>
            </span>
            <span className="btn btn-sm">{t({ en: "Create", ar: "إنشاء" })}</span>
          </summary>
          <form action={saveWebsitePageAction} className="mt-4 grid gap-4 border-t border-[var(--line)] pt-4 lg:grid-cols-2">
            <Inp label={t({ en: "Page ID", ar: "معرّف الصفحة" })} name="id" placeholder="p-new-page" />
            <Inp label={t({ en: "Slug", ar: "الرابط" })} name="slug" placeholder="new-page" />
            <label className="field">
              <span>{t({ en: "Status", ar: "الحالة" })}</span>
              <select name="status" defaultValue="published">
                <option value="published">{t({ en: "Published", ar: "منشور" })}</option>
                <option value="draft">{t({ en: "Draft", ar: "مسودة" })}</option>
              </select>
            </label>
            <Inp label={t({ en: "Template", ar: "القالب" })} name="template" defaultValue="default" />
            <div className="lg:col-span-2">
              <MediaSelect label={t({ en: "Google/social image", ar: "صورة Google والمشاركة" })} name="seo_image_media_id" assets={data.mediaAssets} value="" />
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-black/15 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Arabic</p>
              <div className="grid gap-3" dir="rtl">
                <Inp label={t({ en: "Page title", ar: "عنوان الصفحة" })} name="title_ar" />
                <Inp label={t({ en: "SEO title", ar: "عنوان SEO" })} name="meta_title_ar" />
                <Area label={t({ en: "SEO description", ar: "وصف SEO" })} name="meta_description_ar" />
                <Inp label="OG title" name="og_title_ar" />
                <Area label="OG description" name="og_description_ar" />
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-black/15 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">English</p>
              <div className="grid gap-3">
                <Inp label={t({ en: "Page title", ar: "عنوان الصفحة" })} name="title_en" />
                <Inp label={t({ en: "SEO title", ar: "عنوان SEO" })} name="meta_title_en" />
                <Area label={t({ en: "SEO description", ar: "وصف SEO" })} name="meta_description_en" />
                <Inp label="OG title" name="og_title_en" />
                <Area label="OG description" name="og_description_en" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary lg:col-span-2">{t({ en: "Add page", ar: "إضافة الصفحة" })}</button>
          </form>
        </details>
        <div className="grid gap-4">
          {data.pages.map((page) => {
            const fallback = pageFallbacks[page.slug as keyof typeof pageFallbacks];
            const ar = data.pageTranslations.find((item) => item.page_id === page.id && item.locale === "ar") ?? fallback?.ar;
            const en = data.pageTranslations.find((item) => item.page_id === page.id && item.locale === "en") ?? fallback?.en;
            const seoImage = data.mediaAssets.find((item) => item.id === page.seo_image_media_id);
            return (
              <details key={page.id} className="rounded-3xl border border-[var(--line)] bg-white/[0.025] p-4">
                <summary className="cursor-pointer list-none">
                  <div className="grid gap-4 md:grid-cols-[140px_1fr_auto] md:items-center">
                    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-black/20">
                      {seoImage?.path ? <SafeImage src={seoImage.path} alt={ar?.title || en?.title || page.slug} className="aspect-video h-full w-full object-cover" /> : <ImageFallback label={page.slug} />}
                    </div>
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="badge">{page.status}</span>
                        <span className="badge">{page.template}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">/{page.slug}</span>
                      </div>
                      <h3 className="text-base font-black text-[var(--text-1)]">{ar?.title || en?.title || page.slug}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-[var(--text-3)]">{ar?.meta_title || en?.meta_title}</p>
                    </div>
                    <span className="btn btn-sm">{t({ en: "Customize", ar: "تخصيص" })}</span>
                  </div>
                </summary>
                <form action={saveWebsitePageAction} className="mt-4 grid gap-4 lg:grid-cols-2">
                  <input type="hidden" name="id" value={page.id} />
                  <Inp label={t({ en: "Slug", ar: "الرابط" })} name="slug" defaultValue={page.slug} />
                  <label className="field">
                    <span>{t({ en: "Status", ar: "الحالة" })}</span>
                    <select name="status" defaultValue={page.status}>
                      <option value="published">{t({ en: "Published", ar: "منشور" })}</option>
                      <option value="draft">{t({ en: "Draft", ar: "مسودة" })}</option>
                    </select>
                  </label>
                  <Inp label={t({ en: "Template", ar: "القالب" })} name="template" defaultValue={page.template} />
                  <div className="lg:col-span-2">
                    <MediaSelect
                      label={t({ en: "Google/social image", ar: "صورة Google والمشاركة" })}
                      name="seo_image_media_id"
                      assets={data.mediaAssets}
                      value={page.seo_image_media_id ?? ""}
                    />
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-black/15 p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Arabic</p>
                    <div className="grid gap-3" dir="rtl">
                      <Inp label={t({ en: "Page title", ar: "عنوان الصفحة" })} name="title_ar" defaultValue={ar?.title} />
                      <Inp label={t({ en: "SEO title", ar: "عنوان SEO" })} name="meta_title_ar" defaultValue={ar?.meta_title} />
                      <Area label={t({ en: "SEO description", ar: "وصف SEO" })} name="meta_description_ar" defaultValue={ar?.meta_description} />
                      <Inp label="OG title" name="og_title_ar" defaultValue={ar?.og_title} />
                      <Area label="OG description" name="og_description_ar" defaultValue={ar?.og_description} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-black/15 p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">English</p>
                    <div className="grid gap-3">
                      <Inp label={t({ en: "Page title", ar: "عنوان الصفحة" })} name="title_en" defaultValue={en?.title} />
                      <Inp label={t({ en: "SEO title", ar: "عنوان SEO" })} name="meta_title_en" defaultValue={en?.meta_title} />
                      <Area label={t({ en: "SEO description", ar: "وصف SEO" })} name="meta_description_en" defaultValue={en?.meta_description} />
                      <Inp label="OG title" name="og_title_en" defaultValue={en?.og_title} />
                      <Area label="OG description" name="og_description_en" defaultValue={en?.og_description} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary lg:col-span-2">{t({ en: "Save page", ar: "حفظ الصفحة" })}</button>
                </form>
              </details>
            );
          })}
          {!data.pages.length ? <EmptyState icon={<FileText className="h-5 w-5" />} title={t({ en: "No pages found", ar: "لا توجد صفحات" })} /> : null}
        </div>
      </Accordion>

      {/* Projects */}
      <Accordion
        id="projects"
        title={t({ en: "Projects / case studies", ar: "المشاريع" })}
        description={t({ en: "Create, update, or remove projects", ar: "إضافة وتعديل وحذف المشاريع" })}
        icon={<Briefcase className="h-5 w-5" />}
        count={data.projects.length}
      >
        <details className="mb-6 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-black text-[var(--text-1)]">{t({ en: "Add a new project", ar: "إضافة مشروع جديد" })}</span>
              <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Closed by default so existing projects stay easy to scan.", ar: "مغلق افتراضياً حتى تبقى المشاريع الحالية سهلة القراءة." })}</span>
            </span>
            <span className="btn btn-sm">{t({ en: "Create", ar: "إنشاء" })}</span>
          </summary>
          <form action={saveWebsiteProjectAction} className="mt-5 grid gap-4 border-t border-[var(--line)] pt-4 lg:grid-cols-3">
            <Inp label={t({ en: "ID (optional)", ar: "المعرّف (اختياري)" })} name="id" placeholder="existing-id" />
            <Inp label={t({ en: "Slug", ar: "المعرّف النصي" })} name="slug" placeholder="project-slug" />
            <Inp label={t({ en: "Sort order", ar: "الترتيب" })} name="sort_order" type="number" defaultValue={String(data.projects.length + 1)} />
            <Inp label={t({ en: "Category", ar: "الفئة" })} name="category" defaultValue="business" />
            <Inp label={t({ en: "Featured rank", ar: "ترتيب التمييز" })} name="featured_rank" type="number" defaultValue={String(data.projects.length + 1)} />
            <Inp label={t({ en: "Project URL", ar: "رابط المشروع" })} name="project_url" placeholder="https://..." />
            <Inp label={t({ en: "Repo URL", ar: "رابط المستودع" })} name="repo_url" placeholder="https://github.com/..." />
            <MediaSelect label={t({ en: "Cover image", ar: "صورة الغلاف" })} name="cover_media_id" assets={data.mediaAssets} value="" />
            <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-black/20 px-4 py-3">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{t({ en: "Upload cover", ar: "رفع غلاف مباشر" })}</span>
                <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Choose a project screenshot and save.", ar: "اختر لقطة للمشروع واحفظ." })}</span>
              </span>
              <UploadCloud className="h-5 w-5 text-[var(--accent)]" />
              <input type="file" name="cover_file" accept="image/*" className="sr-only" />
            </label>
            <Inp label={t({ en: "Arabic title", ar: "عنوان المشروع عربي" })} name="title_ar" />
            <Inp label={t({ en: "English title", ar: "عنوان المشروع إنجليزي" })} name="title_en" />
            <Area label={t({ en: "Arabic summary", ar: "ملخص عربي" })} name="summary_ar" />
            <Area label={t({ en: "English summary", ar: "ملخص إنجليزي" })} name="summary_en" />
            <Area label={t({ en: "Arabic description", ar: "وصف عربي" })} name="description_ar" />
            <Area label={t({ en: "English description", ar: "وصف إنجليزي" })} name="description_en" />
            <Inp label={t({ en: "Arabic CTA", ar: "زر عربي" })} name="cta_ar" defaultValue="عرض المشروع" />
            <Inp label={t({ en: "English CTA", ar: "زر إنجليزي" })} name="cta_en" defaultValue="View project" />
            <Area label={t({ en: "Arabic tags, one per line", ar: "وسوم عربي، سطر لكل وسم" })} name="tags_ar" />
            <Area label={t({ en: "English tags, one per line", ar: "وسوم إنجليزي، سطر لكل وسم" })} name="tags_en" />
            <Area label={t({ en: "Arabic challenge", ar: "التحدي عربي" })} name="challenge_ar" />
            <Area label={t({ en: "English challenge", ar: "التحدي إنجليزي" })} name="challenge_en" />
            <Area label={t({ en: "Arabic solution", ar: "الحل عربي" })} name="solution_ar" />
            <Area label={t({ en: "English solution", ar: "الحل إنجليزي" })} name="solution_en" />
            <Area label={t({ en: "Arabic result", ar: "النتيجة عربي" })} name="result_ar" />
            <Area label={t({ en: "English result", ar: "النتيجة إنجليزي" })} name="result_en" />
            <Area
              label={t({ en: "Metrics: value | Arabic label | English label", ar: "المقاييس: القيمة | العنوان العربي | العنوان الإنجليزي" })}
              name="metrics"
              placeholder={"Live | مشروع فعلي | Real project\nSEO | قابل للفهرسة | Indexable"}
            />
            <label className="switch lg:col-span-2">
              <span>
                <strong>{t({ en: "Active on site", ar: "ظاهر في الموقع" })}</strong>
                <small>{t({ en: "Show this project publicly.", ar: "إظهار المشروع للعامة." })}</small>
              </span>
              <input type="checkbox" name="is_active" defaultChecked />
              <i aria-hidden />
            </label>
            <button type="submit" className="btn btn-primary">{t({ en: "Save project", ar: "حفظ المشروع" })}</button>
          </form>
        </details>

        <div className="grid gap-3">
          {data.projects.map((project) => {
            const ar = data.projectTranslations.find((item) => item.project_id === project.id && item.locale === "ar");
            const en = data.projectTranslations.find((item) => item.project_id === project.id && item.locale === "en");
            const asset = data.mediaAssets.find((item) => item.id === project.cover_media_id);
            const metrics = data.projectMetrics.filter((item) => item.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order);
            return (
              <details key={project.id} className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white/[0.025] p-4">
                <summary className="cursor-pointer list-none">
                  <div className="grid gap-4 md:grid-cols-[160px_1fr_auto] md:items-center">
                    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-black/20">
                      {asset?.path ? <SafeImage src={asset.path} alt={en?.title || project.slug} className="aspect-video h-full w-full object-cover" /> : <ImageFallback label={project.slug} />}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="badge">{project.is_active ? t({ en: "Active", ar: "ظاهر" }) : t({ en: "Hidden", ar: "مخفي" })}</span>
                        <span className="badge">{project.category || "project"}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">#{project.sort_order}</span>
                      </div>
                      <p className="text-sm font-black text-[var(--text-1)]">{ar?.title || en?.title || project.slug}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-3)]">{ar?.summary || en?.summary || project.project_url || t({ en: "No summary yet", ar: "لا يوجد ملخص بعد" })}</p>
                    </div>
                    <span className="btn btn-sm">{t({ en: "Customize", ar: "تخصيص" })}</span>
                  </div>
                </summary>
                <form action={saveWebsiteProjectAction} className="mt-5 grid gap-4 border-t border-[var(--line)] pt-5 lg:grid-cols-3">
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="current_cover_media_id" value={project.cover_media_id ?? ""} />
                  <Inp label={t({ en: "Slug", ar: "المعرّف النصي" })} name="slug" defaultValue={project.slug} />
                  <Inp label={t({ en: "Sort order", ar: "الترتيب" })} name="sort_order" type="number" defaultValue={String(project.sort_order)} />
                  <Inp label={t({ en: "Category", ar: "الفئة" })} name="category" defaultValue={project.category ?? "business"} />
                  <Inp label={t({ en: "Featured rank", ar: "ترتيب التمييز" })} name="featured_rank" type="number" defaultValue={String(project.featured_rank ?? 99)} />
                  <Inp label={t({ en: "Project URL", ar: "رابط المشروع" })} name="project_url" defaultValue={project.project_url} />
                  <Inp label={t({ en: "Repo URL", ar: "رابط المستودع" })} name="repo_url" defaultValue={project.repo_url} />
                  <MediaSelect label={t({ en: "Cover image", ar: "صورة الغلاف" })} name="cover_media_id" assets={data.mediaAssets} value={project.cover_media_id ?? ""} />
                  <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-black/20 px-4 py-3">
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{t({ en: "Upload replacement cover", ar: "رفع غلاف بديل" })}</span>
                      <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Optional direct image upload.", ar: "رفع مباشر اختياري." })}</span>
                    </span>
                    <UploadCloud className="h-5 w-5 text-[var(--accent)]" />
                    <input type="file" name="cover_file" accept="image/*" className="sr-only" />
                  </label>
                  <Inp label={t({ en: "Arabic title", ar: "عنوان المشروع عربي" })} name="title_ar" defaultValue={ar?.title} />
                  <Inp label={t({ en: "English title", ar: "عنوان المشروع إنجليزي" })} name="title_en" defaultValue={en?.title} />
                  <Area label={t({ en: "Arabic summary", ar: "ملخص عربي" })} name="summary_ar" defaultValue={ar?.summary} />
                  <Area label={t({ en: "English summary", ar: "ملخص إنجليزي" })} name="summary_en" defaultValue={en?.summary} />
                  <Area label={t({ en: "Arabic description", ar: "وصف عربي" })} name="description_ar" defaultValue={ar?.description} />
                  <Area label={t({ en: "English description", ar: "وصف إنجليزي" })} name="description_en" defaultValue={en?.description} />
                  <Inp label={t({ en: "Arabic CTA", ar: "زر عربي" })} name="cta_ar" defaultValue={ar?.cta_label || "عرض المشروع"} />
                  <Inp label={t({ en: "English CTA", ar: "زر إنجليزي" })} name="cta_en" defaultValue={en?.cta_label || "View project"} />
                  <Area label={t({ en: "Arabic tags, one per line", ar: "وسوم عربي، سطر لكل وسم" })} name="tags_ar" defaultValue={lines(ar?.tags_json)} />
                  <Area label={t({ en: "English tags, one per line", ar: "وسوم إنجليزي، سطر لكل وسم" })} name="tags_en" defaultValue={lines(en?.tags_json)} />
                  <Area label={t({ en: "Arabic challenge", ar: "التحدي عربي" })} name="challenge_ar" defaultValue={ar?.challenge} />
                  <Area label={t({ en: "English challenge", ar: "التحدي إنجليزي" })} name="challenge_en" defaultValue={en?.challenge} />
                  <Area label={t({ en: "Arabic solution", ar: "الحل عربي" })} name="solution_ar" defaultValue={ar?.solution} />
                  <Area label={t({ en: "English solution", ar: "الحل إنجليزي" })} name="solution_en" defaultValue={en?.solution} />
                  <Area label={t({ en: "Arabic result", ar: "النتيجة عربي" })} name="result_ar" defaultValue={ar?.result} />
                  <Area label={t({ en: "English result", ar: "النتيجة إنجليزي" })} name="result_en" defaultValue={en?.result} />
                  <Area
                    label={t({ en: "Metrics: value | Arabic label | English label", ar: "المقاييس: القيمة | العنوان العربي | العنوان الإنجليزي" })}
                    name="metrics"
                    defaultValue={metricLines(metrics)}
                  />
                  <label className="switch lg:col-span-2">
                    <span>
                      <strong>{t({ en: "Active on site", ar: "ظاهر في الموقع" })}</strong>
                      <small>{t({ en: "Show this project publicly.", ar: "إظهار المشروع للعامة." })}</small>
                    </span>
                    <input type="checkbox" name="is_active" defaultChecked={project.is_active} />
                    <i aria-hidden />
                  </label>
                  <div className="flex flex-wrap gap-2 lg:col-span-3">
                    <button type="submit" className="btn btn-primary">{t({ en: "Save changes", ar: "حفظ التعديلات" })}</button>
                    <Link href={project.project_url || `${webBaseUrl}/ar/work`} target="_blank" className="btn">
                      <ExternalLink className="h-4 w-4" />
                      {t({ en: "Open", ar: "فتح" })}
                    </Link>
                  </div>
                </form>
                <div className="mt-4 flex justify-end">
                  <form action={deleteWebsiteProjectAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <button type="submit" className="btn btn-sm btn-danger" aria-label="Delete project">
                      <Trash2 className="h-4 w-4" />
                      {t({ en: "Delete project", ar: "حذف المشروع" })}
                    </button>
                  </form>
                </div>
              </details>
            );
          })}
          {!data.projects.length ? <EmptyState icon={<Briefcase className="h-5 w-5" />} title={t({ en: "No projects yet", ar: "لا مشاريع بعد" })} /> : null}
        </div>
      </Accordion>

      {/* Messages */}
      <Accordion
        id="messages"
        title={t({ en: "Messages inbox", ar: "صندوق الرسائل" })}
        description={t({ en: "Visitor requests — reply by email", ar: "طلبات الزوار — رد بالبريد" })}
        icon={<Inbox className="h-5 w-5" />}
        count={data.messages.length}
        defaultOpen
      >
        <div className="grid gap-3">
          {data.messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-black text-[var(--text-1)]">{message.name}</h3>
                  <p className="mt-0.5 text-xs font-bold text-[var(--accent)]">
                    {message.email}
                    {message.whatsapp ? ` · ${message.whatsapp}` : ""}
                  </p>
                </div>
                <span className="badge shrink-0">{new Date(message.created_at).toLocaleString("en-GB")}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-2)]">{message.message}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-[var(--text-3)]">
                <span className="badge">{message.status || (message.read ? "read" : "new")}</span>
                <span className="badge">{message.locale || "—"}</span>
                <span className="badge">{message.project_type || message.subject || "general"}</span>
                {message.budget ? <span className="badge">{message.budget}</span> : null}
                {message.replied_at ? <span className="badge">{t({ en: "Replied", ar: "تم الرد" })}: {new Date(message.replied_at).toLocaleString("en-GB")}</span> : null}
              </div>
              <form action={updateWebsiteMessageStatusAction} className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--line)] bg-black/15 p-3">
                <input type="hidden" name="id" value={message.id} />
                <label className="field min-w-44 flex-1">
                  <span>{t({ en: "Request status", ar: "حالة الطلب" })}</span>
                  <select name="status" defaultValue={message.status || (message.read ? "read" : "new")}>
                    <option value="new">{t({ en: "New", ar: "جديد" })}</option>
                    <option value="read">{t({ en: "In review", ar: "قيد المراجعة" })}</option>
                    <option value="replied">{t({ en: "Replied", ar: "تم الرد" })}</option>
                    <option value="resolved">{t({ en: "Resolved", ar: "تم الحل" })}</option>
                    <option value="archived">{t({ en: "Archived", ar: "مؤرشف" })}</option>
                  </select>
                </label>
                <button type="submit" className="btn btn-sm">{t({ en: "Update status", ar: "تحديث الحالة" })}</button>
              </form>
              <ReplyComposer
                to={message.email}
                defaultSubject={t({ en: "Re: your message to Moalfarras", ar: "رد على رسالتك إلى Moalfarras" })}
                redirectTo="/website"
                messageId={message.id}
              />
              <form action={deleteWebsiteMessageAction} className="mt-3 flex justify-end">
                <input type="hidden" name="id" value={message.id} />
                <button type="submit" className="btn btn-sm btn-danger" aria-label="Delete message">
                  <Trash2 className="h-4 w-4" />
                  {t({ en: "Delete message", ar: "حذف الرسالة" })}
                </button>
              </form>
            </article>
          ))}
          {!data.messages.length ? <EmptyState icon={<Inbox className="h-5 w-5" />} title={t({ en: "Inbox zero", ar: "لا رسائل" })} body={t({ en: "Visitor messages will appear here.", ar: "ستظهر رسائل الزوار هنا." })} /> : null}
        </div>
      </Accordion>
    </>
  );
}

function Inp({ label, help, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string }) {
  return (
    <label className="field">
      <span>{label}{help ? <HelpTip text={help} /> : null}</span>
      <input {...props} />
    </label>
  );
}

function Area({ label, help, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; help?: string }) {
  return (
    <label className="field">
      <span>{label}{help ? <HelpTip text={help} /> : null}</span>
      <textarea {...props} />
    </label>
  );
}

function GuideCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(99,102,241,0.05))] p-4">
      <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </div>
  );
}

function SectionHelp({ title, body, tone = "default" }: { title: string; body: string; tone?: "default" | "warning" }) {
  return (
    <div
      className={[
        "mb-5 rounded-2xl border p-4",
        tone === "warning"
          ? "border-[rgba(251,191,36,0.32)] bg-[rgba(251,191,36,0.08)]"
          : "border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(99,102,241,0.045))]",
      ].join(" ")}
    >
      <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </div>
  );
}

function QuickJump({ href, title, body }: { href: string; title: string; body: string }) {
  const { t } = useLocale();

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--line-strong)] bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-white/[0.055]"
    >
      <span className="block text-sm font-black text-[var(--text-1)]">{title}</span>
      <span className="mt-1 block text-xs leading-6 text-[var(--text-3)]">{body}</span>
      <span className="mt-3 inline-flex text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)] transition group-hover:translate-x-1">
        {t({ en: "Open section", ar: "فتح القسم" })}
      </span>
    </Link>
  );
}

function OfferForm({ offer, assets, index }: { offer?: WebsiteOffer; assets: WebsiteCmsData["mediaAssets"]; index?: number }) {
  const { t } = useLocale();
  const imageId = offer?.image ? assets.find((asset) => asset.path === offer.image)?.id ?? "" : "";

  return (
    <form action={saveWebsiteOffersAction} className="mt-5 grid gap-4 border-t border-[var(--line)] pt-5 lg:grid-cols-3">
      <input type="hidden" name="existing_index" value={index ?? ""} />
      <input type="hidden" name="id" value={offer?.id ?? ""} />
      <Inp label={t({ en: "Sort order", ar: "الترتيب" })} name="sort_order" type="number" defaultValue={String(offer?.sortOrder ?? (index ?? 0) + 1)} />
      <label className="field">
        <span>{t({ en: "Where should it appear?", ar: "أين يظهر؟" })}</span>
        <select name="placement" defaultValue={offer?.placement ?? "home"}>
          <option value="home">{t({ en: "Home page", ar: "الرئيسية" })}</option>
          <option value="services">{t({ en: "Services page", ar: "الخدمات" })}</option>
          <option value="apps">{t({ en: "Apps page", ar: "التطبيقات" })}</option>
          <option value="contact">{t({ en: "Contact page", ar: "التواصل" })}</option>
          <option value="all">{t({ en: "Every main page", ar: "كل الصفحات الرئيسية" })}</option>
        </select>
      </label>
      <label className="field">
        <span>{t({ en: "Display style", ar: "شكل العرض" })}</span>
        <select name="style" defaultValue={offer?.style ?? "banner"}>
          <option value="banner">{t({ en: "Big banner", ar: "بانر كبير" })}</option>
          <option value="cards">{t({ en: "Card", ar: "بطاقة" })}</option>
          <option value="strip">{t({ en: "Small strip", ar: "شريط صغير" })}</option>
        </select>
      </label>
      <Inp label={t({ en: "Arabic badge", ar: "شارة عربي" })} name="badge_ar" defaultValue={offer?.badge?.ar ?? "عرض خاص"} />
      <Inp label={t({ en: "English badge", ar: "شارة إنجليزي" })} name="badge_en" defaultValue={offer?.badge?.en ?? "Special offer"} />
      <label className="switch">
        <span>
          <strong>{t({ en: "Show offer", ar: "إظهار العرض" })}</strong>
          <small>{t({ en: "Turn off to hide without deleting.", ar: "أطفئه لإخفاء العرض بدون حذف." })}</small>
        </span>
        <input type="checkbox" name="is_active" defaultChecked={offer?.isActive !== false} />
        <i aria-hidden />
      </label>
      <Inp label={t({ en: "Arabic title", ar: "عنوان عربي" })} name="title_ar" defaultValue={offer?.title?.ar ?? ""} required />
      <Inp label={t({ en: "English title", ar: "عنوان إنجليزي" })} name="title_en" defaultValue={offer?.title?.en ?? ""} />
      <Inp label={t({ en: "Button link", ar: "رابط الزر" })} name="cta_href" defaultValue={offer?.ctaHref ?? "/contact"} />
      <Area label={t({ en: "Arabic text", ar: "نص عربي" })} name="body_ar" defaultValue={offer?.body?.ar ?? ""} />
      <Area label={t({ en: "English text", ar: "نص إنجليزي" })} name="body_en" defaultValue={offer?.body?.en ?? ""} />
      <div className="grid gap-3">
        <Inp label={t({ en: "Arabic button", ar: "زر عربي" })} name="cta_ar" defaultValue={offer?.ctaLabel?.ar ?? "اطلب العرض"} />
        <Inp label={t({ en: "English button", ar: "زر إنجليزي" })} name="cta_en" defaultValue={offer?.ctaLabel?.en ?? "Get offer"} />
      </div>
      <div className="lg:col-span-2">
        <MediaSelect label={t({ en: "Offer image from library", ar: "صورة العرض من المكتبة" })} name="image_media_id" assets={assets} value={imageId} fallbackPath={offer?.image} />
      </div>
      <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-black/20 px-4 py-3">
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{t({ en: "Upload offer image", ar: "رفع صورة العرض" })}</span>
          <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Optional direct image upload.", ar: "رفع مباشر اختياري." })}</span>
        </span>
        <UploadCloud className="h-5 w-5 text-[var(--accent)]" />
        <input type="file" name="offer_file" accept="image/*" className="sr-only" />
      </label>
      <button type="submit" className="btn btn-primary lg:col-span-3">{t({ en: "Save offer", ar: "حفظ العرض" })}</button>
    </form>
  );
}

function MediaSelect({
  label,
  name,
  assets,
  value,
  fallbackPath,
}: {
  label: string;
  name: string;
  assets: WebsiteCmsData["mediaAssets"];
  value?: string | null;
  fallbackPath?: string;
}) {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = assets.find((asset) => asset.id === selectedId);
  const previewSrc = selected?.path || fallbackPath || "";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = assets.filter((asset) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [asset.id, asset.type, asset.path, asset.alt_en, asset.alt_ar]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-3">
      <input type="hidden" name={name} value={selectedId} />
      <p className="mb-2 text-xs font-black text-[var(--text-1)]">{label}</p>
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/25">
        <div className="aspect-video">
          {previewSrc ? <SafeImage src={previewSrc} alt={label} className="h-full w-full object-contain p-3" /> : <ImageFallback label={label} />}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-primary">
          <ImageIcon className="h-4 w-4" />
          {t({ en: "Choose from library", ar: "اختر من المكتبة" })}
        </button>
        {selectedId ? (
          <button type="button" onClick={() => setSelectedId("")} className="btn btn-sm">
            {t({ en: "Use fallback", ar: "إزالة الاختيار" })}
          </button>
        ) : null}
        <span className="text-[10px] font-bold text-[var(--text-3)]">
          {selected ? t({ en: "Custom image selected", ar: "تم اختيار صورة" }) : t({ en: "Using fallback image", ar: "الصورة الافتراضية" })}
        </span>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[var(--line-strong)] bg-[var(--panel-2)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-[var(--text-1)]">{t({ en: "Media library", ar: "مكتبة الصور" })}</p>
                <p className="truncate text-[11px] text-[var(--text-3)]">
                  {t({ en: "Tap an image to choose it for", ar: "اضغط على صورة لاختيارها لـ" })} «{label}» · {filtered.length}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 border-b border-[var(--line)] p-3">
              <Search className="h-4 w-4 text-[var(--accent)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t({ en: "Search images...", ar: "ابحث في الصور..." })}
                className="h-9 flex-1 bg-transparent text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]"
              />
            </div>
            <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 md:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedId("");
                  setOpen(false);
                }}
                className={`rounded-2xl border p-2 text-start transition ${!selectedId ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}
              >
                <div className="flex aspect-video items-center justify-center rounded-xl bg-black/25 text-[11px] font-bold text-[var(--text-3)]">
                  {t({ en: "Default / fallback", ar: "الصورة الافتراضية" })}
                </div>
              </button>
              {filtered.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(asset.id);
                    setOpen(false);
                  }}
                  className={`group rounded-2xl border p-2 text-start transition ${selectedId === asset.id ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}
                >
                  <div className="overflow-hidden rounded-xl bg-black/25">
                    <div className="aspect-video">
                      <SafeImage src={asset.path} alt={asset.alt_en || asset.id} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-bold text-[var(--text-3)]">{asset.type}</span>
                    {selectedId === asset.id ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black text-[var(--accent)]">
                        <Check className="h-3 w-3" />
                        {t({ en: "Selected", ar: "مختارة" })}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
              {!filtered.length ? (
                <div className="sm:col-span-2 md:col-span-3">
                  <EmptyState
                    icon={<ImageIcon className="h-5 w-5" />}
                    title={t({ en: "No images found", ar: "لا توجد صور" })}
                    body={t({ en: "Upload images from the Media section, then pick them here.", ar: "ارفع صوراً من قسم الصور، ثم اخترها من هنا." })}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImageControl({
  label,
  selectName,
  fileName,
  assets,
  value,
  fallbackPath,
}: {
  label: string;
  selectName: string;
  fileName: string;
  assets: WebsiteCmsData["mediaAssets"];
  value?: string | null;
  fallbackPath?: string;
}) {
  const { t } = useLocale();

  return (
    <div className="rounded-2xl border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(99,102,241,0.05))] p-3">
      <MediaSelect label={label} name={selectName} assets={assets} value={value} fallbackPath={fallbackPath} />
      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-black/20 px-4 py-3">
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{t({ en: "Replace image directly", ar: "تبديل الصورة مباشرة" })}</span>
          <span className="mt-1 block text-xs text-[var(--text-3)]">{t({ en: "Choose a new file, then press Save. This replaces the selected image without deleting anything.", ar: "اختر ملفاً جديداً ثم اضغط حفظ. سيتم تبديل الصورة بدون حذف أي عنصر." })}</span>
        </span>
        <UploadCloud className="h-5 w-5 text-[var(--accent)]" />
        <input type="file" name={fileName} accept="image/*" className="sr-only" />
      </label>
    </div>
  );
}

function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = resolveAdminAssetUrl(src);

  if (!imageSrc || failedSrc === imageSrc) return <ImageFallback label={alt} />;

  return <img src={imageSrc} alt={alt} className={className} onError={() => setFailedSrc(imageSrc)} />;
}

function ImageFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%),rgba(15,23,42,0.72)] p-5 text-center">
      <ImageIcon className="h-7 w-7 text-[var(--accent)]" />
      <p className="text-xs font-black text-[var(--text-1)]">{label}</p>
      <p className="text-[10px] font-bold text-[var(--text-3)]">Image path needs upload or a valid public URL</p>
    </div>
  );
}

