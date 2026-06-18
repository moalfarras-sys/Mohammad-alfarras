"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  ExternalLink,
  Image as ImageIcon,
  Monitor,
  Settings2,
  Smartphone,
  Tv,
} from "lucide-react";

import { useLocale } from "@/components/admin/locale-provider";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { UpdatedToast } from "@/components/admin/updated-toast";
import type { AdminAppData } from "@/types/app-ecosystem";

const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");

function formatCount(value?: number | null) {
  return Number(value ?? 0).toLocaleString();
}

function runtimeLabel(data: AdminAppData, t: (value: { en: string; ar: string }) => string) {
  if (data.runtimeConfig.maintenanceMode) return t({ en: "Maintenance", ar: "صيانة" });
  return data.runtimeConfig.enabled ? t({ en: "Online", ar: "يعمل" }) : t({ en: "Offline", ar: "متوقف" });
}

export function MoPlayerSuiteControl({
  classic,
  pro,
  updated,
}: {
  classic: AdminAppData;
  pro: AdminAppData;
  updated?: string;
}) {
  const { t } = useLocale();
  const ios = pro.runtimeConfig.ios ?? {};
  const classicRelease = [...classic.releases].sort((a, b) => b.version_code - a.version_code)[0];
  const proRelease = [...pro.releases].sort((a, b) => b.version_code - a.version_code)[0];

  const cards = [
    {
      key: "classic",
      title: "MoPlayer Classic",
      eyebrow: "moplayer",
      href: "/moplayer/classic",
      publicHref: `${webBaseUrl}/en/apps/moplayer/classic`,
      icon: <Smartphone className="h-6 w-6" />,
      status: runtimeLabel(classic, t),
      version: classicRelease?.version_name ?? "—",
      downloads: classic.downloadStats.value,
      imageCount: classic.screenshots.length,
      body: t({
        en: "Android app controls: runtime, releases, screenshots, activation, devices, source handoff, support, and diagnostics.",
        ar: "تحكم تطبيق أندرويد: التشغيل، الإصدارات، الصور، التفعيل، الأجهزة، تسليم المصادر، الدعم، والتشخيص.",
      }),
      accent: "cyan",
    },
    {
      key: "pro",
      title: "MoPlayer Pro",
      eyebrow: "moplayer2",
      href: "/moplayer/pro",
      publicHref: `${webBaseUrl}/en/apps/moplayer2`,
      icon: <Tv className="h-6 w-6" />,
      status: runtimeLabel(pro, t),
      version: proRelease?.version_name ?? "—",
      downloads: pro.downloadStats.value,
      imageCount: pro.screenshots.length,
      body: t({
        en: "Android TV Pro controls only: runtime, releases, product copy, app imagery, widgets, devices, and support.",
        ar: "تحكم MoPlayer Pro فقط: التشغيل، الإصدارات، نص المنتج، صور التطبيق، الويدجت، الأجهزة، والدعم.",
      }),
      accent: "orange",
    },
    {
      key: "ios",
      title: "MoPlayer iOS",
      eyebrow: "ios platform",
      href: "/moplayer/ios",
      publicHref: `${webBaseUrl}/en/apps/moplayer-ios`,
      icon: <BadgeCheck className="h-6 w-6" />,
      status: ios.status === "app_store" ? t({ en: "App Store", ar: "App Store" }) : ios.status === "testflight" ? "TestFlight" : t({ en: "Coming soon", ar: "قريباً" }),
      version: "1.0.0",
      downloads: 0,
      imageCount: ios.heroImageUrl ? 1 : 0,
      body: t({
        en: "Dedicated iPhone page controls: App Store/TestFlight link, activation link, public note, status, and preview image upload.",
        ar: "تحكم صفحة iPhone: رابط App Store/TestFlight، رابط التفعيل، الملاحظة العامة، الحالة، ورفع صورة المعاينة.",
      }),
      accent: "amber",
    },
    {
      key: "pc",
      title: "MoPlayer PC",
      eyebrow: "windows",
      href: "/moplayer/pc",
      publicHref: `${webBaseUrl}/en/apps/moplayer-pc`,
      icon: <Monitor className="h-6 w-6" />,
      status: t({ en: "Desktop", ar: "كمبيوتر" }),
      version: t({ en: "Managed", ar: "مدار" }),
      downloads: 0,
      imageCount: 0,
      body: t({
        en: "Windows app controls: installer, portable build, release copy, system requirements, maintenance, and PC images.",
        ar: "تحكم Windows: المثبت، النسخة المحمولة، نص الإصدار، المتطلبات، الصيانة، وصور الكمبيوتر.",
      }),
      accent: "slate",
    },
  ];

  return (
    <>
      <UpdatedToast code={updated} />
      <PageHeader
        eyebrow="MoPlayer Suite"
        title={t({ en: "MoPlayer Apps Control", ar: "إدارة تطبيقات MoPlayer" })}
        subtitle={t({
          en: "One clean control room for Classic, Pro, iOS, and PC. Each product has its own page, media, links, and runtime scope.",
          ar: "غرفة تحكم واحدة لكل نسخ Classic وPro وiOS وPC. كل نسخة لها صفحتها وصورها وروابطها ونطاق تشغيلها.",
        })}
        icon={<Settings2 className="h-7 w-7" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`${webBaseUrl}/en/apps/moplayer`} target="_blank" className="btn btn-sm">
              <ExternalLink className="h-4 w-4" />
              {t({ en: "Public hub", ar: "البوابة العامة" })}
            </Link>
            <Link href="/website#site-images" className="btn btn-sm">
              <ImageIcon className="h-4 w-4" />
              {t({ en: "Homepage images", ar: "صور الرئيسية" })}
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t({ en: "Products", ar: "النسخ" })} value="4" icon={<Settings2 className="h-5 w-5" />} tone="violet" />
        <StatCard label={t({ en: "Classic status", ar: "حالة Classic" })} value={runtimeLabel(classic, t)} icon={<Smartphone className="h-5 w-5" />} tone={classic.runtimeConfig.enabled ? "success" : "warning"} />
        <StatCard label={t({ en: "Pro status", ar: "حالة Pro" })} value={runtimeLabel(pro, t)} icon={<Tv className="h-5 w-5" />} tone={pro.runtimeConfig.enabled ? "success" : "warning"} />
        <StatCard label={t({ en: "iOS link", ar: "رابط iOS" })} value={ios.storeUrl ? t({ en: "Set", ar: "موجود" }) : t({ en: "Temporary", ar: "مؤقت" })} icon={<BadgeCheck className="h-5 w-5" />} tone="warning" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <article key={card.key} className="group overflow-hidden rounded-[24px] border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
                  {card.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{card.eyebrow}</p>
                  <h2 className="mt-1 text-xl font-black text-[var(--text-1)]">{card.title}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--text-2)]">{card.body}</p>
                </div>
              </div>
              <Link href={card.href} className="btn btn-sm btn-primary shrink-0">
                {t({ en: "Manage", ar: "إدارة" })}
                <ArrowUpRight className="h-4 w-4 rtl:rotate-[-90deg]" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniMetric label={t({ en: "Status", ar: "الحالة" })} value={card.status} />
              <MiniMetric label={t({ en: "Version", ar: "الإصدار" })} value={card.version} />
              <MiniMetric label={t({ en: "Downloads", ar: "التحميلات" })} value={formatCount(card.downloads)} />
              <MiniMetric label={t({ en: "Images", ar: "الصور" })} value={String(card.imageCount)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={card.href} className="btn btn-sm">
                <Settings2 className="h-4 w-4" />
                {t({ en: "Control page", ar: "صفحة التحكم" })}
              </Link>
              <Link href={card.publicHref} target="_blank" className="btn btn-sm">
                <ExternalLink className="h-4 w-4" />
                {t({ en: "Public page", ar: "الصفحة العامة" })}
              </Link>
              <Link href={card.key === "ios" ? "/moplayer/ios#ios-images" : card.key === "pc" ? "/moplayer/pc#images" : `${card.href}#visual-assets`} className="btn btn-sm">
                <ImageIcon className="h-4 w-4" />
                {t({ en: "Images", ar: "الصور" })}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[24px] border border-[var(--line-strong)] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_44%),rgba(255,255,255,0.025)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{t({ en: "Media workflow", ar: "مسار الصور" })}</p>
            <h2 className="mt-1 text-lg font-black text-[var(--text-1)]">{t({ en: "No code needed to change public visuals", ar: "لا تحتاج كود لتغيير الصور العامة" })}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-2)]">
              {t({
                en: "Homepage images live under Website. App product screenshots live under each app. iOS has its own upload/select control because it is a separate public surface even though the backend slug remains moplayer2.",
                ar: "صور الصفحة الرئيسية داخل قسم Website. صور كل تطبيق داخل صفحته. iOS له تحكم رفع/اختيار مستقل لأنه سطح عام منفصل، مع بقاء slug الخلفية moplayer2.",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/website#site-images" className="btn btn-sm">
              <ImageIcon className="h-4 w-4" />
              {t({ en: "Website images", ar: "صور الموقع" })}
            </Link>
            <Link href="/moplayer/ios#ios-images" className="btn btn-sm btn-primary">
              <BadgeCheck className="h-4 w-4" />
              {t({ en: "iOS image", ar: "صورة iOS" })}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-black/15 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-3)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[var(--text-1)]">{value}</p>
    </div>
  );
}
