"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import {
  deleteCertificationAction,
  deleteExperienceAction,
  updateSiteSettingAction,
  upsertCertificationAction,
  upsertExperienceAction,
} from "@/lib/admin-actions";
import type { CvPageContentDocument } from "@/lib/cms-documents";
import type { CvBuilderData } from "@/lib/cv-builder";
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
  SectionTitle,
  Select,
  StatusPill,
  StudioShell,
  TextArea,
  TextInput,
  useControlCenterAction,
} from "./control-center-ui";

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function joinLines(items: string[]) {
  return items.join("\n");
}

function encodeRows(rows: string[][]) {
  return rows.map((row) => row.join(" | ")).join("\n");
}

function createExperienceDraft() {
  return {
    id: `exp-${crypto.randomUUID()}`,
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    current_role: true,
    logo_media_id: "",
    role_title_ar: "",
    role_title_en: "",
    description_ar: "",
    description_en: "",
    highlights_ar: "",
    highlights_en: "",
    sort_order: 0,
    is_active: true,
  };
}

function createCertificationDraft() {
  return {
    id: `cert-${crypto.randomUUID()}`,
    issuer: "",
    issue_date: "",
    expiry_date: "",
    credential_url: "",
    certificate_media_id: "",
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    sort_order: 0,
    is_active: true,
  };
}

export function CvControlCenter({
  locale,
  snapshot,
  initialBuilder,
  cvPageContent,
}: {
  locale: Locale;
  snapshot: CmsSnapshot;
  initialBuilder: CvBuilderData;
  cvPageContent: CvPageContentDocument;
}) {
  const mediaOptions = snapshot.media_assets;
  const projectOptions = snapshot.work_projects
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((project) => ({
      id: project.id,
      title:
        snapshot.work_project_translations.find((item) => item.project_id === project.id && item.locale === locale)?.title ??
        project.slug,
    }));

  const [builder, setBuilder] = useState(initialBuilder);
  const [cvPage, setCvPage] = useState(cvPageContent);
  const [skillsText, setSkillsText] = useState(
    encodeRows(builder.skills.map((skill) => [skill.label_ar, skill.label_en, String(skill.level), skill.category])),
  );
  const [languagesText, setLanguagesText] = useState(
    encodeRows(builder.languages.map((language) => [language.label_ar, language.label_en, language.level_ar, language.level_en, String(language.proficiency)])),
  );
  const [educationText, setEducationText] = useState(
    encodeRows(builder.education.map((entry) => [entry.school_ar, entry.school_en, entry.degree_ar, entry.degree_en, entry.period, entry.details_ar, entry.details_en])),
  );
  const [linksText, setLinksText] = useState(
    encodeRows(builder.links.map((entry) => [entry.label_ar, entry.label_en, entry.url])),
  );
  const [experiences, setExperiences] = useState(() =>
    snapshot.experiences.slice().sort((a, b) => a.sort_order - b.sort_order).map((entry) => {
      const ar = snapshot.experience_translations.find((item) => item.experience_id === entry.id && item.locale === "ar");
      const en = snapshot.experience_translations.find((item) => item.experience_id === entry.id && item.locale === "en");
      return {
        id: entry.id,
        company: entry.company,
        location: entry.location,
        start_date: entry.start_date,
        end_date: entry.end_date ?? "",
        current_role: entry.current_role,
        logo_media_id: entry.logo_media_id ?? "",
        role_title_ar: ar?.role_title ?? "",
        role_title_en: en?.role_title ?? "",
        description_ar: ar?.description ?? "",
        description_en: en?.description ?? "",
        highlights_ar: joinLines(ar?.highlights_json ?? []),
        highlights_en: joinLines(en?.highlights_json ?? []),
        sort_order: entry.sort_order,
        is_active: entry.is_active,
      };
    }),
  );
  const [certifications, setCertifications] = useState(() =>
    snapshot.certifications.slice().sort((a, b) => a.sort_order - b.sort_order).map((entry) => {
      const ar = snapshot.certification_translations.find((item) => item.certification_id === entry.id && item.locale === "ar");
      const en = snapshot.certification_translations.find((item) => item.certification_id === entry.id && item.locale === "en");
      return {
        id: entry.id,
        issuer: entry.issuer,
        issue_date: entry.issue_date,
        expiry_date: entry.expiry_date ?? "",
        credential_url: entry.credential_url,
        certificate_media_id: entry.certificate_media_id ?? "",
        name_ar: ar?.name ?? "",
        name_en: en?.name ?? "",
        description_ar: ar?.description ?? "",
        description_en: en?.description ?? "",
        sort_order: entry.sort_order,
        is_active: entry.is_active,
      };
    }),
  );

  const portraitPath = builder.profile.portrait || "";
  const builderAction = useControlCenterAction(async () => {
    const nextBuilder = {
      ...builder,
      skills: lines(skillsText).map((line, index) => {
        const [label_ar, label_en, level, category] = line.split("|").map((item) => item.trim());
        return { id: builder.skills[index]?.id ?? `skill-${index + 1}`, label_ar, label_en, level: Number(level || 0), category: (category as "product" | "design" | "operations" | "tools") || "product" };
      }),
      languages: lines(languagesText).map((line, index) => {
        const [label_ar, label_en, level_ar, level_en, proficiency] = line.split("|").map((item) => item.trim());
        return { id: builder.languages[index]?.id ?? `lang-${index + 1}`, label_ar, label_en, level_ar, level_en, proficiency: Number(proficiency || 0) };
      }),
      education: lines(educationText).map((line, index) => {
        const [school_ar, school_en, degree_ar, degree_en, period, details_ar, details_en] = line.split("|").map((item) => item.trim());
        return {
          id: builder.education[index]?.id ?? `edu-${index + 1}`,
          school_ar,
          school_en,
          degree_ar,
          degree_en,
          period,
          location_ar: builder.education[index]?.location_ar ?? "",
          location_en: builder.education[index]?.location_en ?? "",
          details_ar,
          details_en,
        };
      }),
      links: lines(linksText).map((line, index) => {
        const [label_ar, label_en, url] = line.split("|").map((item) => item.trim());
        return { id: builder.links[index]?.id ?? `link-${index + 1}`, label_ar, label_en, url };
      }),
    };

    const formData = new FormData();
    formData.set("key", "cv_builder");
    formData.set("value_json", JSON.stringify(nextBuilder));
    await updateSiteSettingAction(formData);
  }, t(locale, "تم حفظ بيانات السيرة.", "CV builder saved."));

  const pageAction = useControlCenterAction(async () => {
    const formData = new FormData();
    formData.set("key", "cv_page_content");
    formData.set("value_json", JSON.stringify(cvPage));
    await updateSiteSettingAction(formData);
  }, t(locale, "تم حفظ صفحة السيرة.", "CV page content saved."));

  const experienceAction = useControlCenterAction(async (index: number) => {
    const item = experiences[index];
    const formData = new FormData();
    Object.entries({
      id: item.id,
      company: item.company,
      location: item.location,
      start_date: item.start_date,
      end_date: item.end_date,
      logo_media_id: item.logo_media_id,
      sort_order: String(item.sort_order),
      role_title_ar: item.role_title_ar,
      role_title_en: item.role_title_en,
      description_ar: item.description_ar,
      description_en: item.description_en,
      highlights_ar: item.highlights_ar,
      highlights_en: item.highlights_en,
    }).forEach(([key, value]) => value && formData.set(key, value));
    if (item.current_role) formData.set("current_role", "on");
    if (item.is_active) formData.set("is_active", "on");
    await upsertExperienceAction(formData);
  }, t(locale, "تم حفظ الخبرة.", "Experience saved."));

  const certificationAction = useControlCenterAction(async (index: number) => {
    const item = certifications[index];
    const formData = new FormData();
    Object.entries({
      id: item.id,
      issuer: item.issuer,
      issue_date: item.issue_date,
      expiry_date: item.expiry_date,
      credential_url: item.credential_url,
      certificate_media_id: item.certificate_media_id,
      name_ar: item.name_ar,
      name_en: item.name_en,
      description_ar: item.description_ar,
      description_en: item.description_en,
      sort_order: String(item.sort_order),
    }).forEach(([key, value]) => value && formData.set(key, value));
    if (item.is_active) formData.set("is_active", "on");
    await upsertCertificationAction(formData);
  }, t(locale, "تم حفظ الشهادة.", "Certification saved."));

  const deleteExperienceFlow = useControlCenterAction(async (id: string) => {
    const formData = new FormData();
    formData.set("id", id);
    await deleteExperienceAction(formData);
  }, t(locale, "تم حذف الخبرة.", "Experience deleted."));

  const deleteCertificationFlow = useControlCenterAction(async (id: string) => {
    const formData = new FormData();
    formData.set("id", id);
    await deleteCertificationAction(formData);
  }, t(locale, "تم حذف الشهادة.", "Certification deleted."));

  const pageStepsAr = useMemo(() => encodeRows(cvPage.ar.journey.steps.map((step) => [step.title, step.body, step.period ?? "", step.role ?? "", step.location ?? ""])), [cvPage.ar.journey.steps]);
  const pageStepsEn = useMemo(() => encodeRows(cvPage.en.journey.steps.map((step) => [step.title, step.body, step.period ?? "", step.role ?? "", step.location ?? ""])), [cvPage.en.journey.steps]);

  return (
    <div className="space-y-5">
      <StudioShell eyebrow={t(locale, "السيرة", "CV")} title={t(locale, "إدارة السيرة الذاتية", "CV management")} body={t(locale, "محتوى الصفحة، بيانات الملف، والخبرات والشهادات في نظام واحد.", "Page copy, profile data, experience, and certifications in one workflow.")}>
        <div className="grid gap-5">
          <Card className="space-y-4">
            <SectionTitle
              title={t(locale, "المعاينة والتصدير", "Preview and exports")}
              aside={<StatusPill tone="success" message={t(locale, "PDF و DOCX من نفس بيانات السيرة", "PDF and DOCX from the same CV data")} />}
            />
            <div className="grid gap-3 md:grid-cols-4">
              <a className="rounded-[1.2rem] border border-[var(--os-border)] bg-white/[0.06] p-4 text-sm font-semibold text-[var(--os-text-1)] transition hover:border-cyan-300/50" href={`/${locale}/cv`} target="_blank" rel="noopener noreferrer">
                {t(locale, "معاينة صفحة CV", "Preview CV page")}
              </a>
              <a className="rounded-[1.2rem] border border-[var(--os-border)] bg-white/[0.06] p-4 text-sm font-semibold text-[var(--os-text-1)] transition hover:border-cyan-300/50" href={`/api/cv-pdf?locale=${locale}&variant=branded`} target="_blank" rel="noopener noreferrer">
                {t(locale, "تنزيل PDF مصمم", "Download designed PDF")}
              </a>
              <a className="rounded-[1.2rem] border border-[var(--os-border)] bg-white/[0.06] p-4 text-sm font-semibold text-[var(--os-text-1)] transition hover:border-cyan-300/50" href={`/api/cv-pdf?locale=${locale}&variant=ats`} target="_blank" rel="noopener noreferrer">
                {t(locale, "تنزيل PDF ATS", "Download ATS PDF")}
              </a>
              <a className="rounded-[1.2rem] border border-[var(--os-border)] bg-white/[0.06] p-4 text-sm font-semibold text-[var(--os-text-1)] transition hover:border-cyan-300/50" href={`/api/cv-docx?locale=${locale}`} target="_blank" rel="noopener noreferrer">
                {t(locale, "تنزيل Word DOCX", "Download Word DOCX")}
              </a>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionTitle title={t(locale, "صفحة السيرة", "CV page copy")} aside={<StatusPill tone={pageAction.tone} message={pageAction.message} />} />
            <LocaleGrid
              ar={<BilingualPane title="Arabic" dir="rtl"><Field label={t(locale, "عنوان الرحلة", "Journey title")}><TextInput value={cvPage.ar.journey.title} onChange={(e) => setCvPage((c) => ({ ...c, ar: { ...c.ar, journey: { ...c.ar.journey, title: e.target.value } } }))} dir="rtl" /></Field><Field label={t(locale, "خطوات الرحلة", "Journey steps")} hint={t(locale, "عنوان | وصف | فترة | دور | موقع", "title | body | period | role | location")}><TextArea value={pageStepsAr} onChange={(e) => setCvPage((c) => ({ ...c, ar: { ...c.ar, journey: { ...c.ar.journey, steps: lines(e.target.value).map((line) => { const [title, body, period, role, location] = line.split("|").map((item) => item.trim()); return { title, body, period, role, location, highlights: [] }; }) } } }))} dir="rtl" /></Field><Field label={t(locale, "قسم CV", "CV section")}><TextArea value={cvPage.ar.cv.body} onChange={(e) => setCvPage((c) => ({ ...c, ar: { ...c.ar, cv: { ...c.ar.cv, body: e.target.value } } }))} dir="rtl" /></Field></BilingualPane>}
              en={<BilingualPane title="English" dir="ltr"><Field label="Journey title"><TextInput value={cvPage.en.journey.title} onChange={(e) => setCvPage((c) => ({ ...c, en: { ...c.en, journey: { ...c.en.journey, title: e.target.value } } }))} /></Field><Field label="Journey steps" hint="title | body | period | role | location"><TextArea value={pageStepsEn} onChange={(e) => setCvPage((c) => ({ ...c, en: { ...c.en, journey: { ...c.en.journey, steps: lines(e.target.value).map((line) => { const [title, body, period, role, location] = line.split("|").map((item) => item.trim()); return { title, body, period, role, location, highlights: [] }; }) } } }))} /></Field><Field label="CV section"><TextArea value={cvPage.en.cv.body} onChange={(e) => setCvPage((c) => ({ ...c, en: { ...c.en, cv: { ...c.en.cv, body: e.target.value } } }))} /></Field></BilingualPane>}
            />
            <div className="flex justify-end"><PrimaryButton disabled={pageAction.isPending} onClick={() => pageAction.run()}>{t(locale, "حفظ الصفحة", "Save page")}</PrimaryButton></div>
          </Card>

          <Card className="space-y-5">
            <SectionTitle title={t(locale, "منشئ السيرة", "CV builder")} aside={<StatusPill tone={builderAction.tone} message={builderAction.message} />} />
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                <PreviewImage src={portraitPath} alt={builder.profile.name_en || "portrait"} className="aspect-[4/5]" />
                <Field label={t(locale, "الصورة", "Portrait")}><Select value={portraitPath} onChange={(e) => setBuilder((current) => ({ ...current, profile: { ...current.profile, portrait: e.target.value } }))}><option value="">{t(locale, "بدون صورة", "No image")}</option>{mediaOptions.map((asset) => <option key={asset.id} value={asset.path}>{asset.id}</option>)}</Select></Field>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput value={builder.profile.name_ar} dir="rtl" placeholder="الاسم العربي" onChange={(e) => setBuilder((current) => ({ ...current, profile: { ...current.profile, name_ar: e.target.value } }))} />
                  <TextInput value={builder.profile.name_en} placeholder="English name" onChange={(e) => setBuilder((current) => ({ ...current, profile: { ...current.profile, name_en: e.target.value } }))} />
                  <TextInput value={builder.profile.headline_ar} dir="rtl" placeholder="العنوان العربي" onChange={(e) => setBuilder((current) => ({ ...current, profile: { ...current.profile, headline_ar: e.target.value } }))} />
                  <TextInput value={builder.profile.headline_en} placeholder="English headline" onChange={(e) => setBuilder((current) => ({ ...current, profile: { ...current.profile, headline_en: e.target.value } }))} />
                  <TextInput value={builder.profile.email} placeholder="Email" onChange={(e) => setBuilder((current) => ({ ...current, profile: { ...current.profile, email: e.target.value } }))} />
                  <TextInput value={builder.profile.phone} placeholder="Phone" onChange={(e) => setBuilder((current) => ({ ...current, profile: { ...current.profile, phone: e.target.value } }))} />
                </div>
                <TextArea value={builder.summary.body_ar} dir="rtl" placeholder="الملخص العربي" onChange={(e) => setBuilder((current) => ({ ...current, summary: { ...current.summary, body_ar: e.target.value } }))} />
                <TextArea value={builder.summary.body_en} placeholder="English summary" onChange={(e) => setBuilder((current) => ({ ...current, summary: { ...current.summary, body_en: e.target.value } }))} />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput value={builder.theme.accent} placeholder="Accent color" onChange={(e) => setBuilder((current) => ({ ...current, theme: { ...current.theme, accent: e.target.value } }))} />
                  <TextInput value={builder.theme.secondary} placeholder="Secondary color" onChange={(e) => setBuilder((current) => ({ ...current, theme: { ...current.theme, secondary: e.target.value } }))} />
                </div>
                <Field label={t(locale, "مشاريع مختارة", "Selected projects")}>
                  <div className="grid gap-2">{projectOptions.map((project) => <Checkbox key={project.id} checked={builder.selectedProjectIds.includes(project.id)} onChange={(checked) => setBuilder((current) => ({ ...current, selectedProjectIds: checked ? [...current.selectedProjectIds, project.id] : current.selectedProjectIds.filter((id) => id !== project.id) }))} label={project.title} />)}</div>
                </Field>
                <Field label={t(locale, "المهارات", "Skills")} hint={t(locale, "سطر لكل مهارة: عربي | English | level | category", "One line per skill: Arabic | English | level | category")}><TextArea value={skillsText} onChange={(e) => setSkillsText(e.target.value)} /></Field>
                <Field label={t(locale, "اللغات", "Languages")} hint={t(locale, "عربي | English | مستوى عربي | English level | proficiency", "Arabic | English | Arabic level | English level | proficiency")}><TextArea value={languagesText} onChange={(e) => setLanguagesText(e.target.value)} /></Field>
                <Field label={t(locale, "التعليم", "Education")} hint={t(locale, "School AR | School EN | Degree AR | Degree EN | Period | Details AR | Details EN", "School AR | School EN | Degree AR | Degree EN | Period | Details AR | Details EN")}><TextArea value={educationText} onChange={(e) => setEducationText(e.target.value)} /></Field>
                <Field label={t(locale, "الروابط", "Links")} hint={t(locale, "Label AR | Label EN | URL", "Label AR | Label EN | URL")}><TextArea value={linksText} onChange={(e) => setLinksText(e.target.value)} /></Field>
              </div>
            </div>
            <div className="flex justify-end"><PrimaryButton disabled={builderAction.isPending} onClick={() => builderAction.run()}>{t(locale, "حفظ بيانات السيرة", "Save builder")}</PrimaryButton></div>
          </Card>
        </div>
      </StudioShell>

      <StudioShell eyebrow={t(locale, "الخبرات والشهادات", "Records")} title={t(locale, "الخط الزمني المهني", "Professional records")} body={t(locale, "هذه السجلات تُستخدم في السيرة وفي بقية صفحات الموقع.", "These records are reused in the CV and other public sections.")}>
        <div className="grid gap-5">
          <Card className="space-y-4">
            <SectionTitle title={t(locale, "الخبرات", "Experience")} aside={<StatusPill tone={experienceAction.tone === "idle" ? deleteExperienceFlow.tone : experienceAction.tone} message={experienceAction.message || deleteExperienceFlow.message} />} />
            {experiences.map((item, index) => (
              <div key={item.id} className="grid gap-3 rounded-[1.3rem] border border-white/8 bg-black/10 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <TextInput value={item.company} placeholder="Company" onChange={(e) => setExperiences((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, company: e.target.value } : entry))} />
                  <TextInput value={item.location} placeholder="Location" onChange={(e) => setExperiences((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, location: e.target.value } : entry))} />
                  <Select value={item.logo_media_id} onChange={(e) => setExperiences((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, logo_media_id: e.target.value } : entry))}><option value="">{t(locale, "بدون شعار", "No logo")}</option>{mediaOptions.map((asset) => <option key={asset.id} value={asset.id}>{asset.id}</option>)}</Select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextArea value={item.description_ar} dir="rtl" placeholder="الوصف العربي" onChange={(e) => setExperiences((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description_ar: e.target.value } : entry))} />
                  <TextArea value={item.description_en} placeholder="English description" onChange={(e) => setExperiences((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description_en: e.target.value } : entry))} />
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="flex flex-wrap gap-2"><Checkbox checked={item.current_role} onChange={(checked) => setExperiences((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, current_role: checked } : entry))} label={t(locale, "حالي", "Current")} /><Checkbox checked={item.is_active} onChange={(checked) => setExperiences((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, is_active: checked } : entry))} label={t(locale, "نشط", "Active")} /></div>
                  <div className="flex flex-wrap gap-2"><DangerButton onClick={() => { deleteExperienceFlow.run(item.id); setExperiences((current) => current.filter((entry) => entry.id !== item.id)); }}>{t(locale, "حذف", "Delete")}</DangerButton><PrimaryButton onClick={() => experienceAction.run(index)}>{t(locale, "حفظ", "Save")}</PrimaryButton></div>
                </div>
              </div>
            ))}
            <PrimaryButton onClick={() => setExperiences((current) => [...current, createExperienceDraft()])}><Plus className="me-2 h-4 w-4" />{t(locale, "إضافة خبرة", "Add experience")}</PrimaryButton>
          </Card>

          <Card className="space-y-4">
            <SectionTitle title={t(locale, "الشهادات", "Certifications")} aside={<StatusPill tone={certificationAction.tone === "idle" ? deleteCertificationFlow.tone : certificationAction.tone} message={certificationAction.message || deleteCertificationFlow.message} />} />
            {certifications.map((item, index) => (
              <div key={item.id} className="grid gap-3 rounded-[1.3rem] border border-white/8 bg-black/10 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <TextInput value={item.issuer} placeholder="Issuer" onChange={(e) => setCertifications((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, issuer: e.target.value } : entry))} />
                  <TextInput type="date" value={item.issue_date} onChange={(e) => setCertifications((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, issue_date: e.target.value } : entry))} />
                  <Select value={item.certificate_media_id} onChange={(e) => setCertifications((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, certificate_media_id: e.target.value } : entry))}><option value="">{t(locale, "بدون ملف", "No asset")}</option>{mediaOptions.map((asset) => <option key={asset.id} value={asset.id}>{asset.id}</option>)}</Select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextArea value={item.description_ar} dir="rtl" placeholder="الوصف العربي" onChange={(e) => setCertifications((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description_ar: e.target.value } : entry))} />
                  <TextArea value={item.description_en} placeholder="English description" onChange={(e) => setCertifications((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description_en: e.target.value } : entry))} />
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <Checkbox checked={item.is_active} onChange={(checked) => setCertifications((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, is_active: checked } : entry))} label={t(locale, "نشط", "Active")} />
                  <div className="flex flex-wrap gap-2"><DangerButton onClick={() => { deleteCertificationFlow.run(item.id); setCertifications((current) => current.filter((entry) => entry.id !== item.id)); }}>{t(locale, "حذف", "Delete")}</DangerButton><PrimaryButton onClick={() => certificationAction.run(index)}>{t(locale, "حفظ", "Save")}</PrimaryButton></div>
                </div>
              </div>
            ))}
            <PrimaryButton onClick={() => setCertifications((current) => [...current, createCertificationDraft()])}><Plus className="me-2 h-4 w-4" />{t(locale, "إضافة شهادة", "Add certification")}</PrimaryButton>
          </Card>
        </div>
      </StudioShell>
    </div>
  );
}
