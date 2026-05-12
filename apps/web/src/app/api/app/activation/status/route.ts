import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import {
  deviceSourceQueueSettingKey,
  providerSourceQueueBelongsToProduct,
  type ProviderSourceQueueValue,
} from "@/lib/provider-source-security";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function sourceDeliveryStatus(value: unknown, publicDeviceId: string, productSlug: string) {
  const queue = (value ?? {}) as Partial<ProviderSourceQueueValue>;
  if (queue.publicDeviceId !== publicDeviceId) return { pending: false, status: "none" };
  if (!providerSourceQueueBelongsToProduct(queue, productSlug)) return { pending: false, status: "none" };
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
  const productSlug = resolveManagedAppSlug(searchParams.get("product") ?? searchParams.get("productSlug"));

  if (!isValidActivationCode(code)) {
    return json(
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
    .select("id, public_device_id, device_code, product_slug, status, expires_at, activated_at")
    .eq("device_code", code)
    .or(productSlug === "moplayer" ? "product_slug.eq.moplayer,product_slug.is.null" : `product_slug.eq.${productSlug}`)
    .maybeSingle();

  if (error) {
    return json({ status: "error", message: "Activation lookup failed." }, { status: 500 });
  }

  if (!data) {
    return json({ status: "invalid", code, message: "Activation code was not found." }, { status: 404 });
  }

  const isExpired = new Date(data.expires_at).getTime() <= Date.now();
  if (isExpired && data.status === "waiting") {
    await supabase
      .from("activation_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return json({ status: "expired", code, expiresAt: data.expires_at }, { status: 410 });
  }

  if (data.status === "activated") {
    const { data: sourceRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", deviceSourceQueueSettingKey(data.public_device_id))
      .maybeSingle();

    const source = sourceDeliveryStatus(sourceRow?.value, data.public_device_id, productSlug);
    return json({
      status: "activated",
      code,
      productSlug,
      publicDeviceId: data.public_device_id,
      activatedAt: data.activated_at,
      sourcePending: source.pending,
      sourceStatus: source.status,
      sourceMessage: source.message,
    });
  }

  return json(
    {
      status: "pending",
      code,
      productSlug,
      expiresAt: data.expires_at,
      message: "Activation is waiting for confirmation.",
    },
    { status: 202 },
  );
}
