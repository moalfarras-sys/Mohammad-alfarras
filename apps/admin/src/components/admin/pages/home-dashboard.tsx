"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Box,
  ExternalLink,
  Globe,
  Inbox,
  Key,
  MonitorPlay,
  Radio,
  ShieldCheck,
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

  const allDevices = apps.flatMap((a) => a.data.devices);
  const allActivations = apps.flatMap((a) => a.data.activationRequests);
  const allLicenses = apps.flatMap((a) => a.data.licenses);
  const allReleases = apps.flatMap((a) => a.data.releases);
  const openSupport = apps.reduce((sum, a) => sum + a.data.supportRequests.filter((s) => s.status === "new").length, 0);
  const waitingActivations = allActivations.filter((a) => a.status === "waiting").length;
  const activeLicenses = allLicenses.filter((l) => l.status === "active").length;

  const deviceStatusSegments = [
    { label: t({ en: "Active", ar: "نشطة" }), value: allDevices.filter((d) => d.status === "active").length, color: C.success },
    { label: t({ en: "Pending", ar: "معلّقة" }), value: allDevices.filter((d) => d.status === "pending").length, color: C.warning },
    { label: t({ en: "Blocked", ar: "محظورة" }), value: allDevices.filter((d) => d.status === "blocked" || d.status === "revoked").length, color: C.danger },
  ];

  const activationSegments = [
    { label: t({ en: "Waiting", ar: "بالانتظار" }), value: allActivations.filter((a) => a.status === "waiting").length, color: C.warning },
    { label: t({ en: "Activated", ar: "مُفعّلة" }), value: allActivations.filter((a) => a.status === "activated").length, color: C.success },
    { label: t({ en: "Expired", ar: "منتهية" }), value: allActivations.filter((a) => a.status === "expired").length, color: C.slate },
    { label: t({ en: "Failed", ar: "فاشلة" }), value: allActivations.filter((a) => a.status === "failed").length, color: C.danger },
  ];

  const releasesPerApp = apps.map((a) => ({ label: a.name, value: a.data.releases.length }));

  return (
    <>
      <PageHeader
        eyebrow={t({ en: "All systems online", ar: "كل الأنظمة تعمل" })}
        title={t({ en: "Control Dashboard", ar: "لوحة التحكم" })}
        subtitle={t({
          en: "One clear place for your website and both MoPlayer apps: live signals, releases, activations, devices, and messages.",
          ar: "مكان واحد واضح لموقعك وتطبيقَي MoPlayer: مؤشرات حية، إصدارات، تفعيلات، أجهزة، ورسائل.",
        })}
        icon={<Activity className="h-7 w-7" />}
        actions={
          <Link href={`${webBaseUrl}`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Open live site", ar: "فتح الموقع" })}
          </Link>
        }
      />

      {/* Top stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t({ en: "Devices", ar: "الأجهزة" })} value={allDevices.length} icon={<Smartphone className="h-5 w-5" />} href="/moplayer#devices" />
        <StatCard label={t({ en: "Active licenses", ar: "تراخيص نشطة" })} value={activeLicenses} icon={<ShieldCheck className="h-5 w-5" />} tone="success" href="/moplayer#devices" />
        <StatCard label={t({ en: "Pending codes", ar: "أكواد معلّقة" })} value={waitingActivations} icon={<Key className="h-5 w-5" />} tone="warning" href="/moplayer#activations" />
        <StatCard label={t({ en: "Releases", ar: "الإصدارات" })} value={allReleases.length} icon={<Box className="h-5 w-5" />} tone="violet" href="/moplayer#releases" />
        <StatCard label={t({ en: "Open messages", ar: "رسائل مفتوحة" })} value={openSupport + website.messages.length} icon={<Inbox className="h-5 w-5" />} tone="danger" href="/website#messages" />
      </section>

      {/* Quick navigation */}
      <section className="grid gap-3 md:grid-cols-3">
        <QuickCard
          href="/website"
          icon={<Globe className="h-6 w-6" />}
          title={t({ en: "Website", ar: "الموقع" })}
          body={t({ en: "Content, media, projects, and inbox.", ar: "المحتوى، الصور، المشاريع، والرسائل." })}
          stat={`${website.messages.length} ${t({ en: "messages", ar: "رسالة" })}`}
        />
        <QuickCard
          href="/moplayer"
          icon={<Smartphone className="h-6 w-6" />}
          title="MoPlayer"
          body={t({ en: "Runtime, releases, activations, fleet.", ar: "التشغيل، الإصدارات، التفعيل، الأجهزة." })}
          stat={appRuntimeLabel(apps.find((a) => a.slug === "moplayer")?.data, t)}
        />
        <QuickCard
          href="/moplayer-pro"
          icon={<MonitorPlay className="h-6 w-6" />}
          title="MoPlayer Pro"
          body={t({ en: "TV-first player controls and runtime.", ar: "تحكم المشغّل للتلفاز والتشغيل." })}
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
          <h3 className="mb-5 text-sm font-black text-[var(--text-1)]">{t({ en: "Device fleet status", ar: "حالة الأجهزة" })}</h3>
          <DonutChart segments={deviceStatusSegments} centerValue={allDevices.length} centerLabel={t({ en: "Total", ar: "الإجمالي" })} />
        </div>
        <div className="glass fade-up rounded-[22px] p-6">
          <h3 className="mb-5 text-sm font-black text-[var(--text-1)]">{t({ en: "Activation requests", ar: "طلبات التفعيل" })}</h3>
          <DonutChart segments={activationSegments} centerValue={allActivations.length} centerLabel={t({ en: "Total", ar: "الإجمالي" })} />
        </div>
        <div className="glass fade-up rounded-[22px] p-6">
          <h3 className="mb-5 text-sm font-black text-[var(--text-1)]">{t({ en: "Releases per app", ar: "الإصدارات لكل تطبيق" })}</h3>
          <BarChart data={releasesPerApp} />
        </div>
        <div className="glass fade-up space-y-4 rounded-[22px] p-6">
          <h3 className="text-sm font-black text-[var(--text-1)]">{t({ en: "Measurements", ar: "مقاييس" })}</h3>
          <ProgressBar
            label={t({ en: "Active license ratio", ar: "نسبة التراخيص النشطة" })}
            value={activeLicenses}
            total={Math.max(1, allLicenses.length)}
            color={C.success}
          />
          <ProgressBar
            label={t({ en: "Active devices", ar: "الأجهزة النشطة" })}
            value={allDevices.filter((d) => d.status === "active").length}
            total={Math.max(1, allDevices.length)}
            color={C.accent}
          />
          <ProgressBar
            label={t({ en: "Resolved support", ar: "الدعم المُحَلّ" })}
            value={apps.reduce((s, a) => s + a.data.supportRequests.filter((r) => r.status === "resolved").length, 0)}
            total={Math.max(1, apps.reduce((s, a) => s + a.data.supportRequests.length, 0))}
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
