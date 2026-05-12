import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  let body: { code?: string; deviceName?: string; productSlug?: string; product_slug?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ status: "invalid", message: "Invalid JSON body." }, { status: 400 });
  }

  const code = normalizeActivationCode(body.code);
  const productSlug = resolveManagedAppSlug(body.productSlug ?? body.product_slug);
  if (!isValidActivationCode(code)) {
    return json({ status: "invalid", message: "Invalid activation code format." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activation_requests")
    .select("id, public_device_id, product_slug, status, expires_at")
    .eq("device_code", code)
    .or(productSlug === "moplayer" ? "product_slug.eq.moplayer,product_slug.is.null" : `product_slug.eq.${productSlug}`)
    .maybeSingle();

  if (error) {
    return json({ status: "error", message: "Activation lookup failed." }, { status: 500 });
  }

  if (!data) {
    return json({ status: "invalid", code, message: "Activation code was not found." }, { status: 404 });
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await supabase
      .from("activation_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return json({ status: "expired", code, expiresAt: data.expires_at }, { status: 410 });
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

  return json({
    status: "activated",
    code,
    productSlug,
    publicDeviceId: data.public_device_id,
    activatedAt: now,
  });
}
