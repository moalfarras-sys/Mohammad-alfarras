import { readFile } from "node:fs/promises";
import path from "node:path";

import { getPdfRegistry } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PdfVariant = "branded" | "ats";

function normalizeLocale(value: string | null): Locale {
  return value === "ar" ? "ar" : "en";
}

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

  // Serve the locale-specific, site-branded CV generated from /[locale]/cv-print.
  // Falls back to the bundled Lebenslauf only if the generated file is missing.
  const candidates = [
    path.join(process.cwd(), "public", "cv", `Mohammad-Alfarras-CV-${locale}.pdf`),
    path.join(process.cwd(), "public", "Lebenslauf.pdf"),
  ];

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
