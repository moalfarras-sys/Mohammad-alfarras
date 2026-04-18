import Link from "next/link";
import { ExternalLink, Save } from "lucide-react";

import { publishPageAction, updatePageCoreAction, updatePageTranslationAction } from "@/lib/admin-actions";
import type { CmsSnapshot, Locale, Page } from "@/types/cms";

type Props = { locale: Locale; snapshot: CmsSnapshot };

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function getTranslation(snapshot: CmsSnapshot, pageId: string, loc: Locale) {
  return snapshot.page_translations.find((x) => x.page_id === pageId && x.locale === loc);
}

function PageEditorCard({ locale, page, snapshot }: { locale: Locale; page: Page; snapshot: CmsSnapshot }) {
  const ar = getTranslation(snapshot, page.id, "ar");
  const en = getTranslation(snapshot, page.id, "en");

  return (
    <article className="admin-page-editor-card rounded-3xl border border-border-glass bg-surface/50 p-5 backdrop-blur-md">
      <div className="mb-4 flex flex-col gap-3 border-b border-border-glass pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">/{page.slug}</p>
          <h2 className="mt-1 text-lg font-black text-foreground">{ar?.title ?? en?.title ?? page.slug}</h2>
          <p className="text-xs text-foreground-muted">
            {t(locale, "آخر تحديث", "Updated")} {new Date(page.updated_at).toLocaleDateString(locale === "ar" ? "ar" : "en")}
          </p>
        </div>
        <Link
          href={page.slug === "home" ? `/${locale}` : `/${locale}/${page.slug}`}
          target="_blank"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-glass bg-surface/80 px-4 text-sm font-bold text-foreground transition hover:border-primary/30"
        >
          <ExternalLink className="h-4 w-4" />
          {t(locale, "معاينة", "Preview")}
        </Link>
      </div>

      <form action={updatePageCoreAction} className="mb-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={page.id} />
        <label className="admin-field">
          <span>{t(locale, "الحالة", "Status")}</span>
          <select name="status" defaultValue={page.status} className="admin-input-lg">
            <option value="draft">{t(locale, "مسودة", "Draft")}</option>
            <option value="published">{t(locale, "منشور", "Published")}</option>
          </select>
        </label>
        <label className="admin-field">
          <span>{t(locale, "القالب", "Template")}</span>
          <input name="template" defaultValue={page.template} className="admin-input-lg" />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="button-primary-shell flex min-h-12 w-full items-center justify-center gap-2 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {t(locale, "حفظ الإعدادات", "Save settings")}
          </button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updatePageTranslationAction} className="space-y-3 rounded-2xl border border-border-glass bg-white/[0.02] p-4">
          <input type="hidden" name="page_id" value={page.id} />
          <input type="hidden" name="locale" value="ar" />
          <h3 className="text-sm font-black text-foreground">العربية</h3>
          <label className="admin-field">
            <span>العنوان</span>
            <input name="title" defaultValue={ar?.title ?? ""} required className="admin-input-lg" dir="rtl" />
          </label>
          <label className="admin-field">
            <span>عنوان SEO</span>
            <input
              name="meta_title"
              defaultValue={ar?.meta_title || ar?.title || en?.title || "-"}
              className="admin-input-lg"
              dir="rtl"
            />
          </label>
          <label className="admin-field">
            <span>وصف SEO</span>
            <textarea
              name="meta_description"
              rows={3}
              defaultValue={ar?.meta_description || ar?.title || en?.title || "-"}
              className="admin-input-lg"
              dir="rtl"
            />
          </label>
          <label className="admin-field">
            <span>OG عنوان</span>
            <input
              name="og_title"
              defaultValue={ar?.og_title || ar?.title || en?.title || "-"}
              className="admin-input-lg"
              dir="rtl"
            />
          </label>
          <label className="admin-field">
            <span>OG وصف</span>
            <textarea
              name="og_description"
              rows={2}
              defaultValue={ar?.og_description || ar?.meta_description || ar?.title || "-"}
              className="admin-input-lg"
              dir="rtl"
            />
          </label>
          <button type="submit" className="button-primary-shell min-h-12 w-full justify-center">
            {t(locale, "حفظ العربية", "Save Arabic")}
          </button>
        </form>

        <form action={updatePageTranslationAction} className="space-y-3 rounded-2xl border border-border-glass bg-white/[0.02] p-4">
          <input type="hidden" name="page_id" value={page.id} />
          <input type="hidden" name="locale" value="en" />
          <h3 className="text-sm font-black text-foreground">English</h3>
          <label className="admin-field">
            <span>Title</span>
            <input name="title" defaultValue={en?.title ?? ""} required className="admin-input-lg" />
          </label>
          <label className="admin-field">
            <span>Meta title</span>
            <input
              name="meta_title"
              defaultValue={en?.meta_title || en?.title || ar?.title || "-"}
              className="admin-input-lg"
            />
          </label>
          <label className="admin-field">
            <span>Meta description</span>
            <textarea
              name="meta_description"
              rows={3}
              defaultValue={en?.meta_description || en?.title || ar?.title || "-"}
              className="admin-input-lg"
            />
          </label>
          <label className="admin-field">
            <span>OG title</span>
            <input name="og_title" defaultValue={en?.og_title || en?.title || ar?.title || "-"} className="admin-input-lg" />
          </label>
          <label className="admin-field">
            <span>OG description</span>
            <textarea
              name="og_description"
              rows={2}
              defaultValue={en?.og_description || en?.meta_description || en?.title || "-"}
              className="admin-input-lg"
            />
          </label>
          <button type="submit" className="button-primary-shell min-h-12 w-full justify-center">
            {t(locale, "حفظ الإنجليزية", "Save English")}
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border-glass pt-4">
        <form action={publishPageAction}>
          <input type="hidden" name="slug" value={page.slug} />
          <input type="hidden" name="status" value="published" />
          <button
            type="submit"
            className="min-h-11 rounded-2xl border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary"
          >
            {t(locale, "نشر سريع", "Quick publish")}
          </button>
        </form>
        <form action={publishPageAction}>
          <input type="hidden" name="slug" value={page.slug} />
          <input type="hidden" name="status" value="draft" />
          <button
            type="submit"
            className="min-h-11 rounded-2xl border border-border-glass px-4 text-sm font-bold text-foreground-muted"
          >
            {t(locale, "إرجاع لمسودة", "Set draft")}
          </button>
        </form>
      </div>
    </article>
  );
}

export function AdminPagesPanel({ locale, snapshot }: Props) {
  const pages = snapshot.pages.slice().sort((a, b) => a.slug.localeCompare(b.slug));

  return (
    <div className="admin-pages-wrap px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
      <div className="mx-auto max-w-4xl space-y-2">
        <span className="admin-eyebrow">{t(locale, "المحتوى", "Content")}</span>
        <h1 className="text-2xl font-black text-foreground md:text-3xl">{t(locale, "الصفحات", "Pages")}</h1>
        <p className="max-w-2xl text-sm leading-7 text-foreground-muted">
          {t(
            locale,
            "كل صفحة عامة في الموقع: الحالة، القالب، والعناوين بالعربية والإنجليزية.",
            "Every public page: status, template, and Arabic + English titles & SEO.",
          )}
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-6">
        {pages.map((page) => (
          <PageEditorCard key={page.id} locale={locale} page={page} snapshot={snapshot} />
        ))}
      </div>
    </div>
  );
}
