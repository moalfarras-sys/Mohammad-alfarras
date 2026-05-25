import { NextResponse } from "next/server";

import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { readBoundedJson, requireAutomationSecret } from "@/lib/automation-security";
import { sendAutomationAlert } from "@/lib/mailer";

export async function POST(request: Request) {
  const unauthorized = requireAutomationSecret(request);
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    await sendAutomationAlert({
      title: "Invalid automation event",
      message: error instanceof Error ? error.message : "Invalid JSON payload received by automation events.",
      route: "/api/automation/events",
      severity: "warning",
    });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }, { status: 400 });
  }

  if (hasSupabasePublicEnv()) {
    try {
      const supabase = createSupabaseAdminClient();
      const eventType = String(body.event_type ?? body.type ?? "automation.event").trim().slice(0, 120);
      const source = String(body.source ?? "web").trim().slice(0, 80);
      const idempotencyKey = String(body.idempotency_key ?? body.idempotencyKey ?? "").trim().slice(0, 160) || null;
      const { error } = await supabase.from("automation_events").upsert(
        {
          event_type: eventType || "automation.event",
          source: source || "web",
          product_slug: typeof body.product_slug === "string" ? body.product_slug : null,
          subject_type: typeof body.subject_type === "string" ? body.subject_type : null,
          subject_id: typeof body.subject_id === "string" ? body.subject_id : null,
          idempotency_key: idempotencyKey,
          priority: typeof body.priority === "string" ? body.priority : "normal",
          status: "queued",
          payload: body,
        },
        idempotencyKey ? { onConflict: "idempotency_key" } : undefined,
      );
      if (error) throw error;

      await supabase.from("automation_inbox").insert({
        title: eventType || "Automation event",
        body: source || "web",
        product_slug: typeof body.product_slug === "string" ? body.product_slug : null,
        severity: "info",
        status: "new",
        action_payload: body,
        created_by: source || "web",
      });
    } catch (error) {
      await sendAutomationAlert({
        title: "Automation event was not stored",
        message: error instanceof Error ? error.message : "Supabase failed to store the automation event.",
        route: "/api/automation/events",
        severity: "danger",
        details: {
          eventType: String(body.event_type ?? body.type ?? "unknown"),
          source: String(body.source ?? "unknown"),
        },
      });
      return NextResponse.json({ ok: true, stored: false });
    }
  }
  return NextResponse.json({ ok: true, stored: hasSupabasePublicEnv() });
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "ready" });
}
