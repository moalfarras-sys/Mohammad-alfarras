"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { deleteProjectControlAction, saveProjectControlAction } from "@/lib/admin-actions";
import type { CmsSnapshot, Locale } from "@/types/cms";

import {
  BilingualPane,
  Card,
  Checkbox,
  DangerButton,
  Field,
  LocaleGrid,
  PreviewImage,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  Select,
  StatusPill,
  StudioShell,
  TextArea,
  TextInput,
  moveListItem,
  useControlCenterAction,
} from "./control-center-ui";

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

type ProjectMetricEditor = {
  value: string;
  label_ar: string;
  label_en: string;
};

type ProjectEditorState = {
  id: string;
  created_at: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  category: string;
  featured_rank: number | null;
  project_url: string;
  repo_url: string;
  cover_media_id: string | null;
  translations: {
    ar: {
      title: string;
      summary: string;
      description: string;
      cta_label: string;
      tags_json: string[];
      challenge: string;
      solution: string;
      result: string;
    };
    en: {
      title: string;
      summary: string;
      description: string;
      cta_label: string;
      tags_json: string[];
      challenge: string;
      solution: string;
      result: string;
    };
  };
  gallery_media_ids: string[];
  metrics: ProjectMetricEditor[];
};

function createDraftProject(): ProjectEditorState {
  return {
    id: `wp-${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
    slug: "",
    is_active: true,
    sort_order: 0,
    category: "general",
    featured_rank: null,
    project_url: "",
    repo_url: "",
    cover_media_id: null,
    translations: {
      ar: {
        title: "",
        summary: "",
        description: "",
        cta_label: "عرض المشروع",
        tags_json: [],
        challenge: "",
        solution: "",
        result: "",
      },
      en: {
        title: "",
        summary: "",
        description: "",
        cta_label: "Open project",
        tags_json: [],
        challenge: "",
        solution: "",
        result: "",
      },
    },
    gallery_media_ids: [],
    metrics: [],
  };
}

function toTagString(items: string[]) {
  return items.join("\n");
}

function fromTagString(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildProjects(snapshot: CmsSnapshot): ProjectEditorState[] {
  return snapshot.work_projects
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((project) => {
      const ar = snapshot.work_project_translations.find((item) => item.project_id === project.id && item.locale === "ar");
      const en = snapshot.work_project_translations.find((item) => item.project_id === project.id && item.locale === "en");
      const cover = snapshot.work_project_media.find((item) => item.project_id === project.id && item.role === "cover");
      const gallery = snapshot.work_project_media
        .filter((item) => item.project_id === project.id && item.role === "gallery")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => item.media_id);
      const metrics = snapshot.work_project_metrics
        .filter((item) => item.project_id === project.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({ value: item.value, label_ar: item.label_ar, label_en: item.label_en }));

      return {
        id: project.id,
        created_at: project.created_at,
        slug: project.slug,
        is_active: project.is_active,
        sort_order: project.sort_order,
        category: project.category ?? "general",
        featured_rank: project.featured_rank ?? null,
        project_url: project.project_url,
        repo_url: project.repo_url,
        cover_media_id: cover?.media_id ?? project.cover_media_id,
        translations: {
          ar: {
            title: ar?.title ?? "",
            summary: ar?.summary ?? "",
            description: ar?.description ?? "",
            cta_label: ar?.cta_label ?? "",
            tags_json: ar?.tags_json ?? [],
            challenge: ar?.challenge ?? "",
            solution: ar?.solution ?? "",
            result: ar?.result ?? "",
          },
          en: {
            title: en?.title ?? "",
            summary: en?.summary ?? "",
            description: en?.description ?? "",
            cta_label: en?.cta_label ?? "",
            tags_json: en?.tags_json ?? [],
            challenge: en?.challenge ?? "",
            solution: en?.solution ?? "",
            result: en?.result ?? "",
          },
        },
        gallery_media_ids: gallery,
        metrics,
      };
    });
}

export function ProjectsControlCenter({
  locale,
  snapshot,
}: {
  locale: Locale;
  snapshot: CmsSnapshot;
}) {
  const mediaOptions = snapshot.media_assets;
  const [projects, setProjects] = useState<ProjectEditorState[]>(() => {
    const built = buildProjects(snapshot);
    return built.length ? built : [createDraftProject()];
  });
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");

  const selectedProject = projects.find((item) => item.id === selectedId) ?? projects[0];
  const saveAction = useControlCenterAction(async (project: ProjectEditorState) => {
    const formData = new FormData();
    formData.set("payload_json", JSON.stringify(project));
    formData.set("created_at", project.created_at);
    await saveProjectControlAction(formData);
  }, t(locale, "تم حفظ المشروع.", "Project saved."));
  const deleteAction = useControlCenterAction(async (id: string) => {
    const formData = new FormData();
    formData.set("id", id);
    await deleteProjectControlAction(formData);
  }, t(locale, "تم حذف المشروع.", "Project deleted."));

  const mediaMap = useMemo(() => new Map(mediaOptions.map((item) => [item.id, item])), [mediaOptions]);

  function updateProject(updater: (current: ProjectEditorState) => ProjectEditorState) {
    setProjects((current) => current.map((item) => (item.id === selectedProject.id ? updater(item) : item)));
  }

  function addProject() {
    const draft = createDraftProject();
    setProjects((current) => [draft, ...current]);
    setSelectedId(draft.id);
  }

  const gallery = selectedProject?.gallery_media_ids ?? [];

  return (
    <div className="space-y-5">
      <StudioShell
        eyebrow={t(locale, "المشاريع", "Projects")}
        title={t(locale, "استوديو المشاريع", "Projects studio")}
        body={t(
          locale,
          "أضف المشاريع أو عدلها مع الغلاف والمعرض والإحصاءات والمحتوى الثنائي اللغة. كل تغيير هنا ينعكس على صفحة الأعمال الفعلية.",
          "Create and edit projects with cover, gallery, metrics, and bilingual copy. Every change here feeds the public projects experience.",
        )}
        actions={
          <PrimaryButton onClick={addProject}>
            <Plus className="me-2 h-4 w-4" />
            {t(locale, "مشروع جديد", "New project")}
          </PrimaryButton>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <Card className="space-y-4">
            <SectionTitle title={t(locale, "القائمة", "Project list")} body={t(locale, "اختر مشروعاً للتحرير أو أضف مشروعاً جديداً.", "Select a project to edit or create a new one.")} />
            <div className="grid gap-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className={`rounded-[1.3rem] border p-4 text-start transition ${
                    project.id === selectedId ? "border-primary/25 bg-primary/10" : "border-white/8 bg-black/10 hover:bg-black/5 dark:bg-white/5"
                  }`}
                >
                  <p className="truncate text-sm font-black text-foreground">{project.translations[locale].title || project.slug || t(locale, "مشروع بدون عنوان", "Untitled project")}</p>
                  <p className="mt-1 truncate text-xs text-foreground-muted">{project.slug || "no-slug"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-foreground-soft">
                    <span>{project.is_active ? t(locale, "نشط", "Active") : t(locale, "مخفي", "Hidden")}</span>
                    <span>•</span>
                    <span>{project.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {selectedProject ? (
            <Card className="space-y-5">
              <SectionTitle
                title={t(locale, "المحرر", "Editor")}
                body={t(locale, "بيانات المشروع والترجمات والأصول المرتبطة.", "Project settings, translations, and attached assets.")}
                aside={<StatusPill tone={saveAction.tone === "idle" ? deleteAction.tone : saveAction.tone} message={saveAction.message || deleteAction.message} />}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Slug">
                  <TextInput value={selectedProject.slug} onChange={(event) => updateProject((current) => ({ ...current, slug: event.target.value }))} />
                </Field>
                <Field label={t(locale, "الفئة", "Category")}>
                  <TextInput value={selectedProject.category} onChange={(event) => updateProject((current) => ({ ...current, category: event.target.value }))} />
                </Field>
                <Field label={t(locale, "الترتيب", "Order")}>
                  <TextInput type="number" value={selectedProject.sort_order} onChange={(event) => updateProject((current) => ({ ...current, sort_order: Number(event.target.value || 0) }))} />
                </Field>
                <Field label={t(locale, "ترتيب المميز", "Featured rank")} hint={t(locale, "اتركه فارغاً إذا لم يكن المشروع مميزاً.", "Leave empty if the project is not featured.")}>
                  <TextInput type="number" value={selectedProject.featured_rank ?? ""} onChange={(event) => updateProject((current) => ({ ...current, featured_rank: event.target.value ? Number(event.target.value) : null }))} />
                </Field>
                <Field label={t(locale, "الرابط المباشر", "Live URL")}><TextInput value={selectedProject.project_url} onChange={(event) => updateProject((current) => ({ ...current, project_url: event.target.value }))} /></Field>
                <Field label="GitHub / Repo URL"><TextInput value={selectedProject.repo_url} onChange={(event) => updateProject((current) => ({ ...current, repo_url: event.target.value }))} /></Field>
              </div>

              <Checkbox
                checked={selectedProject.is_active}
                onChange={(checked) => updateProject((current) => ({ ...current, is_active: checked }))}
                label={t(locale, "إظهار المشروع في الموقع", "Show project on the website")}
                hint={t(locale, "يمكنك حفظ المشروع كمخفي قبل النشر.", "You can keep the project hidden before publishing it.")}
              />

              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <Card className="space-y-3">
                  <SectionTitle title={t(locale, "صورة الغلاف", "Cover image")} />
                  <PreviewImage src={selectedProject.cover_media_id ? mediaMap.get(selectedProject.cover_media_id)?.path : null} alt={selectedProject.slug || "project cover"} className="aspect-[4/3]" />
                  <Field label={t(locale, "الوسيط", "Media asset")}>
                    <Select value={selectedProject.cover_media_id ?? ""} onChange={(event) => updateProject((current) => ({ ...current, cover_media_id: event.target.value || null }))}>
                      <option value="">{t(locale, "بدون غلاف", "No cover")}</option>
                      {mediaOptions.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.id}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </Card>

                <Card className="space-y-4">
                  <SectionTitle title={t(locale, "معرض الصور", "Gallery")} body={t(locale, "أضف صوراً مرتبة للمشروع ويمكنك تغيير ترتيبها من هنا.", "Add ordered gallery images and change their order here.")} />
                  <div className="grid gap-3">
                    {gallery.map((mediaId, index) => (
                      <div key={`${selectedProject.id}-${index}-${mediaId}`} className="grid gap-3 rounded-[1.2rem] border border-white/8 bg-black/10 p-4 md:grid-cols-[100px_1fr_auto] md:items-center">
                        <PreviewImage src={mediaMap.get(mediaId)?.path} alt={`gallery-${index + 1}`} className="aspect-square" />
                        <Field label={t(locale, "الصورة", "Asset")}>
                          <Select
                            value={mediaId}
                            onChange={(event) =>
                              updateProject((current) => ({
                                ...current,
                                gallery_media_ids: current.gallery_media_ids.map((entry, entryIndex) => (entryIndex === index ? event.target.value : entry)),
                              }))
                            }
                          >
                            <option value="">{t(locale, "اختر وسيطاً", "Select media")}</option>
                            {mediaOptions.map((asset) => (
                              <option key={asset.id} value={asset.id}>
                                {asset.id}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <div className="flex gap-2">
                          <SecondaryButton onClick={() => updateProject((current) => ({ ...current, gallery_media_ids: moveListItem(current.gallery_media_ids, index, index - 1) }))}>↑</SecondaryButton>
                          <SecondaryButton onClick={() => updateProject((current) => ({ ...current, gallery_media_ids: moveListItem(current.gallery_media_ids, index, index + 1) }))}>↓</SecondaryButton>
                          <DangerButton
                            onClick={() =>
                              updateProject((current) => ({
                                ...current,
                                gallery_media_ids: current.gallery_media_ids.filter((_, entryIndex) => entryIndex !== index),
                              }))
                            }
                          >
                            {t(locale, "حذف", "Remove")}
                          </DangerButton>
                        </div>
                      </div>
                    ))}
                  </div>
                  <SecondaryButton onClick={() => updateProject((current) => ({ ...current, gallery_media_ids: [...current.gallery_media_ids, ""] }))}>
                    <Plus className="me-2 h-4 w-4" />
                    {t(locale, "إضافة صورة", "Add image")}
                  </SecondaryButton>
                </Card>
              </div>

              <LocaleGrid
                ar={
                  <BilingualPane title="Arabic" dir="rtl">
                    <Field label={t(locale, "العنوان", "Title")}><TextInput value={selectedProject.translations.ar.title} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, title: event.target.value } } }))} dir="rtl" /></Field>
                    <Field label={t(locale, "الوصف المختصر", "Summary")}><TextArea value={selectedProject.translations.ar.summary} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, summary: event.target.value } } }))} dir="rtl" /></Field>
                    <Field label={t(locale, "الوصف الكامل", "Description")}><TextArea value={selectedProject.translations.ar.description} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, description: event.target.value } } }))} dir="rtl" /></Field>
                    <Field label={t(locale, "زر الدعوة", "CTA label")}><TextInput value={selectedProject.translations.ar.cta_label} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, cta_label: event.target.value } } }))} dir="rtl" /></Field>
                    <Field label={t(locale, "الوسوم", "Tags")} hint={t(locale, "وسم بكل سطر", "One tag per line")}><TextArea value={toTagString(selectedProject.translations.ar.tags_json)} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, tags_json: fromTagString(event.target.value) } } }))} dir="rtl" /></Field>
                    <Field label={t(locale, "التحدي", "Challenge")}><TextArea value={selectedProject.translations.ar.challenge} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, challenge: event.target.value } } }))} dir="rtl" /></Field>
                    <Field label={t(locale, "الحل", "Solution")}><TextArea value={selectedProject.translations.ar.solution} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, solution: event.target.value } } }))} dir="rtl" /></Field>
                    <Field label={t(locale, "النتيجة", "Result")}><TextArea value={selectedProject.translations.ar.result} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, ar: { ...current.translations.ar, result: event.target.value } } }))} dir="rtl" /></Field>
                  </BilingualPane>
                }
                en={
                  <BilingualPane title="English" dir="ltr">
                    <Field label="Title"><TextInput value={selectedProject.translations.en.title} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, title: event.target.value } } }))} /></Field>
                    <Field label="Summary"><TextArea value={selectedProject.translations.en.summary} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, summary: event.target.value } } }))} /></Field>
                    <Field label="Description"><TextArea value={selectedProject.translations.en.description} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, description: event.target.value } } }))} /></Field>
                    <Field label="CTA label"><TextInput value={selectedProject.translations.en.cta_label} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, cta_label: event.target.value } } }))} /></Field>
                    <Field label="Tags" hint="One tag per line"><TextArea value={toTagString(selectedProject.translations.en.tags_json)} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, tags_json: fromTagString(event.target.value) } } }))} /></Field>
                    <Field label="Challenge"><TextArea value={selectedProject.translations.en.challenge} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, challenge: event.target.value } } }))} /></Field>
                    <Field label="Solution"><TextArea value={selectedProject.translations.en.solution} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, solution: event.target.value } } }))} /></Field>
                    <Field label="Result"><TextArea value={selectedProject.translations.en.result} onChange={(event) => updateProject((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations.en, result: event.target.value } } }))} /></Field>
                  </BilingualPane>
                }
              />

              <Card className="space-y-4">
                <SectionTitle title={t(locale, "الإحصاءات والبادجات", "Metrics and badges")} body={t(locale, "أرقام قصيرة تظهر داخل بطاقة المشروع.", "Short stats displayed with the project story.")} />
                <div className="grid gap-3">
                  {selectedProject.metrics.map((metric, index) => (
                    <div key={`${selectedProject.id}-metric-${index}`} className="grid gap-3 rounded-[1.2rem] border border-white/8 bg-black/10 p-4 md:grid-cols-[0.5fr_1fr_1fr_auto] md:items-center">
                      <Field label={t(locale, "القيمة", "Value")}><TextInput value={metric.value} onChange={(event) => updateProject((current) => ({ ...current, metrics: current.metrics.map((entry, entryIndex) => (entryIndex === index ? { ...entry, value: event.target.value } : entry)) }))} /></Field>
                      <Field label={t(locale, "العنوان العربي", "Arabic label")}><TextInput value={metric.label_ar} onChange={(event) => updateProject((current) => ({ ...current, metrics: current.metrics.map((entry, entryIndex) => (entryIndex === index ? { ...entry, label_ar: event.target.value } : entry)) }))} dir="rtl" /></Field>
                      <Field label={t(locale, "العنوان الإنجليزي", "English label")}><TextInput value={metric.label_en} onChange={(event) => updateProject((current) => ({ ...current, metrics: current.metrics.map((entry, entryIndex) => (entryIndex === index ? { ...entry, label_en: event.target.value } : entry)) }))} /></Field>
                      <DangerButton onClick={() => updateProject((current) => ({ ...current, metrics: current.metrics.filter((_, entryIndex) => entryIndex !== index) }))}>
                        <Trash2 className="h-4 w-4" />
                      </DangerButton>
                    </div>
                  ))}
                </div>
                <SecondaryButton onClick={() => updateProject((current) => ({ ...current, metrics: [...current.metrics, { value: "", label_ar: "", label_en: "" }] }))}>
                  <Plus className="me-2 h-4 w-4" />
                  {t(locale, "إضافة إحصاء", "Add metric")}
                </SecondaryButton>
              </Card>

              <div className="flex flex-wrap justify-between gap-3">
                <DangerButton
                  disabled={deleteAction.isPending}
                  onClick={async () => {
                    if (!window.confirm(t(locale, "سيتم حذف المشروع نهائياً. متابعة؟", "This project will be deleted permanently. Continue?"))) {
                      return;
                    }
                    await deleteAction.run(selectedProject.id);
                    setProjects((current) => current.filter((item) => item.id !== selectedProject.id));
                    const next = projects.find((item) => item.id !== selectedProject.id);
                    setSelectedId(next?.id ?? "");
                  }}
                >
                  {t(locale, "حذف المشروع", "Delete project")}
                </DangerButton>
                <PrimaryButton disabled={saveAction.isPending} onClick={() => saveAction.run(selectedProject)}>
                  {saveAction.isPending ? t(locale, "جارٍ الحفظ...", "Saving...") : t(locale, "حفظ المشروع", "Save project")}
                </PrimaryButton>
              </div>
            </Card>
          ) : null}
        </div>
      </StudioShell>
    </div>
  );
}
