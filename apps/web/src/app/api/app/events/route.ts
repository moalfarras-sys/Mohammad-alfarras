import { NextResponse } from "next/server";

import { readBoundedJson } from "@/lib/automation-security";
import { rateLimit } from "@/lib/request-guard";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit({ request, bucket: "app-events", limit: 80, windowSeconds: 60 });
    if (limited) return limited;

    const body = await readBoundedJson(request);
    let stored = false;
    if (hasSupabasePublicEnv()) {
      const supabase = createSupabaseAdminClient();
      const eventType = String(body.event_type ?? body.type ?? "app.event").trim().slice(0, 120);
      const { error } = await supabase.from("automation_events").insert({
        event_type: eventType || "app.event",
        source: "app",
        product_slug: typeof body.product_slug === "string" ? body.product_slug : typeof body.product === "string" ? body.product : null,
        subject_type: "device",
        subject_id: typeof body.public_device_id === "string" ? body.public_device_id : null,
        priority: typeof body.priority === "string" ? body.priority : "normal",
        status: "queued",
        payload: body,
      });
      stored = !error;
    }
    return NextResponse.json({ ok: true, stored, receivedAt: new Date().toISOString(), event: body });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "ready" });
}
