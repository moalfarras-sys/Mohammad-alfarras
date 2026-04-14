"use client";

import { useDeferredValue, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { Download, Eye, Layers3, Plus, Sparkles, Trash2 } from "lucide-react";

import { CvStudioPreview } from "@/components/site/cv-studio-preview";
import { updateSiteSettingAction } from "@/lib/admin-actions";
import {
  createDefaultCvBuilder,
  type CvBuilderData,
  type CvBuilderEducation,
  type CvBuilderExperience,
  type CvBuilderLanguage,
  type CvBuilderLink,
  type CvBuilderSkill,
} from "@/lib/cv-builder";
import { buildCvPresentationModel, getCvDownloadLinks } from "@/lib/cv-presenter";
import type { CmsSnapshot, Locale } from "@/types/cms";

type Props = { locale: Locale; snapshot: CmsSnapshot; initialData: CvBuilderData };
type StudioTab =
  | "profile"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "projects"
  | "theme"
  | "export";

type DownloadLinks = ReturnType<typeof getCvDownloadLinks>;
type SetData = Dispatch<SetStateAction<CvBuilderData>>;

const tabs: Record<Locale, { id: StudioTab; label: string; hint: string }[]> = {
  ar: [
    { id: "profile", label: "الهوية", hint: "الاسم والصورة وبيانات التواصل" },
    { id: "summary", label: "الملخص", hint: "التموضع والرسالة المختصرة" },
    { id: "experience", label: "الخبرات", hint: "تايم لاين الخبرات والوصف" },
    { id: "education", label: "التعليم", hint: "المحطات التعليمية والتفاصيل" },
    { id: "skills", label: "المهارات", hint: "المهارات ونسب القوة" },
    { id: "languages", label: "اللغات", hint: "اللغات ومستوى الإتقان" },
    { id: "projects", label: "الأعمال", hint: "ربط المشاريع وروابط السيرة" },
    { id: "theme", label: "الثيم", hint: "القالب والألوان وخيارات العرض" },
    { id: "export", label: "التصدير", hint: "PDF والرابط العام" },
  ],
  en: [
    { id: "profile", label: "Profile", hint: "Identity, portrait, and contact" },
    { id: "summary", label: "Summary", hint: "Positioning and narrative" },
    { id: "experience", label: "Experience", hint: "Timeline and role copy" },
    { id: "education", label: "Education", hint: "Academic milestones" },
    { id: "skills", label: "Skills", hint: "Strengths and proficiency" },
    { id: "languages", label: "Languages", hint: "Languages and fluency" },
    { id: "projects", label: "Projects", hint: "Selected work and CV links" },
    { id: "theme", label: "Theme", hint: "Template and visual tuning" },
    { id: "export", label: "Export", hint: "PDF and public route" },
  ],
};

const t = (locale: Locale, ar: string, en: string) => (locale === "ar" ? ar : en);
const linesToText = (items: string[]) => items.join("\n");
const textToLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

function createSkill(): CvBuilderSkill {
  return { id: `skill-${crypto.randomUUID()}`, label_ar: "", label_en: "", level: 80, category: "tools" };
}

function createLanguage(): CvBuilderLanguage {
  return {
    id: `lang-${crypto.randomUUID()}`,
    label_ar: "",
    label_en: "",
    level_ar: "",
    level_en: "",
    proficiency: 80,
  };
}

function createEducation(): CvBuilderEducation {
  return {
    id: `edu-${crypto.randomUUID()}`,
    school_ar: "",
    school_en: "",
    degree_ar: "",
    degree_en: "",
    period: "",
    location_ar: "",
    location_en: "",
    details_ar: "",
    details_en: "",
  };
}

function createLink(): CvBuilderLink {
  return { id: `link-${crypto.randomUUID()}`, label_ar: "", label_en: "", url: "" };
}

function createExperience(): CvBuilderExperience {
  return {
    id: `exp-${crypto.randomUUID()}`,
    company: "",
    role_ar: "",
    role_en: "",
    period_ar: "",
    period_en: "",
    location_ar: "",
    location_en: "",
    summary_ar: "",
    summary_en: "",
    highlights_ar: [],
    highlights_en: [],
  };
}

export function CvBuilderStudio({ locale, snapshot, initialData }: Props) {
  const [activeTab, setActiveTab] = useState<StudioTab>("profile");
  const [variant, setVariant] = useState<"branded" | "ats">(initialData.theme.defaultVariant);
  const [data, setData] = useState<CvBuilderData>(initialData);
  const deferredData = useDeferredValue(data);

  const cvPreview = useMemo(
    () => buildCvPresentationModel(snapshot, locale, deferredData),
    [snapshot, locale, deferredData],
  );
  const downloadLinks = useMemo(() => getCvDownloadLinks(locale, variant), [locale, variant]);
  const projectOptions = useMemo(
    () =>
      snapshot.work_projects
        .filter((project) => project.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((project) => {
          const translation = snapshot.work_project_translations.find(
            (item) => item.project_id === project.id && item.locale === locale,
          );
          return { id: project.id, title: translation?.title ?? project.slug, summary: translation?.summary ?? "" };
        }),
    [snapshot, locale],
  );

  const currentTab = tabs[locale].find((tab) => tab.id === activeTab) ?? tabs[locale][0];

  return (
    <section id="studio" className="space-y-5">
      <div className="admin-studio-shell">
        <div className="admin-studio-header">
          <div className="space-y-3">
            <span className="admin-eyebrow">CV Studio</span>
            <h2>
              {t(
                locale,
                "لوحة سيرة حية مرتبطة مباشرة بالصفحة العامة وملفات PDF",
                "A live CV studio connected to the public page and PDF exports",
              )}
            </h2>
            <p>
              {t(
                locale,
                "عدّل السيرة من مكان واحد، وشاهد نفس البيانات داخل الصفحة العامة ونسخ التصدير الاحترافية.",
                "Edit the CV from one place and preview the same data powering the live page and premium exports.",
              )}
            </p>
          </div>

          <form action={updateSiteSettingAction} className="admin-studio-actions">
            <input type="hidden" name="key" value="cv_builder" />
            <textarea name="value_json" readOnly value={JSON.stringify(data)} className="sr-only" />
            <button type="submit">{t(locale, "حفظ السيرة", "Save CV")}</button>
            <button
              type="button"
              onClick={() => setData(createDefaultCvBuilder(snapshot))}
              className="admin-secondary-button"
            >
              {t(locale, "استعادة الافتراضي", "Reset defaults")}
            </button>
          </form>
        </div>

        <div className="grid gap-4 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 lg:grid-cols-[0.34fr_0.66fr]">
          <div className="space-y-3">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(0,255,135,0.10)] text-[var(--primary)]">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground">{currentTab.label}</div>
                  <div className="text-xs leading-6 text-foreground-muted">{currentTab.hint}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              {tabs[locale].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    tab.id === activeTab
                      ? "rounded-[1.35rem] border border-[rgba(0,255,135,0.25)] bg-[rgba(0,255,135,0.08)] px-4 py-3 text-start text-foreground shadow-[0_18px_40px_rgba(0,255,135,0.07)]"
                      : "rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-start text-foreground-muted transition hover:bg-white/[0.05] hover:text-foreground"
                  }
                >
                  <div className="text-sm font-black">{tab.label}</div>
                  <div className="mt-1 text-xs leading-6">{tab.hint}</div>
                </button>
              ))}
            </div>

            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--primary)]">
                {t(locale, "اختصارات", "Quick actions")}
              </div>
              <div className="mt-3 grid gap-2">
                <Link
                  href={`/${locale}/admin/projects`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  {t(locale, "فتح Projects Studio", "Open Projects Studio")}
                </Link>
                <Link
                  href={`/${locale}/cv`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
                >
                  <Eye className="h-4 w-4" />
                  {t(locale, "فتح صفحة السيرة", "Open public CV")}
                </Link>
                <Link
                  href={downloadLinks.current}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
                >
                  <Download className="h-4 w-4" />
                  {t(locale, "تحميل النسخة الحالية", "Download current PDF")}
                </Link>
              </div>
            </div>
          </div>

          <div className="admin-studio-grid !mt-0 !grid-cols-1 xl:!grid-cols-[0.88fr_1.12fr]">
            <div className="admin-studio-editor">
              {activeTab === "profile" ? <ProfileEditor locale={locale} data={data} setData={setData} /> : null}
              {activeTab === "summary" ? <SummaryEditor locale={locale} data={data} setData={setData} /> : null}
              {activeTab === "experience" ? <ExperienceEditor locale={locale} data={data} setData={setData} /> : null}
              {activeTab === "education" ? <EducationEditor locale={locale} data={data} setData={setData} /> : null}
              {activeTab === "skills" ? <SkillsEditor locale={locale} data={data} setData={setData} /> : null}
              {activeTab === "languages" ? <LanguagesEditor locale={locale} data={data} setData={setData} /> : null}
              {activeTab === "projects" ? (
                <ProjectsEditor locale={locale} data={data} setData={setData} projectOptions={projectOptions} />
              ) : null}
              {activeTab === "theme" ? (
                <ThemeEditor locale={locale} data={data} setData={setData} setVariant={setVariant} />
              ) : null}
              {activeTab === "export" ? (
                <ExportEditor locale={locale} variant={variant} setVariant={setVariant} downloadLinks={downloadLinks} />
              ) : null}
            </div>

            <div className="admin-studio-preview-column">
              <div className="admin-preview-toolbar">
                <div>
                  <strong>{t(locale, "المعاينة الحية", "Live preview")}</strong>
                  <p>{t(locale, "هذه هي نفس بيانات النشر وملفات PDF.", "This preview uses the same data shipped to the site and PDFs.")}</p>
                </div>
                <div className="admin-variant-toggle">
                  <button type="button" className={variant === "branded" ? "active" : ""} onClick={() => setVariant("branded")}>
                    <Sparkles className="h-4 w-4" />
                    Branded
                  </button>
                  <button type="button" className={variant === "ats" ? "active" : ""} onClick={() => setVariant("ats")}>
                    ATS
                  </button>
                </div>
              </div>
              <CvStudioPreview cv={cvPreview} variant={variant} compact downloadLinks={downloadLinks} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({
  locale,
  titleAr,
  titleEn,
  bodyAr,
  bodyEn,
}: {
  locale: Locale;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}) {
  return (
    <div className="mb-4 space-y-2">
      <h3 className="text-lg font-black text-foreground">{t(locale, titleAr, titleEn)}</h3>
      <p className="text-sm leading-7 text-foreground-muted">{t(locale, bodyAr, bodyEn)}</p>
    </div>
  );
}

function ProfileEditor({ locale, data, setData }: { locale: Locale; data: CvBuilderData; setData: SetData }) {
  const profile = data.profile;
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="هوية السيرة"
        titleEn="CV identity"
        bodyAr="هذا القسم هو أول انطباع: الاسم، الصورة، العنوان، ومعلومات الوصول السريعة."
        bodyEn="This section controls the first impression: name, portrait, headline, and fast contact details."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field locale={locale} labelAr="الاسم بالعربية" labelEn="Arabic name" value={profile.name_ar} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, name_ar: value } }))} />
        <Field locale={locale} labelAr="الاسم بالإنجليزية" labelEn="English name" value={profile.name_en} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, name_en: value } }))} />
        <Field locale={locale} labelAr="العنوان بالعربية" labelEn="Arabic headline" value={profile.headline_ar} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, headline_ar: value } }))} />
        <Field locale={locale} labelAr="العنوان بالإنجليزية" labelEn="English headline" value={profile.headline_en} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, headline_en: value } }))} />
        <Field locale={locale} labelAr="الموقع بالعربية" labelEn="Arabic location" value={profile.location_ar} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, location_ar: value } }))} />
        <Field locale={locale} labelAr="الموقع بالإنجليزية" labelEn="English location" value={profile.location_en} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, location_en: value } }))} />
        <Field locale={locale} labelAr="الإتاحة بالعربية" labelEn="Arabic availability" value={profile.availability_ar} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, availability_ar: value } }))} />
        <Field locale={locale} labelAr="الإتاحة بالإنجليزية" labelEn="English availability" value={profile.availability_en} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, availability_en: value } }))} />
        <Field locale={locale} labelAr="البريد" labelEn="Email" value={profile.email} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, email: value } }))} />
        <Field locale={locale} labelAr="الهاتف" labelEn="Phone" value={profile.phone} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, phone: value } }))} />
        <Field locale={locale} labelAr="الموقع" labelEn="Website" value={profile.website} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, website: value } }))} />
        <Field locale={locale} labelAr="رابط الصورة" labelEn="Portrait URL" value={profile.portrait} onChange={(value) => setData((current) => ({ ...current, profile: { ...current.profile, portrait: value } }))} />
      </div>
    </div>
  );
}

function SummaryEditor({ locale, data, setData }: { locale: Locale; data: CvBuilderData; setData: SetData }) {
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="الملخص التنفيذي"
        titleEn="Executive summary"
        bodyAr="اكتب تموضعاً واضحاً ومقنعاً. هذا النص يجب أن يشرح لماذا هذه السيرة مختلفة."
        bodyEn="Write a clear positioning statement. This copy should explain why this CV stands out."
      />
      <RepeaterTextarea
        locale={locale}
        labelAr="الملخص بالعربية"
        labelEn="Arabic summary"
        value={data.summary.body_ar}
        onChange={(value) => setData((current) => ({ ...current, summary: { ...current.summary, body_ar: value } }))}
      />
      <RepeaterTextarea
        locale={locale}
        labelAr="الملخص بالإنجليزية"
        labelEn="English summary"
        value={data.summary.body_en}
        onChange={(value) => setData((current) => ({ ...current, summary: { ...current.summary, body_en: value } }))}
      />
    </div>
  );
}

function ExperienceEditor({ locale, data, setData }: { locale: Locale; data: CvBuilderData; setData: SetData }) {
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="الخبرات"
        titleEn="Experience"
        bodyAr="رتّب الخبرات كتايم لاين حقيقي. كل عنصر هنا يظهر مباشرة داخل الصفحة وملفات PDF."
        bodyEn="Arrange experience as a real timeline. Every item here appears directly in the page and PDF exports."
      />
      <button
        type="button"
        onClick={() => setData((current) => ({ ...current, experience: [...current.experience, createExperience()] }))}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
      >
        <Plus className="h-4 w-4" />
        {t(locale, "إضافة خبرة", "Add experience")}
      </button>
      <div className="space-y-4">
        {data.experience.map((entry, index) => (
          <CardShell
            key={entry.id}
            locale={locale}
            title={entry.company || t(locale, `خبرة ${index + 1}`, `Experience ${index + 1}`)}
            onRemove={() =>
              setData((current) => ({
                ...current,
                experience: current.experience.filter((item) => item.id !== entry.id),
              }))
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field locale={locale} labelAr="الشركة" labelEn="Company" value={entry.company} onChange={(value) => updateExperience(setData, entry.id, { company: value })} />
              <Field locale={locale} labelAr="المسمى بالعربية" labelEn="Arabic role" value={entry.role_ar} onChange={(value) => updateExperience(setData, entry.id, { role_ar: value })} />
              <Field locale={locale} labelAr="المسمى بالإنجليزية" labelEn="English role" value={entry.role_en} onChange={(value) => updateExperience(setData, entry.id, { role_en: value })} />
              <Field locale={locale} labelAr="الفترة بالعربية" labelEn="Arabic period" value={entry.period_ar} onChange={(value) => updateExperience(setData, entry.id, { period_ar: value })} />
              <Field locale={locale} labelAr="الفترة بالإنجليزية" labelEn="English period" value={entry.period_en} onChange={(value) => updateExperience(setData, entry.id, { period_en: value })} />
              <Field locale={locale} labelAr="المكان بالعربية" labelEn="Arabic location" value={entry.location_ar} onChange={(value) => updateExperience(setData, entry.id, { location_ar: value })} />
              <Field locale={locale} labelAr="المكان بالإنجليزية" labelEn="English location" value={entry.location_en} onChange={(value) => updateExperience(setData, entry.id, { location_en: value })} />
            </div>
            <div className="mt-4 grid gap-4">
              <RepeaterTextarea locale={locale} labelAr="الوصف بالعربية" labelEn="Arabic summary" value={entry.summary_ar} onChange={(value) => updateExperience(setData, entry.id, { summary_ar: value })} />
              <RepeaterTextarea locale={locale} labelAr="الوصف بالإنجليزية" labelEn="English summary" value={entry.summary_en} onChange={(value) => updateExperience(setData, entry.id, { summary_en: value })} />
              <RepeaterTextarea locale={locale} labelAr="Highlights بالعربية" labelEn="Arabic highlights" value={linesToText(entry.highlights_ar)} onChange={(value) => updateExperience(setData, entry.id, { highlights_ar: textToLines(value) })} />
              <RepeaterTextarea locale={locale} labelAr="Highlights بالإنجليزية" labelEn="English highlights" value={linesToText(entry.highlights_en)} onChange={(value) => updateExperience(setData, entry.id, { highlights_en: textToLines(value) })} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

function EducationEditor({ locale, data, setData }: { locale: Locale; data: CvBuilderData; setData: SetData }) {
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="التعليم"
        titleEn="Education"
        bodyAr="أظهر المحطات التعليمية والبرامج المهنية التي تعزز القيمة العملية للسيرة."
        bodyEn="Show the educational milestones and professional tracks that strengthen the CV."
      />
      <button
        type="button"
        onClick={() => setData((current) => ({ ...current, education: [...current.education, createEducation()] }))}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
      >
        <Plus className="h-4 w-4" />
        {t(locale, "إضافة محطة تعليمية", "Add education item")}
      </button>
      <div className="space-y-4">
        {data.education.map((entry, index) => (
          <CardShell
            key={entry.id}
            locale={locale}
            title={entry.school_en || t(locale, `تعليم ${index + 1}`, `Education ${index + 1}`)}
            onRemove={() =>
              setData((current) => ({
                ...current,
                education: current.education.filter((item) => item.id !== entry.id),
              }))
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field locale={locale} labelAr="الجهة بالعربية" labelEn="Arabic school" value={entry.school_ar} onChange={(value) => updateEducation(setData, entry.id, { school_ar: value })} />
              <Field locale={locale} labelAr="الجهة بالإنجليزية" labelEn="English school" value={entry.school_en} onChange={(value) => updateEducation(setData, entry.id, { school_en: value })} />
              <Field locale={locale} labelAr="العنوان بالعربية" labelEn="Arabic degree" value={entry.degree_ar} onChange={(value) => updateEducation(setData, entry.id, { degree_ar: value })} />
              <Field locale={locale} labelAr="العنوان بالإنجليزية" labelEn="English degree" value={entry.degree_en} onChange={(value) => updateEducation(setData, entry.id, { degree_en: value })} />
              <Field locale={locale} labelAr="الفترة" labelEn="Period" value={entry.period} onChange={(value) => updateEducation(setData, entry.id, { period: value })} />
              <Field locale={locale} labelAr="المكان بالعربية" labelEn="Arabic location" value={entry.location_ar} onChange={(value) => updateEducation(setData, entry.id, { location_ar: value })} />
              <Field locale={locale} labelAr="المكان بالإنجليزية" labelEn="English location" value={entry.location_en} onChange={(value) => updateEducation(setData, entry.id, { location_en: value })} />
            </div>
            <div className="mt-4 grid gap-4">
              <RepeaterTextarea locale={locale} labelAr="التفاصيل بالعربية" labelEn="Arabic details" value={entry.details_ar} onChange={(value) => updateEducation(setData, entry.id, { details_ar: value })} />
              <RepeaterTextarea locale={locale} labelAr="التفاصيل بالإنجليزية" labelEn="English details" value={entry.details_en} onChange={(value) => updateEducation(setData, entry.id, { details_en: value })} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

function SkillsEditor({ locale, data, setData }: { locale: Locale; data: CvBuilderData; setData: SetData }) {
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="المهارات"
        titleEn="Skills"
        bodyAr="هذه الأشرطة تظهر في الصفحة العامة والـ PDF. اجعل النسب واقعية ومنظمة حسب نوع المهارة."
        bodyEn="These bars appear in the live page and the PDF. Keep them realistic and categorized."
      />
      <button
        type="button"
        onClick={() => setData((current) => ({ ...current, skills: [...current.skills, createSkill()] }))}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
      >
        <Plus className="h-4 w-4" />
        {t(locale, "إضافة مهارة", "Add skill")}
      </button>
      <div className="space-y-4">
        {data.skills.map((skill, index) => (
          <CardShell
            key={skill.id}
            locale={locale}
            title={skill.label_en || t(locale, `مهارة ${index + 1}`, `Skill ${index + 1}`)}
            onRemove={() =>
              setData((current) => ({
                ...current,
                skills: current.skills.filter((item) => item.id !== skill.id),
              }))
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field locale={locale} labelAr="الاسم بالعربية" labelEn="Arabic label" value={skill.label_ar} onChange={(value) => updateSkill(setData, skill.id, { label_ar: value })} />
              <Field locale={locale} labelAr="الاسم بالإنجليزية" labelEn="English label" value={skill.label_en} onChange={(value) => updateSkill(setData, skill.id, { label_en: value })} />
              <RangeField locale={locale} labelAr="القوة" labelEn="Level" value={skill.level} onChange={(value) => updateSkill(setData, skill.id, { level: value })} />
              <SelectField
                locale={locale}
                labelAr="التصنيف"
                labelEn="Category"
                value={skill.category}
                options={[
                  { value: "product", label: "Product" },
                  { value: "design", label: "Design" },
                  { value: "operations", label: "Operations" },
                  { value: "tools", label: "Tools" },
                ]}
                onChange={(value) => updateSkill(setData, skill.id, { category: value as CvBuilderSkill["category"] })}
              />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

function LanguagesEditor({ locale, data, setData }: { locale: Locale; data: CvBuilderData; setData: SetData }) {
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="اللغات"
        titleEn="Languages"
        bodyAr="يمكنك تحديد الاسم، الوصف، والنسبة لكل لغة. ستظهر في الصفحة والـ PDF."
        bodyEn="Set the name, fluency label, and percentage for every language. They appear in the page and the PDF."
      />
      <button
        type="button"
        onClick={() => setData((current) => ({ ...current, languages: [...current.languages, createLanguage()] }))}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
      >
        <Plus className="h-4 w-4" />
        {t(locale, "إضافة لغة", "Add language")}
      </button>
      <div className="space-y-4">
        {data.languages.map((language, index) => (
          <CardShell
            key={language.id}
            locale={locale}
            title={language.label_en || t(locale, `لغة ${index + 1}`, `Language ${index + 1}`)}
            onRemove={() =>
              setData((current) => ({
                ...current,
                languages: current.languages.filter((item) => item.id !== language.id),
              }))
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field locale={locale} labelAr="الاسم بالعربية" labelEn="Arabic label" value={language.label_ar} onChange={(value) => updateLanguage(setData, language.id, { label_ar: value })} />
              <Field locale={locale} labelAr="الاسم بالإنجليزية" labelEn="English label" value={language.label_en} onChange={(value) => updateLanguage(setData, language.id, { label_en: value })} />
              <Field locale={locale} labelAr="المستوى بالعربية" labelEn="Arabic level" value={language.level_ar} onChange={(value) => updateLanguage(setData, language.id, { level_ar: value })} />
              <Field locale={locale} labelAr="المستوى بالإنجليزية" labelEn="English level" value={language.level_en} onChange={(value) => updateLanguage(setData, language.id, { level_en: value })} />
              <RangeField locale={locale} labelAr="نسبة الإتقان" labelEn="Proficiency" value={language.proficiency} onChange={(value) => updateLanguage(setData, language.id, { proficiency: value })} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

function ProjectsEditor({
  locale,
  data,
  setData,
  projectOptions,
}: {
  locale: Locale;
  data: CvBuilderData;
  setData: SetData;
  projectOptions: { id: string; title: string; summary: string }[];
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="الأعمال والروابط"
        titleEn="Projects and links"
        bodyAr="اختر أي المشاريع يجب أن تظهر داخل السيرة، وأضف الروابط التي تريدها في الهيدر والـ PDF."
        bodyEn="Choose which projects appear in the CV and manage the links shown in the header and PDF."
      />
      <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
        <div className="mb-3 text-sm font-black text-foreground">{t(locale, "المشاريع المختارة", "Selected projects")}</div>
        <div className="grid gap-2">
          {projectOptions.map((project) => {
            const active = data.selectedProjectIds.includes(project.id);
            return (
              <label key={project.id} className="flex cursor-pointer items-start gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.02] p-3">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      selectedProjectIds: event.target.checked
                        ? [...current.selectedProjectIds, project.id]
                        : current.selectedProjectIds.filter((id) => id !== project.id),
                    }))
                  }
                />
                <div>
                  <div className="text-sm font-bold text-foreground">{project.title}</div>
                  <div className="mt-1 text-xs leading-6 text-foreground-muted">{project.summary}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setData((current) => ({ ...current, links: [...current.links, createLink()] }))}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground"
      >
        <Plus className="h-4 w-4" />
        {t(locale, "إضافة رابط", "Add link")}
      </button>

      <div className="space-y-4">
        {data.links.map((link, index) => (
          <CardShell
            key={link.id}
            locale={locale}
            title={link.label_en || t(locale, `رابط ${index + 1}`, `Link ${index + 1}`)}
            onRemove={() =>
              setData((current) => ({
                ...current,
                links: current.links.filter((item) => item.id !== link.id),
              }))
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field locale={locale} labelAr="التسمية بالعربية" labelEn="Arabic label" value={link.label_ar} onChange={(value) => updateLink(setData, link.id, { label_ar: value })} />
              <Field locale={locale} labelAr="التسمية بالإنجليزية" labelEn="English label" value={link.label_en} onChange={(value) => updateLink(setData, link.id, { label_en: value })} />
              <Field locale={locale} labelAr="الرابط" labelEn="URL" value={link.url} onChange={(value) => updateLink(setData, link.id, { url: value })} />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}

function ThemeEditor({
  locale,
  data,
  setData,
  setVariant,
}: {
  locale: Locale;
  data: CvBuilderData;
  setData: SetData;
  setVariant: Dispatch<SetStateAction<"branded" | "ats">>;
}) {
  const theme = data.theme;
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="الثيم"
        titleEn="Theme"
        bodyAr="تحكم بالقالب، الألوان، مساحة التنفس، وإظهار الصورة والعدادات."
        bodyEn="Control the template, colors, spacing scale, and whether the portrait and metrics are shown."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          locale={locale}
          labelAr="القالب"
          labelEn="Template"
          value={theme.template}
          options={[
            { value: "signal", label: "Signal" },
            { value: "studio", label: "Studio" },
            { value: "minimal", label: "Minimal" },
          ]}
          onChange={(value) =>
            setData((current) => ({
              ...current,
              theme: { ...current.theme, template: value as CvBuilderData["theme"]["template"] },
            }))
          }
        />
        <SelectField
          locale={locale}
          labelAr="المقياس"
          labelEn="Layout scale"
          value={theme.layoutScale}
          options={[
            { value: "compact", label: "Compact" },
            { value: "balanced", label: "Balanced" },
            { value: "airy", label: "Airy" },
          ]}
          onChange={(value) =>
            setData((current) => ({
              ...current,
              theme: { ...current.theme, layoutScale: value as CvBuilderData["theme"]["layoutScale"] },
            }))
          }
        />
        <ColorField locale={locale} labelAr="اللون الأساسي" labelEn="Accent color" value={theme.accent} onChange={(value) => setData((current) => ({ ...current, theme: { ...current.theme, accent: value } }))} />
        <ColorField locale={locale} labelAr="اللون الثانوي" labelEn="Secondary color" value={theme.secondary} onChange={(value) => setData((current) => ({ ...current, theme: { ...current.theme, secondary: value } }))} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleCard locale={locale} labelAr="إظهار الصورة" labelEn="Show portrait" checked={theme.showPhoto} onChange={(checked) => setData((current) => ({ ...current, theme: { ...current.theme, showPhoto: checked } }))} />
        <ToggleCard locale={locale} labelAr="إظهار العدادات" labelEn="Show metrics" checked={theme.showMetrics} onChange={(checked) => setData((current) => ({ ...current, theme: { ...current.theme, showMetrics: checked } }))} />
      </div>
      <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
        <div className="text-sm font-black text-foreground">{t(locale, "النسخة الافتراضية", "Default export mode")}</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className={theme.defaultVariant === "branded" ? "button-primary-shell" : "button-secondary-shell"}
            onClick={() => {
              setData((current) => ({ ...current, theme: { ...current.theme, defaultVariant: "branded" } }));
              setVariant("branded");
            }}
          >
            Branded
          </button>
          <button
            type="button"
            className={theme.defaultVariant === "ats" ? "button-primary-shell" : "button-secondary-shell"}
            onClick={() => {
              setData((current) => ({ ...current, theme: { ...current.theme, defaultVariant: "ats" } }));
              setVariant("ats");
            }}
          >
            ATS
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportEditor({
  locale,
  variant,
  setVariant,
  downloadLinks,
}: {
  locale: Locale;
  variant: "branded" | "ats";
  setVariant: Dispatch<SetStateAction<"branded" | "ats">>;
  downloadLinks: DownloadLinks;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        locale={locale}
        titleAr="التصدير والروابط"
        titleEn="Export and routes"
        bodyAr="اختر نوع ملف الـ PDF، وافتح الصفحة العامة أو حمّل النسخ الجاهزة مباشرة."
        bodyEn="Choose the PDF mode, open the public page, or download the ready exports directly."
      />
      <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
        <div className="text-sm font-black text-foreground">{t(locale, "نوع المعاينة الحالية", "Current preview mode")}</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className={variant === "branded" ? "button-primary-shell" : "button-secondary-shell"} onClick={() => setVariant("branded")}>
            Branded
          </button>
          <button type="button" className={variant === "ats" ? "button-primary-shell" : "button-secondary-shell"} onClick={() => setVariant("ats")}>
            ATS
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href={`/${locale}/cv`} target="_blank" className="button-secondary-shell justify-center">
          <Eye className="h-4 w-4" />
          {t(locale, "فتح الصفحة العامة", "Open public page")}
        </Link>
        <Link href={downloadLinks.current} target="_blank" className="button-primary-shell justify-center">
          <Download className="h-4 w-4" />
          {t(locale, "تحميل النسخة الحالية", "Download current PDF")}
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href={downloadLinks.branded_ar} target="_blank" className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-bold text-foreground">Arabic Branded</Link>
        <Link href={downloadLinks.branded_en} target="_blank" className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-bold text-foreground">English Branded</Link>
        <Link href={downloadLinks.ats_ar} target="_blank" className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-bold text-foreground">Arabic ATS</Link>
        <Link href={downloadLinks.ats_en} target="_blank" className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-bold text-foreground">English ATS</Link>
      </div>
    </div>
  );
}

function CardShell({
  locale,
  title,
  onRemove,
  children,
}: {
  locale: Locale;
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-foreground">{title}</div>
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/8 px-3 py-1.5 text-xs font-bold text-red-200">
          <Trash2 className="h-3.5 w-3.5" />
          {t(locale, "حذف", "Remove")}
        </button>
      </div>
      {children}
    </article>
  );
}

function Field({
  locale,
  labelAr,
  labelEn,
  value,
  onChange,
}: {
  locale: Locale;
  labelAr: string;
  labelEn: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground-muted">{t(locale, labelAr, labelEn)}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  locale,
  labelAr,
  labelEn,
  value,
  options,
  onChange,
}: {
  locale: Locale;
  labelAr: string;
  labelEn: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground-muted">{t(locale, labelAr, labelEn)}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeField({
  locale,
  labelAr,
  labelEn,
  value,
  onChange,
}: {
  locale: Locale;
  labelAr: string;
  labelEn: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground-muted">
        {t(locale, labelAr, labelEn)} <strong className="text-foreground">{value}%</strong>
      </span>
      <input type="range" min={20} max={100} step={1} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function ColorField({
  locale,
  labelAr,
  labelEn,
  value,
  onChange,
}: {
  locale: Locale;
  labelAr: string;
  labelEn: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground-muted">{t(locale, labelAr, labelEn)}</span>
      <div className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.03] px-3 py-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-14 rounded-lg border-0 bg-transparent p-0" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="border-0 bg-transparent p-0 text-sm text-foreground focus:outline-none" />
      </div>
    </label>
  );
}

function ToggleCard({
  locale,
  labelAr,
  labelEn,
  checked,
  onChange,
}: {
  locale: Locale;
  labelAr: string;
  labelEn: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <span className="text-sm font-bold text-foreground">{t(locale, labelAr, labelEn)}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function updateExperience(setData: SetData, id: string, patch: Partial<CvBuilderExperience>) {
  setData((current) => ({
    ...current,
    experience: current.experience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

function updateEducation(setData: SetData, id: string, patch: Partial<CvBuilderEducation>) {
  setData((current) => ({
    ...current,
    education: current.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

function updateSkill(setData: SetData, id: string, patch: Partial<CvBuilderSkill>) {
  setData((current) => ({
    ...current,
    skills: current.skills.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

function updateLanguage(setData: SetData, id: string, patch: Partial<CvBuilderLanguage>) {
  setData((current) => ({
    ...current,
    languages: current.languages.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

function updateLink(setData: SetData, id: string, patch: Partial<CvBuilderLink>) {
  setData((current) => ({
    ...current,
    links: current.links.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

function RepeaterTextarea({
  locale,
  labelAr,
  labelEn,
  value,
  onChange,
}: {
  locale: Locale;
  labelAr: string;
  labelEn: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground-muted">{t(locale, labelAr, labelEn)}</span>
      <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
