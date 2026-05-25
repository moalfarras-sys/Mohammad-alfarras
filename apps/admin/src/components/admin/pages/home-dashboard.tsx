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
  MonitorPlay,
  Radio,
  Smartphone,
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

  return (
    <>
      <PageHeader
        eyebrow={health.supabase && health.storage ? t({ en: "Control center ready", ar: "مركز التحكم جاهز" }) : t({ en: "Checks need review", ar: "توجد فحوصات تحتاج مراجعة" })}
        title={t({ en: "Control Dashboard", ar: "لوحة التحكم" })}
        subtitle={t({
          en: "A mobile-ready admin app for the website, MoPlayer Classic, MoPlayer Pro, AI, and automation health. Each area stays separate so no setting jumps into another product.",
          ar: "تطبيق إدارة جاهز للهاتف للموقع وMoPlayer Classic وMoPlayer Pro والـ AI وصحة الأتمتة. كل قسم منفصل حتى لا تدخل إعدادات تطبيق في تطبيق آخر.",
        })}
        icon={<Activity className="h-7 w-7" />}
        actions={
          <Link href={`${webBaseUrl}`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Open live site", ar: "فتح الموقع" })}
          </Link>
        }
      />

      <section className="grid gap-3 md:grid-cols-4">
        <GuideTile
          title={t({ en: "Website is separate", ar: "الموقع منفصل" })}
          body={t({
            en: "Change public text, images, pages, SEO, colors, services, projects, and visitor messages only from Website.",
            ar: "غيّر نصوص الموقع وصوره وصفحاته وSEO والألوان والخدمات والمشاريع ورسائل الزوار فقط من قسم الموقع.",
          })}
        />
        <GuideTile
          title="MoPlayer"
          body={t({
            en: "Classic app only: releases, activation, devices, sources, maintenance, and support for moplayer.",
            ar: "التطبيق الكلاسيكي فقط: الإصدارات والتفعيل والأجهزة والمصادر والصيانة والدعم الخاص بـ moplayer.",
          })}
        />
        <GuideTile
          title="MoPlayer Pro"
          body={t({
            en: "Pro app only: slug stays moplayer2 for URLs, APIs, devices, releases, colors, and maintenance.",
            ar: "تطبيق برو فقط: يبقى slug باسم moplayer2 للروابط والـ API والأجهزة والإصدارات والألوان والصيانة.",
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

      <section className="grid gap-3 lg:grid-cols-5">
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
          href="/moplayer#runtime"
          icon={<Smartphone className="h-5 w-5" />}
          title="MoPlayer Classic"
          body={t({ en: "Runtime, releases, images, and public page.", ar: "التشغيل، الإصدارات، الصور، وصفحة الموقع." })}
        />
        <ActionTile
          href="/moplayer-pro#runtime"
          icon={<MonitorPlay className="h-5 w-5" />}
          title="MoPlayer Pro"
          body={t({ en: "Runtime, releases, images, and public page.", ar: "التشغيل، الإصدارات، الصور، وصفحة الموقع." })}
        />
        <ActionTile
          href="/ai"
          icon={<Bot className="h-5 w-5" />}
          title={t({ en: "AI & automation", ar: "AI والأتمتة" })}
          body={t({ en: "Understand assistant messages, app assistant, n8n, and route health.", ar: "افهم رسائل المساعد ومساعد التطبيق وn8n وصحة المسارات." })}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t({ en: "Website images", ar: "صور الموقع" })} value={website.mediaAssets.length} icon={<Globe className="h-5 w-5" />} hint={t({ en: "Media library", ar: "مكتبة الصور" })} />
        <StatCard label={t({ en: "Visible services", ar: "خدمات ظاهرة" })} value={website.services.filter((item) => item.is_active).length} icon={<Gauge className="h-5 w-5" />} tone="success" hint={t({ en: "Website", ar: "الموقع" })} />
        <StatCard label={t({ en: "Published pages", ar: "صفحات منشورة" })} value={website.pages.filter((item) => item.status === "published").length} icon={<Key className="h-5 w-5" />} tone="warning" hint="SEO" />
        <StatCard label={t({ en: "Releases", ar: "الإصدارات" })} value={allReleases.length} icon={<Box className="h-5 w-5" />} tone="violet" hint={t({ en: "Classic + Pro", ar: "كلاسيك + برو" })} />
        <StatCard label={t({ en: "App images", ar: "صور التطبيقات" })} value={apps.reduce((sum, app) => sum + app.data.screenshots.length, 0)} icon={<Inbox className="h-5 w-5" />} tone="danger" href="/moplayer-pro#visual-assets" />
      </section>

      {/* Quick navigation */}
      <section className="grid gap-3 md:grid-cols-3">
        <QuickCard
          href="/website"
          icon={<Globe className="h-6 w-6" />}
          title={t({ en: "Website", ar: "الموقع" })}
          body={t({ en: "Content, media, projects, and inbox.", ar: "المحتوى، الصور، المشاريع، والرسائل." })}
          stat={`${website.mediaAssets.length} ${t({ en: "images", ar: "صورة" })} · ${website.messages.length} ${t({ en: "messages", ar: "رسالة" })}`}
        />
        <QuickCard
          href="/moplayer"
          icon={<Smartphone className="h-6 w-6" />}
          title="MoPlayer"
          body={t({ en: "Classic app runtime, releases, activations, fleet, sources, and support.", ar: "تشغيل التطبيق الكلاسيكي، الإصدارات، التفعيل، الأجهزة، المصادر، والدعم." })}
          stat={appRuntimeLabel(apps.find((a) => a.slug === "moplayer")?.data, t)}
        />
        <QuickCard
          href="/moplayer-pro"
          icon={<MonitorPlay className="h-6 w-6" />}
          title="MoPlayer Pro"
          body={t({ en: "Pro app runtime, colors, releases, activations, fleet, and support.", ar: "تشغيل تطبيق برو، الألوان، الإصدارات، التفعيل، الأجهزة، والدعم." })}
          stat={appRuntimeLabel(apps.find((a) => a.slug === "moplayer2")?.data, t)}
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
          <Link key={a.slug} href={a.slug === "moplayer2" ? "/moplayer-pro" : "/moplayer"} className="glass fade-up flex items-center gap-4 rounded-[20px] p-5 transition hover:border-[var(--line-strong)]">
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
