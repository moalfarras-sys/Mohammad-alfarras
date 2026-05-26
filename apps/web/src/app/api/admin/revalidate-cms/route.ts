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
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/apps/moplayer2");
  revalidatePath("/ar/apps/moplayer2");

  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
