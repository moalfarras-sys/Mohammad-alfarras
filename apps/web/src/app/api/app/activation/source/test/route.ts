import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import { normalizeProviderSource, testProviderSource } from "@/lib/provider-source-security";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

async function getActivatedDevice(code: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activation_requests")
    .select("public_device_id, status, expires_at")
    .eq("device_code", code)
    .maybeSingle();

  if (error) return { error: "Activation lookup failed." };
  if (!data) return { error: "Activation code was not found.", status: 404 };
  if (data.status !== "activated") return { error: "Activate the device before adding a source.", status: 409 };
  if (new Date(data.expires_at).getTime() <= Date.now()) return { error: "Activation code expired.", status: 410 };
  return { publicDeviceId: data.public_device_id };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const code = normalizeActivationCode(String(body.code ?? ""));
  if (!isValidActivationCode(code)) {
    return NextResponse.json({ ok: false, message: "Invalid activation code." }, { status: 400 });
  }

  const activated = await getActivatedDevice(code);
  if (!activated.publicDeviceId) {
    return NextResponse.json({ ok: false, message: activated.error }, { status: activated.status ?? 500 });
  }

  try {
    const source = normalizeProviderSource(body.source);
    const result = await testProviderSource(source);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid source." },
      { status: 400 },
    );
  }
}
