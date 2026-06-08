import { NextResponse } from "next/server";

import { readBoundedJson } from "@/lib/automation-security";
import { rateLimit } from "@/lib/request-guard";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit({ request, bucket: "app-events", limit: 80, windowSeconds: 60 });
    if (limited) return limited;

    const body = await readBoundedJson(request);
    let stored = false;
    let storedDeviceEvent = false;
    if (hasSupabasePublicEnv()) {
      const supabase = createSupabaseAdminClient();
      const eventType = String(body.event_type ?? body.type ?? "app.event").trim().slice(0, 120);
      const productSlug = resolveManagedAppSlug(
        typeof body.product_slug === "string" ? body.product_slug : typeof body.product === "string" ? body.product : undefined,
      );
      const publicDeviceId = String(body.public_device_id ?? body.publicDeviceId ?? "").trim().slice(0, 80);
      const appVersion = String(body.app_version ?? body.appVersion ?? "").trim().slice(0, 40);

      if (publicDeviceId) {
        const seenAt = new Date().toISOString();
        const deviceEvent = await supabase.from("app_device_events").insert({
          product_slug: productSlug,
          public_device_id: publicDeviceId,
          event_type: eventType || "app.event",
          app_version: appVersion || null,
          metadata: body,
        });
        storedDeviceEvent = !deviceEvent.error;

        await supabase
          .from("devices")
          .update({
            ...(appVersion ? { app_version: appVersion } : {}),
            last_seen_at: seenAt,
            updated_at: seenAt,
          })
          .eq("public_device_id", publicDeviceId);
      }

      const { error } = await supabase.from("automation_events").insert({
        event_type: eventType || "app.event",
        source: "app",
        product_slug: productSlug,
        subject_type: "device",
        subject_id: publicDeviceId || null,
        priority: typeof body.priority === "string" ? body.priority : "normal",
        status: "queued",
        payload: body,
      });
      stored = !error;
    }
    return NextResponse.json({ ok: true, stored, storedDeviceEvent, receivedAt: new Date().toISOString(), event: body });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "ready" });
}
