import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const configuredSecret = process.env.CMS_REVALIDATE_SECRET || process.env.AUTOMATION_API_KEY || process.env.ADMIN_SESSION_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const headerSecret = request.headers.get("x-cms-revalidate-secret");
  if (headerSecret !== configuredSecret) return unauthorized();

  revalidateTag("cms-snapshot", "max");
  revalidatePath("/[locale]", "layout");
  for (const locale of ["en", "ar"]) {
    for (const path of [
      "",
      "/services",
      "/work",
      "/contact",
      "/support",
      "/apps",
      "/apps/moplayer",
      "/apps/moplayer/classic",
      "/apps/moplayer2",
      "/apps/moplayer-pc",
      "/activate",
      "/youtube",
      "/cv",
      "/privacy",
      "/terms",
      // "/legal" was revalidated for years but no such route exists; the real
      // legal routes are these, and /moos, /about and the iOS page were missing.
      "/app-disclaimer",
      "/download-disclaimer",
      "/impressum",
      "/moos",
      "/about",
      "/apps/moplayer-ios",
    ]) {
      revalidatePath(`/${locale}${path}`);
    }
  }
  revalidatePath("/api/app/config");
  revalidatePath("/api/app/download/latest");

  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
