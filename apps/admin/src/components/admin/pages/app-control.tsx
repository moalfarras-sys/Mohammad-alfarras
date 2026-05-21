"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Box,
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
  saveScreenshotAction,
  updateActivationStatusAction,
  updateDeviceStatusAction,
  updateProviderSourceAction,
  updateSupportRequestAction,
} from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";
import { ReplyComposer } from "@/components/admin/reply-composer";
import {
  Accordion,
  BarChart,
  CopyButton,
  DonutChart,
  EmptyState,
  Field,
  PageHeader,
  SelectField,
  StatCard,
  StatusBadge,
  TextAreaField,
  Toggle,
} from "@/components/admin/ui";
import { UpdatedToast } from "@/components/admin/updated-toast";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
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

export function AppControl({ slug, data, updated }: { slug: ManagedAppSlug; data: AdminAppData; updated?: string }) {
  const { t } = useLocale();
  const [deviceQuery, setDeviceQuery] = useState("");
  const { product, faqs, screenshots, releases, supportRequests, devices, activationRequests, licenses, providerSources, runtimeConfig } = data;
  const runtime = runtimeConfig as RuntimeExtras;
  const basePath = slug === "moplayer2" ? "/moplayer-pro" : "/moplayer";

  const waiting = activationRequests.filter((r) => r.status === "waiting").length;
  const openSupport = supportRequests.filter((r) => r.status === "new").length;
  const activeLicenses = licenses.filter((l) => l.status === "active").length;
  const activePercent = devices.length ? Math.round((data.metrics.activeLast24h / devices.length) * 100) : 0;

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

  const deviceSegments = [
    { label: t({ en: "Active", ar: "نشطة" }), value: devices.filter((d) => d.status === "active").length, color: C.success },
    { label: t({ en: "Pending", ar: "معلّقة" }), value: devices.filter((d) => d.status === "pending").length, color: C.warning },
    { label: t({ en: "Blocked", ar: "محظورة" }), value: devices.filter((d) => d.status === "blocked" || d.status === "revoked").length, color: C.danger },
  ];
  const activationSegments = [
    { label: t({ en: "Waiting", ar: "بالانتظار" }), value: activationRequests.filter((a) => a.status === "waiting").length, color: C.warning },
    { label: t({ en: "Activated", ar: "مُفعّلة" }), value: activationRequests.filter((a) => a.status === "activated").length, color: C.success },
    { label: t({ en: "Expired", ar: "منتهية" }), value: activationRequests.filter((a) => a.status === "expired").length, color: C.slate },
    { label: t({ en: "Failed", ar: "فاشلة" }), value: activationRequests.filter((a) => a.status === "failed").length, color: C.danger },
  ];

  return (
    <>
      <UpdatedToast code={updated} />
      <PageHeader
        eyebrow={t({ en: "App ecosystem control", ar: "تحكم منظومة التطبيق" })}
        title={product.product_name}
        subtitle={t({
          en: "Runtime switches, releases, activations, devices, content, and support — all for this app.",
          ar: "مفاتيح التشغيل، الإصدارات، التفعيلات، الأجهزة، المحتوى، والدعم — كلها لهذا التطبيق.",
        })}
        icon={slug === "moplayer2" ? <ShieldCheck className="h-7 w-7" /> : <Smartphone className="h-7 w-7" />}
        actions={
          <Link href={`${webBaseUrl}/en/apps/${slug}`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Public page", ar: "الصفحة العامة" })}
          </Link>
        }
      />

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t({ en: "Devices", ar: "أجهزة" })} value={devices.length} icon={<Smartphone className="h-5 w-5" />} href={`${basePath}#devices`} />
        <StatCard label={t({ en: "Licenses", ar: "تراخيص" })} value={activeLicenses} icon={<ShieldCheck className="h-5 w-5" />} tone="success" href={`${basePath}#devices`} />
        <StatCard label={t({ en: "Waiting", ar: "بانتظار" })} value={waiting} icon={<Key className="h-5 w-5" />} tone="warning" href={`${basePath}#activations`} />
        <StatCard label={t({ en: "Releases", ar: "إصدارات" })} value={releases.length} icon={<Box className="h-5 w-5" />} tone="violet" href={`${basePath}#releases`} />
        <StatCard label={t({ en: "Assets", ar: "صور" })} value={screenshots.length} icon={<ImageIconLucide className="h-5 w-5" />} href={`${basePath}#visual-assets`} />
        <StatCard label={t({ en: "Support", ar: "دعم" })} value={openSupport} icon={<Inbox className="h-5 w-5" />} tone="danger" href={`${basePath}#support-inbox`} />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard label={t({ en: "Active now", ar: "نشط الآن" })} value={data.metrics.activeNow} icon={<Smartphone className="h-5 w-5" />} tone="success" />
        <StatCard label={t({ en: "Active 24h", ar: "نشط 24 ساعة" })} value={`${activePercent}%`} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label={t({ en: "Expired stale", ar: "منتهية قديمة" })} value={data.metrics.expiredWaitingActivations} icon={<Key className="h-5 w-5" />} tone="warning" />
        <StatCard label={t({ en: "Activation success", ar: "نجاح التفعيل" })} value={`${data.metrics.activationSuccessRate}%`} icon={<LayoutGrid className="h-5 w-5" />} tone="violet" />
      </section>

      {/* Overview charts */}
      <Accordion title={t({ en: "Overview", ar: "نظرة عامة" })} description={t({ en: "Live signals for this app", ar: "مؤشرات حية لهذا التطبيق" })} icon={<LayoutGrid className="h-5 w-5" />} defaultOpen>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-5">
            <h4 className="mb-4 text-sm font-black text-[var(--text-1)]">{t({ en: "Devices", ar: "الأجهزة" })}</h4>
            <DonutChart segments={deviceSegments} centerValue={devices.length} centerLabel={t({ en: "Total", ar: "الإجمالي" })} />
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-5">
            <h4 className="mb-4 text-sm font-black text-[var(--text-1)]">{t({ en: "Activations", ar: "التفعيلات" })}</h4>
            <DonutChart segments={activationSegments} centerValue={activationRequests.length} centerLabel={t({ en: "Total", ar: "الإجمالي" })} />
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-5 lg:col-span-2">
            <h4 className="mb-4 text-sm font-black text-[var(--text-1)]">{t({ en: "Releases by version code", ar: "الإصدارات حسب الكود" })}</h4>
            <BarChart data={[...releases].sort((a, b) => a.version_code - b.version_code).slice(-8).map((r) => ({ label: r.version_name, value: r.version_code }))} />
          </div>
        </div>
      </Accordion>

      {/* Runtime */}
      <Accordion id="runtime" title={t({ en: "Runtime configuration", ar: "إعدادات التشغيل" })} description={t({ en: "Switches the app reads on sync", ar: "مفاتيح يقرأها التطبيق عند المزامنة" })} icon={<SlidersHorizontal className="h-5 w-5" />} tone="accent" count={runtimeConfig.enabled ? t({ en: "ON", ar: "يعمل" }) : t({ en: "OFF", ar: "متوقف" })} defaultOpen>
        <form action={saveRuntimeConfigAction} className="grid gap-5 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={slug} />
          <div className="grid gap-3 lg:col-span-2 md:grid-cols-2">
            <Toggle name="enabled" label={t({ en: "Master switch", ar: "المفتاح الرئيسي" })} description={t({ en: "App online for users", ar: "التطبيق متاح للمستخدمين" })} checked={runtimeConfig.enabled} />
            <Toggle name="maintenanceMode" label={t({ en: "Maintenance mode", ar: "وضع الصيانة" })} description={t({ en: "Show downtime state", ar: "إظهار حالة التوقف" })} checked={runtimeConfig.maintenanceMode} />
            <Toggle name="forceUpdate" label={t({ en: "Force update", ar: "إجبار التحديث" })} description={t({ en: "Require newest build", ar: "إلزام أحدث إصدار" })} checked={runtimeConfig.forceUpdate} />
            <Toggle name="weather" label={t({ en: "Weather widget", ar: "أداة الطقس" })} description={t({ en: "Enable weather module", ar: "تفعيل الطقس" })} checked={runtimeConfig.widgets.weather} />
            <Toggle name="football" label={t({ en: "Football widget", ar: "أداة المباريات" })} description={t({ en: "Enable match widgets", ar: "تفعيل المباريات" })} checked={runtimeConfig.widgets.football} />
            <Toggle name="sourceProtocolFallback" label={t({ en: "Source fallback", ar: "احتياطي المصدر" })} description={t({ en: "Protocol fallback for sources", ar: "احتياطي بروتوكول المصادر" })} checked={runtime.sourceProtocolFallback ?? true} />
          </div>

          <Field label={t({ en: "Min version code", ar: "أدنى كود إصدار" })} name="minimumVersionCode" type="number" defaultValue={String(runtimeConfig.minimumVersionCode)} />
          <Field label={t({ en: "Latest build name", ar: "اسم أحدث إصدار" })} name="latestVersionName" defaultValue={runtimeConfig.latestVersionName} />
          <Field label={t({ en: "Latest version code", ar: "كود أحدث إصدار" })} name="latestVersionCode" type="number" defaultValue={String(runtimeNumber(runtime.latestVersionCode ?? runtime.update?.latestVersionCode, runtimeConfig.minimumVersionCode))} />
          <Field label={t({ en: "Downloader code", ar: "رمز Downloader" })} name="downloaderCode" defaultValue={runtime.downloaderCode ?? (slug === "moplayer2" ? "4608937" : "2418397")} placeholder={slug === "moplayer2" ? "4608937" : "2418397"} />
          <Field label={t({ en: "Sync interval (min)", ar: "فاصل المزامنة (دقيقة)" })} name="syncIntervalMinutes" type="number" defaultValue={String(runtimeNumber(runtime.syncIntervalMinutes, 120))} />
          <ColorField label={t({ en: "Accent color", ar: "لون مميز" })} name="accentColor" defaultValue={runtimeConfig.accentColor || "#22d3ee"} />
          <Field label={t({ en: "App name override", ar: "اسم التطبيق" })} name="appName" defaultValue={runtime.appName ?? product.product_name} />
          <Field label={t({ en: "Package name", ar: "اسم الحزمة" })} name="packageName" defaultValue={runtime.packageName ?? product.package_name} />
          <Field label={t({ en: "Weather city", ar: "مدينة الطقس" })} name="weatherCity" defaultValue={runtime.widgets.weatherCity ?? ""} placeholder="Berlin" />
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
                background: runtimeConfig.backgroundUrl
                  ? `linear-gradient(135deg, rgba(6,10,24,.84), rgba(15,23,42,.78)), url(${runtimeConfig.backgroundUrl}) center/cover`
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

      {/* Releases */}
      <Accordion id="releases" title={t({ en: "Releases", ar: "الإصدارات" })} description={t({ en: "Upload and manage APK builds", ar: "رفع وإدارة ملفات APK" })} icon={<UploadCloud className="h-5 w-5" />} count={releases.length}>
        <form action={saveReleaseAction} className="mb-6 grid gap-4 lg:grid-cols-2" encType="multipart/form-data">
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

      {/* Activations */}
      <Accordion id="activations" title={t({ en: "Activation requests", ar: "طلبات التفعيل" })} description={t({ en: "Only waiting/failed requests older than 24 hours are cleaned. Activated records stay until you delete them.", ar: "يتم تنظيف المعلقة/الفاشلة الأقدم من 24 ساعة فقط. السجلات المفعّلة تبقى حتى تحذفها أنت." })} icon={<Key className="h-5 w-5" />} count={waiting}>
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

      {/* Devices + licenses */}
      <Accordion id="devices" title={t({ en: "Devices & licenses", ar: "الأجهزة والتراخيص" })} description={t({ en: "Search the fleet and review access", ar: "ابحث في الأجهزة وراجع الوصول" })} icon={<Smartphone className="h-5 w-5" />} count={devices.length}>
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

      {/* Sources */}
      <Accordion id="sources" title={t({ en: "Website source delivery", ar: "تسليم مصادر الموقع" })} description={t({ en: "Xtream/M3U source handoff status", ar: "حالة تسليم مصادر Xtream/M3U" })} icon={<UploadCloud className="h-5 w-5" />} count={providerSources.length}>
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

      {/* Content */}
      <Accordion title={t({ en: "Product content", ar: "محتوى المنتج" })} description={t({ en: "Public story, metadata, and steps", ar: "القصة العامة والبيانات والخطوات" })} icon={<FileText className="h-5 w-5" />}>
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
          <Field label={t({ en: "Logo path", ar: "مسار الشعار" })} name="logo_path" defaultValue={product.logo_path ?? ""} />
          <Field label={t({ en: "Hero image path", ar: "مسار صورة البطل" })} name="hero_image_path" defaultValue={product.hero_image_path ?? ""} />
          <Field label={t({ en: "TV banner path", ar: "مسار بانر التلفاز" })} name="tv_banner_path" defaultValue={product.tv_banner_path ?? ""} />
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
      <Accordion id="visual-assets" title={t({ en: "Visual assets", ar: "الصور والمعرض" })} description={t({ en: "Screenshots, TV banners, gallery", ar: "لقطات، بانرات، معرض" })} icon={<ImageIconLucide className="h-5 w-5" />} count={screenshots.length}>
        <form action={saveScreenshotAction} className="mb-6 grid gap-4 lg:grid-cols-2" encType="multipart/form-data">
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
          <Field label={t({ en: "Public path override", ar: "مسار عام (اختياري)" })} name="image_path" placeholder="/images/..." />
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
              <div className="flex items-center justify-between p-3">
                <p className="truncate text-xs font-black text-[var(--text-1)]">{item.title}</p>
                <form action={deleteScreenshotAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="product_slug" value={slug} />
                  <button type="submit" className="text-[var(--danger)] opacity-70 transition hover:opacity-100" aria-label="Delete asset">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {!screenshots.length ? <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={<ImageIconLucide className="h-5 w-5" />} title={t({ en: "No visual assets", ar: "لا صور بعد" })} /></div> : null}
        </div>
      </Accordion>

      {/* Support inbox */}
      <Accordion id="support-inbox" title={t({ en: "Support inbox", ar: "صندوق الدعم" })} description={t({ en: "User requests — reply and resolve", ar: "طلبات المستخدمين — رد وحل" })} icon={<Inbox className="h-5 w-5" />} count={openSupport} defaultOpen>
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

function ColorField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [value, setValue] = useState(String(props.defaultValue ?? "#22d3ee"));

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

function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const imageSrc = resolveAdminAssetUrl(src);
  const status = useVerifiedImage(imageSrc);

  if (status !== "loaded") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%),rgba(15,23,42,0.72)] p-5 text-center">
        <ImageIconLucide className="h-7 w-7 text-[var(--accent)]" />
        <p className="text-xs font-black text-[var(--text-1)]">{alt}</p>
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} />;
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
