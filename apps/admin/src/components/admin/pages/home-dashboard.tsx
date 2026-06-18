"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Box,
  Bot,
  Gauge,
  ExternalLink,
  Globe,
  Inbox,
  Key,
  Laptop,
  Monitor,
  Radio,
  Smartphone,
  Tv,
} from "lucide-react";

import { useLocale } from "@/components/admin/locale-provider";
import { BarChart, DonutChart, PageHeader, ProgressBar, StatCard } from "@/components/admin/ui";
import type { AdminAppData, AdminHealthStatus } from "@/types/app-ecosystem";
import type { WebsiteCmsData } from "@/lib/website-cms";

const C = {
  accent: "#22d3ee",
  indigo: "#6366f1",
  violet: "#a78bfa",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#fb7185",
  slate: "#64748b",
};

const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");

type AppEntry = { slug: string; name: string; label: string; data: AdminAppData };

export function HomeDashboard({ apps, website, health }: { apps: AppEntry[]; website: WebsiteCmsData; health: AdminHealthStatus }) {
  const { t } = useLocale();

  const allReleases = apps.flatMap((a) => a.data.releases);
  const websiteSegments = [
    { label: t({ en: "Pages", ar: "الصفحات" }), value: website.pages.length, color: C.accent },
    { label: t({ en: "Services", ar: "الخدمات" }), value: website.services.length, color: C.success },
    { label: t({ en: "Projects", ar: "المشاريع" }), value: website.projects.length, color: C.violet },
    { label: t({ en: "Images", ar: "الصور" }), value: website.mediaAssets.length, color: C.warning },
  ];

  const releasesPerApp = apps.map((a) => ({ label: a.name, value: a.data.releases.length }));

  const downloadRaw = website.settings.find((s) => s.key === "download_counts")?.value_json as
    | { counts?: Record<string, number>; total?: number; since?: string }
    | undefined;
  const downloadCounts = downloadRaw?.counts && typeof downloadRaw.counts === "object" ? downloadRaw.counts : {};
  const downloadTotal = Number(downloadRaw?.total) || 0;
  const downloadSince = typeof downloadRaw?.since === "string" ? downloadRaw.since : null;
  const downloadRows = [
    { label: "MoPlayer Classic", value: Number(downloadCounts["moplayer"]) || 0 },
    { label: "MoPlayer Pro", value: Number(downloadCounts["moplayer2"]) || 0 },
    { label: "MoPlayer PC", value: Number(downloadCounts["moplayer2:windows"]) || 0 },
  ];

  return (
    <>
      <PageHeader
        eyebrow={health.supabase && health.storage ? t({ en: "Control center ready", ar: "مركز التحكم جاهز" }) : t({ en: "Checks need review", ar: "توجد فحوصات تحتاج مراجعة" })}
        title={t({ en: "Control Dashboard", ar: "لوحة التحكم" })}
        subtitle={t({
          en: "A mobile-ready admin app for the website, MoPlayer Classic, MoPlayer Pro, MoPlayer iOS, MoPlayer PC, AI, and automation health. Each product is its own section so no setting jumps into another product.",
          ar: "تطبيق إدارة جاهز للهاتف للموقع وMoPlayer Classic وMoPlayer Pro وMoPlayer PC والـ AI وصحة الأتمتة. كل منتج له قسمه المستقل حتى لا تدخل إعدادات تطبيق في تطبيق آخر.",
        })}
        icon={<Activity className="h-7 w-7" />}
        actions={
          <Link href={`${webBaseUrl}`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Open live site", ar: "فتح الموقع" })}
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <GuideTile
          title={t({ en: "Website is separate", ar: "الموقع منفصل" })}
          body={t({
            en: "Change public text, images, pages, SEO, colors, services, projects, and visitor messages only from Website.",
            ar: "غيّر نصوص الموقع وصوره وصفحاته وSEO والألوان والخدمات والمشاريع ورسائل الزوار فقط من قسم الموقع.",
          })}
        />
        <GuideTile
          title="MoPlayer Classic"
          body={t({
            en: "Android app only (slug moplayer): releases, activation, devices, sources, maintenance, and support.",
            ar: "تطبيق أندرويد فقط (slug moplayer): الإصدارات والتفعيل والأجهزة والمصادر والصيانة والدعم.",
          })}
        />
        <GuideTile
          title="MoPlayer Pro"
          body={t({
            en: "Android/TV app only: slug stays moplayer2 for URLs, APIs, devices, releases, colors, and maintenance.",
            ar: "تطبيق أندرويد/تلفاز فقط: يبقى slug باسم moplayer2 للروابط والـ API والأجهزة والإصدارات والألوان والصيانة.",
          })}
        />
        <GuideTile
          title="MoPlayer iOS"
          body={t({
            en: "iPhone public page only: App Store/TestFlight link, activation link, status, note, and preview image.",
            ar: "صفحة iPhone فقط: رابط App Store/TestFlight، رابط التفعيل، الحالة، الملاحظة، وصورة المعاينة.",
          })}
        />
        <GuideTile
          title="MoPlayer PC"
          body={t({
            en: "Windows desktop app only: version, installer and portable downloads, system requirements, and maintenance.",
            ar: "تطبيق ويندوز للكمبيوتر فقط: الإصدار، روابط المثبت والنسخة المحمولة، متطلبات النظام، والصيانة.",
          })}
        />
        <GuideTile
          title={t({ en: "AI assistant", ar: "المساعد الذكي" })}
          body={t({
            en: "Explains site/app flows, health checks, and temporary events. It does not control private settings by itself.",
            ar: "يشرح مسارات الموقع والتطبيقات والفحوصات والأحداث المؤقتة. لا يغير الإعدادات الخاصة من تلقاء نفسه.",
          })}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionTile
          href="/website#brand"
          icon={<Globe className="h-5 w-5" />}
          title={t({ en: "Edit the website", ar: "عدّل الموقع" })}
          body={t({ en: "Images, colors, SEO, pages, services, projects, and messages.", ar: "الصور والألوان وSEO والصفحات والخدمات والمشاريع والرسائل." })}
        />
        <ActionTile
          href="/website#offers"
          icon={<Inbox className="h-5 w-5" />}
          title={t({ en: "Website offers", ar: "عروض الموقع" })}
          body={t({ en: "Create a banner, card, or strip and choose where it appears.", ar: "أنشئ بانر أو بطاقة أو شريط واختر أين يظهر." })}
        />
        <ActionTile
          href="/ai"
          icon={<Bot className="h-5 w-5" />}
          title={t({ en: "AI & automation", ar: "AI والأتمتة" })}
          body={t({ en: "Understand assistant messages, app assistant, n8n, and route health.", ar: "افهم رسائل المساعد ومساعد التطبيق وn8n وصحة المسارات." })}
        />
        <ActionTile
          href="/moplayer/classic#runtime"
          icon={<Smartphone className="h-5 w-5" />}
          title="MoPlayer Classic"
          body={t({ en: "Android app: runtime, releases, images, and public page.", ar: "تطبيق أندرويد: التشغيل، الإصدارات، الصور، وصفحة الموقع." })}
        />
        <ActionTile
          href="/moplayer/pro#runtime"
          icon={<Tv className="h-5 w-5" />}
          title="MoPlayer Pro"
          body={t({ en: "Android/TV app: runtime, releases, images, and public page.", ar: "تطبيق أندرويد/تلفاز: التشغيل، الإصدارات، الصور، وصفحة الموقع." })}
        />
        <ActionTile
          href="/moplayer/ios#ios-runtime"
          icon={<Laptop className="h-5 w-5" />}
          title="MoPlayer iOS"
          body={t({ en: "iPhone page: store button, activation link, status, note, and public image.", ar: "صفحة iPhone: زر المتجر، رابط التفعيل، الحالة، الملاحظة، والصورة العامة." })}
        />
        <ActionTile
          href="/moplayer/pc"
          icon={<Monitor className="h-5 w-5" />}
          title="MoPlayer PC"
          body={t({ en: "Windows app: version, downloads, requirements, and maintenance.", ar: "تطبيق ويندوز: الإصدار، روابط التحميل، المتطلبات، والصيانة." })}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t({ en: "Website images", ar: "صور الموقع" })} value={website.mediaAssets.length} icon={<Globe className="h-5 w-5" />} hint={t({ en: "Media library", ar: "مكتبة الصور" })} />
        <StatCard label={t({ en: "Visible services", ar: "خدمات ظاهرة" })} value={website.services.filter((item) => item.is_active).length} icon={<Gauge className="h-5 w-5" />} tone="success" hint={t({ en: "Website", ar: "الموقع" })} />
        <StatCard label={t({ en: "Published pages", ar: "صفحات منشورة" })} value={website.pages.filter((item) => item.status === "published").length} icon={<Key className="h-5 w-5" />} tone="warning" hint="SEO" />
        <StatCard label={t({ en: "Releases", ar: "الإصدارات" })} value={allReleases.length} icon={<Box className="h-5 w-5" />} tone="violet" hint={t({ en: "Classic + Pro", ar: "كلاسيك + برو" })} />
        <StatCard label={t({ en: "App images", ar: "صور التطبيقات" })} value={apps.reduce((sum, app) => sum + app.data.screenshots.length, 0)} icon={<Inbox className="h-5 w-5" />} tone="danger" href="/moplayer" />
      </section>

      {/* App downloads counter */}
      <section className="glass fade-up rounded-[22px] p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">{t({ en: "App downloads", ar: "تحميلات التطبيقات" })}</p>
            <h3 className="mt-1 text-lg font-black text-[var(--text-1)]">{t({ en: "Total downloads", ar: "إجمالي التحميلات" })}</h3>
          </div>
          <div className="text-end">
            <p className="tnum text-3xl font-black text-[var(--accent)]">{downloadTotal.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-[var(--text-3)]">
              {downloadSince
                ? `${t({ en: "Since", ar: "منذ" })} ${new Date(downloadSince).toLocaleDateString("en-GB")}`
                : t({ en: "Counting from first download", ar: "يبدأ العدّ من أول تحميل" })}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {downloadRows.map((row) => (
            <div key={row.label} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{row.label}</p>
              <p className="tnum mt-1 text-2xl font-black text-[var(--text-1)]">{row.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-[var(--text-3)]">
          {t({
            en: "Counts each download/update served by the website (Classic + Pro APKs and the PC installer).",
            ar: "يحسب كل تحميل/تحديث يخدمه الموقع (ملفات Classic وPro ومثبّت PC).",
          })}
        </p>
      </section>

      {/* Quick navigation */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <QuickCard
          href="/website"
          icon={<Globe className="h-6 w-6" />}
          title={t({ en: "Website", ar: "الموقع" })}
          body={t({ en: "Content, media, projects, and inbox.", ar: "المحتوى، الصور، المشاريع، والرسائل." })}
          stat={`${website.mediaAssets.length} ${t({ en: "images", ar: "صورة" })} · ${website.messages.length} ${t({ en: "messages", ar: "رسالة" })}`}
        />
        <QuickCard
          href="/moplayer/classic"
          icon={<Smartphone className="h-6 w-6" />}
          title="MoPlayer Classic"
          body={t({ en: "Android app runtime, releases, activations, fleet, sources, and support.", ar: "تطبيق أندرويد: التشغيل، الإصدارات، التفعيل، الأجهزة، المصادر، والدعم." })}
          stat={appRuntimeLabel(apps.find((a) => a.slug === "moplayer")?.data, t)}
        />
        <QuickCard
          href="/moplayer/pro"
          icon={<Tv className="h-6 w-6" />}
          title="MoPlayer Pro"
          body={t({ en: "Android/TV app runtime, colors, releases, activations, fleet, and support.", ar: "تطبيق أندرويد/تلفاز: التشغيل، الألوان، الإصدارات، التفعيل، الأجهزة، والدعم." })}
          stat={appRuntimeLabel(apps.find((a) => a.slug === "moplayer2")?.data, t)}
        />
        <QuickCard
          href="/moplayer/ios"
          icon={<Laptop className="h-6 w-6" />}
          title="MoPlayer iOS"
          body={t({ en: "iPhone public page, store link, activation link, note, and preview image.", ar: "صفحة iPhone العامة، رابط المتجر، رابط التفعيل، الملاحظة، وصورة المعاينة." })}
          stat={t({ en: "App Store ready", ar: "جاهز App Store" })}
        />
        <QuickCard
          href="/moplayer/pc"
          icon={<Monitor className="h-6 w-6" />}
          title="MoPlayer PC"
          body={t({ en: "Windows desktop app: version, installer + portable downloads, and maintenance.", ar: "تطبيق ويندوز للكمبيوتر: الإصدار، روابط المثبت والنسخة المحمولة، والصيانة." })}
          stat={t({ en: "Windows", ar: "ويندوز" })}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <HealthCard label="Supabase" ok={health.supabase} detail={health.websiteDomain} />
        <HealthCard label="Storage" ok={health.storage} detail={health.adminDomain} />
        <HealthCard label="Email" ok={health.smtp} detail={t({ en: "SMTP configured", ar: "إعداد SMTP" })} />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass fade-up rounded-[22px] p-6">
          <h3 className="mb-5 text-sm font-black text-[var(--text-1)]">{t({ en: "Website content", ar: "محتوى الموقع" })}</h3>
          <DonutChart segments={websiteSegments} centerValue={websiteSegments.reduce((sum, item) => sum + item.value, 0)} centerLabel={t({ en: "Items", ar: "عنصر" })} />
        </div>
        <div className="glass fade-up rounded-[22px] p-6">
          <h3 className="mb-5 text-sm font-black text-[var(--text-1)]">{t({ en: "Releases per app", ar: "الإصدارات لكل تطبيق" })}</h3>
          <BarChart data={releasesPerApp} />
        </div>
        <div className="glass fade-up space-y-4 rounded-[22px] p-6">
          <h3 className="text-sm font-black text-[var(--text-1)]">{t({ en: "Measurements", ar: "مقاييس" })}</h3>
          <ProgressBar
            label={t({ en: "Published pages", ar: "الصفحات المنشورة" })}
            value={website.pages.filter((item) => item.status === "published").length}
            total={Math.max(1, website.pages.length)}
            color={C.success}
          />
          <ProgressBar
            label={t({ en: "Visible services", ar: "الخدمات الظاهرة" })}
            value={website.services.filter((item) => item.is_active).length}
            total={Math.max(1, website.services.length)}
            color={C.accent}
          />
          <ProgressBar
            label={t({ en: "Visible projects", ar: "المشاريع الظاهرة" })}
            value={website.projects.filter((item) => item.is_active).length}
            total={Math.max(1, website.projects.length)}
            color={C.warning}
          />
          <ProgressBar
            label={t({ en: "App image coverage", ar: "صور التطبيقات" })}
            value={apps.reduce((sum, app) => sum + app.data.screenshots.length, 0)}
            total={Math.max(1, apps.length * 4)}
            color={C.violet}
          />
        </div>
      </section>

      {/* Per-app runtime strip */}
      <section className="grid gap-3 md:grid-cols-2">
        {apps.map((a) => (
          <Link key={a.slug} href={a.slug === "moplayer2" ? "/moplayer/pro" : "/moplayer/classic"} className="glass fade-up flex items-center gap-4 rounded-[20px] p-5 transition hover:border-[var(--line-strong)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <Radio className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[var(--text-1)]">{a.label}</p>
              <p className="text-xs text-[var(--text-3)]">
                {t({ en: "Latest", ar: "الأحدث" })}: {[...a.data.releases].sort((x, y) => y.version_code - x.version_code)[0]?.version_name ?? "—"} ·{" "}
                {a.data.runtimeConfig.enabled ? t({ en: "Online", ar: "يعمل" }) : t({ en: "Offline", ar: "متوقف" })}
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-[var(--text-3)] rtl:rotate-[-90deg]" />
          </Link>
        ))}
      </section>
    </>
  );
}

function appRuntimeLabel(data: AdminAppData | undefined, t: (p: { en: string; ar: string }) => string) {
  if (!data) return "—";
  if (data.runtimeConfig.maintenanceMode) return t({ en: "Maintenance", ar: "صيانة" });
  return data.runtimeConfig.enabled ? t({ en: "Online", ar: "يعمل" }) : t({ en: "Offline", ar: "متوقف" });
}

function HealthCard({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="glass fade-up rounded-[20px] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black text-[var(--text-1)]">{label}</p>
        <span className={ok ? "badge badge-ok" : "badge badge-danger"}>{ok ? "OK" : "CHECK"}</span>
      </div>
      <p className="truncate text-xs text-[var(--text-3)]">{detail}</p>
    </div>
  );
}

function QuickCard({ href, icon, title, body, stat }: { href: string; icon: React.ReactNode; title: string; body: string; stat: string }) {
  return (
    <Link href={href} className="glass fade-up group rounded-[22px] p-6 transition hover:-translate-y-1 hover:border-[var(--line-strong)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span>
        <ArrowUpRight className="h-5 w-5 text-[var(--text-3)] transition group-hover:text-[var(--accent)] rtl:rotate-[-90deg]" />
      </div>
      <p className="text-lg font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-2)]">{body}</p>
      <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-[var(--accent)]">{stat}</p>
    </Link>
  );
}

function ActionTile({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="group rounded-[22px] border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.09),rgba(99,102,241,0.045))] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span>
        <ArrowUpRight className="h-4 w-4 text-[var(--text-3)] transition group-hover:text-[var(--accent)] rtl:rotate-[-90deg]" />
      </div>
      <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </Link>
  );
}

function GuideTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(99,102,241,0.04))] p-4">
      <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </div>
  );
}
