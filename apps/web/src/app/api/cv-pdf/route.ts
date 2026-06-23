import { readFile } from "node:fs/promises";
import path from "node:path";

import { getPdfRegistry } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PdfVariant = "branded" | "ats";
type CvLocale = "ar" | "en" | "de";

function normalizeLocale(value: string | null): CvLocale {
  if (value === "ar") return "ar";
  if (value === "de") return "de";
  return "en";
}

// Literal paths so the Vercel file tracer bundles every CV into the function.
const CV_FILES: Record<CvLocale, string> = {
  ar: path.join(process.cwd(), "public", "cv", "Mohammad-Alfarras-CV-ar.pdf"),
  en: path.join(process.cwd(), "public", "cv", "Mohammad-Alfarras-CV-en.pdf"),
  de: path.join(process.cwd(), "public", "cv", "Mohammad-Alfarras-CV-de.pdf"),
};

function normalizeVariant(value: string | null): PdfVariant {
  return value === "ats" ? "ats" : "branded";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get("locale"));
  const variant = normalizeVariant(searchParams.get("variant"));

  try {
    const snapshot = await readSnapshot();
    const registry = getPdfRegistry(snapshot);
    const activeMode = registry.active[variant];
    const upload = registry.uploads[variant];

    if (activeMode === "uploaded" && upload?.url) {
      return Response.redirect(upload.url, 302);
    }
  } catch {
    // Fall back to the bundled PDF if CMS content cannot be read.
  }

  // Serve the locale-specific, site-branded CV generated from /cv-print/[locale].
  // Falls back to the bundled Lebenslauf only if the generated file is missing.
  const candidates = [CV_FILES[locale], path.join(process.cwd(), "public", "Lebenslauf.pdf")];

  let pdf: Buffer | null = null;
  for (const candidate of candidates) {
    try {
      pdf = await readFile(candidate);
      break;
    } catch {
      // try the next candidate
    }
  }

  if (!pdf) {
    return new Response("CV not found", { status: 404 });
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Mohammad-Alfarras-CV-${locale}-${variant}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
