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

  const fallbackPath = path.join(process.cwd(), "public", "Lebenslauf.pdf");
  const pdf = await readFile(fallbackPath);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mohammad-alfarras-${locale}-${variant}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
