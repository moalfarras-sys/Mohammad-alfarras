import { NextResponse } from "next/server";

import { readBoundedJson, requireAutomationSecret } from "@/lib/automation-security";
import { sendAutomationAlert } from "@/lib/mailer";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export async function POST(request: Request) {
  const unauthorized = requireAutomationSecret(request, "N8N_WEBHOOK_SECRET");
  if (unauthorized) return unauthorized;

  try {
    const body = await readBoundedJson(request);
    let stored = false;
    if (hasSupabasePublicEnv()) {
      const supabase = createSupabaseAdminClient();
      const eventId = typeof body.event_id === "string" ? body.event_id : null;
      const runId = typeof body.run_id === "string" ? body.run_id : null;
      const status = String(body.status ?? "processed").slice(0, 40);
      if (eventId) {
        await supabase
          .from("automation_events")
          .update({
            status,
            n8n_execution_id: typeof body.n8n_execution_id === "string" ? body.n8n_execution_id : null,
            error_message: typeof body.error_message === "string" ? body.error_message : null,
            processed_at: new Date().toISOString(),
          })
          .eq("id", eventId);
      }
      const { error } = await supabase.from("automation_inbox").insert({
        event_id: eventId,
        run_id: runId,
        title: String(body.title ?? "n8n callback").slice(0, 160),
        body: String(body.message ?? body.error_message ?? "Automation callback received.").slice(0, 2000),
        severity: status === "failed" ? "danger" : "info",
        status: status === "failed" ? "new" : "reviewed",
        action_payload: body,
        created_by: "n8n",
      });
      stored = !error;
    }
    return NextResponse.json({ ok: true, received: true, stored });
  } catch (error) {
    await sendAutomationAlert({
      title: "Invalid n8n callback",
      message: error instanceof Error ? error.message : "Invalid JSON payload received by n8n callback.",
      route: "/api/automation/n8n/callback",
      severity: "warning",
    });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }, { status: 400 });
  }
}
