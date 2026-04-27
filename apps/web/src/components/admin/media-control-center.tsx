"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";

import { deleteMediaAction, uploadMediaWithResult } from "@/lib/admin-actions";
import { getBrandAssets } from "@/lib/cms-documents";
import type { CmsSnapshot, Locale } from "@/types/cms";

import {
  Card,
  DangerButton,
  Field,
  PreviewImage,
  PrimaryButton,
  SectionTitle,
  StatusPill,
  StudioShell,
  TextInput,
  useControlCenterAction,
} from "./control-center-ui";

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function buildUsage(snapshot: CmsSnapshot) {
  const brand = getBrandAssets(snapshot);
  return new Map<string, string[]>(
    snapshot.media_assets.map((asset) => {
      const refs: string[] = [];
      snapshot.work_projects.forEach((project) => {
        if (project.cover_media_id === asset.id) refs.push(`Project cover: ${project.slug}`);
      });
      snapshot.work_project_media.forEach((item) => {
        if (item.media_id === asset.id) refs.push(`${item.role === "cover" ? "Project cover" : "Gallery"}: ${item.project_id}`);
      });
      snapshot.experiences.forEach((entry) => {
        if (entry.logo_media_id === asset.id) refs.push(`Experience logo: ${entry.company}`);
      });
      snapshot.certifications.forEach((entry) => {
        if (entry.certificate_media_id === asset.id) refs.push(`Certification: ${entry.issuer}`);
      });
      if (brand.logo.mediaId === asset.id) refs.push("Brand logo");
      if (brand.profilePortrait.mediaId === asset.id) refs.push("Profile portrait");
      if (brand.youtubeHero.mediaId === asset.id) refs.push("YouTube hero");
      if (brand.contactHero.mediaId === asset.id) refs.push("Contact hero");
      return [asset.id, refs];
    }),
  );
}

function MediaAssetCard({
  locale,
  asset,
  usedBy,
}: {
  locale: Locale;
  asset: CmsSnapshot["media_assets"][number];
  usedBy: string[];
}) {
  const [altAr, setAltAr] = useState(asset.alt_ar);
  const [altEn, setAltEn] = useState(asset.alt_en);
  const [replacement, setReplacement] = useState<File | null>(null);
  const saveAction = useControlCenterAction(async () => {
    const formData = new FormData();
    formData.set("id", asset.id);
    formData.set("path", asset.path);
    formData.set("alt_ar", altAr);
    formData.set("alt_en", altEn);
    formData.set("width", String(asset.width));
    formData.set("height", String(asset.height));
    formData.set("type", asset.type);
    if (replacement) formData.set("file", replacement);
    await uploadMediaWithResult(formData);
    setReplacement(null);
  }, t(locale, "تم تحديث الوسيط.", "Media asset updated."));
  const deleteAction = useControlCenterAction(async () => {
    const formData = new FormData();
    formData.set("id", asset.id);
    await deleteMediaAction(formData);
  }, t(locale, "تم حذف الوسيط.", "Media asset deleted."));

  return (
    <Card className="space-y-4">
      <PreviewImage src={asset.path} alt={asset.alt_en || asset.id} className="aspect-[4/3]" />
      <div>
        <p className="truncate text-sm font-black text-foreground">{asset.id}</p>
        <p className="truncate text-xs text-foreground-muted">{asset.path}</p>
      </div>
      <StatusPill tone={saveAction.tone === "idle" ? deleteAction.tone : saveAction.tone} message={saveAction.message || deleteAction.message} />
      <Field label={t(locale, "الوصف العربي", "Arabic alt")}><TextInput value={altAr} onChange={(e) => setAltAr(e.target.value)} dir="rtl" /></Field>
      <Field label={t(locale, "الوصف الإنجليزي", "English alt")}><TextInput value={altEn} onChange={(e) => setAltEn(e.target.value)} /></Field>
      <Field label={t(locale, "استبدال الملف", "Replace file")}><input type="file" accept="image/*,.pdf" onChange={(e) => setReplacement(e.target.files?.[0] ?? null)} /></Field>
      <div className="flex flex-wrap gap-2">{usedBy.map((item) => <span key={item} className="rounded-full border border-[var(--os-border)] bg-black/10 px-3 py-1 text-[11px] font-bold text-foreground-soft">{item}</span>)}</div>
      <div className="flex flex-wrap justify-between gap-2">
        <DangerButton onClick={() => { if (window.confirm(t(locale, "سيتم حذف هذا الملف. متابعة؟", "Delete this asset?"))) deleteAction.run(); }}>{t(locale, "حذف", "Delete")}</DangerButton>
        <PrimaryButton onClick={() => saveAction.run()}>{t(locale, "حفظ", "Save")}</PrimaryButton>
      </div>
    </Card>
  );
}

export function MediaControlCenter({
  locale,
  snapshot,
}: {
  locale: Locale;
  snapshot: CmsSnapshot;
}) {
  const usage = useMemo(() => buildUsage(snapshot), [snapshot]);
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [altAr, setAltAr] = useState("");
  const [altEn, setAltEn] = useState("");
  const uploadAction = useControlCenterAction(async () => {
    if (!file) throw new Error("Select a file first.");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt_ar", altAr || file.name);
    formData.set("alt_en", altEn || file.name);
    formData.set("width", "0");
    formData.set("height", "0");
    formData.set("type", file.type || "application/octet-stream");
    await uploadMediaWithResult(formData);
    setFile(null);
    setAltAr("");
    setAltEn("");
  }, t(locale, "تم رفع الملف.", "File uploaded."));

  const filtered = snapshot.media_assets.filter((asset) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [asset.id, asset.path, asset.alt_ar, asset.alt_en].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <StudioShell eyebrow={t(locale, "الوسائط", "Media")} title={t(locale, "مكتبة الوسائط", "Media library")} body={t(locale, "ارفع الملفات، حدث النص البديل، واعرف أين يستخدم كل أصل قبل الحذف أو الاستبدال.", "Upload files, update alt text, and see exactly where each asset is used before deleting or replacing it.")}>
        <div className="grid gap-5">
          <Card className="space-y-4">
            <SectionTitle title={t(locale, "رفع ملف جديد", "Upload new asset")} aside={<StatusPill tone={uploadAction.tone} message={uploadAction.message} />} />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label={t(locale, "الملف", "File")}><input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
              <Field label={t(locale, "الوصف العربي", "Arabic alt")}><TextInput value={altAr} onChange={(e) => setAltAr(e.target.value)} dir="rtl" /></Field>
              <Field label={t(locale, "الوصف الإنجليزي", "English alt")}><TextInput value={altEn} onChange={(e) => setAltEn(e.target.value)} /></Field>
            </div>
            <div className="flex justify-end"><PrimaryButton disabled={uploadAction.isPending} onClick={() => uploadAction.run()}><Upload className="me-2 h-4 w-4" />{t(locale, "رفع", "Upload")}</PrimaryButton></div>
          </Card>

          <Card className="space-y-4">
            <SectionTitle title={t(locale, "الأصول الحالية", "Current assets")} />
            <Field label={t(locale, "بحث", "Search")}><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale, "ابحث بالاسم أو المسار", "Search by id or path")} /></Field>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((asset) => (
              <MediaAssetCard key={asset.id} locale={locale} asset={asset} usedBy={usage.get(asset.id) ?? []} />
            ))}
          </div>
        </div>
      </StudioShell>
    </div>
  );
}
