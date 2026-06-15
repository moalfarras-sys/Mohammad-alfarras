import { NextResponse } from "next/server";

import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { readBoundedJson, requireAutomationSecret } from "@/lib/automation-security";
import { sendAutomationAlert } from "@/lib/mailer";
import { rateLimit } from "@/lib/request-guard";

async function dispatchToN8n(eventId: string, body: Record<string, unknown>) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET || process.env.AUTOMATION_API_KEY;
  if (!webhookUrl) return { status: "queued", executionId: null, error: null };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
      },
      body: JSON.stringify({ event_id: eventId, ...body }),
    });
    return {
      status: res.ok ? "sent" : "failed",
      executionId: res.headers.get("x-n8n-execution-id"),
      error: res.ok ? null : `n8n_${res.status}`,
    };
  } catch (error) {
    return { status: "failed", executionId: null, error: error instanceof Error ? error.message : "n8n dispatch failed" };
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAutomationSecret(request);
  if (unauthorized) return unauthorized;

  const limited = await rateLimit({ request, bucket: "automation-events", limit: 60, windowSeconds: 60 });
  if (limited) return limited;

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
      const eventPayload = {
        event_type: eventType || "automation.event",
        source: source || "web",
        product_slug: typeof body.product_slug === "string" ? body.product_slug : null,
        subject_type: typeof body.subject_type === "string" ? body.subject_type : null,
        subject_id: typeof body.subject_id === "string" ? body.subject_id : null,
        idempotency_key: idempotencyKey,
        priority: typeof body.priority === "string" ? body.priority : "normal",
        status: "queued",
        payload: body,
      };
      const { data, error } = await supabase.from("automation_events").upsert(
        eventPayload,
        idempotencyKey ? { onConflict: "idempotency_key" } : undefined,
      ).select("id").single();
      if (error) throw error;

      const eventId = data.id as string;
      const dispatch = await dispatchToN8n(eventId, body);
      await supabase.from("automation_events").update({
        status: dispatch.status,
        n8n_execution_id: dispatch.executionId,
        error_message: dispatch.error,
        sent_at: dispatch.status === "sent" ? new Date().toISOString() : null,
      }).eq("id", eventId);

      await supabase.from("automation_runs").insert({
        event_id: eventId,
        workflow_key: String(body.workflow_key ?? eventType ?? "automation.event").slice(0, 120),
        workflow_name: typeof body.workflow_name === "string" ? body.workflow_name.slice(0, 160) : null,
        status: dispatch.status === "failed" ? "failed" : dispatch.status === "sent" ? "success" : "started",
        n8n_execution_id: dispatch.executionId,
        input_summary: body,
        error_message: dispatch.error,
      });

      await supabase.from("automation_inbox").insert({
        event_id: eventId,
        title: eventType || "Automation event",
        body: dispatch.error || source || "web",
        product_slug: typeof body.product_slug === "string" ? body.product_slug : null,
        severity: dispatch.status === "failed" ? "critical" : "info",
        status: dispatch.status === "failed" ? "new" : "reviewing",
        action_payload: { ...body, dispatch },
        created_by: source || "web",
      });
    } catch (error) {
      await sendAutomationAlert({
        title: "Automation event was not stored",
        message: error instanceof Error ? error.message : "The automation event was not stored.",
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
