import { NextResponse } from "next/server";

import {
  deviceSourceAuthSettingKey,
  deviceSourceQueueSettingKey,
  hashSourcePullToken,
  isValidPublicDeviceId,
  normalizePublicDeviceId,
  normalizeSourcePullToken,
  providerSourceQueueExpired,
  type ProviderSourceQueueValue,
} from "@/lib/provider-source-security";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

function readQueueValue(value: unknown): ProviderSourceQueueValue | null {
  const candidate = (value ?? {}) as Partial<ProviderSourceQueueValue>;
  if (typeof candidate.id !== "string" || typeof candidate.publicDeviceId !== "string") {
    return null;
  }
  return candidate as ProviderSourceQueueValue;
}

export async function POST(request: Request) {
  let body: {
    publicDeviceId?: string;
    token?: string;
    sourceId?: string;
    status?: "imported" | "failed";
    message?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const publicDeviceId = normalizePublicDeviceId(body.publicDeviceId);
  const token = normalizeSourcePullToken(body.token);
  const sourceId = String(body.sourceId ?? "").trim();
  const status = body.status === "failed" ? "failed" : "imported";

  if (!isValidPublicDeviceId(publicDeviceId) || token.length < 32 || !sourceId) {
    return NextResponse.json({ ok: false, message: "Invalid source acknowledgement." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: auth, error: deviceError } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", deviceSourceAuthSettingKey(publicDeviceId))
    .maybeSingle();

  if (deviceError) {
    return NextResponse.json({ ok: false, message: "Device lookup failed." }, { status: 500 });
  }
  const authValue = (auth?.value ?? {}) as { publicDeviceId?: string; sourcePullTokenHash?: string; expiresAt?: string };
  if (authValue.publicDeviceId !== publicDeviceId || authValue.sourcePullTokenHash !== hashSourcePullToken(token)) {
    return NextResponse.json({ ok: false, message: "Device token was not accepted." }, { status: 401 });
  }

  const key = deviceSourceQueueSettingKey(publicDeviceId);
  const authKey = deviceSourceAuthSettingKey(publicDeviceId);
  if (authValue.expiresAt && new Date(authValue.expiresAt).getTime() <= Date.now()) {
    await supabase.from("app_settings").delete().in("key", [key, authKey]);
    return NextResponse.json({ ok: true, status, alreadyCleared: true });
  }
  const { data: queueData, error: queueReadError } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (queueReadError) {
    return NextResponse.json({ ok: false, message: "Could not read source acknowledgement state." }, { status: 500 });
  }

  const queue = readQueueValue(queueData?.value);
  if (!queue || queue.publicDeviceId !== publicDeviceId || queue.id !== sourceId) {
    await supabase.from("app_settings").delete().eq("key", authKey);
    return NextResponse.json({ ok: true, status, alreadyCleared: true });
  }

  if (providerSourceQueueExpired(queue)) {
    await supabase.from("app_settings").delete().in("key", [key, authKey]);
    return NextResponse.json({ ok: true, status, alreadyCleared: true });
  }

  const { error } = await supabase.from("app_settings").delete().in("key", [key, authKey]);

  if (error) {
    return NextResponse.json({ ok: false, message: "Could not acknowledge source import." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
