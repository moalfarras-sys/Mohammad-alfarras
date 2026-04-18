import Link from "next/link";

import { deleteWorkProjectAction, upsertProjectStudioAction } from "@/lib/admin-actions";
import { getProjectsStudioData } from "@/lib/projects-studio";
import { MediaPickerField } from "@/components/admin/media-picker-field";
import type { CmsSnapshot, Locale, WorkProject } from "@/types/cms";

type Props = {
  locale: Locale;
  snapshot: CmsSnapshot;
};

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function getTranslation(snapshot: CmsSnapshot, projectId: string, locale: Locale) {
  return snapshot.work_project_translations.find((item) => item.project_id === projectId && item.locale === locale);
}

function createEmptyProject() {
  return {
    id: "",
    slug: "",
    sort_order: 1,
    project_url: "",
    repo_url: "",
    cover_media_id: "",
    is_active: true,
    title_ar: "",
    title_en: "",
    summary_ar: "",
    summary_en: "",
    description_ar: "",
    description_en: "",
    cta_label_ar: "عرض المشروع",
    cta_label_en: "Open project",
  };
}

function ProjectCard({
  locale,
  snapshot,
  project,
}: {
  locale: Locale;
  snapshot: CmsSnapshot;
  project: WorkProject | null;
}) {
  const studio = project ? getProjectsStudioData(snapshot).items.find((item) => item.project_id === project.id) : null;
  const ar = project ? getTranslation(snapshot, project.id, "ar") : null;
  const en = project ? getTranslation(snapshot, project.id, "en") : null;
  const initial = createEmptyProject();

  return (
    <article className="admin-project-card">
      <div className="admin-project-card-head">
        <div>
          <span className="admin-eyebrow">{project ? t(locale, "مشروع حي", "Live project") : t(locale, "مشروع جديد", "New project")}</span>
          <h3>{project ? (locale === "ar" ? ar?.title || project.slug : en?.title || project.slug) : t(locale, "إضافة مشروع جديد", "Add a new project")}</h3>
          <p>
            {project
              ? t(locale, "عدّل البيانات الأساسية، الصور، وتموضع المشروع داخل الـ flagship أو الشبكة.", "Edit the core content, images, and whether the project appears in the flagship area or the dynamic grid.")
              : t(locale, "املأ الحقول الأساسية ثم فعّل الظهور المميز إذا كان المشروع من الثلاثة الرئيسية.", "Fill the core fields, then enable featured mode if this project should enter the flagship area.")}
          </p>
        </div>
        {project ? (
          <div className="admin-project-card-actions">
            <Link href={`/${locale}/projects`} target="_blank">{t(locale, "فتح الصفحة", "Open page")}</Link>
            <form action={deleteWorkProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <button type="submit" className="admin-danger-button">{t(locale, "حذف", "Delete")}</button>
            </form>
          </div>
        ) : null}
      </div>

      <form action={upsertProjectStudioAction} className="admin-project-form">
        <input type="hidden" name="id" value={project?.id ?? initial.id} />
        <input type="hidden" name="created_at" value={project?.created_at ?? new Date().toISOString()} />

        <div className="admin-project-grid">
          <label>
            <span>slug</span>
            <input name="slug" defaultValue={project?.slug ?? initial.slug} required />
          </label>
          <label>
            <span>sort_order</span>
            <input type="number" name="sort_order" defaultValue={project?.sort_order ?? snapshot.work_projects.length + 1} required />
          </label>
          <label>
            <span>project_url</span>
            <input name="project_url" defaultValue={project?.project_url ?? initial.project_url} />
          </label>
          <label>
            <span>repo_url</span>
            <input name="repo_url" defaultValue={project?.repo_url ?? initial.repo_url} />
          </label>
          <label className="admin-project-picker">
            <span>{t(locale, "صورة الغلاف", "Cover image")}</span>
            <MediaPickerField name="cover_media_id" initialValue={project?.cover_media_id ?? initial.cover_media_id} mediaAssets={snapshot.media_assets} locale={locale} />
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" name="is_active" defaultChecked={project?.is_active ?? initial.is_active} />
            <span>{t(locale, "ظاهر في الموقع", "Visible on site")}</span>
          </label>
        </div>

        <div className="admin-project-locale-grid">
          <div>
            <h4>AR</h4>
            <label><span>{t(locale, "العنوان", "Title")}</span><input name="title_ar" defaultValue={ar?.title ?? initial.title_ar} required /></label>
            <label><span>{t(locale, "الملخص", "Summary")}</span><input name="summary_ar" defaultValue={ar?.summary ?? initial.summary_ar} required /></label>
            <label><span>{t(locale, "الوصف", "Description")}</span><textarea name="description_ar" rows={4} defaultValue={ar?.description ?? initial.description_ar} required /></label>
            <label><span>CTA</span><input name="cta_label_ar" defaultValue={ar?.cta_label ?? initial.cta_label_ar} required /></label>
          </div>
          <div>
            <h4>EN</h4>
            <label><span>{t(locale, "العنوان", "Title")}</span><input name="title_en" defaultValue={en?.title ?? initial.title_en} required /></label>
            <label><span>{t(locale, "الملخص", "Summary")}</span><input name="summary_en" defaultValue={en?.summary ?? initial.summary_en} required /></label>
            <label><span>{t(locale, "الوصف", "Description")}</span><textarea name="description_en" rows={4} defaultValue={en?.description ?? initial.description_en} required /></label>
            <label><span>CTA</span><input name="cta_label_en" defaultValue={en?.cta_label ?? initial.cta_label_en} required /></label>
          </div>
        </div>

        <div className="admin-project-locale-grid">
          <div>
            <h4>{t(locale, "تموضع العرض", "Showcase positioning")}</h4>
            <label className="admin-checkbox">
              <input type="checkbox" name="studio_is_featured" defaultChecked={studio?.is_featured ?? false} />
              <span>{t(locale, "مشروع رئيسي مميز", "Featured flagship project")}</span>
            </label>
            <label><span>{t(locale, "ترتيب الظهور", "Featured rank")}</span><input type="number" name="studio_featured_rank" defaultValue={studio?.featured_rank ?? 99} /></label>
            <label>
              <span>{t(locale, "الستايل", "Highlight style")}</span>
              <select name="studio_highlight_style" defaultValue={studio?.highlight_style ?? "editorial"}>
                <option value="operations">operations</option>
                <option value="trust">trust</option>
                <option value="app">app</option>
                <option value="editorial">editorial</option>
              </select>
            </label>
            <label>
              <span>{t(locale, "اللون", "Accent")}</span>
              <select name="studio_accent" defaultValue={studio?.accent ?? "green"}>
                <option value="green">green</option>
                <option value="orange">orange</option>
                <option value="cyan">cyan</option>
                <option value="purple">purple</option>
              </select>
            </label>
            <label>
              <span>{t(locale, "إطار العرض", "Device frame")}</span>
              <select name="studio_device_frame" defaultValue={studio?.device_frame ?? "browser"}>
                <option value="browser">browser</option>
                <option value="phone">phone</option>
                <option value="floating">floating</option>
              </select>
            </label>
            <label><span>{t(locale, "وسم صغير عربي", "Arabic eyebrow")}</span><input name="studio_eyebrow_ar" defaultValue={studio?.eyebrow_ar ?? ""} /></label>
            <label><span>{t(locale, "وسم صغير إنجليزي", "English eyebrow")}</span><input name="studio_eyebrow_en" defaultValue={studio?.eyebrow_en ?? ""} /></label>
          </div>

          <div>
            <h4>{t(locale, "صور العرض", "Showcase gallery")}</h4>
            <label className="admin-project-picker">
              <span>{t(locale, "صورة 1", "Gallery image 1")}</span>
              <MediaPickerField name="gallery_media_id_1" initialValue={studio?.gallery_media_ids[0] ?? ""} mediaAssets={snapshot.media_assets} locale={locale} />
            </label>
            <label className="admin-project-picker">
              <span>{t(locale, "صورة 2", "Gallery image 2")}</span>
              <MediaPickerField name="gallery_media_id_2" initialValue={studio?.gallery_media_ids[1] ?? ""} mediaAssets={snapshot.media_assets} locale={locale} />
            </label>
            <label className="admin-project-picker">
              <span>{t(locale, "صورة 3", "Gallery image 3")}</span>
              <MediaPickerField name="gallery_media_id_3" initialValue={studio?.gallery_media_ids[2] ?? ""} mediaAssets={snapshot.media_assets} locale={locale} />
            </label>
          </div>
        </div>

        <div className="admin-project-locale-grid">
          <div>
            <h4>{t(locale, "السرد العربي", "Arabic narrative")}</h4>
            <label><span>{t(locale, "التحدي", "Challenge")}</span><textarea name="studio_challenge_ar" rows={3} defaultValue={studio?.challenge_ar ?? ""} /></label>
            <label><span>{t(locale, "الحل", "Solution")}</span><textarea name="studio_solution_ar" rows={3} defaultValue={studio?.solution_ar ?? ""} /></label>
            <label><span>{t(locale, "النتيجة", "Result")}</span><textarea name="studio_result_ar" rows={3} defaultValue={studio?.result_ar ?? ""} /></label>
            <label><span>{t(locale, "الوسوم", "Tags")}</span><textarea name="studio_tags_ar" rows={3} defaultValue={(studio?.tags_ar ?? []).join("\n")} /></label>
          </div>
          <div>
            <h4>{t(locale, "السرد الإنجليزي", "English narrative")}</h4>
            <label><span>{t(locale, "التحدي", "Challenge")}</span><textarea name="studio_challenge_en" rows={3} defaultValue={studio?.challenge_en ?? ""} /></label>
            <label><span>{t(locale, "الحل", "Solution")}</span><textarea name="studio_solution_en" rows={3} defaultValue={studio?.solution_en ?? ""} /></label>
            <label><span>{t(locale, "النتيجة", "Result")}</span><textarea name="studio_result_en" rows={3} defaultValue={studio?.result_en ?? ""} /></label>
            <label><span>{t(locale, "الوسوم", "Tags")}</span><textarea name="studio_tags_en" rows={3} defaultValue={(studio?.tags_en ?? []).join("\n")} /></label>
          </div>
        </div>

        <div className="admin-project-metrics-grid">
          {[0, 1, 2].map((index) => (
            <div key={index} className="admin-project-metric-card">
              <h4>{t(locale, `مؤشر ${index + 1}`, `Metric ${index + 1}`)}</h4>
              <label><span>{t(locale, "القيمة", "Value")}</span><input name={`metric_value_${index + 1}`} defaultValue={studio?.metrics[index]?.value ?? ""} /></label>
              <label><span>{t(locale, "الاسم العربي", "Arabic label")}</span><input name={`metric_label_ar_${index + 1}`} defaultValue={studio?.metrics[index]?.label_ar ?? ""} /></label>
              <label><span>{t(locale, "الاسم الإنجليزي", "English label")}</span><input name={`metric_label_en_${index + 1}`} defaultValue={studio?.metrics[index]?.label_en ?? ""} /></label>
            </div>
          ))}
        </div>

        <div className="admin-project-submit-row">
          <button type="submit">{t(locale, "حفظ المشروع", "Save project")}</button>
        </div>
      </form>
    </article>
  );
}

export function ProjectsStudio({ locale, snapshot }: Props) {
  const projects = snapshot.work_projects.slice().sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="admin-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="admin-content" style={{ marginInlineStart: 0 }}>
        <nav className="admin-mobile-nav" aria-label="Project sections">
          <a href="#overview">{t(locale, "نظرة عامة", "Overview")}</a>
          <a href="#new-project">{t(locale, "مشروع جديد", "New project")}</a>
          <a href="#all-projects">{t(locale, "كل المشاريع", "All projects")}</a>
        </nav>

        <section id="overview">
          <div className="admin-spotlight">
            <div>
              <span className="admin-eyebrow">Projects Studio</span>
              <h2>{t(locale, "لوحة أعمال مرتبطة مباشرة بالصفحة العامة", "A projects studio wired directly to the public showcase")}</h2>
              <p>{t(locale, "هنا تضيف المشاريع، ترتبها، تختار الصور، وتحدد من يدخل منطقة الـ flagship ومن يبقى في الشبكة الديناميكية.", "Create projects, order them, choose the media, and decide which ones become flagship blocks versus dynamic grid entries.")}</p>
            </div>
            <div className="admin-overview-note">
              <strong>{t(locale, "روابط سريعة", "Quick links")}</strong>
              <p><Link href={`/${locale}/projects`} target="_blank">{t(locale, "فتح صفحة الأعمال الحية", "Open live projects page")}</Link></p>
              <p><Link href={`/${locale}/admin/cv`}>{t(locale, "العودة إلى CV Studio", "Back to CV Studio")}</Link></p>
            </div>
          </div>
          <div className="admin-overview-grid">
            <article><h3>{projects.filter((item) => item.is_active).length}</h3><p>{t(locale, "مشاريع فعالة", "Active projects")}</p></article>
            <article><h3>{projects.length}</h3><p>{t(locale, "إجمالي المشاريع", "Total projects")}</p></article>
            <article><h3>3</h3><p>{t(locale, "منطقة flagship", "Flagship zone")}</p></article>
            <article><h3>Live</h3><p>{t(locale, "ربط مباشر بالصفحة", "Live page binding")}</p></article>
          </div>
        </section>

        <section id="new-project">
          <ProjectCard locale={locale} snapshot={snapshot} project={null} />
        </section>

        <section id="all-projects" className="space-y-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} locale={locale} snapshot={snapshot} project={project} />
          ))}
        </section>
      </div>
    </div>
  );
}
