import { NextResponse } from "next/server";

import { readBoundedJson } from "@/lib/automation-security";
import { rateLimit } from "@/lib/request-guard";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

const categoryAliases = {
  activation: "activation",
  pairing: "activation",
  code: "activation",
  playback: "playback",
  player: "playback",
  video: "playback",
  audio: "playback",
  buffering: "playback",
  source: "source",
  provider: "source",
  playlist: "source",
  xtream: "source",
  m3u: "source",
  crash: "crash",
  exception: "crash",
  fatal: "crash",
} as const;

function normalizeDiagnosticCategory(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  return categoryAliases[raw as keyof typeof categoryAliases] ?? "general";
}

function normalizeDiagnosticSeverity(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "critical" || raw === "fatal") return "critical";
  if (raw === "high" || raw === "error" || raw === "warning") return "high";
  if (raw === "low" || raw === "info" || raw === "debug") return "low";
  return "normal";
}

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
    const limited = await rateLimit({ request, bucket: "app-diagnostics", limit: 20, windowSeconds: 10 * 60 });
    if (limited) return limited;

    const body = await readBoundedJson(request);
    const publicDeviceId = String(body.public_device_id ?? body.publicDeviceId ?? "").trim().slice(0, 80);
    const message = String(body.customer_message ?? body.message ?? "").trim().slice(0, 2000);
    if (!publicDeviceId || !message) {
      return NextResponse.json({ ok: false, error: "Missing device id or message" }, { status: 400 });
    }

    let stored = false;
    if (hasSupabasePublicEnv()) {
      const supabase = createSupabaseAdminClient();
      const productSlug = resolveManagedAppSlug(
        typeof body.product_slug === "string" ? body.product_slug : typeof body.product === "string" ? body.product : undefined,
      );
      const appVersion = typeof body.app_version === "string" ? body.app_version : typeof body.appVersion === "string" ? body.appVersion : null;
      const { error } = await supabase.from("app_diagnostic_reports").insert({
        product_slug: productSlug,
        public_device_id: publicDeviceId,
        app_version: appVersion,
        app_version_code: Number.isFinite(Number(body.app_version_code ?? body.appVersionCode)) ? Number(body.app_version_code ?? body.appVersionCode) : null,
        locale: body.locale === "ar" ? "ar" : "en",
        category: normalizeDiagnosticCategory(body.category),
        severity: normalizeDiagnosticSeverity(body.severity),
        customer_email: typeof body.customer_email === "string" ? body.customer_email.slice(0, 240) : null,
        customer_message: message,
        diagnostic_payload: body,
      });
      stored = !error;

      const seenAt = new Date().toISOString();
      await supabase
        .from("devices")
        .update({
          ...(appVersion ? { app_version: appVersion } : {}),
          last_seen_at: seenAt,
          updated_at: seenAt,
        })
        .eq("public_device_id", publicDeviceId);
    }

    return NextResponse.json({ ok: true, stored });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }, { status: 400 });
  }
}
