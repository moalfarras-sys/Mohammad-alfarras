"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";

import { savePdfRegistryAction, uploadPdfSlotAction } from "@/lib/admin-actions";
import type { PdfRegistryDocument } from "@/lib/cms-documents";
import type { Locale } from "@/types/cms";

import {
  Card,
  Field,
  PrimaryButton,
  SectionTitle,
  Select,
  StatusPill,
  StudioShell,
  useControlCenterAction,
} from "./control-center-ui";

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

type SlotKey = "branded" | "ats";

export function PdfsControlCenter({
  locale,
  registry,
}: {
  locale: Locale;
  registry: PdfRegistryDocument;
}) {
  const [state, setState] = useState(registry);
  const [files, setFiles] = useState<Record<SlotKey, File | null>>({ branded: null, ats: null });
  const saveAction = useControlCenterAction(async () => {
    const formData = new FormData();
    formData.set("payload_json", JSON.stringify(state));
    await savePdfRegistryAction(formData);
  }, t(locale, "تم تحديث حالة ملفات PDF.", "PDF registry updated."));
  const uploadAction = useControlCenterAction(async (slot: SlotKey) => {
    const file = files[slot];
    if (!file) throw new Error("Select a PDF first.");
    const formData = new FormData();
    formData.set("slot", slot);
    formData.set("file", file);
    const next = await uploadPdfSlotAction(formData);
    setState(next);
    setFiles((current) => ({ ...current, [slot]: null }));
  }, t(locale, "تم رفع الملف.", "PDF uploaded."));

  return (
    <div className="space-y-5">
      <StudioShell
        eyebrow="PDF"
        title={t(locale, "إدارة ملفات السيرة", "PDF management")}
        body={t(
          locale,
          "بدل بين النسخ المولدة والنسخ المرفوعة لكل نوع من ملفات السيرة، وراجع الحالة الحالية قبل الحفظ.",
          "Switch between generated and uploaded PDFs for each CV type and review the active state before saving.",
        )}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {(["branded", "ats"] as const).map((slot) => (
            <Card key={slot} className="space-y-4">
              <SectionTitle
                title={slot === "branded" ? t(locale, "السيرة البراند", "Branded CV") : t(locale, "سيرة ATS", "ATS CV")}
                aside={<StatusPill tone={uploadAction.tone === "idle" ? saveAction.tone : uploadAction.tone} message={uploadAction.message || saveAction.message} />}
              />
              <div className="rounded-[1.3rem] border border-white/8 bg-black/10 p-4 text-sm text-foreground-muted">
                <p>{t(locale, "الرابط المولد", "Generated URL")}</p>
                <p className="mt-2 font-bold text-foreground">{`/api/cv-pdf?locale=${locale}&variant=${slot}`}</p>
              </div>
              <Field label={t(locale, "الوضع النشط", "Active source")}>
                <Select
                  value={state.active[slot]}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      active: { ...current.active, [slot]: event.target.value as "generated" | "uploaded" },
                    }))
                  }
                >
                  <option value="generated">{t(locale, "مولد", "Generated")}</option>
                  <option value="uploaded">{t(locale, "مرفوع", "Uploaded")}</option>
                </Select>
              </Field>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/10 p-4 text-sm">
                <p className="font-bold text-foreground">{t(locale, "الملف المرفوع", "Uploaded file")}</p>
                {state.uploads[slot] ? (
                  <div className="mt-3 space-y-1 text-foreground-muted">
                    <p>{state.uploads[slot]?.filename}</p>
                    <a href={state.uploads[slot]?.url ?? "#"} target="_blank" className="break-all text-primary" rel="noreferrer">
                      {state.uploads[slot]?.url}
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-foreground-soft">{t(locale, "لا يوجد ملف مرفوع لهذا النوع.", "No uploaded file for this slot.")}</p>
                )}
              </div>
              <Field label={t(locale, "رفع ملف PDF", "Upload PDF")}>
                <input type="file" accept="application/pdf" onChange={(event) => setFiles((current) => ({ ...current, [slot]: event.target.files?.[0] ?? null }))} />
              </Field>
              <div className="flex flex-wrap justify-between gap-2">
                <PrimaryButton disabled={uploadAction.isPending} onClick={() => uploadAction.run(slot)}>
                  <Upload className="me-2 h-4 w-4" />
                  {t(locale, "رفع الملف", "Upload file")}
                </PrimaryButton>
                <PrimaryButton disabled={saveAction.isPending} onClick={() => saveAction.run()}>
                  <FileText className="me-2 h-4 w-4" />
                  {t(locale, "حفظ الحالة", "Save state")}
                </PrimaryButton>
              </div>
            </Card>
          ))}
        </div>
      </StudioShell>
    </div>
  );
}
