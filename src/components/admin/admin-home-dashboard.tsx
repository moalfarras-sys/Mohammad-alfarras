import Link from "next/link";
import { ArrowUpRight, Briefcase, FileStack, Layers, Sparkles } from "lucide-react";

import type { CmsSnapshot, Locale } from "@/types/cms";

type Props = { locale: Locale; snapshot: CmsSnapshot };

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export function AdminHomeDashboard({ locale, snapshot }: Props) {
  const base = `/${locale}/admin`;
  const pagesCount = snapshot.pages.length;
  const projectsActive = snapshot.work_projects.filter((p) => p.is_active).length;
  const blocksCount = snapshot.page_blocks.length;

  const cards = [
    {
      href: `${base}/pages`,
      title: t(locale, "الصفحات", "Pages"),
      desc: t(locale, "عناوين، حالة النشر، وSEO لكل صفحة.", "Titles, publish status, and SEO per page."),
      stat: String(pagesCount),
      statLabel: t(locale, "صفحة", "pages"),
      icon: FileStack,
      tone: "primary" as const,
    },
    {
      href: `${base}/cv`,
      title: t(locale, "السيرة الذاتية", "CV Studio"),
      desc: t(locale, "الهوية، الخبرات، المهارات، وتصدير PDF.", "Identity, experience, skills, and PDF export."),
      stat: "CV",
      statLabel: t(locale, "مباشر", "live"),
      icon: Layers,
      tone: "accent" as const,
    },
    {
      href: `${base}/projects`,
      title: t(locale, "المشاريع", "Projects"),
      desc: t(locale, "إضافة وتعديل الأعمال وصور الغلاف.", "Add and edit portfolio work and covers."),
      stat: String(projectsActive),
      statLabel: t(locale, "نشط", "active"),
      icon: Briefcase,
      tone: "secondary" as const,
    },
  ];

  return (
    <div className="admin-dashboard-home px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
      <div className="mx-auto max-w-3xl space-y-2 text-center md:text-start">
        <span className="admin-eyebrow mx-auto md:mx-0">{t(locale, "مرحباً", "Welcome")}</span>
        <h1 className="text-2xl font-black text-foreground md:text-3xl">
          {t(locale, "لوحة التحكم", "Control center")}
        </h1>
        <p className="text-sm leading-7 text-foreground-muted">
          {t(
            locale,
            "اختر قسمًا أدناه. كل شيء مُحسَّن للمس والجوال.",
            "Pick a section below. Everything is touch-friendly and mobile-first.",
          )}
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="admin-dash-card group flex items-start gap-4 rounded-3xl border border-border-glass bg-surface/60 p-5 backdrop-blur-md transition hover:border-primary/25 hover:bg-surface/80"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
                style={{
                  boxShadow:
                    card.tone === "primary"
                      ? "0 0 24px rgba(0,255,135,0.12)"
                      : card.tone === "secondary"
                        ? "0 0 24px rgba(255,107,0,0.1)"
                        : "0 0 24px rgba(168,85,247,0.1)",
                }}
              >
                <Icon className="h-7 w-7 text-foreground" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-foreground">{card.title}</h2>
                  <span className="rounded-full border border-border-glass bg-surface/80 px-2.5 py-0.5 text-[11px] font-bold text-foreground-muted">
                    {card.stat} · {card.statLabel}
                  </span>
                </div>
                <p className="text-sm leading-6 text-foreground-muted">{card.desc}</p>
              </div>
              <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-foreground-soft transition group-hover:text-primary" aria-hidden />
            </Link>
          );
        })}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-dashed border-border-glass bg-surface/30 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-bold text-foreground">
                {t(locale, "أدوات متقدمة", "Advanced tools")}
              </p>
              <p className="mt-1 text-xs leading-6 text-foreground-muted">
                {t(
                  locale,
                  "بلوكات، يوتيوب، شهادات، ووسائط — للمستخدمين الذين يحتاجون تحكماً كاملاً.",
                  "Blocks, YouTube, certifications, media — full CMS when you need it.",
                )}
              </p>
            </div>
          </div>
          <Link
            href={`${base}/advanced`}
            className="button-secondary-shell shrink-0 justify-center px-5 py-3 text-sm font-bold"
          >
            {t(locale, "فتح اللوحة المتقدمة", "Open advanced")}
          </Link>
        </div>
        <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground-soft">
          {blocksCount} {t(locale, "بلوك محتوى", "content blocks")} · {snapshot.media_assets.length}{" "}
          {t(locale, "وسائط", "media")}
        </p>
      </div>
    </div>
  );
}
