"use client";

import { useState } from "react";

import { updateSiteSettingAction } from "@/lib/admin-actions";
import type { RebuildPageKey, SeoEntry } from "@/data/rebuild-content";
import type { AdminProfileDocument, BrandAssetsDocument, SiteSeoDocument } from "@/lib/cms-documents";
import type { CmsSnapshot, Locale } from "@/types/cms";

import {
  BilingualPane,
  Card,
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

const SEO_PAGE_KEYS: RebuildPageKey[] = ["home", "cv", "blog", "projects", "youtube", "contact", "privacy"];

function seoPageLabel(uiLocale: Locale, key: RebuildPageKey): string {
  const labels: Record<RebuildPageKey, [string, string]> = {
    home: ["الرئيسية", "Home"],
    cv: ["السيرة", "CV"],
    blog: ["الرؤية", "Blog"],
    projects: ["الأعمال", "Projects"],
    youtube: ["يوتيوب", "YouTube"],
    contact: ["تواصل", "Contact"],
    privacy: ["الخصوصية", "Privacy"],
  };
  return uiLocale === "ar" ? labels[key][0] : labels[key][1];
}

export function SettingsControlCenter({
  locale,
  snapshot,
  brandAssets,
  adminProfile,
  siteSeo,
  envStatus,
}: {
  locale: Locale;
  snapshot: CmsSnapshot;
  brandAssets: BrandAssetsDocument;
  adminProfile: AdminProfileDocument;
  siteSeo: SiteSeoDocument;
  envStatus: { allowlist: boolean; passwordHash: boolean; sessionSecret: boolean };
}) {
  const [brand, setBrand] = useState(brandAssets);
  const [admin, setAdmin] = useState(adminProfile);
  const [seoDoc, setSeoDoc] = useState(siteSeo);
  const [seoPage, setSeoPage] = useState<RebuildPageKey>("home");
  const mediaOptions = snapshot.media_assets;

  const patchSeo = (loc: Locale, page: RebuildPageKey, field: keyof SeoEntry, value: string) => {
    setSeoDoc((prev) => ({
      ...prev,
      [loc]: {
        ...prev[loc],
        [page]: { ...prev[loc][page], [field]: value },
      },
    }));
  };

  const saveAction = useControlCenterAction(async (key: string, payload: Record<string, unknown>) => {
    const formData = new FormData();
    formData.set("key", key);
    formData.set("value_json", JSON.stringify(payload));
    await updateSiteSettingAction(formData);
  }, t(locale, "تم حفظ الإعدادات.", "Settings saved."));

  return (
    <div className="space-y-5">
      <StudioShell
        eyebrow={t(locale, "الإعدادات", "Settings")}
        title={t(locale, "الهوية والأصول العامة", "Brand and shared assets")}
        body={t(
          locale,
          "هنا تُدار هوية Moalfarras داخل اللوحة والموقع: الاسم، الشعار، الصور المشتركة، وبيانات المدير المعروضة.",
          "This is where the Moalfarras identity is managed across the control center and public website: name, logo, shared imagery, and visible admin identity.",
        )}
      >
        <div className="grid gap-5">
          <Card className="space-y-5">
            <SectionTitle title={t(locale, "ملف المدير", "Admin profile")} aside={<StatusPill tone={saveAction.tone} message={saveAction.message} />} />
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <PreviewImage src={admin.avatarPath} alt={admin.displayName.en || "admin"} className="aspect-square" />
              <div className="grid gap-4">
                <LocaleGrid
                  ar={<BilingualPane title="Arabic" dir="rtl"><Field label={t(locale, "الاسم", "Name")}><TextInput value={admin.displayName.ar} onChange={(e) => setAdmin((current) => ({ ...current, displayName: { ...current.displayName, ar: e.target.value } }))} dir="rtl" /></Field><Field label={t(locale, "الدور", "Role")}><TextInput value={admin.role.ar} onChange={(e) => setAdmin((current) => ({ ...current, role: { ...current.role, ar: e.target.value } }))} dir="rtl" /></Field></BilingualPane>}
                  en={<BilingualPane title="English" dir="ltr"><Field label="Name"><TextInput value={admin.displayName.en} onChange={(e) => setAdmin((current) => ({ ...current, displayName: { ...current.displayName, en: e.target.value } }))} /></Field><Field label="Role"><TextInput value={admin.role.en} onChange={(e) => setAdmin((current) => ({ ...current, role: { ...current.role, en: e.target.value } }))} /></Field></BilingualPane>}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Email"><TextInput value={admin.email} onChange={(e) => setAdmin((current) => ({ ...current, email: e.target.value }))} /></Field>
                  <Field label={t(locale, "صورة المدير", "Admin avatar")}><Select value={admin.avatarMediaId ?? ""} onChange={(e) => { const selected = mediaOptions.find((item) => item.id === e.target.value); setAdmin((current) => ({ ...current, avatarMediaId: e.target.value || null, avatarPath: selected?.path ?? current.avatarPath })); }}><option value="">{t(locale, "بدون تعيين", "No assignment")}</option>{mediaOptions.map((asset) => <option key={asset.id} value={asset.id}>{asset.id}</option>)}</Select></Field>
                </div>
                <div className="flex justify-end"><PrimaryButton disabled={saveAction.isPending} onClick={() => saveAction.run("admin_profile", admin as unknown as Record<string, unknown>)}>{t(locale, "حفظ الملف", "Save profile")}</PrimaryButton></div>
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionTitle title={t(locale, "هوية العلامة", "Brand identity")} />
            <LocaleGrid
              ar={<BilingualPane title="Arabic" dir="rtl"><Field label={t(locale, "اسم الموقع", "Site name")}><TextInput value={brand.siteName.ar} onChange={(e) => setBrand((current) => ({ ...current, siteName: { ...current.siteName, ar: e.target.value } }))} dir="rtl" /></Field><Field label={t(locale, "الشعار النصي", "Tagline")}><TextInput value={brand.navTagline.ar} onChange={(e) => setBrand((current) => ({ ...current, navTagline: { ...current.navTagline, ar: e.target.value } }))} dir="rtl" /></Field><Field label={t(locale, "الفوتر", "Footer body")}><TextArea value={brand.footer.ar.body} onChange={(e) => setBrand((current) => ({ ...current, footer: { ...current.footer, ar: { ...current.footer.ar, body: e.target.value } } }))} dir="rtl" /></Field></BilingualPane>}
              en={<BilingualPane title="English" dir="ltr"><Field label="Site name"><TextInput value={brand.siteName.en} onChange={(e) => setBrand((current) => ({ ...current, siteName: { ...current.siteName, en: e.target.value } }))} /></Field><Field label="Tagline"><TextInput value={brand.navTagline.en} onChange={(e) => setBrand((current) => ({ ...current, navTagline: { ...current.navTagline, en: e.target.value } }))} /></Field><Field label="Footer body"><TextArea value={brand.footer.en.body} onChange={(e) => setBrand((current) => ({ ...current, footer: { ...current.footer, en: { ...current.footer.en, body: e.target.value } } }))} /></Field></BilingualPane>}
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  { key: "logo", mediaId: brand.logo.mediaId, path: brand.logo.path },
                  { key: "profilePortrait", mediaId: brand.profilePortrait.mediaId, path: brand.profilePortrait.path },
                  { key: "youtubeHero", mediaId: brand.youtubeHero.mediaId, path: brand.youtubeHero.path },
                  { key: "contactHero", mediaId: brand.contactHero.mediaId, path: brand.contactHero.path },
                ] as const
              ).map(({ key, mediaId, path }) => (
                <div key={key} className="space-y-3 rounded-[1.3rem] border border-white/8 bg-black/10 p-4">
                  <PreviewImage src={path} alt={key} className="aspect-square" />
                  <Field label={key}>
                    <Select
                      value={mediaId ?? ""}
                      onChange={(e) => {
                        const selected = mediaOptions.find((item) => item.id === e.target.value);
                        setBrand((current) => ({
                          ...current,
                          [key]: {
                            mediaId: e.target.value || null,
                            path: selected?.path ?? current[key].path,
                          },
                        }));
                      }}
                    >
                      <option value="">{t(locale, "بدون تعيين", "No assignment")}</option>
                      {mediaOptions.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.id}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              ))}
            </div>
            <div className="flex justify-end"><PrimaryButton disabled={saveAction.isPending} onClick={() => saveAction.run("brand_assets", brand as unknown as Record<string, unknown>)}>{t(locale, "حفظ الهوية", "Save brand assets")}</PrimaryButton></div>
          </Card>

          <Card className="space-y-5">
            <SectionTitle
              title={t(locale, "ميتا وعناوين الصفحات", "Page SEO & metadata")}
              body={t(
                locale,
                "عناوين ووصف وOpen Graph لكل مسار عام. تُحفظ في وثيقة site_seo وتُقرأ مباشرة في metadata الموقع.",
                "Titles, descriptions, and Open Graph text per public route. Stored in the site_seo document and consumed by page metadata.",
              )}
              aside={<StatusPill tone={saveAction.tone} message={saveAction.message} />}
            />
            <Field label={t(locale, "الصفحة", "Page")}>
              <Select value={seoPage} onChange={(e) => setSeoPage(e.target.value as RebuildPageKey)}>
                {SEO_PAGE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {seoPageLabel(locale, key)} ({key})
                  </option>
                ))}
              </Select>
            </Field>
            <LocaleGrid
              ar={
                <BilingualPane title="Arabic (ar)" dir="rtl">
                  <Field label={t(locale, "عنوان المتصفح", "Document title")}>
                    <TextInput value={seoDoc.ar[seoPage].title} onChange={(e) => patchSeo("ar", seoPage, "title", e.target.value)} dir="rtl" />
                  </Field>
                  <Field label={t(locale, "الوصف", "Meta description")}>
                    <TextArea value={seoDoc.ar[seoPage].description} onChange={(e) => patchSeo("ar", seoPage, "description", e.target.value)} dir="rtl" />
                  </Field>
                  <Field label="OG title">
                    <TextInput value={seoDoc.ar[seoPage].ogTitle} onChange={(e) => patchSeo("ar", seoPage, "ogTitle", e.target.value)} dir="rtl" />
                  </Field>
                  <Field label="OG description">
                    <TextArea value={seoDoc.ar[seoPage].ogDescription} onChange={(e) => patchSeo("ar", seoPage, "ogDescription", e.target.value)} dir="rtl" />
                  </Field>
                  <Field label={t(locale, "صورة OG (مسار)", "OG image path")}>
                    <TextInput
                      value={seoDoc.ar[seoPage].image ?? ""}
                      onChange={(e) => patchSeo("ar", seoPage, "image", e.target.value)}
                      dir="ltr"
                      placeholder="/images/..."
                    />
                  </Field>
                </BilingualPane>
              }
              en={
                <BilingualPane title="English (en)" dir="ltr">
                  <Field label="Document title">
                    <TextInput value={seoDoc.en[seoPage].title} onChange={(e) => patchSeo("en", seoPage, "title", e.target.value)} />
                  </Field>
                  <Field label="Meta description">
                    <TextArea value={seoDoc.en[seoPage].description} onChange={(e) => patchSeo("en", seoPage, "description", e.target.value)} />
                  </Field>
                  <Field label="OG title">
                    <TextInput value={seoDoc.en[seoPage].ogTitle} onChange={(e) => patchSeo("en", seoPage, "ogTitle", e.target.value)} />
                  </Field>
                  <Field label="OG description">
                    <TextArea value={seoDoc.en[seoPage].ogDescription} onChange={(e) => patchSeo("en", seoPage, "ogDescription", e.target.value)} />
                  </Field>
                  <Field label="OG image path">
                    <TextInput
                      value={seoDoc.en[seoPage].image ?? ""}
                      onChange={(e) => patchSeo("en", seoPage, "image", e.target.value)}
                      placeholder="/images/..."
                    />
                  </Field>
                </BilingualPane>
              }
            />
            <div className="flex justify-end">
              <PrimaryButton disabled={saveAction.isPending} onClick={() => saveAction.run("site_seo", seoDoc as unknown as Record<string, unknown>)}>
                {t(locale, "حفظ SEO", "Save SEO")}
              </PrimaryButton>
            </div>
          </Card>

          <Card className="space-y-4">
            <SectionTitle title={t(locale, "أمان الدخول", "Admin auth runtime")} />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["ADMIN_ALLOWLIST", envStatus.allowlist],
                ["ADMIN_PASSWORD_HASH", envStatus.passwordHash],
                ["ADMIN_SESSION_SECRET", envStatus.sessionSecret],
              ].map(([key, value]) => (
                <div key={String(key)} className="rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground-soft">{key}</p>
                  <p className={`mt-3 text-sm font-bold ${value ? "text-primary" : "text-red-300"}`}>{value ? t(locale, "مفعل", "Configured") : t(locale, "غير مضبوط", "Missing")}</p>
                </div>
              ))}
            </div>
            <p className="text-sm leading-7 text-foreground-muted">
              {t(
                locale,
                "كلمات المرور لم تعد تُحفظ داخل قاعدة البيانات. أي تعديل على الوصول الإداري يتم عبر متغيرات البيئة فقط.",
                "Passwords are no longer stored in the CMS. Administrative access is controlled through environment variables only.",
              )}
            </p>
          </Card>
        </div>
      </StudioShell>
    </div>
  );
}
