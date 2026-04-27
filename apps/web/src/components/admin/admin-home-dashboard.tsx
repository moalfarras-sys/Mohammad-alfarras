import Link from "next/link";
import {
  ArrowUpRight,
  BookCopy,
  BriefcaseBusiness,
  Download,
  FileStack,
  FolderKanban,
  Image as ImageIcon,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { getAdminProfileDocument, getPdfRegistry } from "@/lib/cms-documents";
import type { CmsSnapshot, Locale } from "@/types/cms";

type Props = {
  locale: Locale;
  snapshot: CmsSnapshot;
};

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export function AdminHomeDashboard({ locale, snapshot }: Props) {
  const base = `/${locale}/admin`;
  const adminProfile = getAdminProfileDocument(snapshot);
  const pdfRegistry = getPdfRegistry(snapshot);

  const stats = [
    {
      label: t(locale, "الصفحات", "Pages"),
      value: String(snapshot.pages.length),
      note: t(locale, "صفحات أساسية مرتبطة بالموقع", "Core site routes connected to the website"),
    },
    {
      label: t(locale, "المشاريع", "Projects"),
      value: String(snapshot.work_projects.filter((item) => item.is_active).length),
      note: t(locale, "مشاريع نشطة ظاهرة للزوار", "Active projects visible on the public site"),
    },
    {
      label: t(locale, "الوسائط", "Media"),
      value: String(snapshot.media_assets.length),
      note: t(locale, "صور وأصول قابلة لإعادة الاستخدام", "Images and reusable visual assets"),
    },
    {
      label: t(locale, "سجلات الحفظ", "Audit"),
      value: String(snapshot.audit_logs.length),
      note: t(locale, "آخر العمليات المحفوظة في النظام", "Latest tracked admin mutations"),
    },
  ];

  const destinations = [
    {
      href: `${base}/pages`,
      title: t(locale, "إدارة الصفحات", "Page management"),
      body: t(
        locale,
        "حرر محتوى الصفحة الرئيسية والمشاريع ويوتيوب والتواصل، مع تحكم آمن في إظهار الأقسام وترتيبها.",
        "Edit home, projects, YouTube, and contact copy with safe section visibility and ordering controls.",
      ),
      icon: FileStack,
    },
    {
      href: `${base}/projects`,
      title: t(locale, "استوديو المشاريع", "Projects studio"),
      body: t(
        locale,
        "أضف المشاريع أو عدلها مع الغلاف والمعرض والإحصاءات والنسختين العربية والإنجليزية.",
        "Create and edit projects with cover, gallery, metrics, and bilingual content from one workspace.",
      ),
      icon: BriefcaseBusiness,
    },
    {
      href: `${base}/cv`,
      title: t(locale, "إدارة السيرة", "CV management"),
      body: t(
        locale,
        "تحكم في مقدمة السيرة، الخبرات، المهارات، التعليم، والختام مع روابط PDF.",
        "Control CV hero copy, experience, skills, education, closing CTA, and linked PDFs.",
      ),
      icon: BookCopy,
    },
    {
      href: `${base}/media`,
      title: t(locale, "مكتبة الوسائط", "Media library"),
      body: t(
        locale,
        "ارفع الملفات، استعرضها بصرياً، واعرف أين تُستخدم داخل الموقع قبل التعديل أو الحذف.",
        "Upload files, preview them visually, and inspect where they are used before replacing or deleting them.",
      ),
      icon: ImageIcon,
    },
    {
      href: `${base}/pdfs`,
      title: t(locale, "مركز ملفات PDF", "PDF control"),
      body: t(
        locale,
        "بدل بين النسخ المولدة والمرفوعة، وراجع حالة كل ملف قبل جعله نشطاً للواجهة العامة.",
        "Switch between generated and uploaded PDFs and review each slot before making it live.",
      ),
      icon: FolderKanban,
    },
    {
      href: `${base}/settings`,
      title: t(locale, "الهوية والإعدادات", "Brand and settings"),
      body: t(
        locale,
        "أدر شعار Moalfarras والأصول العامة وملف المدير المعروض داخل النظام.",
        "Manage the Moalfarras logo, shared brand assets, and the admin identity shown inside the CMS.",
      ),
      icon: Settings2,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--os-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)),rgba(7,10,18,0.8)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-primary">
              {t(locale, "لوحة رئيسية", "Overview")}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground md:text-4xl">
              {t(locale, "Moalfarras Control Center", "Moalfarras Control Center")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-foreground-muted md:text-base">
              {t(
                locale,
                "هذه اللوحة مبنية لإدارة الموقع الحقيقي: النصوص، المشاريع، السيرة، الوسائط، وملفات PDF. كل شاشة هنا مرتبطة ببيانات الواجهة العامة وليست طبقة تجميلية منفصلة.",
                "This workspace manages the live website: copy, projects, CV, media, and PDFs. Every screen writes to the same content model the public experience reads.",
              )}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/8 bg-black/5 dark:bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">{adminProfile.displayName[locale]}</p>
                <p className="text-xs text-foreground-muted">{adminProfile.role[locale]}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-foreground-muted">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                <span>{t(locale, "البريد", "Email")}</span>
                <span className="truncate font-bold text-foreground">{adminProfile.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                <span>{t(locale, "PDF البراند", "Branded PDF")}</span>
                <span className="font-bold text-foreground">
                  {pdfRegistry.active.branded === "uploaded" ? t(locale, "مرفوع", "Uploaded") : t(locale, "مولد", "Generated")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                <span>{t(locale, "PDF ATS", "ATS PDF")}</span>
                <span className="font-bold text-foreground">
                  {pdfRegistry.active.ats === "uploaded" ? t(locale, "مرفوع", "Uploaded") : t(locale, "مولد", "Generated")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(135deg,rgba(0,229,255,0.1),rgba(99,102,241,0.06))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-foreground md:text-2xl">
              {t(locale, "تحميل السيرة (PDF)", "CV downloads (PDF)")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-muted">
              {t(
                locale,
                "حمّل النسخة النشطة مباشرة (مولدة أو مرفوعة حسب إعدادات مركز PDF). للتحكم بالمصدر استخدم «مركز ملفات PDF».",
                "Download the active CV for this locale (generated or uploaded per your PDF registry). Manage sources in PDF control.",
              )}
            </p>
          </div>
          <Link
            href={`${base}/pdfs`}
            className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-foreground transition hover:border-primary/30 hover:bg-primary/10"
          >
            {t(locale, "إدارة PDF", "Manage PDFs")}
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/api/cv-pdf?locale=${locale}&variant=branded`}
            target="_blank"
            rel="noreferrer"
            download
            className="inline-flex flex-1 min-w-[200px] items-center justify-center gap-2 rounded-[1.25rem] bg-primary px-5 py-3.5 text-sm font-black text-black transition hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            {t(locale, "سيرة براند PDF", "Branded CV PDF")}
          </a>
          <a
            href={`/api/cv-pdf?locale=${locale}&variant=ats`}
            target="_blank"
            rel="noreferrer"
            download
            className="inline-flex flex-1 min-w-[200px] items-center justify-center gap-2 rounded-[1.25rem] border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-black text-foreground transition hover:border-primary/25 hover:bg-primary/10"
          >
            <Download className="h-4 w-4" />
            {t(locale, "سيرة ATS PDF", "ATS CV PDF")}
          </a>
        </div>
        <p className="mt-4 text-[11px] leading-5 text-foreground-soft">
          {t(
            locale,
            `البراند النشط: ${pdfRegistry.active.branded === "uploaded" ? "مرفوع" : "مولد"} · ATS النشط: ${pdfRegistry.active.ats === "uploaded" ? "مرفوع" : "مولد"}`,
            `Active branded: ${pdfRegistry.active.branded} · Active ATS: ${pdfRegistry.active.ats}`,
          )}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(7,10,18,0.78)] p-5 backdrop-blur-2xl"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-foreground-soft">{stat.label}</p>
            <p className="mt-4 text-3xl font-black text-foreground">{stat.value}</p>
            <p className="mt-3 text-sm leading-7 text-foreground-muted">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-[var(--os-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(7,10,18,0.78)] p-5 backdrop-blur-2xl md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-foreground">{t(locale, "الأقسام", "Workspaces")}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground-muted">
              {t(
                locale,
                "كل مساحة عمل مصممة لوظيفة محددة بدل لوحة مطور عامة. ابدأ من القسم الذي تريد تحديثه.",
                "Each workspace is purpose-built instead of exposing a raw developer dashboard. Start with the area you need to update.",
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {destinations.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.6rem] border border-white/8 bg-black/5 dark:bg-white/5 p-5 transition hover:border-primary/20 hover:bg-primary/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--os-border)] bg-black/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black text-foreground">{item.title}</h3>
                      <ArrowUpRight className="h-4 w-4 text-foreground-soft transition group-hover:text-primary" />
                    </div>
                    <p className="mt-2 text-sm leading-7 text-foreground-muted">{item.body}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--os-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(7,10,18,0.78)] p-5 backdrop-blur-2xl md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-foreground">{t(locale, "آخر النشاط", "Recent activity")}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground-muted">
              {t(
                locale,
                "مراجعة سريعة لأحدث العمليات المسجلة بعد الحفظ داخل النظام.",
                "A quick read on the latest tracked mutations written by the Control Center.",
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {snapshot.audit_logs.slice(0, 6).map((entry) => (
            <div key={entry.id} className="flex flex-col gap-2 rounded-[1.4rem] border border-white/8 bg-black/5 dark:bg-white/5 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {entry.action} · {entry.entity}
                </p>
                <p className="truncate text-xs text-foreground-muted">{entry.entity_id}</p>
              </div>
              <div className="shrink-0 text-xs text-foreground-soft">{new Date(entry.created_at).toLocaleString()}</div>
            </div>
          ))}

          {snapshot.audit_logs.length === 0 && (
            <div className="rounded-[1.4rem] border border-dashed border-[var(--os-border)] bg-black/5 dark:bg-white/5 px-4 py-5 text-sm text-foreground-muted">
              {t(locale, "لا توجد سجلات بعد. أول عملية حفظ ستظهر هنا.", "No audit entries yet. The first saved change will appear here.")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
