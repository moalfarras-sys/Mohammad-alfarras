import { NextResponse } from "next/server";

import { activationExpiresAt, createActivationCode } from "@/lib/activation-code";
import {
  deviceSourceAuthSettingKey,
  hashSourcePullToken,
  isValidPublicDeviceId,
  normalizePublicDeviceId,
  normalizeSourcePullToken,
} from "@/lib/provider-source-security";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

type CreateBody = {
  publicDeviceId?: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  appVersion?: string;
  sourcePullToken?: string;
};

export async function POST(request: Request) {
  let body: CreateBody = {};
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ status: "invalid", message: "Invalid JSON body." }, { status: 400 });
  }

  const publicDeviceId = normalizePublicDeviceId(body.publicDeviceId);
  if (!isValidPublicDeviceId(publicDeviceId)) {
    return NextResponse.json({ status: "invalid", message: "Invalid public device id." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const sourcePullToken = normalizeSourcePullToken(body.sourcePullToken);
  const sourcePullTokenHash = sourcePullToken.length >= 32 ? hashSourcePullToken(sourcePullToken) : "";

  const devicePayload = {
    public_device_id: publicDeviceId,
    name: String(body.deviceName ?? "MoPlayer device").slice(0, 120),
    platform: String(body.platform ?? "android").slice(0, 40),
    device_type: String(body.deviceType ?? "android-tv").slice(0, 40),
    app_version: String(body.appVersion ?? "").slice(0, 40),
    last_seen_at: now,
    updated_at: now,
  };

  const { error: deviceError } = await supabase
    .from("devices")
    .upsert(devicePayload, { onConflict: "public_device_id" });

  if (deviceError) {
    return NextResponse.json({ status: "error", message: "Could not register device." }, { status: 500 });
  }

  if (sourcePullTokenHash) {
    const { error: authError } = await supabase.from("app_settings").upsert(
      {
        key: deviceSourceAuthSettingKey(publicDeviceId),
        value: {
          publicDeviceId,
          sourcePullTokenHash,
          updatedAt: now,
        },
        description: "Server-only MoPlayer device source sync token hash.",
        updated_at: now,
      },
      { onConflict: "key" },
    );

    if (authError) {
      return NextResponse.json({ status: "error", message: "Could not enable secure source sync." }, { status: 500 });
    }
  }

  await supabase
    .from("activation_requests")
    .update({ status: "expired", updated_at: now })
    .eq("public_device_id", publicDeviceId)
    .eq("status", "waiting");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createActivationCode();
    const expiresAt = activationExpiresAt();
    const { data, error } = await supabase
      .from("activation_requests")
      .insert({
        public_device_id: publicDeviceId,
        device_code: code,
        status: "waiting",
        expires_at: expiresAt,
        user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
      })
      .select("id, device_code, status, expires_at")
      .single();

    if (!error && data) {
      return NextResponse.json({
        status: "waiting",
        code: data.device_code,
        expiresAt: data.expires_at,
        ttlSeconds: 15 * 60,
      });
    }
  }

  return NextResponse.json({ status: "error", message: "Could not create activation code." }, { status: 500 });
}
