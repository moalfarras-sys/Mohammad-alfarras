"use client";

import { useState } from "react";

import {
  updatePageCoreAction,
  updatePageTranslationAction,
  updateSectionCoreAction,
  updateSiteSettingAction,
} from "@/lib/admin-actions";
import type {
  ContactPageContentDocument,
  HomeContentDocument,
  ProjectsPageContentDocument,
  YoutubePageContentDocument,
} from "@/lib/cms-documents";
import type { CmsSnapshot, Locale, Page, Section } from "@/types/cms";

import {
  BilingualPane,
  Card,
  Checkbox,
  Field,
  LocaleGrid,
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

function toSimplePairs(value: Array<{ title: string; body: string }>) {
  return value.map((item) => `${item.title} | ${item.body}`).join("\n");
}

function fromSimplePairs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split("|");
      return {
        title: title?.trim() ?? "",
        body: rest.join("|").trim(),
      };
    });
}

function toStringList(value: string[]) {
  return value.join("\n");
}

function fromStringList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type PageCardProps = {
  locale: Locale;
  page: Page;
  snapshot: CmsSnapshot;
};

function PageMetaCard({ locale, page, snapshot }: PageCardProps) {
  const [status, setStatus] = useState(page.status);
  const [template, setTemplate] = useState(page.template);
  const ar = snapshot.page_translations.find((item) => item.page_id === page.id && item.locale === "ar");
  const en = snapshot.page_translations.find((item) => item.page_id === page.id && item.locale === "en");
  const [arState, setArState] = useState({
    title: ar?.title ?? "",
    meta_title: ar?.meta_title ?? "",
    meta_description: ar?.meta_description ?? "",
    og_title: ar?.og_title ?? "",
    og_description: ar?.og_description ?? "",
  });
  const [enState, setEnState] = useState({
    title: en?.title ?? "",
    meta_title: en?.meta_title ?? "",
    meta_description: en?.meta_description ?? "",
    og_title: en?.og_title ?? "",
    og_description: en?.og_description ?? "",
  });

  const metaAction = useControlCenterAction(async () => {
    const core = new FormData();
    core.set("id", page.id);
    core.set("status", status);
    core.set("template", template);
    await updatePageCoreAction(core);

    for (const [localeKey, payload] of [
      ["ar", arState],
      ["en", enState],
    ] as const) {
      const formData = new FormData();
      formData.set("page_id", page.id);
      formData.set("locale", localeKey);
      formData.set("title", payload.title);
      formData.set("meta_title", payload.meta_title);
      formData.set("meta_description", payload.meta_description);
      formData.set("og_title", payload.og_title);
      formData.set("og_description", payload.og_description);
      await updatePageTranslationAction(formData);
    }
  }, t(locale, "تم حفظ بيانات الصفحة.", "Page settings saved."));

  return (
    <Card className="space-y-5">
      <SectionTitle title={page.slug} body={t(locale, "الحالة والقوالب وبيانات SEO", "Status, template, and SEO data")} aside={<StatusPill tone={metaAction.tone} message={metaAction.message} />} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t(locale, "الحالة", "Status")}>
          <Select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")}>
            <option value="draft">{t(locale, "مسودة", "Draft")}</option>
            <option value="published">{t(locale, "منشور", "Published")}</option>
          </Select>
        </Field>
        <Field label={t(locale, "القالب", "Template")}>
          <TextInput value={template} onChange={(event) => setTemplate(event.target.value)} />
        </Field>
      </div>

      <LocaleGrid
        ar={
          <BilingualPane title="Arabic" dir="rtl">
            <Field label={t(locale, "عنوان الصفحة", "Page title")}>
              <TextInput value={arState.title} onChange={(event) => setArState((current) => ({ ...current, title: event.target.value }))} dir="rtl" />
            </Field>
            <Field label={t(locale, "عنوان SEO", "SEO title")}>
              <TextInput value={arState.meta_title} onChange={(event) => setArState((current) => ({ ...current, meta_title: event.target.value }))} dir="rtl" />
            </Field>
            <Field label={t(locale, "وصف SEO", "SEO description")}>
              <TextArea value={arState.meta_description} onChange={(event) => setArState((current) => ({ ...current, meta_description: event.target.value }))} dir="rtl" />
            </Field>
            <Field label="OG title">
              <TextInput value={arState.og_title} onChange={(event) => setArState((current) => ({ ...current, og_title: event.target.value }))} dir="rtl" />
            </Field>
            <Field label="OG description">
              <TextArea value={arState.og_description} onChange={(event) => setArState((current) => ({ ...current, og_description: event.target.value }))} dir="rtl" />
            </Field>
          </BilingualPane>
        }
        en={
          <BilingualPane title="English" dir="ltr">
            <Field label={t(locale, "عنوان الصفحة", "Page title")}>
              <TextInput value={enState.title} onChange={(event) => setEnState((current) => ({ ...current, title: event.target.value }))} />
            </Field>
            <Field label={t(locale, "عنوان SEO", "SEO title")}>
              <TextInput value={enState.meta_title} onChange={(event) => setEnState((current) => ({ ...current, meta_title: event.target.value }))} />
            </Field>
            <Field label={t(locale, "وصف SEO", "SEO description")}>
              <TextArea value={enState.meta_description} onChange={(event) => setEnState((current) => ({ ...current, meta_description: event.target.value }))} />
            </Field>
            <Field label="OG title">
              <TextInput value={enState.og_title} onChange={(event) => setEnState((current) => ({ ...current, og_title: event.target.value }))} />
            </Field>
            <Field label="OG description">
              <TextArea value={enState.og_description} onChange={(event) => setEnState((current) => ({ ...current, og_description: event.target.value }))} />
            </Field>
          </BilingualPane>
        }
      />

      <div className="flex justify-end">
        <PrimaryButton disabled={metaAction.isPending} onClick={() => metaAction.run()}>
          {metaAction.isPending ? t(locale, "جارٍ الحفظ...", "Saving...") : t(locale, "حفظ الصفحة", "Save page")}
        </PrimaryButton>
      </div>
    </Card>
  );
}

function SectionControlRow({ locale, section }: { locale: Locale; section: Section }) {
  const [sortOrder, setSortOrder] = useState(section.sort_order);
  const [enabled, setEnabled] = useState(section.is_enabled);
  const action = useControlCenterAction(async () => {
    const formData = new FormData();
    formData.set("id", section.id);
    formData.set("sort_order", String(sortOrder));
    if (enabled) formData.set("is_enabled", "on");
    await updateSectionCoreAction(formData);
  }, t(locale, "تم تحديث القسم.", "Section updated."));

  return (
    <div className="grid gap-3 rounded-[1.3rem] border border-white/8 bg-black/10 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
      <div>
        <p className="text-sm font-bold text-foreground">{section.section_key}</p>
        <p className="text-xs text-foreground-muted">{section.section_type}</p>
      </div>
      <div className="grid gap-2">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground-soft">{t(locale, "الترتيب", "Order")}</span>
        <TextInput type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value || 0))} className="w-24" />
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <Checkbox checked={enabled} onChange={setEnabled} label={t(locale, "مفعل", "Visible")} />
        <PrimaryButton className="px-4" disabled={action.isPending} onClick={() => action.run()}>
          {t(locale, "حفظ", "Save")}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function PagesControlCenter({
  locale,
  snapshot,
  homeContent,
  projectsContent,
  youtubeContent,
  contactContent,
}: {
  locale: Locale;
  snapshot: CmsSnapshot;
  homeContent: HomeContentDocument;
  projectsContent: ProjectsPageContentDocument;
  youtubeContent: YoutubePageContentDocument;
  contactContent: ContactPageContentDocument;
}) {
  const [homeState, setHomeState] = useState(homeContent);
  const [projectsState, setProjectsState] = useState(projectsContent);
  const [youtubeState, setYoutubeState] = useState(youtubeContent);
  const [contactState, setContactState] = useState(contactContent);

  const saveSetting = useControlCenterAction(async (key: string, payload: Record<string, unknown>) => {
    const formData = new FormData();
    formData.set("key", key);
    formData.set("value_json", JSON.stringify(payload));
    await updateSiteSettingAction(formData);
  }, t(locale, "تم حفظ المحتوى.", "Content saved."));

  return (
    <div className="space-y-5">
      <StudioShell
        eyebrow={t(locale, "الصفحات", "Pages")}
        title={t(locale, "إدارة الصفحات والأقسام", "Pages and sections")}
        body={t(
          locale,
          "حرر النسخ الأساسية للصفحة الرئيسية وصفحات المشاريع ويوتيوب والتواصل، ثم راجع حالة كل صفحة وأقسامها من نفس المكان.",
          "Edit the core copy for home, projects, YouTube, and contact, then review page state and section visibility from the same workspace.",
        )}
      >
        <div className="grid gap-5">
          <Card className="space-y-5">
            <SectionTitle title={t(locale, "الصفحة الرئيسية", "Homepage")} body={t(locale, "الهوية، الهيرو، القيم، والطبقات التعريفية.", "Hero, identity, service copy, and public-facing section intros.")} aside={<StatusPill tone={saveSetting.tone} message={saveSetting.message} />} />
            <LocaleGrid
              ar={
                <BilingualPane title="Arabic" dir="rtl">
                  <Field label={t(locale, "Eyebrow", "Eyebrow")}><TextInput value={homeState.ar.hero.eyebrow} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, hero: { ...current.ar.hero, eyebrow: event.target.value } } }))} dir="rtl" /></Field>
                  <Field label={t(locale, "العنوان الرئيسي", "Hero title")}><TextArea value={homeState.ar.hero.title} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, hero: { ...current.ar.hero, title: event.target.value } } }))} dir="rtl" /></Field>
                  <Field label={t(locale, "وصف الهيرو", "Hero body")}><TextArea value={homeState.ar.hero.body} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, hero: { ...current.ar.hero, body: event.target.value } } }))} dir="rtl" /></Field>
                  <Field label={t(locale, "الزر الأساسي", "Primary CTA")}><TextInput value={homeState.ar.hero.primary} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, hero: { ...current.ar.hero, primary: event.target.value } } }))} dir="rtl" /></Field>
                  <Field label={t(locale, "الزر الثانوي", "Secondary CTA")}><TextInput value={homeState.ar.hero.secondary} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, hero: { ...current.ar.hero, secondary: event.target.value } } }))} dir="rtl" /></Field>
                  <Field label={t(locale, "قسم الهوية", "Identity section")}><TextArea value={homeState.ar.identity.body} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, identity: { ...current.ar.identity, body: event.target.value } } }))} dir="rtl" /></Field>
                  <Field label={t(locale, "بطاقات الهوية", "Identity cards")} hint={t(locale, "سطر لكل بطاقة: عنوان | وصف", "One line per card: title | body")}><TextArea value={toSimplePairs(homeState.ar.identity.cards)} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, identity: { ...current.ar.identity, cards: fromSimplePairs(event.target.value) } } }))} dir="rtl" /></Field>
                  <Field label={t(locale, "قيم اللوجستيات", "Logistics values")} hint={t(locale, "عنصر واحد بكل سطر", "One item per line")}><TextArea value={toStringList(homeState.ar.logistics.values)} onChange={(event) => setHomeState((current) => ({ ...current, ar: { ...current.ar, logistics: { ...current.ar.logistics, values: fromStringList(event.target.value) } } }))} dir="rtl" /></Field>
                </BilingualPane>
              }
              en={
                <BilingualPane title="English" dir="ltr">
                  <Field label="Eyebrow"><TextInput value={homeState.en.hero.eyebrow} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, hero: { ...current.en.hero, eyebrow: event.target.value } } }))} /></Field>
                  <Field label="Hero title"><TextArea value={homeState.en.hero.title} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, hero: { ...current.en.hero, title: event.target.value } } }))} /></Field>
                  <Field label="Hero body"><TextArea value={homeState.en.hero.body} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, hero: { ...current.en.hero, body: event.target.value } } }))} /></Field>
                  <Field label="Primary CTA"><TextInput value={homeState.en.hero.primary} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, hero: { ...current.en.hero, primary: event.target.value } } }))} /></Field>
                  <Field label="Secondary CTA"><TextInput value={homeState.en.hero.secondary} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, hero: { ...current.en.hero, secondary: event.target.value } } }))} /></Field>
                  <Field label="Identity section"><TextArea value={homeState.en.identity.body} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, identity: { ...current.en.identity, body: event.target.value } } }))} /></Field>
                  <Field label="Identity cards" hint="One line per card: title | body"><TextArea value={toSimplePairs(homeState.en.identity.cards)} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, identity: { ...current.en.identity, cards: fromSimplePairs(event.target.value) } } }))} /></Field>
                  <Field label="Logistics values" hint="One item per line"><TextArea value={toStringList(homeState.en.logistics.values)} onChange={(event) => setHomeState((current) => ({ ...current, en: { ...current.en, logistics: { ...current.en.logistics, values: fromStringList(event.target.value) } } }))} /></Field>
                </BilingualPane>
              }
            />
            <div className="flex justify-end">
              <PrimaryButton disabled={saveSetting.isPending} onClick={() => saveSetting.run("home_content", homeState as unknown as Record<string, unknown>)}>
                {t(locale, "حفظ الصفحة الرئيسية", "Save homepage")}
              </PrimaryButton>
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="space-y-4">
              <SectionTitle title={t(locale, "صفحة المشاريع", "Projects page")} />
              <Field label={t(locale, "العنوان العربي", "Arabic title")}><TextInput value={projectsState.ar.title} onChange={(event) => setProjectsState((current) => ({ ...current, ar: { ...current.ar, title: event.target.value } }))} dir="rtl" /></Field>
              <Field label={t(locale, "الوصف العربي", "Arabic body")}><TextArea value={projectsState.ar.body} onChange={(event) => setProjectsState((current) => ({ ...current, ar: { ...current.ar, body: event.target.value } }))} dir="rtl" /></Field>
              <Field label={t(locale, "English title", "English title")}><TextInput value={projectsState.en.title} onChange={(event) => setProjectsState((current) => ({ ...current, en: { ...current.en, title: event.target.value } }))} /></Field>
              <Field label={t(locale, "English body", "English body")}><TextArea value={projectsState.en.body} onChange={(event) => setProjectsState((current) => ({ ...current, en: { ...current.en, body: event.target.value } }))} /></Field>
              <PrimaryButton disabled={saveSetting.isPending} onClick={() => saveSetting.run("projects_page_content", projectsState as unknown as Record<string, unknown>)}>{t(locale, "حفظ المشاريع", "Save projects page")}</PrimaryButton>
            </Card>

            <Card className="space-y-4">
              <SectionTitle title={t(locale, "صفحة يوتيوب", "YouTube page")} />
              <Field label={t(locale, "العنوان العربي", "Arabic title")}><TextInput value={youtubeState.ar.title} onChange={(event) => setYoutubeState((current) => ({ ...current, ar: { ...current.ar, title: event.target.value } }))} dir="rtl" /></Field>
              <Field label={t(locale, "الوصف العربي", "Arabic body")}><TextArea value={youtubeState.ar.body} onChange={(event) => setYoutubeState((current) => ({ ...current, ar: { ...current.ar, body: event.target.value } }))} dir="rtl" /></Field>
              <Field label={t(locale, "قيم الصفحة", "Value items")} hint={t(locale, "عنصر بكل سطر", "One value per line")}><TextArea value={toStringList(youtubeState.ar.values)} onChange={(event) => setYoutubeState((current) => ({ ...current, ar: { ...current.ar, values: fromStringList(event.target.value) } }))} dir="rtl" /></Field>
              <Field label={t(locale, "English title", "English title")}><TextInput value={youtubeState.en.title} onChange={(event) => setYoutubeState((current) => ({ ...current, en: { ...current.en, title: event.target.value } }))} /></Field>
              <Field label={t(locale, "English body", "English body")}><TextArea value={youtubeState.en.body} onChange={(event) => setYoutubeState((current) => ({ ...current, en: { ...current.en, body: event.target.value } }))} /></Field>
              <Field label="Values" hint="One value per line"><TextArea value={toStringList(youtubeState.en.values)} onChange={(event) => setYoutubeState((current) => ({ ...current, en: { ...current.en, values: fromStringList(event.target.value) } }))} /></Field>
              <PrimaryButton disabled={saveSetting.isPending} onClick={() => saveSetting.run("youtube_page_content", youtubeState as unknown as Record<string, unknown>)}>{t(locale, "حفظ يوتيوب", "Save YouTube page")}</PrimaryButton>
            </Card>

            <Card className="space-y-4">
              <SectionTitle title={t(locale, "صفحة التواصل", "Contact page")} />
              <Field label={t(locale, "العنوان العربي", "Arabic title")}><TextInput value={contactState.ar.title} onChange={(event) => setContactState((current) => ({ ...current, ar: { ...current.ar, title: event.target.value } }))} dir="rtl" /></Field>
              <Field label={t(locale, "الوصف العربي", "Arabic body")}><TextArea value={contactState.ar.body} onChange={(event) => setContactState((current) => ({ ...current, ar: { ...current.ar, body: event.target.value } }))} dir="rtl" /></Field>
              <Field label={t(locale, "شرائح سريعة", "Quick chips")} hint={t(locale, "عنصر بكل سطر", "One chip per line")}><TextArea value={toStringList(contactState.ar.chips)} onChange={(event) => setContactState((current) => ({ ...current, ar: { ...current.ar, chips: fromStringList(event.target.value) } }))} dir="rtl" /></Field>
              <Field label={t(locale, "أسباب التواصل", "Reasons")} hint={t(locale, "سطر لكل سبب: عنوان | وصف", "One line per reason: title | body")}><TextArea value={toSimplePairs(contactState.ar.reasons)} onChange={(event) => setContactState((current) => ({ ...current, ar: { ...current.ar, reasons: fromSimplePairs(event.target.value) } }))} dir="rtl" /></Field>
              <Field label={t(locale, "English title", "English title")}><TextInput value={contactState.en.title} onChange={(event) => setContactState((current) => ({ ...current, en: { ...current.en, title: event.target.value } }))} /></Field>
              <Field label={t(locale, "English body", "English body")}><TextArea value={contactState.en.body} onChange={(event) => setContactState((current) => ({ ...current, en: { ...current.en, body: event.target.value } }))} /></Field>
              <PrimaryButton disabled={saveSetting.isPending} onClick={() => saveSetting.run("contact_page_content", contactState as unknown as Record<string, unknown>)}>{t(locale, "حفظ التواصل", "Save contact page")}</PrimaryButton>
            </Card>
          </div>
        </div>
      </StudioShell>

      <StudioShell
        eyebrow={t(locale, "التحكم البنيوي", "Structure")}
        title={t(locale, "حالة الصفحات وإظهار الأقسام", "Page status and section visibility")}
        body={t(
          locale,
          "تأكد من حالة النشر والعناوين الوصفية وترتيب الأقسام لكل صفحة متاحة في الموقع.",
          "Review publish state, metadata, and section ordering for each page available on the site.",
        )}
      >
        <div className="grid gap-5">
          {snapshot.pages.map((page) => {
            const sections = snapshot.sections
              .filter((section) => section.page_id === page.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <div key={page.id} className="grid gap-4">
                <PageMetaCard locale={locale} page={page} snapshot={snapshot} />
                <Card className="space-y-4">
                  <SectionTitle title={t(locale, "أقسام الصفحة", "Sections")} body={t(locale, "إظهار، إخفاء، وترتيب آمن لكل قسم.", "Safe show, hide, and ordering controls for each section.")} />
                  <div className="grid gap-3">
                    {sections.map((section) => (
                      <SectionControlRow key={section.id} locale={locale} section={section} />
                    ))}
                    {sections.length === 0 && (
                      <div className="rounded-[1.3rem] border border-dashed border-[var(--os-border)] bg-black/10 px-4 py-5 text-sm text-foreground-muted">
                        {t(locale, "لا توجد أقسام مرتبطة بهذه الصفحة.", "No sections are linked to this page.")}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </StudioShell>
    </div>
  );
}
