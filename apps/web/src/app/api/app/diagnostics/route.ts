import { NextResponse } from "next/server";

import { readBoundedJson } from "@/lib/automation-security";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    webUrl: process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space",
    adminUrl: process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.moalfarras.space",
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    assistant: Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
  });
}

export async function POST(request: Request) {
  try {
    const body = await readBoundedJson(request);
    const publicDeviceId = String(body.public_device_id ?? body.publicDeviceId ?? "").trim().slice(0, 80);
    const message = String(body.customer_message ?? body.message ?? "").trim().slice(0, 2000);
    if (!publicDeviceId || !message) {
      return NextResponse.json({ ok: false, error: "Missing device id or message" }, { status: 400 });
    }

    let stored = false;
    if (hasSupabasePublicEnv()) {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("app_diagnostic_reports").insert({
        product_slug: typeof body.product_slug === "string" ? body.product_slug : typeof body.product === "string" ? body.product : "moplayer",
        public_device_id: publicDeviceId,
        app_version: typeof body.app_version === "string" ? body.app_version : typeof body.appVersion === "string" ? body.appVersion : null,
        app_version_code: Number.isFinite(Number(body.app_version_code ?? body.appVersionCode)) ? Number(body.app_version_code ?? body.appVersionCode) : null,
        locale: body.locale === "ar" ? "ar" : "en",
        category: typeof body.category === "string" ? body.category.slice(0, 80) : "general",
        severity: typeof body.severity === "string" ? body.severity.slice(0, 40) : "normal",
        customer_email: typeof body.customer_email === "string" ? body.customer_email.slice(0, 240) : null,
        customer_message: message,
        diagnostic_payload: body,
      });
      stored = !error;
    }

    return NextResponse.json({ ok: true, stored });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }, { status: 400 });
  }
}
