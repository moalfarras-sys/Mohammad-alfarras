"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";
import type { CvPresentationModel } from "@/lib/cv-presenter";

import { CvPdfDocument } from "./cv-pdf-document";
import { CvShowcase } from "./cv-showcase";

type Props = {
  cv: CvPresentationModel;
  variant?: "branded" | "ats";
  className?: string;
  compact?: boolean;
  downloadLinks?: {
    branded_ar: string;
    branded_en: string;
    ats_ar: string;
    ats_en: string;
    current?: string;
  };
};

export function CvStudioPreview({ cv, variant = "branded", className, compact = false, downloadLinks }: Props) {
  const isArabic = cv.locale === "ar";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(4,8,16,0.95),rgba(7,10,18,0.98))] shadow-[0_24px_80px_rgba(2,6,23,0.32)]",
        className,
      )}
      dir={isArabic ? "rtl" : "ltr"}
      data-testid="cv-studio-preview"
    >
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-[var(--primary)]">
              {isArabic ? "معاينة حية" : "Live preview"}
            </div>
            <div className="mt-1 text-sm text-foreground-muted">
              {isArabic
                ? "هذه المعاينة تعتمد على نفس بيانات السيرة التي سيتم حفظها وتصديرها."
                : "This preview is driven by the same CV data used for saving and export."}
            </div>
          </div>

          {downloadLinks ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={isArabic ? downloadLinks.branded_ar : downloadLinks.branded_en}
                target="_blank"
                className="rounded-full border border-white/10 bg-white px-4 py-2 text-xs font-bold text-slate-950"
              >
                Branded PDF
              </Link>
              <Link
                href={isArabic ? downloadLinks.ats_ar : downloadLinks.ats_en}
                target="_blank"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white"
              >
                ATS PDF
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-h-[78vh] overflow-auto p-4">
        {variant === "ats" ? (
          <div className="mx-auto max-w-[920px] overflow-hidden rounded-[1.8rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div
              className="origin-top scale-[0.62] sm:scale-[0.72] md:scale-[0.82]"
              style={{ width: "210mm", transformOrigin: isArabic ? "top right" : "top left" }}
            >
              <CvPdfDocument cv={cv} variant={variant} />
            </div>
          </div>
        ) : (
          <CvShowcase cv={cv} compact={compact} />
        )}
      </div>
    </div>
  );
}
