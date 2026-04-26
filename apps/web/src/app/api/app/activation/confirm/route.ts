import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  let body: { code?: string; deviceName?: string } = {};
  try {
    body = (await request.json()) as { code?: string; deviceName?: string };
  } catch {
    return NextResponse.json({ status: "invalid", message: "Invalid JSON body." }, { status: 400 });
  }

  const code = normalizeActivationCode(body.code);
  if (!isValidActivationCode(code)) {
    return NextResponse.json({ status: "invalid", message: "Invalid activation code format." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activation_requests")
    .select("id, public_device_id, status, expires_at")
    .eq("device_code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ status: "error", message: "Activation lookup failed." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ status: "invalid", code, message: "Activation code was not found." }, { status: 404 });
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await supabase
      .from("activation_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return NextResponse.json({ status: "expired", code, expiresAt: data.expires_at }, { status: 410 });
  }

  const now = new Date().toISOString();
  const { data: device } = await supabase
    .from("devices")
    .update({
      status: "active",
      name: String(body.deviceName ?? "MoPlayer device").slice(0, 120),
      last_seen_at: now,
      updated_at: now,
    })
    .eq("public_device_id", data.public_device_id)
    .select("id, public_device_id")
    .single();

  await supabase
    .from("activation_requests")
    .update({ status: "activated", activated_at: now, updated_at: now })
    .eq("id", data.id);

  if (device?.id) {
    await supabase.from("licenses").upsert(
      {
        device_id: device.id,
        plan: "free",
        status: "active",
        updated_at: now,
      },
      { onConflict: "device_id" },
    );
  }

  return NextResponse.json({
    status: "activated",
    code,
    publicDeviceId: data.public_device_id,
    activatedAt: now,
  });
}
