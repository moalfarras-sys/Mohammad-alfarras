import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import {
  decryptProviderSource,
  deviceSourceAuthSettingKey,
  deviceSourceQueueSettingKey,
  encryptProviderSource,
  hashSourcePullToken,
  isValidPublicDeviceId,
  normalizePublicDeviceId,
  normalizeProviderSource,
  normalizeSourcePullToken,
  providerSourceQueueBelongsToProduct,
  publicProviderSource,
  type ProviderSourceQueueValue,
  testProviderSource,
} from "@/lib/provider-source-security";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function activatedDeviceByCode(code: string, productSlug: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activation_requests")
    .select("public_device_id, product_slug, status, expires_at")
    .eq("device_code", code)
    .or(productSlug === "moplayer" ? "product_slug.eq.moplayer,product_slug.is.null" : `product_slug.eq.${productSlug}`)
    .maybeSingle();

  if (error) return { error: "Activation lookup failed." };
  if (!data) return { error: "Activation code was not found.", status: 404 };
  if (data.status !== "activated") return { error: "Activate the device before adding a source.", status: 409 };
  if (new Date(data.expires_at).getTime() <= Date.now()) return { error: "Activation code expired.", status: 410 };
  return { publicDeviceId: data.public_device_id };
}

async function verifiedDeviceByToken(publicDeviceId: string, token: string) {
  const supabase = createSupabaseAdminClient();
  const tokenHash = hashSourcePullToken(token);
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", deviceSourceAuthSettingKey(publicDeviceId))
    .maybeSingle();

  if (error) return { error: "Device lookup failed." };
  const value = (data?.value ?? {}) as { publicDeviceId?: string; sourcePullTokenHash?: string };
  if (value.publicDeviceId !== publicDeviceId || value.sourcePullTokenHash !== tokenHash) {
    return { error: "Device token was not accepted.", status: 401 };
  }
  return { publicDeviceId };
}

function readQueueValue(value: unknown): ProviderSourceQueueValue | null {
  const candidate = (value ?? {}) as Partial<ProviderSourceQueueValue>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.publicDeviceId !== "string" ||
    typeof candidate.encryptedPayload !== "string" ||
    (candidate.sourceType !== "xtream" && candidate.sourceType !== "m3u")
  ) {
    return null;
  }
  return candidate as ProviderSourceQueueValue;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const code = normalizeActivationCode(String(body.code ?? ""));
  if (!isValidActivationCode(code)) {
    return json({ ok: false, message: "Invalid activation code." }, { status: 400 });
  }

  const productSlug = resolveManagedAppSlug(String(body.productSlug ?? body.product_slug ?? ""));
  const activated = await activatedDeviceByCode(code, productSlug);
  if (!activated.publicDeviceId) {
    return json({ ok: false, message: activated.error }, { status: activated.status ?? 500 });
  }

  try {
    const source = normalizeProviderSource(body.source);
    const test = await testProviderSource(source);
    if (!test.ok) {
      return json(test, { status: 422 });
    }
    const normalizedSource = test.normalizedSource ?? source;

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const queueValue: ProviderSourceQueueValue = {
      id: randomUUID(),
      publicDeviceId: activated.publicDeviceId,
      productSlug,
      sourceType: normalizedSource.type,
      displayName: normalizedSource.name,
      encryptedPayload: encryptProviderSource(normalizedSource),
      encryptionVersion: "aes-256-gcm:v1",
      status: "pending",
      lastTestStatus: "success",
      lastTestMessage: test.message,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from("app_settings").upsert(
      {
        key: deviceSourceQueueSettingKey(activated.publicDeviceId),
        value: queueValue,
        description: "Server-only encrypted one-device provider source queue.",
        updated_at: now,
      },
      { onConflict: "key" },
    );

    if (error) {
      return json({ ok: false, message: "Could not save source for the device." }, { status: 500 });
    }

    return json({
      ok: true,
      status: "source_sent",
      message: "Source saved. MoPlayer will import it automatically while the activation screen is open.",
      source: {
        id: queueValue.id,
        source_type: queueValue.sourceType,
        display_name: queueValue.displayName,
        status: queueValue.status,
        created_at: queueValue.createdAt,
      },
    });
  } catch (error) {
    return json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid source." },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicDeviceId = normalizePublicDeviceId(searchParams.get("publicDeviceId"));
  const token = normalizeSourcePullToken(searchParams.get("token"));
  const productSlug = resolveManagedAppSlug(searchParams.get("product") ?? searchParams.get("productSlug"));

  if (!isValidPublicDeviceId(publicDeviceId) || token.length < 32) {
    return json({ status: "invalid", message: "Invalid device credentials." }, { status: 400 });
  }

  const verified = await verifiedDeviceByToken(publicDeviceId, token);
  if (!verified.publicDeviceId) {
    return json({ status: "unauthorized", message: verified.error }, { status: verified.status ?? 500 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", deviceSourceQueueSettingKey(publicDeviceId))
    .maybeSingle();

  if (error) {
    return json({ status: "error", message: "Could not read pending source." }, { status: 500 });
  }

  const queue = readQueueValue(data?.value);
  if (
    !queue ||
    queue.publicDeviceId !== publicDeviceId ||
    !providerSourceQueueBelongsToProduct(queue, productSlug) ||
    !["pending", "fetched"].includes(queue.status)
  ) {
    return json({ status: "empty" });
  }

  const now = new Date().toISOString();
  await supabase.from("app_settings").upsert(
    {
      key: deviceSourceQueueSettingKey(publicDeviceId),
      value: {
        ...queue,
        status: "fetched",
        pulledAt: now,
        updatedAt: now,
      },
      description: "Server-only encrypted one-device provider source queue.",
      updated_at: now,
    },
    { onConflict: "key" },
  );

  return json({
    status: "source_available",
    sourceId: queue.id,
    source: publicProviderSource(decryptProviderSource(queue.encryptedPayload)),
  });
}
