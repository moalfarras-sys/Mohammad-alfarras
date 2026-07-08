"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Box,
  Bug,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIconLucide,
  Key,
  LayoutGrid,
  Megaphone,
  Search,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  Download,
  Inbox,
} from "lucide-react";

import {
  cleanupStaleActivationsAction,
  deleteFaqAction,
  deleteActivationAction,
  deleteReleaseAction,
  deleteScreenshotAction,
  saveFaqAction,
  saveDeviceLicenseAction,
  saveProductAction,
  saveReleaseAction,
  saveRuntimeConfigAction,
  saveWidgetProviderSettingsAction,
  saveScreenshotAction,
  updateActivationStatusAction,
  updateDeviceStatusAction,
  updateDiagnosticReportStatusAction,
  updateProviderSourceAction,
  updateSupportRequestAction,
} from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";
import { ReplyComposer } from "@/components/admin/reply-composer";
import {
  Accordion,
  BarChart,
  CopyButton,
  EmptyState,
  Field,
  PageHeader,
  SelectField,
  StatCard,
  StatusBadge,
  TextAreaField,
  Toggle,
  HelpTip,
} from "@/components/admin/ui";
import { UpdatedToast } from "@/components/admin/updated-toast";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
import { MediaPicker } from "@/components/admin/media-picker";
import type { WebsiteMediaAsset } from "@/lib/website-cms";
import { cn } from "@/lib/cn";
import type { ManagedAppSlug } from "@moalfarras/shared/app-products";
import type { AdminAppData, AppRuntimeConfig } from "@/types/app-ecosystem";

const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");
const C = { accent: "#22d3ee", success: "#34d399", warning: "#fbbf24", danger: "#fb7185", violet: "#a78bfa", slate: "#64748b" };

type RuntimeExtras = AppRuntimeConfig & {
  widgets: AppRuntimeConfig["widgets"] & { weatherCity?: string; footballMaxMatches?: number };
};

function formatBytes(size?: number | null) {
  if (!size) return "—";
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
function structuredLines(items: Array<{ title: string; body: string }>) {
  return items.map((item) => `${item.title} :: ${item.body}`).join("\n");
}
function simpleLines(items: string[]) {
  return items.join("\n");
}
function runtimeNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : fallback;
}

export function AppControl({ slug, data, updated, mediaAssets = [] }: { slug: ManagedAppSlug; data: AdminAppData; updated?: string; mediaAssets?: WebsiteMediaAsset[] }) {
  const { t } = useLocale();
  const [deviceQuery, setDeviceQuery] = useState("");
  const {
    product,
    faqs,
    screenshots,
    releases,
    supportRequests,
    devices,
    activationRequests,
    licenses,
    providerSources,
    deviceEvents,
    diagnostics,
    runtimeConfig,
    widgetProviderSettings,
    downloadStats,
  } = data;
  const runtime = runtimeConfig as RuntimeExtras;
  const basePath = slug === "moplayer2" ? "/moplayer/pro" : "/moplayer/classic";
  const runtimeBackgroundUrl = runtimeConfig.backgroundUrl ? resolveAdminAssetUrl(runtimeConfig.backgroundUrl) : "";

  const waiting = activationRequests.filter((r) => r.status === "waiting").length;
  const openSupport = supportRequests.filter((r) => r.status === "new").length;
  const openDiagnostics = diagnostics.filter((item) => !["resolved", "archived"].includes(item.status)).length;
  const latestRelease = [...releases].sort((a, b) => b.version_code - a.version_code)[0];
  const downloadHint = downloadStats.since
    ? `${t({ en: "Since", ar: "منذ" })} ${new Date(downloadStats.since).toLocaleDateString("en-GB")}`
    : t({ en: "From first live download", ar: "من أول تحميل مباشر" });

  const filteredDevices = devices.filter((d) => {
    const q = deviceQuery.trim().toLowerCase();
    if (!q) return true;
    return [d.public_device_id, d.name, d.platform, d.device_type, d.app_version, d.status]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const activationLink = (code?: string) => {
    const params = new URLSearchParams({ product: slug });
    if (code) params.set("code", code);
    return `${webBaseUrl}/en/activate?${params.toString()}`;
  };

  return (
    <>
      <UpdatedToast code={updated} />
      <PageHeader
        eyebrow={slug === "moplayer2" ? "moplayer2" : "moplayer"}
        title={product.product_name}
        subtitle={t({
          en: "Everything here is for this app only: runtime, releases, images, public page content, FAQ, and basic app settings.",
          ar: "كل شيء هنا يخص هذا التطبيق فقط: التشغيل، الإصدارات، الصور، محتوى صفحة الموقع، الأسئلة، والإعدادات الأساسية.",
        })}
        icon={slug === "moplayer2" ? <ShieldCheck className="h-7 w-7" /> : <Smartphone className="h-7 w-7" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`${webBaseUrl}/en/apps/${slug}`} target="_blank" className="btn btn-sm">
              <ExternalLink className="h-4 w-4" />
              {t({ en: slug === "moplayer" ? "Product hub" : "Public page", ar: slug === "moplayer" ? "بوابة المنتجات" : "الصفحة العامة" })}
            </Link>
            {slug === "moplayer" ? (
              <Link href={`${webBaseUrl}/en/apps/moplayer`} target="_blank" className="btn btn-sm">
                <ExternalLink className="h-4 w-4" />
                {t({ en: "Classic page", ar: "صفحة Classic" })}
              </Link>
            ) : (
              <Link href={`${webBaseUrl}/api/app/download/latest?product=moplayer2&platform=windows`} target="_blank" className="btn btn-sm">
                <Download className="h-4 w-4" />
                {t({ en: "Windows setup", ar: "مثبت Windows" })}
              </Link>
            )}
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t({ en: "Releases", ar: "إصدارات" })} value={releases.length} icon={<Box className="h-5 w-5" />} tone="violet" href={`${basePath}#releases`} />
        <StatCard label={t({ en: "Downloads", ar: "التحميلات" })} value={downloadStats.value.toLocaleString()} icon={<Download className="h-5 w-5" />} tone="success" hint={downloadHint} />
        <StatCard label={t({ en: "Images", ar: "صور" })} value={screenshots.length} icon={<ImageIconLucide className="h-5 w-5" />} href={`${basePath}#visual-assets`} />
        <StatCard label={t({ en: "FAQ", ar: "أسئلة" })} value={faqs.length} icon={<HelpCircle className="h-5 w-5" />} tone="success" />
        <StatCard label={t({ en: "Runtime", ar: "التشغيل" })} value={runtimeConfig.enabled ? t({ en: "On", ar: "يعمل" }) : t({ en: "Off", ar: "متوقف" })} icon={<SlidersHorizontal className="h-5 w-5" />} tone="warning" href={`${basePath}#runtime`} />
        <StatCard label={t({ en: "Diagnostics", ar: "تشخيص" })} value={openDiagnostics} icon={<Bug className="h-5 w-5" />} tone="warning" href={`${basePath}#telemetry`} />
        <StatCard label={t({ en: "Events", ar: "أحداث" })} value={deviceEvents.length} icon={<Activity className="h-5 w-5" />} tone="violet" href={`${basePath}#telemetry`} />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <AppGuide
          title={t({ en: "This app only", ar: "هذا التطبيق فقط" })}
          body={t({
            en: slug === "moplayer2" ? "Changes here use moplayer2 and do not touch Classic." : "Changes here use moplayer and do not touch Pro.",
            ar: slug === "moplayer2" ? "التعديلات هنا تستخدم moplayer2 ولا تلمس كلاسيك." : "التعديلات هنا تستخدم moplayer ولا تلمس برو.",
          })}
        />
        <AppGuide
          title={t({ en: "Need to change app colors?", ar: "تريد تغيير ألوان التطبيق؟" })}
          body={t({ en: "Open Runtime and change Accent color, logo URL, and background URL.", ar: "افتح إعدادات التشغيل وغيّر اللون المميز ورابط الشعار والخلفية." })}
        />
        <AppGuide
          title={t({ en: "Need to replace page images?", ar: "تريد تبديل صور صفحة التطبيق؟" })}
          body={t({ en: "Open Product content. Logo, hero, TV banner, and gallery images now feed the public website.", ar: "افتح محتوى المنتج. الشعار وصورة البطل وبانر التلفاز وصور المعرض تظهر الآن في الموقع." })}
        />
        <AppGuide
          title={t({ en: "Need a clean setup?", ar: "تريد إعداداً نظيفاً؟" })}
          body={t({ en: "Use only Runtime, Releases, Product content, FAQ, and Visual assets.", ar: "استخدم فقط التشغيل، الإصدارات، المحتوى، الأسئلة، والصور." })}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <ControlHubCard
          href={`${basePath}#runtime`}
          title={t({ en: "1. App running", ar: "1. تشغيل التطبيق" })}
          status={runtimeConfig.maintenanceMode ? t({ en: "Maintenance", ar: "صيانة" }) : runtimeConfig.enabled ? t({ en: "Online", ar: "يعمل" }) : t({ en: "Offline", ar: "متوقف" })}
          body={t({
            en: "Turn the app on/off, maintenance, force update, color, logo, background, weather, and football widgets.",
            ar: "شغّل أو أوقف التطبيق، الصيانة، إجبار التحديث، اللون، الشعار، الخلفية، الطقس، والمباريات.",
          })}
        />
        <ControlHubCard
          href={`${basePath}#releases`}
          title={t({ en: "2. APK releases", ar: "2. إصدارات APK" })}
          status={latestRelease ? `${latestRelease.version_name} · ${latestRelease.version_code}` : t({ en: "No release", ar: "لا إصدار" })}
          body={t({
            en: "Upload the correct APK for this app only. Download links and version checks use these records.",
            ar: "ارفع APK الخاص بهذا التطبيق فقط. روابط التحميل وفحص النسخة تعتمد على هذه السجلات.",
          })}
        />
        <ControlHubCard
          href={`${basePath}#product-content`}
          title={t({ en: "3. Public page", ar: "3. صفحة الموقع" })}
          status={t({ en: "Content", ar: "محتوى" })}
          body={t({
            en: "Edit the title, description, logo, hero image, TV banner, and public copy.",
            ar: "عدّل العنوان، الوصف، الشعار، صورة البطل، بانر التلفاز، والنصوص.",
          })}
        />
        <ControlHubCard
          href={`${basePath}#product-content`}
          title={t({ en: "4. Images and page", ar: "4. الصور والصفحة" })}
          status={`${screenshots.length} ${t({ en: "assets", ar: "صور" })}`}
          body={t({
            en: "Replace logo, hero, TV banner, screenshots, public text, FAQ, and support copy. These affect the public app page.",
            ar: "بدّل الشعار، صورة البطل، بانر التلفاز، اللقطات، النصوص، الأسئلة، والدعم. هذه تظهر في صفحة التطبيق العامة.",
          })}
        />
      </section>

      <section className="glass fade-up rounded-[24px] p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t({ en: "Public image map", ar: "خريطة صور الموقع" })}</p>
            <h2 className="mt-1 text-xl font-black text-[var(--text-1)]">{t({ en: "These are the images users see on the website", ar: "هذه الصور التي يراها المستخدم في الموقع" })}</h2>
            <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">
              {t({
                en: "Change them in Product content, then save. Gallery screenshots are managed in Visual assets.",
                ar: "غيّرها في محتوى المنتج ثم احفظ. صور المعرض تُدار من قسم الصور والمعرض.",
              })}
            </p>
          </div>
          <Link href={`${webBaseUrl}/en/apps/${slug}`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Preview public page", ar: "معاينة الصفحة" })}
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ImageMapCard
            title={t({ en: "Logo", ar: "الشعار" })}
            body={t({ en: "Brand card and app identity.", ar: "بطاقة الهوية وهوية التطبيق." })}
            src={product.logo_path}
          />
          <ImageMapCard
            title={t({ en: "Hero image", ar: "صورة البطل" })}
            body={t({ en: "Main first-screen product visual.", ar: "الصورة الرئيسية في أول شاشة." })}
            src={product.hero_image_path}
          />
          <ImageMapCard
            title={t({ en: "TV banner", ar: "بانر التلفاز" })}
            body={t({ en: "Fallback and TV-style preview.", ar: "احتياطي ومعاينة تلفزيونية." })}
            src={product.tv_banner_path}
          />
        </div>
      </section>

      <Accordion title={t({ en: "Overview", ar: "نظرة عامة" })} description={t({ en: "Simple launch readiness", ar: "جاهزية تشغيل بسيطة" })} icon={<LayoutGrid className="h-5 w-5" />} defaultOpen>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-5 lg:col-span-2">
            <h4 className="mb-4 text-sm font-black text-[var(--text-1)]">{t({ en: "Releases by version code", ar: "الإصدارات حسب الكود" })}</h4>
            <BarChart data={[...releases].sort((a, b) => a.version_code - b.version_code).slice(-8).map((r) => ({ label: r.version_name, value: r.version_code }))} />
          </div>
        </div>
      </Accordion>

      {/* Runtime */}
      <Accordion id="runtime" title={t({ en: "Runtime configuration", ar: "إعدادات التشغيل" })} description={t({ en: "Switches the app reads on sync", ar: "مفاتيح يقرأها التطبيق عند المزامنة" })} icon={<SlidersHorizontal className="h-5 w-5" />} tone="accent" count={runtimeConfig.enabled ? t({ en: "ON", ar: "يعمل" }) : t({ en: "OFF", ar: "متوقف" })} defaultOpen>
        <SectionHelp
          title={t({ en: "What the app reads", ar: "ماذا يقرأ التطبيق؟" })}
          body={t({
            en: "These values are sent by the public app config API. Maintenance and force update are app-level switches, not website switches.",
            ar: "هذه القيم يرسلها API إعدادات التطبيق. الصيانة وإجبار التحديث تخص التطبيق فقط، وليست إعدادات الموقع.",
          })}
        />
        <form action={saveRuntimeConfigAction} className="grid gap-5 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={slug} />
          <div className="grid gap-3 lg:col-span-2 md:grid-cols-2">
            <Toggle name="enabled" label={t({ en: "Master switch", ar: "المفتاح الرئيسي" })} description={t({ en: "When OFF, the app shows an offline message to every user.", ar: "عند الإيقاف يظهر التطبيق رسالة غير متاح لكل المستخدمين." })} checked={runtimeConfig.enabled} />
            <Toggle name="maintenanceMode" label={t({ en: "Maintenance mode", ar: "وضع الصيانة" })} description={t({ en: "Tells users the app is being updated. Keeps installs, hides playback.", ar: "يخبر المستخدمين أن التطبيق قيد التحديث. لا يحذف شيئاً، يخفي التشغيل فقط." })} checked={runtimeConfig.maintenanceMode} />
            <Toggle name="forceUpdate" label={t({ en: "Force update", ar: "إجبار التحديث" })} description={t({ en: "Blocks old versions until users install the latest build.", ar: "يمنع الإصدارات القديمة حتى يثبت المستخدم الإصدار الأحدث." })} checked={runtimeConfig.forceUpdate} />
            <Toggle name="weather" label={t({ en: "Weather widget", ar: "أداة الطقس" })} description={t({ en: "Shows a live weather card on the app home.", ar: "تعرض بطاقة الطقس على الشاشة الرئيسية للتطبيق." })} checked={runtimeConfig.widgets.weather} />
            <Toggle name="football" label={t({ en: "Football widget", ar: "أداة المباريات" })} description={t({ en: "Shows live match results and upcoming fixtures.", ar: "تعرض نتائج المباريات الحية والمواعيد القادمة." })} checked={runtimeConfig.widgets.football} />
            <Toggle name="sourceProtocolFallback" label={t({ en: "Source fallback", ar: "احتياطي المصدر" })} description={t({ en: "If primary source protocol fails, switch automatically. Recommended ON.", ar: "إذا فشل بروتوكول المصدر الأساسي، يتم التحويل تلقائياً. يُفضل تفعيله." })} checked={runtime.sourceProtocolFallback ?? true} />
            <Toggle name="trailerPreviewEnabled" label={t({ en: "Trailer preview", ar: "معاينة الإعلان" })} description={t({ en: "Autoplay a muted trailer in the app preview pane after a few seconds of focus. Provider trailer first, YouTube search fallback.", ar: "تشغيل إعلان صامت في معاينة التطبيق بعد ثوانٍ من التركيز. إعلان المزود أولاً ثم بحث يوتيوب احتياطياً." })} checked={runtime.trailerPreviewEnabled ?? true} />
          </div>

          <Field label={t({ en: "Min version code", ar: "أدنى كود إصدار" })} name="minimumVersionCode" type="number" defaultValue={String(runtimeConfig.minimumVersionCode)} help={t({ en: "The oldest app version allowed to run. Anything older is asked to update.", ar: "أقدم نسخة من التطبيق مسموح لها بالعمل. أي نسخة أقدم سيُطلب منها التحديث." })} />
          <Field label={t({ en: "Latest build name", ar: "اسم أحدث إصدار" })} name="latestVersionName" defaultValue={runtimeConfig.latestVersionName} help={t({ en: "Human-readable version like 2.2.3. Shown to users in update prompts.", ar: "رقم النسخة المقروء مثل 2.2.3. يظهر للمستخدم في طلب التحديث." })} />
          <Field label={t({ en: "Latest version code", ar: "كود أحدث إصدار" })} name="latestVersionCode" type="number" defaultValue={String(runtimeNumber(runtime.latestVersionCode ?? runtime.update?.latestVersionCode, runtimeConfig.minimumVersionCode))} help={t({ en: "Integer that grows each release. The app uses this to compare versions.", ar: "رقم صحيح يكبر مع كل إصدار. يستخدمه التطبيق لمقارنة النسخ." })} />
          <Field label={t({ en: "Downloader code", ar: "رمز Downloader" })} name="downloaderCode" defaultValue={runtime.downloaderCode ?? (slug === "moplayer2" ? "4608937" : "2418397")} placeholder={slug === "moplayer2" ? "4608937" : "2418397"} help={t({ en: "The numeric code shown for installing the APK via Downloader on TVs.", ar: "الرقم الذي يستخدمه المستخدم على تطبيق Downloader للتلفاز." })} />
          <Field label={t({ en: "Sync interval (min)", ar: "فاصل المزامنة (دقيقة)" })} name="syncIntervalMinutes" type="number" defaultValue={String(runtimeNumber(runtime.syncIntervalMinutes, 120))} help={t({ en: "How often the app re-reads this configuration. 120 = every 2 hours.", ar: "كل كم دقيقة يعيد التطبيق قراءة هذه الإعدادات. 120 = كل ساعتين." })} />
          <ColorField label={t({ en: "Accent color", ar: "لون مميز" })} name="accentColor" defaultValue={runtimeConfig.accentColor || "#22d3ee"} />
          <Field label={t({ en: "App name override", ar: "اسم التطبيق" })} name="appName" defaultValue={runtime.appName ?? product.product_name} help={t({ en: "Display name shown inside the app header. Leave empty to use the product name.", ar: "اسم العرض داخل التطبيق. اتركه فارغاً لاستخدام اسم المنتج." })} />
          <Field label={t({ en: "Package name", ar: "اسم الحزمة" })} name="packageName" defaultValue={runtime.packageName ?? product.package_name} help={t({ en: "Android package identifier, e.g. com.mo.moplayer. Do not change unless rebuilding.", ar: "معرّف الحزمة في أندرويد، مثل com.mo.moplayer. لا تغيّره إلا عند إعادة البناء." })} />
          <Field label={t({ en: "Weather city", ar: "مدينة الطقس" })} name="weatherCity" defaultValue={runtime.widgets.weatherCity ?? ""} placeholder="Berlin" help={t({ en: "Default city if the device cannot detect location. English name preferred.", ar: "المدينة الافتراضية إذا تعذّر تحديد الموقع. يُفضل الاسم الإنجليزي." })} />
          <Field label={t({ en: "Football max matches", ar: "أقصى عدد مباريات" })} name="footballMaxMatches" type="number" defaultValue={String(runtimeNumber(runtime.widgets.footballMaxMatches, 8))} />
          <SelectField
            label={t({ en: "Football provider mode", ar: "وضع مزود المباريات" })}
            name="footballProviderMode"
            defaultValue={runtime.footballProviderMode ?? "auto"}
            options={[
              { value: "auto", label: t({ en: "Auto: paid then free", ar: "تلقائي: المدفوع ثم المجاني" }) },
              { value: "paid", label: t({ en: "Paid providers only", ar: "المزودات المدفوعة فقط" }) },
              { value: "free", label: t({ en: "Free provider only", ar: "المجاني فقط" }) },
              { value: "off", label: t({ en: "Off", ar: "إيقاف" }) },
            ]}
          />
          <Field
            label={t({ en: "Priority league IDs", ar: "أرقام البطولات المهمة" })}
            name="footballLeagueIds"
            defaultValue={(runtime.footballLeagueIds ?? []).join(", ")}
            placeholder="39, 140, 135, 78, 61, 1, 15"
          />
          <TextAreaField
            label={t({ en: "Priority league keywords", ar: "كلمات البطولات المهمة" })}
            name="footballLeagueKeywords"
            defaultValue={(runtime.footballLeagueKeywords ?? []).join("\n")}
            placeholder={"world cup\nfifa\nchampions league\npremier\nla liga"}
          />
          <TextAreaField
            label={t({ en: "Small football news message", ar: "رسالة أخبار صغيرة للمباريات" })}
            name="footballNewsMessage"
            defaultValue={runtime.footballNewsMessage ?? ""}
            placeholder={t({ en: "Shown as a short note in supported clients.", ar: "تظهر كملاحظة قصيرة في التطبيقات الداعمة." })}
          />
          <div className="rounded-2xl border border-[var(--line-strong)] bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_45%),rgba(255,255,255,0.03)] p-4 lg:col-span-2">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">{t({ en: "Home campaign", ar: "حملة الشاشة الرئيسية" })}</p>
                <h4 className="mt-1 text-lg font-black text-[var(--text-1)]">{t({ en: "World Cup / announcement overlay", ar: "إعلان كأس العالم / التنبيه العائم" })}</h4>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--text-3)]">
                  {t({
                    en: "MoPlayer Pro already reads this from the config API, so changes here appear after the app syncs runtime settings.",
                    ar: "MoPlayer Pro يقرأ هذه القيم من API الإعدادات، لذلك تظهر التغييرات بعد مزامنة التطبيق.",
                  })}
                </p>
              </div>
              <span className="rounded-full border border-orange-300/25 bg-orange-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200">
                {t({ en: "Pro ready", ar: "جاهز للبرو" })}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label={t({ en: "Notification mode", ar: "وضع التنبيه" })}
                name="homeNotificationMode"
                defaultValue={runtime.homeNotification?.mode ?? "auto"}
                options={[
                  { value: "auto", label: t({ en: "Auto", ar: "تلقائي" }) },
                  { value: "on", label: t({ en: "Always show", ar: "تشغيل دائم" }) },
                  { value: "off", label: t({ en: "Hidden", ar: "إخفاء" }) },
                ]}
              />
              <Field label={t({ en: "Campaign type", ar: "نوع الحملة" })} name="homeNotificationType" defaultValue={runtime.homeNotification?.type ?? "world_cup_2026"} />
              <Field label={t({ en: "Overlay title", ar: "عنوان التنبيه" })} name="homeNotificationTitle" defaultValue={runtime.homeNotification?.title ?? ""} />
              <Field label={t({ en: "Countdown start date", ar: "تاريخ البداية" })} name="homeNotificationStartDate" type="date" defaultValue={runtime.homeNotification?.startDate ?? ""} />
              <TextAreaField label={t({ en: "Overlay message", ar: "نص التنبيه" })} name="homeNotificationMessage" defaultValue={runtime.homeNotification?.message ?? ""} />
              <div className="grid gap-4">
                <Field label={t({ en: "CTA label", ar: "نص الزر" })} name="homeNotificationCtaLabel" defaultValue={runtime.homeNotification?.ctaLabel ?? ""} />
                <Field label={t({ en: "CTA URL", ar: "رابط الزر" })} name="homeNotificationCtaUrl" defaultValue={runtime.homeNotification?.ctaUrl ?? ""} />
              </div>
              <Toggle name="campaignWorldCup" label={t({ en: "World Cup widget", ar: "أداة كأس العالم" })} checked={runtime.campaignWidgets?.worldCup ?? true} />
              <Toggle name="campaignLiveSports" label={t({ en: "Live sports widget", ar: "أداة الرياضة المباشرة" })} checked={runtime.campaignWidgets?.liveSports ?? true} />
              <Toggle name="campaignAnnouncement" label={t({ en: "Announcement widget", ar: "أداة الإعلان" })} checked={runtime.campaignWidgets?.announcement ?? true} />
              <Field label={t({ en: "Promo title", ar: "عنوان العرض" })} name="campaignPromoTitle" defaultValue={runtime.campaignWidgets?.promoTitle ?? ""} />
              <TextAreaField label={t({ en: "Promo message", ar: "نص العرض" })} name="campaignPromoMessage" defaultValue={runtime.campaignWidgets?.promoMessage ?? ""} />
              <Field label={t({ en: "Promo URL", ar: "رابط العرض" })} name="campaignPromoUrl" defaultValue={runtime.campaignWidgets?.promoUrl ?? ""} />
            </div>
          </div>
          {slug === "moplayer2" ? (
            <div className="rounded-2xl border border-orange-300/20 bg-orange-300/[0.045] p-4 lg:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">MoPlayer iOS</p>
                  <h4 className="mt-1 text-base font-black text-[var(--text-1)]">{t({ en: "iOS is managed separately", ar: "iOS صار له تحكم منفصل" })}</h4>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-3)]">
                    {t({
                      en: "Keep this page for Pro Android/TV. Change the iPhone page, store link, activation link, and iOS image from the dedicated iOS control page.",
                      ar: "اترك هذه الصفحة لـ Pro أندرويد/TV. غيّر صفحة iPhone ورابط المتجر والتفعيل وصورة iOS من صفحة تحكم iOS المستقلة.",
                    })}
                  </p>
                </div>
                <Link href="/moplayer/ios" className="btn btn-sm btn-primary">
                  <ExternalLink className="h-4 w-4" />
                  {t({ en: "Open iOS controls", ar: "فتح تحكم iOS" })}
                </Link>
              </div>
            </div>
          ) : null}
          <Toggle
            name="allowFootballFallback"
            label={t({ en: "Allow curated football fallback", ar: "السماح ببديل مباريات منسق" })}
            description={t({ en: "Keep off to avoid fake match data.", ar: "اتركه مغلقاً لمنع بيانات مباريات وهمية." })}
            checked={Boolean(runtime.allowFootballFallback)}
          />
          <Toggle
            name="allowWeatherFallback"
            label={t({ en: "Allow weather fallback preview", ar: "السماح بمعاينة طقس بديلة" })}
            description={t({ en: "Keep off to hide unavailable real weather.", ar: "اتركه مغلقاً لإخفاء الطقس غير الحقيقي." })}
            checked={Boolean(runtime.allowWeatherFallback)}
          />
          <Field label={t({ en: "Weather background mode", ar: "وضع خلفية الطقس" })} name="weatherBackgroundMode" defaultValue={runtime.weatherBackgroundMode ?? "city_daily"} />
          <Field label={t({ en: "Weather background URL", ar: "رابط خلفية الطقس" })} name="weatherBackgroundUrl" defaultValue={runtime.weatherBackgroundUrl ?? ""} />
          <Field label={t({ en: "Support URL", ar: "رابط الدعم" })} name="supportUrl" defaultValue={runtimeConfig.supportUrl} />
          <Field label={t({ en: "Privacy URL", ar: "رابط الخصوصية" })} name="privacyUrl" defaultValue={runtimeConfig.privacyUrl} />
          <Field label={t({ en: "Logo URL", ar: "رابط الشعار" })} name="logoUrl" defaultValue={runtimeConfig.logoUrl} />
          <Field label={t({ en: "Background URL", ar: "رابط الخلفية" })} name="backgroundUrl" defaultValue={runtimeConfig.backgroundUrl} />
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4 lg:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-3)]">{t({ en: "Live visual preview", ar: "معاينة شكل التطبيق" })}</p>
            <div
              className="mt-3 overflow-hidden rounded-3xl border border-[var(--line-strong)] p-5"
              style={{
                background: runtimeBackgroundUrl
                  ? `linear-gradient(135deg, rgba(6,10,24,.84), rgba(15,23,42,.78)), url("${runtimeBackgroundUrl}") center/cover`
                  : `radial-gradient(circle at top, ${runtimeConfig.accentColor || "#22d3ee"}33, transparent 55%), #060a18`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 font-black" style={{ color: runtimeConfig.accentColor || "#22d3ee" }}>
                  {product.product_name.slice(0, 2)}
                </span>
                <div>
                  <p className="text-lg font-black text-white">{runtime.appName ?? product.product_name}</p>
                  <p className="text-xs text-white/60">{runtimeConfig.message || t({ en: "Runtime message preview", ar: "معاينة رسالة التشغيل" })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--accent-soft)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[var(--accent)]" />
              <h4 className="text-sm font-black text-[var(--text-1)]">{t({ en: "In-app broadcast message", ar: "رسالة بث داخل التطبيق" })}</h4>
            </div>
            <TextAreaField label={t({ en: "Message to users", ar: "رسالة للمستخدمين" })} name="message" defaultValue={runtimeConfig.message} placeholder={t({ en: "A new version is ready...", ar: "يتوفر إصدار جديد..." })} />
          </div>

          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            <Field label={t({ en: "Update download URL", ar: "رابط تحميل التحديث" })} name="updateDownloadUrl" defaultValue={runtime.update?.downloadUrl ?? `/api/app/download/latest?product=${slug}`} />
            <Field label={t({ en: "APK size (bytes)", ar: "حجم APK (بايت)" })} name="updateApkSizeBytes" type="number" defaultValue={String(runtimeNumber(runtime.update?.apkSizeBytes, 0))} />
            <Field label={t({ en: "Checksum SHA-256", ar: "بصمة SHA-256" })} name="updateChecksumSha256" defaultValue={runtime.update?.checksumSha256 ?? ""} />
            <TextAreaField label={t({ en: "Update release notes", ar: "ملاحظات التحديث" })} name="updateReleaseNotes" defaultValue={runtime.update?.releaseNotes ?? ""} />
          </div>

          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save & sync runtime", ar: "حفظ ومزامنة" })}</button>
          </div>
        </form>
      </Accordion>

      <Accordion
        id="widget-providers"
        title={t({ en: "Private widget providers", ar: "مزودات الويجت الخاصة" })}
        description={t({ en: "Server-only keys for weather and football. Saved values are never sent to apps.", ar: "مفاتيح خادم فقط للطقس والمباريات. القيم المحفوظة لا تُرسل للتطبيقات." })}
        icon={<Key className="h-5 w-5" />}
        tone="accent"
        count={widgetProviderSettings.sportmonksConfigured || widgetProviderSettings.weatherApiConfigured ? t({ en: "Configured", ar: "مضبوطة" }) : t({ en: "Needs keys", ar: "تحتاج مفاتيح" })}
      >
        <SectionHelp
          title={t({ en: "Safe key rule", ar: "قاعدة المفاتيح الآمنة" })}
          body={t({
            en: "Paste new provider keys only when you want to replace them. Existing secrets are preserved and shown here only as configured/not configured.",
            ar: "الصق المفاتيح الجديدة فقط عند الرغبة باستبدالها. الأسرار الحالية تبقى محفوظة وتظهر هنا كحالة فقط بدون كشفها.",
          })}
        />
        <form action={saveWidgetProviderSettingsAction} className="grid gap-5 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={slug} />
          <div className="grid gap-3 lg:col-span-2 md:grid-cols-4">
            <ProviderStatus label="Weather API" active={widgetProviderSettings.weatherApiConfigured} />
            <ProviderStatus label="SportMonks" active={widgetProviderSettings.sportmonksConfigured} />
            <ProviderStatus label="API-Football" active={widgetProviderSettings.apiFootballConfigured} />
            <ProviderStatus label="RapidAPI Football" active={widgetProviderSettings.rapidApiFootballConfigured} />
          </div>
          <Field label={t({ en: "Weather API key", ar: "مفتاح Weather API" })} name="weatherApiKey" type="password" placeholder={widgetProviderSettings.weatherApiConfigured ? "•••••••• configured" : "Paste new key"} autoComplete="off" />
          <Field label={t({ en: "SportMonks token", ar: "مفتاح SportMonks" })} name="sportmonksToken" type="password" placeholder={widgetProviderSettings.sportmonksConfigured ? "•••••••• configured" : "Paste new token"} autoComplete="off" />
          <Field label={t({ en: "API-Football key", ar: "مفتاح API-Football" })} name="apiFootballKey" type="password" placeholder={widgetProviderSettings.apiFootballConfigured ? "•••••••• configured" : "Paste new key"} autoComplete="off" />
          <Field label={t({ en: "RapidAPI Football key", ar: "مفتاح RapidAPI Football" })} name="rapidApiFootballKey" type="password" placeholder={widgetProviderSettings.rapidApiFootballConfigured ? "•••••••• configured" : "Paste new key"} autoComplete="off" />
          <Field label={t({ en: "Default weather city", ar: "مدينة الطقس الافتراضية" })} name="defaultWeatherCity" defaultValue={widgetProviderSettings.defaultWeatherCity} />
          <Field label={t({ en: "SportMonks results round", ar: "جولة نتائج SportMonks" })} name="sportmonksResultsRoundId" defaultValue={widgetProviderSettings.sportmonksResultsRoundId ?? ""} />
          <Field label={t({ en: "Provider league IDs", ar: "بطولات المزود" })} name="providerFootballLeagueIds" defaultValue={widgetProviderSettings.footballLeagueIds.join(", ")} />
          <Field label={t({ en: "Provider max matches", ar: "أقصى مباريات للمزود" })} name="providerFootballMaxMatches" type="number" defaultValue={String(widgetProviderSettings.footballMaxMatches)} />
          <Field label={t({ en: "Minimum priority", ar: "أقل أولوية" })} name="providerFootballMinPriority" type="number" defaultValue={String(widgetProviderSettings.footballMinPriority)} />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save private provider settings", ar: "حفظ إعدادات المزود الخاصة" })}</button>
          </div>
        </form>
      </Accordion>

      {/* Releases */}
      <Accordion id="releases" title={t({ en: "Releases", ar: "الإصدارات" })} description={t({ en: "Upload and manage APK builds", ar: "رفع وإدارة ملفات APK" })} icon={<UploadCloud className="h-5 w-5" />} count={releases.length}>
        <SectionHelp
          title={t({ en: "Release rule", ar: "قاعدة الإصدارات" })}
          body={t({
            en: "Upload only the APK for this app. Classic and Pro downloads stay separate through product slug and release records.",
            ar: "ارفع APK الخاص بهذا التطبيق فقط. تحميل كلاسيك وبرو يبقى منفصلاً عبر slug وسجل الإصدار.",
          })}
        />
        <form action={saveReleaseAction} className="mb-6 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={slug} />
          <Field label={t({ en: "Release slug", ar: "معرّف الإصدار" })} name="slug" placeholder="moplayer-v2-1-0" required />
          <Field label={t({ en: "Hardware ABI", ar: "معمارية" })} name="abi" defaultValue="universal" required />
          <Field label={t({ en: "Version name", ar: "اسم الإصدار" })} name="version_name" placeholder="2.1.0" required />
          <Field label={t({ en: "Version code", ar: "كود الإصدار" })} name="version_code" type="number" defaultValue="3" required />
          <Field label={t({ en: "Publish time", ar: "وقت النشر" })} name="published_at" type="datetime-local" />
          <label className="switch">
            <span><strong>{t({ en: "Publish now", ar: "نشر الآن" })}</strong></span>
            <input type="checkbox" name="is_published" defaultChecked />
            <i aria-hidden />
          </label>
          <label className="field lg:col-span-2">
            <span>{t({ en: "APK file", ar: "ملف APK" })}</span>
            <input type="file" name="file" accept=".apk" />
          </label>
          <div className="lg:col-span-2">
            <TextAreaField label={t({ en: "Release notes", ar: "ملاحظات الإصدار" })} name="release_notes" required />
          </div>
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Publish release", ar: "نشر الإصدار" })}</button>
          </div>
        </form>

        <div className="space-y-3">
          {releases.map((item) => {
            const primary = item.assets.find((a) => a.is_primary) ?? item.assets[0];
            return (
              <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <StatusBadge status={item.is_published ? "published" : "draft"} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{new Date(item.published_at).toLocaleDateString("en-GB")}</span>
                    </div>
                    <p className="text-lg font-black text-[var(--text-1)]">
                      {item.version_name} <span className="font-mono text-xs text-[var(--text-3)]">({item.slug})</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--text-2)]">{item.release_notes}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge">{primary?.abi || "universal"}</span>
                      <span className="badge">{formatBytes(primary?.file_size_bytes)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`${webBaseUrl}/api/app/releases/${item.slug}/download`} className="btn btn-sm btn-primary">
                      <Download className="h-4 w-4" />
                    </Link>
                    <form action={deleteReleaseAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="product_slug" value={slug} />
                      <button type="submit" className="btn btn-sm btn-danger" aria-label="Delete release">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
          {!releases.length ? <EmptyState icon={<Box className="h-5 w-5" />} title={t({ en: "No releases yet", ar: "لا إصدارات بعد" })} body={t({ en: "Upload a published APK so downloads work.", ar: "ارفع APK منشور حتى يعمل التحميل." })} /> : null}
        </div>
      </Accordion>

      <Accordion id="activations" title={t({ en: "Activation requests", ar: "طلبات التفعيل" })} description={t({ en: "Only waiting/failed requests older than 24 hours are cleaned. Activated records stay until you delete them.", ar: "يتم تنظيف المعلقة/الفاشلة الأقدم من 24 ساعة فقط. السجلات المفعّلة تبقى حتى تحذفها أنت." })} icon={<Key className="h-5 w-5" />} count={waiting}>
        <SectionHelp
          title={t({ en: "No QR needed", ar: "لا تحتاج QR" })}
          body={t({
            en: "Activation is a short code/link flow. Waiting codes expire; activated device history stays visible for review.",
            ar: "التفعيل يعمل بكود أو رابط قصير. الأكواد المعلقة تنتهي، وسجل الأجهزة المفعلة يبقى للمراجعة.",
          })}
          tone="warning"
        />
        <form action={cleanupStaleActivationsAction} className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--warning-soft)] p-4">
          <input type="hidden" name="product_slug" value={slug} />
          <p className="text-sm font-bold text-[var(--text-2)]">
            {t({ en: "Clean waiting/failed activation requests older than 24 hours.", ar: "تنظيف طلبات التفعيل المعلقة أو الفاشلة الأقدم من 24 ساعة." })}
          </p>
          <button type="submit" className="btn btn-sm btn-danger">{t({ en: "Clean stale", ar: "تنظيف القديم" })}</button>
        </form>
        <div className="space-y-3">
          {activationRequests.map((req) => (
            <div key={req.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <StatusBadge status={req.status} />
                    <span className="badge">{req.product_slug ?? slug}</span>
                  </div>
                  <p className="font-mono text-2xl font-black tracking-tight text-[var(--text-1)]">{req.device_code}</p>
                  <p className="mt-1 truncate font-mono text-xs text-[var(--text-3)]">{req.public_device_id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">{t({ en: "Expires", ar: "ينتهي" })}: {new Date(req.expires_at).toLocaleDateString("en-GB")}</span>
                  <CopyButton value={req.device_code} label={t({ en: "Code", ar: "الكود" })} />
                  <CopyButton value={activationLink(req.device_code)} label={t({ en: "Link", ar: "الرابط" })} />
                  <form action={updateActivationStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={req.id} />
                    <input type="hidden" name="product_slug" value={slug} />
                    <select name="status" defaultValue={req.status} className="input h-9 w-auto">
                      <option value="waiting">{t({ en: "waiting", ar: "بانتظار" })}</option>
                      <option value="activated">{t({ en: "activated", ar: "مفعل" })}</option>
                      <option value="expired">{t({ en: "expired", ar: "منتهي" })}</option>
                      <option value="failed">{t({ en: "failed", ar: "فشل" })}</option>
                    </select>
                    <button type="submit" className="btn btn-sm">{t({ en: "Save", ar: "حفظ" })}</button>
                  </form>
                  <form action={deleteActivationAction}>
                    <input type="hidden" name="id" value={req.id} />
                    <input type="hidden" name="product_slug" value={slug} />
                    <button type="submit" className="btn btn-sm btn-danger" aria-label="Delete activation">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {!activationRequests.length ? <EmptyState icon={<Key className="h-5 w-5" />} title={t({ en: "No activation requests", ar: "لا طلبات تفعيل" })} /> : null}
        </div>
      </Accordion>

      <Accordion id="devices" title={t({ en: "Devices & licenses", ar: "الأجهزة والتراخيص" })} description={t({ en: "Search the fleet and review access", ar: "ابحث في الأجهزة وراجع الوصول" })} icon={<Smartphone className="h-5 w-5" />} count={devices.length}>
        <SectionHelp
          title={t({ en: "How to read this", ar: "كيف تقرأ هذا القسم؟" })}
          body={t({
            en: "A device appears when it talks to activation/config flows. Online numbers are based on last seen time, not a permanent live connection.",
            ar: "يظهر الجهاز عندما يتواصل مع التفعيل أو الإعدادات. أرقام الاتصال تعتمد على آخر ظهور، وليست اتصالاً مباشراً دائماً.",
          })}
        />
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-3">
          <Search className="h-4 w-4 text-[var(--accent)]" />
          <input value={deviceQuery} onChange={(e) => setDeviceQuery(e.target.value)} placeholder={t({ en: "Search devices...", ar: "ابحث في الأجهزة..." })} className="h-9 flex-1 bg-transparent text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]" />
          <span className="badge tnum">{filteredDevices.length}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((d) => (
            <div key={d.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <StatusBadge status={d.status} />
                <span className="text-[9px] font-bold text-[var(--text-3)]">{new Date(d.last_seen_at).toLocaleDateString("en-GB")}</span>
              </div>
              <p className="truncate font-mono text-xs font-black text-[var(--text-1)]">{d.public_device_id}</p>
              <div className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3 text-[11px]">
                <Row k={t({ en: "Platform", ar: "النظام" })} v={d.platform} />
                <Row k={t({ en: "Version", ar: "الإصدار" })} v={`v${d.app_version || "—"}`} />
              </div>
              <form action={updateDeviceStatusAction} className="mt-4 flex items-center gap-2">
                <input type="hidden" name="public_device_id" value={d.public_device_id} />
                <input type="hidden" name="product_slug" value={slug} />
                <select name="status" defaultValue={d.status} className="input h-9 min-w-0 flex-1">
                  <option value="pending">{t({ en: "pending", ar: "معلق" })}</option>
                  <option value="active">{t({ en: "active", ar: "نشط" })}</option>
                  <option value="blocked">{t({ en: "blocked", ar: "محظور" })}</option>
                  <option value="revoked">{t({ en: "revoked", ar: "ملغى" })}</option>
                </select>
                <button type="submit" className="btn btn-sm">{t({ en: "Apply", ar: "تطبيق" })}</button>
              </form>
              <form action={saveDeviceLicenseAction} className="mt-3 grid gap-2">
                <input type="hidden" name="public_device_id" value={d.public_device_id} />
                <input type="hidden" name="product_slug" value={slug} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="plan" className="input h-9" placeholder="premium" defaultValue="premium" />
                  <select name="status" defaultValue="active" className="input h-9">
                    <option value="active">{t({ en: "active", ar: "نشط" })}</option>
                    <option value="expired">{t({ en: "expired", ar: "منتهي" })}</option>
                    <option value="revoked">{t({ en: "revoked", ar: "ملغى" })}</option>
                  </select>
                </div>
                <input name="valid_until" className="input h-9" type="datetime-local" />
                <button type="submit" className="btn btn-sm btn-primary">{t({ en: "Save license", ar: "حفظ الترخيص" })}</button>
              </form>
            </div>
          ))}
          {!filteredDevices.length ? <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={<Smartphone className="h-5 w-5" />} title={t({ en: "No matching devices", ar: "لا أجهزة مطابقة" })} /></div> : null}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { label: t({ en: "Active", ar: "نشطة" }), value: licenses.filter((l) => l.status === "active").length, color: C.success },
            { label: t({ en: "Expired", ar: "منتهية" }), value: licenses.filter((l) => l.status === "expired").length, color: C.warning },
            { label: t({ en: "Revoked", ar: "ملغاة" }), value: licenses.filter((l) => l.status === "revoked").length, color: C.danger },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{s.label}</p>
              <p className="tnum mt-1 text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion id="sources" title={t({ en: "Website source delivery", ar: "تسليم مصادر الموقع" })} description={t({ en: "Xtream/M3U source handoff status", ar: "حالة تسليم مصادر Xtream/M3U" })} icon={<UploadCloud className="h-5 w-5" />} count={providerSources.length}>
        <SectionHelp
          title={t({ en: "Source status only", ar: "حالة المصدر فقط" })}
          body={t({
            en: "This screen shows whether a source handoff was received, fetched, imported, failed, or revoked. It does not show private source passwords.",
            ar: "هذه الشاشة تعرض هل وصل المصدر أو تم سحبه أو استيراده أو فشل أو ألغي. لا تعرض كلمات مرور المصادر الخاصة.",
          })}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providerSources.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <StatusBadge status={item.status} />
                <span className="badge">{item.sourceType}</span>
              </div>
              <p className="truncate text-sm font-black text-[var(--text-1)]">{item.displayName || "Source"}</p>
              <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-3)]">{item.publicDeviceId}</p>
              {item.lastTestMessage ? (
                <p className={cn("mt-2 text-[11px] leading-5", item.lastTestStatus === "failed" ? "text-[var(--danger)]" : "text-[var(--success)]")}>{item.lastTestMessage}</p>
              ) : null}
              <form action={updateProviderSourceAction} className="mt-4 flex items-center gap-2">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="product_slug" value={slug} />
                <select name="status" defaultValue={item.status} className="input h-9 min-w-0 flex-1">
                  <option value="pending">{t({ en: "pending", ar: "معلق" })}</option>
                  <option value="fetched">{t({ en: "fetched", ar: "تم السحب" })}</option>
                  <option value="imported">{t({ en: "imported", ar: "تم الاستيراد" })}</option>
                  <option value="failed">{t({ en: "failed", ar: "فشل" })}</option>
                  <option value="revoked">{t({ en: "revoked", ar: "ملغى" })}</option>
                </select>
                <button type="submit" className="btn btn-sm">{t({ en: "Update", ar: "تحديث" })}</button>
              </form>
            </div>
          ))}
          {!providerSources.length ? <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={<UploadCloud className="h-5 w-5" />} title={t({ en: "No sources delivered yet", ar: "لا مصادر مُسلّمة بعد" })} /></div> : null}
        </div>
      </Accordion>

      <Accordion id="telemetry" title={t({ en: "Diagnostics and device events", ar: "التشخيص وأحداث الأجهزة" })} description={t({ en: "Real app reports grouped by this product", ar: "تقارير حقيقية من التطبيق لهذا المنتج" })} icon={<Activity className="h-5 w-5" />} count={openDiagnostics + deviceEvents.length}>
        <SectionHelp
          title={t({ en: "Operational signal", ar: "إشارة تشغيلية" })}
          body={t({
            en: "Diagnostics come from /api/app/diagnostics. Device events come from /api/app/events. They help connect Android behavior to admin decisions without exposing source credentials.",
            ar: "التشخيصات تصل من /api/app/diagnostics، وأحداث الأجهزة من /api/app/events. الهدف ربط سلوك تطبيق Android بقرارات الأدمن بدون كشف بيانات المصادر.",
          })}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{t({ en: "Open diagnostics", ar: "تشخيصات مفتوحة" })}</p>
            <p className="tnum mt-1 text-2xl font-black text-[var(--warning)]">{openDiagnostics}</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{t({ en: "Recent events", ar: "أحداث حديثة" })}</p>
            <p className="tnum mt-1 text-2xl font-black text-[var(--accent)]">{deviceEvents.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{t({ en: "Reported devices", ar: "أجهزة أرسلت تقارير" })}</p>
            <p className="tnum mt-1 text-2xl font-black text-[var(--success)]">{new Set([...diagnostics.map((item) => item.public_device_id), ...deviceEvents.map((item) => item.public_device_id)]).size}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-[var(--warning)]" />
              <h3 className="text-sm font-black text-[var(--text-1)]">{t({ en: "Diagnostic reports", ar: "تقارير التشخيص" })}</h3>
            </div>
            {diagnostics.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="badge">{item.severity}</span>
                      <span className="badge">{item.category}</span>
                      <span className="text-[10px] font-bold text-[var(--text-3)]">{new Date(item.created_at).toLocaleString("en-GB")}</span>
                    </div>
                    <p className="truncate font-mono text-xs font-black text-[var(--text-1)]">{item.public_device_id}</p>
                    <p className="mt-1 text-xs text-[var(--text-3)]">v{item.app_version || "?"}{item.app_version_code ? ` / ${item.app_version_code}` : ""}</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">{item.customer_message}</p>
                    {item.customer_email ? <p className="mt-2 text-xs font-bold text-[var(--accent)]">{item.customer_email}</p> : null}
                  </div>
                  <form action={updateDiagnosticReportStatusAction} className="flex shrink-0 items-center gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="product_slug" value={slug} />
                    <select name="status" defaultValue={item.status} className="input h-9 w-auto">
                      <option value="new">{t({ en: "new", ar: "جديد" })}</option>
                      <option value="reviewing">{t({ en: "reviewing", ar: "قيد المراجعة" })}</option>
                      <option value="resolved">{t({ en: "resolved", ar: "محلول" })}</option>
                      <option value="archived">{t({ en: "archived", ar: "مؤرشف" })}</option>
                    </select>
                    <button type="submit" className="btn btn-sm">{t({ en: "Save", ar: "حفظ" })}</button>
                  </form>
                </div>
              </div>
            ))}
            {!diagnostics.length ? <EmptyState icon={<Bug className="h-5 w-5" />} title={t({ en: "No diagnostic reports", ar: "لا توجد تقارير تشخيص" })} /> : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
              <h3 className="text-sm font-black text-[var(--text-1)]">{t({ en: "Recent device events", ar: "آخر أحداث الأجهزة" })}</h3>
            </div>
            {deviceEvents.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="badge">{item.event_type}</span>
                  <span className="text-[10px] font-bold text-[var(--text-3)]">{new Date(item.created_at).toLocaleString("en-GB")}</span>
                </div>
                <p className="truncate font-mono text-xs font-black text-[var(--text-1)]">{item.public_device_id}</p>
                <p className="mt-1 text-xs text-[var(--text-3)]">v{item.app_version || "?"}</p>
              </div>
            ))}
            {!deviceEvents.length ? <EmptyState icon={<Activity className="h-5 w-5" />} title={t({ en: "No app events yet", ar: "لا توجد أحداث بعد" })} /> : null}
          </div>
        </div>
      </Accordion>

      {/* Content */}
      <Accordion id="product-content" title={t({ en: "Product content", ar: "محتوى المنتج" })} description={t({ en: "Public story, metadata, and steps", ar: "القصة العامة والبيانات والخطوات" })} icon={<FileText className="h-5 w-5" />} defaultOpen>
        <SectionHelp
          title={t({ en: "Public app page", ar: "صفحة التطبيق العامة" })}
          body={t({
            en: "Use this when you want to change what users see on the app page. Logo appears in the small brand card. Hero image is the big first-screen visual. TV banner is used as a fallback and TV preview. Gallery images are managed in Visual assets below. Upload a replacement, save content, then open the public page to check it.",
            ar: "استخدم هذا القسم عندما تريد تغيير ما يراه المستخدم في صفحة التطبيق. الشعار يظهر في بطاقة الهوية الصغيرة. صورة البطل هي الصورة الكبيرة في أول الشاشة. بانر التلفاز يستخدم كصورة احتياطية ومعاينة تلفزيونية. صور المعرض تُدار من قسم الصور بالأسفل. ارفع صورة بديلة، احفظ المحتوى، ثم افتح الصفحة العامة لتتأكد.",
          })}
        />
        <form action={saveProductAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={slug} />
          <Field label={t({ en: "Product name", ar: "اسم المنتج" })} name="product_name" defaultValue={product.product_name} required />
          <Field label={t({ en: "Hero badge", ar: "شارة" })} name="hero_badge" defaultValue={product.hero_badge} />
          <Field label={t({ en: "Package name", ar: "اسم الحزمة" })} name="package_name" defaultValue={product.package_name} required />
          <Field label={t({ en: "Download label", ar: "نص التحميل" })} name="default_download_label" defaultValue={product.default_download_label} />
          <Field label={t({ en: "Support email", ar: "بريد الدعم" })} name="support_email" defaultValue={product.support_email} />
          <Field label={t({ en: "Support WhatsApp", ar: "واتساب الدعم" })} name="support_whatsapp" defaultValue={product.support_whatsapp} />
          <Field label={t({ en: "Support URL", ar: "رابط الدعم" })} name="support_url" defaultValue={product.support_url ?? ""} />
          <Field label={t({ en: "Privacy path", ar: "مسار الخصوصية" })} name="privacy_path" defaultValue={product.privacy_path} />
          <Field label={t({ en: "Play Store URL", ar: "رابط المتجر" })} name="play_store_url" defaultValue={product.play_store_url ?? ""} />
          <Field label={t({ en: "Min SDK", ar: "أدنى SDK" })} name="android_min_sdk" type="number" defaultValue={String(product.android_min_sdk)} />
          <Field label={t({ en: "Target SDK", ar: "SDK المستهدف" })} name="android_target_sdk" type="number" defaultValue={String(product.android_target_sdk)} />
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
            <ProductImageField label={t({ en: "Logo image", ar: "صورة الشعار" })} hint={t({ en: "Shown in the public hero brand card and app identity.", ar: "تظهر في بطاقة الهوية أعلى صفحة التطبيق." })} pathName="logo_path" fileName="logo_file" defaultValue={product.logo_path ?? ""} assets={mediaAssets} />
            <ProductImageField label={t({ en: "Hero image", ar: "صورة البطل" })} hint={t({ en: "Main image on the first screen of the public app page.", ar: "الصورة الرئيسية في أول شاشة من صفحة التطبيق." })} pathName="hero_image_path" fileName="hero_file" defaultValue={product.hero_image_path ?? ""} assets={mediaAssets} />
            <ProductImageField label={t({ en: "TV banner", ar: "بانر التلفاز" })} hint={t({ en: "Fallback hero/banner image and TV preview image.", ar: "صورة احتياطية للواجهة وبانر التلفاز." })} pathName="tv_banner_path" fileName="tv_banner_file" defaultValue={product.tv_banner_path ?? ""} assets={mediaAssets} />
          </div>
          <label className="switch">
            <span><strong>{t({ en: "Android TV ready", ar: "جاهز للتلفاز" })}</strong></span>
            <input type="checkbox" name="android_tv_ready" defaultChecked={product.android_tv_ready} />
            <i aria-hidden />
          </label>
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            <TextAreaField label={t({ en: "Tagline", ar: "الشعار النصي" })} name="tagline" defaultValue={product.tagline} />
            <TextAreaField label={t({ en: "Short description", ar: "وصف قصير" })} name="short_description" defaultValue={product.short_description} />
            <TextAreaField label={t({ en: "Long description", ar: "وصف طويل" })} name="long_description" defaultValue={product.long_description} />
            <TextAreaField label={t({ en: "Changelog intro", ar: "مقدمة سجل التغييرات" })} name="changelog_intro" defaultValue={product.changelog_intro} />
            <TextAreaField label={t({ en: "Feature highlights (Title :: Body)", ar: "المزايا (عنوان :: نص)" })} name="feature_highlights" defaultValue={structuredLines(product.feature_highlights)} />
            <TextAreaField label={t({ en: "How it works (Title :: Body)", ar: "كيف يعمل (عنوان :: نص)" })} name="how_it_works" defaultValue={structuredLines(product.how_it_works)} />
            <TextAreaField label={t({ en: "Install steps (Title :: Body)", ar: "خطوات التثبيت (عنوان :: نص)" })} name="install_steps" defaultValue={structuredLines(product.install_steps)} />
            <TextAreaField label={t({ en: "Compatibility notes (one per line)", ar: "ملاحظات التوافق (سطر لكل)" })} name="compatibility_notes" defaultValue={simpleLines(product.compatibility_notes)} />
            <TextAreaField label={t({ en: "Legal notes (one per line)", ar: "ملاحظات قانونية (سطر لكل)" })} name="legal_notes" defaultValue={simpleLines(product.legal_notes)} />
          </div>
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save content", ar: "حفظ المحتوى" })}</button>
          </div>
        </form>
      </Accordion>

      {/* FAQ */}
      <Accordion title={t({ en: "FAQ manager", ar: "إدارة الأسئلة" })} description={t({ en: "Questions shown on the public page", ar: "الأسئلة الظاهرة على الصفحة العامة" })} icon={<HelpCircle className="h-5 w-5" />} count={faqs.length}>
        <form action={saveFaqAction} className="mb-6 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={slug} />
          <Field label={t({ en: "Existing ID (optional)", ar: "المعرّف (اختياري)" })} name="id" />
          <Field label={t({ en: "Order", ar: "الترتيب" })} name="sort_order" type="number" defaultValue={String(faqs.length + 1)} />
          <Field label={t({ en: "Question", ar: "السؤال" })} name="question" required />
          <Field label={t({ en: "Answer", ar: "الجواب" })} name="answer" required />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Save FAQ", ar: "حفظ السؤال" })}</button>
          </div>
        </form>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div key={faq.id} className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-black text-[var(--text-1)]">{faq.question}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-2)]">{faq.answer}</p>
              </div>
              <form action={deleteFaqAction}>
                <input type="hidden" name="id" value={faq.id} />
                <input type="hidden" name="product_slug" value={slug} />
                <button type="submit" className="btn btn-sm btn-danger" aria-label="Delete FAQ">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))}
          {!faqs.length ? <EmptyState icon={<HelpCircle className="h-5 w-5" />} title={t({ en: "No FAQ yet", ar: "لا أسئلة بعد" })} /> : null}
        </div>
      </Accordion>

      {/* Visual assets */}
      <Accordion id="visual-assets" title={t({ en: "Visual assets", ar: "الصور والمعرض" })} description={t({ en: "Screenshots, TV banners, gallery", ar: "لقطات، بانرات، معرض" })} icon={<ImageIconLucide className="h-5 w-5" />} count={screenshots.length} defaultOpen>
        <SectionHelp
          title={t({ en: "Add a new gallery section", ar: "إضافة قسم جديد مع صورة" })}
          body={t({
            en: "No path is needed. Add a title, choose phone/TV/landscape, upload the image, and save. Existing images can be replaced directly below.",
            ar: "لا تحتاج لمس أي مسار. اكتب عنواناً، اختر نوع العرض، ارفع الصورة، واحفظ. الصور الموجودة يمكن استبدالها مباشرة من الأسفل.",
          })}
        />
        <form action={saveScreenshotAction} className="mb-6 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={slug} />
          <Field label={t({ en: "Asset title", ar: "عنوان الصورة" })} name="title" required />
          <Field label={t({ en: "Order", ar: "الترتيب" })} name="sort_order" type="number" defaultValue="1" required />
          <label className="field">
            <span>{t({ en: "Device frame", ar: "إطار الجهاز" })}</span>
            <select name="device_frame">
              <option value="phone">phone</option>
              <option value="tv">tv</option>
              <option value="landscape">landscape</option>
            </select>
          </label>
          <details className="rounded-2xl border border-[var(--line)] bg-black/15 p-3">
            <summary className="cursor-pointer text-xs font-black text-[var(--accent)]">{t({ en: "Advanced path only if needed", ar: "مسار متقدم عند الحاجة فقط" })}</summary>
            <div className="mt-3">
              <Field label={t({ en: "Public path override", ar: "مسار عام (اختياري)" })} name="image_path" placeholder="/images/..." />
            </div>
          </details>
          <label className="field lg:col-span-2">
            <span>{t({ en: "Upload image", ar: "رفع صورة" })}</span>
            <input type="file" name="file" accept="image/*" />
          </label>
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">{t({ en: "Upload asset", ar: "رفع الصورة" })}</button>
          </div>
        </form>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {screenshots.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/[0.02]">
              <div className="relative aspect-video">
                <SafeImage src={item.image_path} alt={item.title} className="h-full w-full object-cover" />
                <span className="absolute top-2 start-2 badge">{item.device_frame}</span>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-black text-[var(--text-1)]">{item.title}</p>
                  <form action={deleteScreenshotAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="product_slug" value={slug} />
                    <button type="submit" className="text-[var(--danger)] opacity-70 transition hover:opacity-100" aria-label="Delete asset">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                <form action={saveScreenshotAction} className="grid gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="product_slug" value={slug} />
                  <input type="hidden" name="title" value={item.title} />
                  <input type="hidden" name="sort_order" value={String(item.sort_order)} />
                  <input type="hidden" name="device_frame" value={item.device_frame} />
                  <input type="hidden" name="image_path" value={item.image_path} />
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--accent-soft)] px-3 py-2">
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">{t({ en: "Replace this image", ar: "استبدال هذه الصورة" })}</span>
                      <span className="mt-0.5 block text-[10px] text-[var(--text-3)]">{t({ en: "Choose file, then save.", ar: "اختر ملفاً ثم احفظ." })}</span>
                    </span>
                    <UploadCloud className="h-4 w-4 text-[var(--accent)]" />
                    <input type="file" name="file" accept="image/*" className="sr-only" />
                  </label>
                  <button type="submit" className="btn btn-sm btn-primary">{t({ en: "Save replacement", ar: "حفظ الاستبدال" })}</button>
                </form>
              </div>
            </div>
          ))}
          {!screenshots.length ? <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={<ImageIconLucide className="h-5 w-5" />} title={t({ en: "No visual assets", ar: "لا صور بعد" })} /></div> : null}
        </div>
      </Accordion>

      <Accordion id="support-inbox" title={t({ en: "Support inbox", ar: "صندوق الدعم" })} description={t({ en: "User requests — reply and resolve", ar: "طلبات المستخدمين — رد وحل" })} icon={<Inbox className="h-5 w-5" />} count={openSupport}>
        <div className="space-y-3">
          {supportRequests.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{new Date(item.created_at).toLocaleString("en-GB")}</span>
                  </div>
                  <p className="text-base font-black text-[var(--text-1)]">{item.name}</p>
                  <p className="text-xs font-bold text-[var(--accent)]">{item.email}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">{item.message}</p>
                </div>
                <form action={updateSupportRequestAction} className="flex shrink-0 items-center gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="product_slug" value={slug} />
                  <select name="status" defaultValue={item.status} className="input h-9 w-auto">
                    <option value="new">{t({ en: "new", ar: "جديد" })}</option>
                    <option value="resolved">{t({ en: "resolved", ar: "محلول" })}</option>
                    <option value="archived">{t({ en: "archived", ar: "مؤرشف" })}</option>
                  </select>
                  <button type="submit" className="btn btn-sm">{t({ en: "Update", ar: "تحديث" })}</button>
                </form>
              </div>
              <ReplyComposer to={item.email} defaultSubject={t({ en: `Re: your ${product.product_name} support request`, ar: `رد على طلب دعم ${product.product_name}` })} redirectTo={basePath} />
            </div>
          ))}
          {!supportRequests.length ? <EmptyState icon={<Inbox className="h-5 w-5" />} title={t({ en: "Inbox zero", ar: "لا طلبات" })} body={t({ en: "Support requests will appear here.", ar: "ستظهر طلبات الدعم هنا." })} /> : null}
        </div>
      </Accordion>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-3)]">{k}</span>
      <span className="font-bold text-[var(--text-2)]">{v}</span>
    </div>
  );
}

function AppGuide({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(99,102,241,0.04))] p-4">
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

function ControlHubCard({ href, title, status, body }: { href: string; title: string; status: string; body: string }) {
  const { t } = useLocale();

  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(99,102,241,0.05))] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
        <span className="badge max-w-[50%] truncate text-[var(--accent)]">{status}</span>
      </div>
      <p className="text-xs leading-6 text-[var(--text-3)]">{body}</p>
      <span className="mt-3 inline-flex text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)] transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
        {t({ en: "Open section", ar: "فتح القسم" })}
      </span>
    </Link>
  );
}

function ImageMapCard({ title, body, src }: { title: string; body: string; src?: string | null }) {
  const imageSrc = src ? resolveAdminAssetUrl(src) : "";

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/[0.02]">
      <div className="aspect-video bg-black/25">
        {imageSrc ? <SafeImage src={imageSrc} alt={title} className="h-full w-full object-contain p-3" /> : <ImagePlaceholder label={title} />}
      </div>
      <div className="p-3">
        <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-3)]">{body}</p>
        <p className="mt-2 truncate font-mono text-[10px] text-[var(--text-3)]">{src || "No image set"}</p>
      </div>
    </div>
  );
}

function ProductImageField({
  label,
  hint,
  pathName,
  fileName,
  defaultValue,
  assets = [],
}: {
  label: string;
  hint: string;
  pathName: string;
  fileName: string;
  defaultValue: string;
  assets?: WebsiteMediaAsset[];
}) {
  const { t } = useLocale();
  const [value, setValue] = useState(defaultValue);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const previewSrc = pendingPreview ?? value;

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPendingPreview(null);
      setPendingName(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingPreview(typeof reader.result === "string" ? reader.result : null);
      setPendingName(file.name);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-2xl border border-[var(--line-strong)] bg-white/[0.02] p-3">
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/25">
        <div className="aspect-video">
          {previewSrc ? (
            pendingPreview ? (
              <img src={pendingPreview} alt={label} className="h-full w-full object-contain p-3" />
            ) : (
              <SafeImage src={previewSrc} alt={label} className="h-full w-full object-contain p-3" />
            )
          ) : (
            <ImagePlaceholder label={label} />
          )}
        </div>
      </div>
      <label className="field mt-3">
        <span>{label}</span>
        <input type="hidden" name={pathName} value={value} />
      </label>
      <p className="mt-2 text-[11px] font-bold leading-5 text-[var(--text-3)]">{hint}</p>
      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-3">
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            {pendingName ? t({ en: "Ready to upload", ar: "جاهزة للرفع" }) : t({ en: "Upload replacement", ar: "رفع بديل" })}
            <HelpTip text={t({ en: "Choose a new image file. It replaces this image after you save content. Then open the public page preview to check it.", ar: "اختر ملف صورة جديد. سيتم استبدال هذه الصورة بعد حفظ المحتوى. بعدها افتح معاينة الصفحة العامة للتأكد." })} />
          </span>
          <span className="mt-1 block truncate text-xs text-[var(--text-3)]">
            {pendingName ? pendingName : t({ en: "Choose a file, then save content.", ar: "اختر ملفاً ثم احفظ المحتوى." })}
          </span>
        </span>
        <UploadCloud className="h-5 w-5 text-[var(--accent)]" />
        <input type="file" name={fileName} accept="image/*" className="sr-only" onChange={handleFile} />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {assets.length ? (
          <MediaPicker
            assets={assets}
            selectedPath={value}
            onSelect={(asset) => {
              setValue(asset.path);
              setPendingPreview(null);
              setPendingName(null);
            }}
          />
        ) : null}
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setPendingPreview(null);
              setPendingName(null);
            }}
            className="btn btn-sm"
          >
            <Trash2 className="h-4 w-4" />
            {t({ en: "Remove image", ar: "حذف الصورة" })}
          </button>
        ) : null}
      </div>
      <details className="mt-3 rounded-2xl border border-[var(--line)] bg-black/15 p-3">
        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
          {t({ en: "Advanced path", ar: "المسار المتقدم" })}
          <HelpTip text={t({ en: "Use only if you already know an image URL or public path.", ar: "استخدمه فقط إذا كنت تعرف رابط الصورة أو مسارها." })} />
        </summary>
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="/images/..." className="input mt-3 font-mono text-xs" />
      </details>
    </div>
  );
}

function ColorField({ label, defaultValue, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [value, setValue] = useState(String(defaultValue ?? "#22d3ee"));

  return (
    <label className="field">
      <span>{label}</span>
      <div className="flex gap-2">
        <input
          {...props}
          type="color"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 w-16 cursor-pointer rounded-xl border border-[var(--line)] bg-transparent p-1"
        />
        <input name={props.name} value={value} onChange={(event) => setValue(event.target.value)} className="input flex-1 font-mono" />
      </div>
    </label>
  );
}

function ProviderStatus({ label, active }: { label: string; active: boolean }) {
  const { t } = useLocale();
  return (
    <div className={cn(
      "rounded-2xl border p-4",
      active ? "border-emerald-300/25 bg-emerald-400/10" : "border-amber-300/25 bg-amber-400/10",
    )}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-3)]">{label}</p>
      <p className={cn("mt-1 text-sm font-black", active ? "text-emerald-200" : "text-amber-200")}>
        {active ? t({ en: "Configured", ar: "مضبوط" }) : t({ en: "Missing", ar: "غير موجود" })}
      </p>
    </div>
  );
}

function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const imageSrc = resolveAdminAssetUrl(src);
  const status = useVerifiedImage(imageSrc);

  if (status !== "loaded") {
    return <ImagePlaceholder label={alt} />;
  }

  return <img src={imageSrc} alt={alt} className={className} />;
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%),rgba(15,23,42,0.72)] p-5 text-center">
      <ImageIconLucide className="h-7 w-7 text-[var(--accent)]" />
      <p className="text-xs font-black text-[var(--text-1)]">{label}</p>
    </div>
  );
}

function useVerifiedImage(src: string) {
  const [status, setStatus] = useState<"checking" | "loaded" | "failed">("checking");

  useEffect(() => {
    if (!src) {
      queueMicrotask(() => setStatus("failed"));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setStatus("checking");
    });
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setStatus("loaded");
    };
    probe.onerror = () => {
      if (!cancelled) setStatus("failed");
    };
    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return status;
}
