"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Layers3,
  Monitor,
  Palette,
  Power,
  Save,
  Search,
  ShieldAlert,
  Smartphone,
  Trash2,
  Tv,
  UploadCloud,
} from "lucide-react";

import { deleteMediaLibraryAction, saveMediaSiteImagesAction, uploadMediaLibraryAction } from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";
import { CopyButton, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { UpdatedToast } from "@/components/admin/updated-toast";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
import type { WebsiteCmsData, WebsiteMediaAsset, WebsiteSetting } from "@/lib/website-cms";
import type { AdminAppData } from "@/types/app-ecosystem";

const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");

type AppEntry = {
  key: "classic" | "pro";
  title: string;
  href: string;
  publicHref: string;
  icon: ReactNode;
  data: AdminAppData;
};

type SiteImageSlot = {
  key: string;
  controlKey: string;
  labelEn: string;
  labelAr: string;
  bodyEn: string;
  bodyAr: string;
  fallback: string;
  publicHref: string;
};

const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  {
    key: "home.hero.profile",
    controlKey: "home_portrait",
    labelEn: "Homepage portrait",
    labelAr: "صورة الرئيسية الشخصية",
    bodyEn: "Main personal/profile image on the home page.",
    bodyAr: "الصورة الشخصية الأساسية في الصفحة الرئيسية.",
    fallback: "/images/protofeilnew.jpeg",
    publicHref: `${webBaseUrl}/en`,
  },
  {
    key: "home.moplayer.hero",
    controlKey: "home_product_hero",
    labelEn: "Home MoPlayer hero",
    labelAr: "صورة MoPlayer في الرئيسية",
    bodyEn: "3D/app image used in the home product area.",
    bodyAr: "صورة التطبيق/الثلاثية الأبعاد في قسم MoPlayer بالرئيسية.",
    fallback: "/images/moplayer-hero-3d-final.png",
    publicHref: `${webBaseUrl}/en`,
  },
  {
    key: "home.activation.preview",
    controlKey: "home_product_secondary",
    labelEn: "Home activation preview",
    labelAr: "صورة التفعيل في الرئيسية",
    bodyEn: "Secondary activation/QR preview image.",
    bodyAr: "صورة معاينة التفعيل أو QR في الرئيسية.",
    fallback: "/images/moplayer-activation-flow.webp",
    publicHref: `${webBaseUrl}/en`,
  },
  {
    key: "activation.hero",
    controlKey: "activation_hero",
    labelEn: "Activation page hero",
    labelAr: "صورة صفحة التفعيل",
    bodyEn: "Hero/social image for the activation page.",
    bodyAr: "صورة الهيرو والمشاركة لصفحة التفعيل.",
    fallback: "/images/moplayer-activation-flow.webp",
    publicHref: `${webBaseUrl}/en/activate?product=moplayer2`,
  },
  {
    key: "apps.hero",
    controlKey: "apps_hero",
    labelEn: "Apps page hero",
    labelAr: "صورة صفحة التطبيقات",
    bodyEn: "Main MoPlayer Family / apps page image.",
    bodyAr: "الصورة الأساسية لصفحة عائلة MoPlayer والتطبيقات.",
    fallback: "/images/moplayer-hero-3d-final.png",
    publicHref: `${webBaseUrl}/en/apps/moplayer`,
  },
  {
    key: "ai.hero",
    controlKey: "ai_hero",
    labelEn: "AI page hero",
    labelAr: "صورة صفحة الذكاء الاصطناعي",
    bodyEn: "Public AI/automation page visual.",
    bodyAr: "صورة صفحة الذكاء الاصطناعي والأتمتة.",
    fallback: "/images/hero_tech.png",
    publicHref: `${webBaseUrl}/en/ai`,
  },
  {
    key: "support.hero",
    controlKey: "support_hero",
    labelEn: "Support page hero",
    labelAr: "صورة صفحة الدعم",
    bodyEn: "Support/help page public image.",
    bodyAr: "الصورة العامة لصفحة الدعم والمساعدة.",
    fallback: "/images/moplayer-activation-flow.webp",
    publicHref: `${webBaseUrl}/en/support`,
  },
  {
    key: "legal.hero",
    controlKey: "legal_hero",
    labelEn: "Legal pages hero",
    labelAr: "صورة الصفحات القانونية",
    bodyEn: "Privacy, terms, and legal pages image.",
    bodyAr: "صورة الخصوصية والشروط والصفحات القانونية.",
    fallback: "/images/hero_tech.png",
    publicHref: `${webBaseUrl}/en/privacy`,
  },
];

function setting<T>(settings: WebsiteSetting[], key: string, fallback: T): T {
  return (settings.find((item) => item.key === key)?.value_json ?? fallback) as T;
}

function mediaAssetById(assets: WebsiteMediaAsset[], id?: string | null) {
  return assets.find((asset) => asset.id === id);
}

function assetPath(assets: WebsiteMediaAsset[], idOrPath?: string | null, fallback = "") {
  if (!idOrPath) return fallback;
  const asset = mediaAssetById(assets, idOrPath);
  return asset?.path || idOrPath || fallback;
}

function runtimeStatus(data: AdminAppData, t: (value: { en: string; ar: string }) => string) {
  if (data.runtimeConfig.maintenanceMode) return t({ en: "Maintenance", ar: "صيانة" });
  if (!data.runtimeConfig.enabled) return t({ en: "Off", ar: "متوقف" });
  if (data.runtimeConfig.forceUpdate) return t({ en: "Force update", ar: "تحديث إجباري" });
  return t({ en: "Online", ar: "يعمل" });
}

export function MediaControlCenter({
  website,
  classic,
  pro,
  updated,
}: {
  website: WebsiteCmsData;
  classic: AdminAppData;
  pro: AdminAppData;
  updated?: string;
}) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const siteImages = setting<Record<string, string>>(website.settings, "site_images", {});
  const ios = pro.runtimeConfig.ios ?? {};
  const classicApp: AppEntry = {
    key: "classic",
    title: "MoPlayer Classic",
    href: "/moplayer/classic",
    publicHref: `${webBaseUrl}/en/apps/moplayer/classic`,
    icon: <Smartphone className="h-5 w-5" />,
    data: classic,
  };
  const proApp: AppEntry = {
    key: "pro",
    title: "MoPlayer Pro",
    href: "/moplayer/pro",
    publicHref: `${webBaseUrl}/en/apps/moplayer2`,
    icon: <Tv className="h-5 w-5" />,
    data: pro,
  };
  const apps: AppEntry[] = [
    classicApp,
    proApp,
  ];

  const filteredMedia = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return website.mediaAssets;
    return website.mediaAssets.filter((asset) =>
      [asset.id, asset.path, asset.alt_ar, asset.alt_en, asset.type].some((value) => String(value ?? "").toLowerCase().includes(q)),
    );
  }, [query, website.mediaAssets]);

  const usedSiteSlots = SITE_IMAGE_SLOTS.filter((slot) => Boolean(siteImages[slot.controlKey])).length;
  const appImages = classic.screenshots.length + pro.screenshots.length + [classic.product.logo_path, classic.product.hero_image_path, classic.product.tv_banner_path, pro.product.logo_path, pro.product.hero_image_path, pro.product.tv_banner_path, ios.heroImageUrl].filter(Boolean).length;

  return (
    <>
      <UpdatedToast code={updated} />
      <PageHeader
        eyebrow={t({ en: "Real media controls", ar: "تحكم حقيقي بالصور" })}
        title={t({ en: "Media Control Center", ar: "مركز التحكم بالصور" })}
        subtitle={t({
          en: "Upload images once, see exactly where they are used, connect them to website slots, and jump to each app image editor without writing paths or code.",
          ar: "ارفع الصورة مرة واحدة، اعرف أين تستخدم، اربطها بمكانها في الموقع، وانتقل مباشرة إلى محرر صور كل تطبيق بدون كتابة مسارات أو كود.",
        })}
        icon={<ImageIcon className="h-7 w-7" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/website#site-images" className="btn btn-sm">
              <Layers3 className="h-4 w-4" />
              {t({ en: "Website slots", ar: "مفاتيح الموقع" })}
            </Link>
            <Link href={`${webBaseUrl}/en`} target="_blank" className="btn btn-sm">
              <ExternalLink className="h-4 w-4" />
              {t({ en: "Open live site", ar: "فتح الموقع" })}
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t({ en: "Media assets", ar: "ملفات الصور" })} value={website.mediaAssets.length} icon={<ImageIcon className="h-5 w-5" />} tone="violet" href="#library" />
        <StatCard label={t({ en: "Mapped site slots", ar: "صور مربوطة" })} value={`${usedSiteSlots}/${SITE_IMAGE_SLOTS.length}`} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" href="#site-images" />
        <StatCard label={t({ en: "App visuals", ar: "صور التطبيقات" })} value={appImages} icon={<Monitor className="h-5 w-5" />} href="#app-images" />
        <StatCard label={t({ en: "Public pages", ar: "صفحات عامة" })} value={website.pages.length} icon={<ExternalLink className="h-5 w-5" />} tone="warning" href="/website#pages" />
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <ControlPathCard
          title={t({ en: "Change website photo", ar: "تغيير صورة بالموقع" })}
          body={t({ en: "Upload or choose an image, then assign it to the exact slot below.", ar: "ارفع أو اختر صورة، ثم اربطها بالمفتاح المناسب بالأسفل." })}
          href="#site-images"
          icon={<ImageIcon className="h-5 w-5" />}
        />
        <ControlPathCard
          title={t({ en: "Change app screenshots", ar: "تغيير صور التطبيق" })}
          body={t({ en: "Open the app editor. The save button updates the public app page.", ar: "افتح محرر التطبيق. زر الحفظ يحدّث صفحة التطبيق العامة." })}
          href="/moplayer/pro#visual-assets"
          icon={<Tv className="h-5 w-5" />}
        />
        <ControlPathCard
          title={t({ en: "Maintenance / colors", ar: "الصيانة والألوان" })}
          body={t({ en: "Runtime controls are real app config values consumed by app APIs.", ar: "إعدادات التشغيل قيم حقيقية يقرأها API التطبيقات." })}
          href="#remote-config"
          icon={<Power className="h-5 w-5" />}
        />
        <ControlPathCard
          title={t({ en: "Customer notes", ar: "رسائل للعملاء" })}
          body={t({ en: "Use app runtime message, home notification, or support inbox.", ar: "استخدم رسالة التشغيل أو تنبيه الرئيسية أو صندوق الدعم." })}
          href="/moplayer/pro#runtime"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </section>

      <section id="upload" className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <form action={uploadMediaLibraryAction} className="glass fade-up rounded-[24px] p-5" encType="multipart/form-data">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[var(--text-1)]">{t({ en: "Upload image", ar: "رفع صورة" })}</h2>
              <p className="text-xs leading-5 text-[var(--text-3)]">
                {t({ en: "Stored in Supabase Storage and saved as a media asset.", ar: "تُحفظ في Supabase Storage وتسجل كـ media asset." })}
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <label className="field">
              <span>{t({ en: "Image file", ar: "ملف الصورة" })}</span>
              <input name="file" type="file" accept="image/*" required />
            </label>
            <label className="field">
              <span>{t({ en: "Arabic alt text", ar: "وصف الصورة عربي" })}</span>
              <input name="alt_ar" placeholder="صورة صفحة MoPlayer Pro" />
            </label>
            <label className="field">
              <span>{t({ en: "English alt text", ar: "وصف الصورة إنجليزي" })}</span>
              <input name="alt_en" placeholder="MoPlayer Pro page image" />
            </label>
            <label className="field">
              <span>{t({ en: "Tag / folder", ar: "التصنيف / المجلد" })}</span>
              <select name="kind" defaultValue="general">
                <option value="general">general</option>
                <option value="home">home</option>
                <option value="apps">apps</option>
                <option value="apps/moplayer-classic">apps/moplayer-classic</option>
                <option value="apps/moplayer-pro">apps/moplayer-pro</option>
                <option value="apps/moplayer-ios">apps/moplayer-ios</option>
                <option value="projects">projects</option>
                <option value="services">services</option>
                <option value="legal">legal</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary">
              <UploadCloud className="h-4 w-4" />
              {t({ en: "Upload to library", ar: "رفع للمكتبة" })}
            </button>
          </div>
        </form>

        <section className="glass fade-up rounded-[24px] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t({ en: "How images are wired", ar: "كيف الصور مربوطة" })}</p>
              <h2 className="mt-1 text-lg font-black text-[var(--text-1)]">{t({ en: "No-code image workflow", ar: "مسار صور بدون كود" })}</h2>
            </div>
            <Link href="/website#media" className="btn btn-sm">
              <ArrowUpRight className="h-4 w-4 rtl:rotate-[-90deg]" />
              Website CMS
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <WorkflowStep step="1" title={t({ en: "Upload", ar: "ارفع" })} body={t({ en: "Use the form here or any image picker in Website/App pages.", ar: "استخدم النموذج هنا أو أي منتقي صور داخل صفحات الموقع والتطبيقات." })} />
            <WorkflowStep step="2" title={t({ en: "Assign", ar: "اربط" })} body={t({ en: "Choose the exact slot: home hero, app hero, iOS preview, project cover.", ar: "اختر المكان المحدد: هيرو الرئيسية، هيرو التطبيق، صورة iOS، غلاف مشروع." })} />
            <WorkflowStep step="3" title={t({ en: "Preview", ar: "عاين" })} body={t({ en: "Open the live public page after saving to verify the result.", ar: "افتح الصفحة العامة بعد الحفظ للتأكد من النتيجة." })} />
          </div>
          <div className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-4">
            <p className="text-sm font-black text-amber-100">{t({ en: "Delete protection is active", ar: "حماية الحذف مفعلة" })}</p>
            <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">
              {t({
                en: "Images used by pages, settings, projects, services, or app records are blocked from deletion until you replace their usage.",
                ar: "أي صورة مستخدمة في صفحة أو إعداد أو مشروع أو خدمة أو تطبيق لا تُحذف حتى تستبدل استخدامها أولاً.",
              })}
            </p>
          </div>
        </section>
      </section>

      <section id="site-images" className="glass fade-up rounded-[24px] p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">site_images</p>
            <h2 className="mt-1 text-xl font-black text-[var(--text-1)]">{t({ en: "Website image slots", ar: "مفاتيح صور الموقع" })}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-7 text-[var(--text-2)]">
              {t({
                en: "These keys feed the public website. Choose an image from the library or upload a direct replacement in the same card.",
                ar: "هذه المفاتيح تغذي الموقع العام. اختر صورة من المكتبة أو ارفع بديلًا مباشرًا داخل نفس البطاقة.",
              })}
            </p>
          </div>
          <Link href={`${webBaseUrl}/en`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Preview home", ar: "معاينة الرئيسية" })}
          </Link>
        </div>
        <form action={saveMediaSiteImagesAction} className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4" encType="multipart/form-data">
          {SITE_IMAGE_SLOTS.map((slot) => (
            <SiteImageSlotCard key={slot.key} slot={slot} assets={website.mediaAssets} selectedValue={siteImages[slot.controlKey]} locale={locale} />
          ))}
          <div className="xl:col-span-4">
            <button type="submit" className="btn btn-primary">
              <Save className="h-4 w-4" />
              {t({ en: "Save website image slots", ar: "حفظ مفاتيح الصور" })}
            </button>
          </div>
        </form>
      </section>

      <section id="app-images" className="grid gap-4 lg:grid-cols-2">
        {apps.map((app) => (
          <AppImagePanel key={app.key} app={app} t={t} />
        ))}
        <section className="glass fade-up rounded-[24px] p-5 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">moplayer2_public_config.ios</p>
              <h2 className="mt-1 text-xl font-black text-[var(--text-1)]">MoPlayer iOS</h2>
              <p className="mt-1 max-w-3xl text-sm leading-7 text-[var(--text-2)]">
                {t({
                  en: "The iOS page is separate from Android Pro. Its App Store/TestFlight link, activation link, note, and preview image are controlled in one place.",
                  ar: "صفحة iOS منفصلة عن Android Pro. رابط App Store/TestFlight ورابط التفعيل والملاحظة وصورة المعاينة تُدار من مكان واحد.",
                })}
              </p>
            </div>
            <Link href="/moplayer/ios#ios-runtime" className="btn btn-sm btn-primary">
              <Smartphone className="h-4 w-4" />
              {t({ en: "Manage iOS", ar: "إدارة iOS" })}
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-[260px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-black/25">
              <div className="aspect-[4/3]">
                <SafeImage src={ios.heroImageUrl || "/images/moplayer-pro-home.webp"} alt="MoPlayer iOS preview" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <MiniStatus label={t({ en: "Visibility", ar: "الظهور" })} value={ios.enabled === false ? t({ en: "Hidden", ar: "مخفي" }) : t({ en: "Visible", ar: "ظاهر" })} />
              <MiniStatus label={t({ en: "Status", ar: "الحالة" })} value={String(ios.status ?? "coming_soon")} />
              <MiniStatus label={t({ en: "Button", ar: "الزر" })} value={ios.buttonLabel || "App Store soon"} />
              <div className="md:col-span-3 flex flex-wrap gap-2">
                <Link href="/moplayer/ios#ios-images" className="btn btn-sm">
                  <ImageIcon className="h-4 w-4" />
                  {t({ en: "Change iOS image", ar: "تغيير صورة iOS" })}
                </Link>
                <Link href={`${webBaseUrl}/en/apps/moplayer-ios`} target="_blank" className="btn btn-sm">
                  <ExternalLink className="h-4 w-4" />
                  {t({ en: "Preview iOS page", ar: "معاينة صفحة iOS" })}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section id="remote-config" className="glass fade-up rounded-[24px] p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
            <Power className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t({ en: "App Remote Config", ar: "تحكم التطبيقات" })}</p>
            <h2 className="text-xl font-black text-[var(--text-1)]">{t({ en: "Maintenance, colors, messages and widgets", ar: "الصيانة والألوان والرسائل والودجت" })}</h2>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <RemoteConfigCard app={classicApp} t={t} />
          <RemoteConfigCard app={proApp} t={t} />
          <div className="rounded-[22px] border border-[var(--line)] bg-white/[0.02] p-4">
            <p className="text-sm font-black text-[var(--text-1)]">MoPlayer iOS</p>
            <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">
              {t({
                en: "iOS currently controls the public page and activation/store links. Runtime in-app controls are prepared after the iOS app consumes the same config API.",
                ar: "iOS يتحكم حاليًا بالصفحة العامة وروابط المتجر والتفعيل. إعدادات داخل التطبيق تجهز بعد أن يقرأ تطبيق iOS نفس API.",
              })}
            </p>
            <Link href="/moplayer/ios#ios-runtime" className="btn btn-sm mt-3">
              <ArrowUpRight className="h-4 w-4 rtl:rotate-[-90deg]" />
              {t({ en: "Open iOS controls", ar: "فتح تحكم iOS" })}
            </Link>
          </div>
        </div>
      </section>

      <section id="library" className="glass fade-up rounded-[24px] p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">media_assets</p>
            <h2 className="text-xl font-black text-[var(--text-1)]">{t({ en: "All uploaded media", ar: "كل الصور المرفوعة" })}</h2>
          </div>
          <label className="admin-helper-search w-full max-w-md">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t({ en: "Search media...", ar: "ابحث في الصور..." })} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredMedia.map((asset) => (
            <MediaAssetCard key={asset.id} asset={asset} website={website} apps={apps} locale={locale} />
          ))}
          {!filteredMedia.length ? (
            <div className="sm:col-span-2 xl:col-span-4">
              <EmptyState icon={<ImageIcon className="h-5 w-5" />} title={t({ en: "No images found", ar: "لا توجد صور" })} body={t({ en: "Upload a new image or clear the search.", ar: "ارفع صورة جديدة أو ألغ البحث." })} />
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function ControlPathCard({ title, body, href, icon }: { title: string; body: string; href: string; icon: ReactNode }) {
  const { t } = useLocale();
  return (
    <Link href={href} className="group rounded-[22px] border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(99,102,241,0.05))] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span>
        <ArrowUpRight className="h-4 w-4 text-[var(--text-3)] transition group-hover:text-[var(--accent)] rtl:rotate-[-90deg]" />
      </div>
      <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
      <span className="mt-3 inline-flex text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
        {t({ en: "Open", ar: "فتح" })}
      </span>
    </Link>
  );
}

function WorkflowStep({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/[0.025] p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-black text-[var(--accent)]">{step}</span>
      <p className="mt-3 text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </div>
  );
}

function SiteImageSlotCard({
  slot,
  assets,
  selectedValue,
  locale,
}: {
  slot: SiteImageSlot;
  assets: WebsiteMediaAsset[];
  selectedValue?: string;
  locale: "ar" | "en";
}) {
  const selectedAsset = mediaAssetById(assets, selectedValue);
  const resolved = assetPath(assets, selectedValue, slot.fallback);
  const label = locale === "ar" ? slot.labelAr : slot.labelEn;
  const body = locale === "ar" ? slot.bodyAr : slot.bodyEn;

  return (
    <article className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white/[0.02]">
      <div className="aspect-video bg-black/25">
        <SafeImage src={resolved} alt={label} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent)]">{slot.key}</p>
          <h3 className="mt-1 text-sm font-black text-[var(--text-1)]">{label}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-3)]">{body}</p>
        </div>
        <label className="field">
          <span>{locale === "ar" ? "اختر من المكتبة" : "Choose from library"}</span>
          <select name={`${slot.controlKey}_media_id`} defaultValue={selectedAsset?.id ?? ""}>
            <option value="">{locale === "ar" ? "استخدام الصورة الافتراضية" : "Use fallback image"}</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.alt_en || asset.alt_ar || asset.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--accent-soft)] px-3 py-2">
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">{locale === "ar" ? "رفع بديل" : "Upload replacement"}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--text-3)]">{locale === "ar" ? "يربط هذا المفتاح بعد الحفظ." : "This slot changes after save."}</span>
          </span>
          <UploadCloud className="h-4 w-4 text-[var(--accent)]" />
          <input type="file" name={`${slot.controlKey}_file`} accept="image/*" className="sr-only" />
        </label>
        <div className="flex flex-wrap gap-2">
          <Link href={slot.publicHref} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {locale === "ar" ? "معاينة" : "Preview"}
          </Link>
          <CopyButton value={resolved} label={locale === "ar" ? "نسخ الرابط" : "Copy URL"} />
        </div>
      </div>
    </article>
  );
}

function AppImagePanel({ app, t }: { app: AppEntry; t: (value: { en: string; ar: string }) => string }) {
  const { product, screenshots } = app.data;
  const mainImages = [
    { key: `${app.key}.logo`, label: "Logo", src: product.logo_path },
    { key: `${app.key}.hero`, label: "Hero", src: product.hero_image_path },
    { key: `${app.key}.tv_banner`, label: "TV banner", src: product.tv_banner_path },
  ];

  return (
    <section className="glass fade-up rounded-[24px] p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">{app.icon}</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{product.slug}</p>
            <h2 className="text-xl font-black text-[var(--text-1)]">{app.title}</h2>
            <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">
              {t({ en: "Public product images and screenshots are edited in this app page only.", ar: "صور المنتج واللقطات العامة تعدل داخل صفحة هذا التطبيق فقط." })}
            </p>
          </div>
        </div>
        <Link href={`${app.href}#product-content`} className="btn btn-sm btn-primary">
          <Palette className="h-4 w-4" />
          {t({ en: "Edit content/images", ar: "تعديل المحتوى والصور" })}
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {mainImages.map((image) => (
          <ImagePreviewCard key={image.key} title={image.label} src={image.src} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`${app.href}#visual-assets`} className="btn btn-sm">
          <ImageIcon className="h-4 w-4" />
          {screenshots.length} {t({ en: "screenshots", ar: "لقطات" })}
        </Link>
        <Link href={app.publicHref} target="_blank" className="btn btn-sm">
          <ExternalLink className="h-4 w-4" />
          {t({ en: "Preview public page", ar: "معاينة الصفحة العامة" })}
        </Link>
      </div>
    </section>
  );
}

function ImagePreviewCard({ title, src }: { title: string; src?: string | null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/[0.02]">
      <div className="aspect-video bg-black/25">
        <SafeImage src={src || ""} alt={title} className="h-full w-full object-contain p-3" />
      </div>
      <div className="p-3">
        <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
        <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-3)]">{src || "No image set"}</p>
      </div>
    </div>
  );
}

function RemoteConfigCard({ app, t }: { app: AppEntry; t: (value: { en: string; ar: string }) => string }) {
  const runtime = app.data.runtimeConfig;
  return (
    <article className="rounded-[22px] border border-[var(--line)] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--text-1)]">{app.title}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">{runtimeStatus(app.data, t)}</p>
        </div>
        <span className="h-8 w-8 rounded-full border border-[var(--line-strong)]" style={{ background: runtime.accentColor || "var(--accent)" }} />
      </div>
      <div className="mt-3 grid gap-2">
        <MiniStatus label={t({ en: "Maintenance", ar: "الصيانة" })} value={runtime.maintenanceMode ? t({ en: "On", ar: "مفعلة" }) : t({ en: "Off", ar: "مطفي" })} />
        <MiniStatus label={t({ en: "Force update", ar: "تحديث إجباري" })} value={runtime.forceUpdate ? t({ en: "On", ar: "مفعل" }) : t({ en: "Off", ar: "مطفي" })} />
        <MiniStatus label={t({ en: "Customer message", ar: "رسالة العملاء" })} value={runtime.message?.trim() ? t({ en: "Set", ar: "موجودة" }) : t({ en: "Empty", ar: "فارغة" })} />
      </div>
      <Link href={`${app.href}#runtime`} className="btn btn-sm mt-3">
        <Power className="h-4 w-4" />
        {t({ en: "Open runtime", ar: "فتح التشغيل" })}
      </Link>
    </article>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-black/15 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-3)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[var(--text-1)]">{value}</p>
    </div>
  );
}

function MediaAssetCard({
  asset,
  website,
  apps,
  locale,
}: {
  asset: WebsiteMediaAsset;
  website: WebsiteCmsData;
  apps: AppEntry[];
  locale: "ar" | "en";
}) {
  const usage = mediaUsageLabels(asset, website, apps);
  const src = resolveAdminAssetUrl(asset.path);

  return (
    <article className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white/[0.02]">
      <div className="aspect-video bg-black/25">
        <SafeImage src={asset.path} alt={asset.alt_en || asset.id} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-3">
        <div>
          <p className="truncate text-sm font-black text-[var(--text-1)]">{asset.alt_en || asset.alt_ar || asset.id}</p>
          <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-3)]">{asset.id}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="badge">{asset.type || "image"}</span>
          <span className={usage.length ? "badge badge-ok" : "badge"}>{usage.length ? `${usage.length} used` : "unused"}</span>
        </div>
        {usage.length ? (
          <details className="rounded-2xl border border-[var(--line)] bg-black/15 p-3">
            <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
              {locale === "ar" ? "أماكن الاستخدام" : "Usage"}
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {usage.map((item) => (
                <span key={item} className="badge">
                  {item}
                </span>
              ))}
            </div>
          </details>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              if (src) void navigator.clipboard?.writeText(src);
            }}
          >
            <Copy className="h-4 w-4" />
            {locale === "ar" ? "نسخ" : "Copy"}
          </button>
          {usage.length ? (
            <button type="button" className="btn btn-sm btn-danger opacity-60" disabled title={locale === "ar" ? "استبدل الاستخدام قبل الحذف" : "Replace usage before deleting"}>
              <Trash2 className="h-4 w-4" />
              {locale === "ar" ? "محمي" : "Protected"}
            </button>
          ) : (
            <form action={deleteMediaLibraryAction}>
              <input type="hidden" name="id" value={asset.id} />
              <button type="submit" className="btn btn-sm btn-danger">
                <Trash2 className="h-4 w-4" />
                {locale === "ar" ? "حذف" : "Delete"}
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

function mediaUsageLabels(asset: WebsiteMediaAsset, website: WebsiteCmsData, apps: AppEntry[]) {
  const usage = new Set<string>();
  const needles = [asset.id, asset.path].filter(Boolean);

  for (const slot of SITE_IMAGE_SLOTS) {
    const siteImages = setting<Record<string, string>>(website.settings, "site_images", {});
    if (siteImages[slot.controlKey] === asset.id || siteImages[slot.controlKey] === asset.path) usage.add(slot.key);
  }

  for (const service of website.services) {
    if (service.cover_media_id === asset.id) usage.add(`service:${service.id}`);
  }
  for (const project of website.projects) {
    if (project.cover_media_id === asset.id) usage.add(`project:${project.id}`);
  }
  for (const page of website.pages) {
    if (page.seo_image_media_id === asset.id) usage.add(`page-seo:${page.slug}`);
  }
  for (const settingRow of website.settings) {
    const text = JSON.stringify(settingRow.value_json);
    if (needles.some((needle) => text.includes(needle))) usage.add(`setting:${settingRow.key}`);
  }
  for (const app of apps) {
    const productText = JSON.stringify(app.data.product);
    if (needles.some((needle) => productText.includes(needle))) usage.add(`app:${app.key}`);
    for (const shot of app.data.screenshots) {
      const shotText = JSON.stringify(shot);
      if (needles.some((needle) => shotText.includes(needle))) usage.add(`app-shot:${app.key}`);
    }
  }

  return [...usage].slice(0, 12);
}

function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const resolved = resolveAdminAssetUrl(src);
  if (!resolved) return <ImageFallback label={alt} />;
  return <img src={resolved} alt={alt} className={className} onError={(event) => ((event.currentTarget.style.display = "none"))} />;
}

function ImageFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%),rgba(15,23,42,0.72)] p-5 text-center">
      <ImageIcon className="h-7 w-7 text-[var(--accent)]" />
      <p className="text-xs font-black text-[var(--text-1)]">{label}</p>
    </div>
  );
}
