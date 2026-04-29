import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import { deviceSourceQueueSettingKey, type ProviderSourceQueueValue } from "@/lib/provider-source-security";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

function sourceDeliveryStatus(value: unknown, publicDeviceId: string) {
  const queue = (value ?? {}) as Partial<ProviderSourceQueueValue>;
  if (queue.publicDeviceId !== publicDeviceId) return { pending: false, status: "none" };
  if (queue.status === "pending") return { pending: true, status: "source_sent" };
  if (queue.status === "fetched") return { pending: true, status: "source_fetched" };
  if (queue.status === "imported") return { pending: false, status: "imported" };
  if (queue.status === "failed") return { pending: false, status: "failed", message: queue.failureMessage };
  if (queue.status === "revoked") return { pending: false, status: "revoked" };
  return { pending: false, status: "none" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = normalizeActivationCode(searchParams.get("code"));

  if (!isValidActivationCode(code)) {
    return NextResponse.json(
      {
        status: "invalid",
        message: "Invalid activation code format.",
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activation_requests")
    .select("id, public_device_id, device_code, status, expires_at, activated_at")
    .eq("device_code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ status: "error", message: "Activation lookup failed." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ status: "invalid", code, message: "Activation code was not found." }, { status: 404 });
  }

  const isExpired = new Date(data.expires_at).getTime() <= Date.now();
  if (isExpired && data.status === "waiting") {
    await supabase
      .from("activation_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return NextResponse.json({ status: "expired", code, expiresAt: data.expires_at }, { status: 410 });
  }

  if (data.status === "activated") {
    const { data: sourceRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", deviceSourceQueueSettingKey(data.public_device_id))
      .maybeSingle();

    const source = sourceDeliveryStatus(sourceRow?.value, data.public_device_id);
    return NextResponse.json({
      status: "activated",
      code,
      publicDeviceId: data.public_device_id,
      activatedAt: data.activated_at,
      sourcePending: source.pending,
      sourceStatus: source.status,
      sourceMessage: source.message,
    });
  }

  return NextResponse.json(
    {
      status: "pending",
      code,
      expiresAt: data.expires_at,
      message: "Activation is waiting for confirmation.",
    },
    { status: 202 },
  );
}
