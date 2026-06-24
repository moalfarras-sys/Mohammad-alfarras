import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import {
  deleteDeviceSettings,
  getActivationRequest,
  readDeviceSetting,
  secondsUntil,
  writeDeviceSetting,
} from "@/lib/activation-store";
import {
  decryptProviderSource,
  deviceSourceAuthSettingKey,
  deviceSourceQueueSettingKey,
  encryptProviderSource,
  fetchedProviderSourceReceiptExpiresAt,
  hashSourcePullToken,
  isValidPublicDeviceId,
  normalizePublicDeviceId,
  normalizeProviderSource,
  normalizeSourcePullToken,
  pendingProviderSourceExpiresAt,
  providerSourceTestAllowsHandoff,
  providerSourceQueueBelongsToProduct,
  providerSourceQueueExpired,
  publicProviderSource,
  type ProviderSourceQueueValue,
  testProviderSource,
} from "@/lib/provider-source-security";
import { rateLimit } from "@/lib/request-guard";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function activatedDeviceByCode(code: string, productSlug: string) {
  const data = await getActivationRequest(code, productSlug);
  if (!data) return { error: "Activation code was not found.", status: 404 };
  if (data.status !== "activated") return { error: "Activate the device before adding a source.", status: 409 };
  if (new Date(data.expiresAt).getTime() <= Date.now()) return { error: "Activation code expired.", status: 410 };
  return { publicDeviceId: data.publicDeviceId };
}

async function verifiedDeviceByToken(publicDeviceId: string, token: string) {
  const tokenHash = hashSourcePullToken(token);
  const authKey = deviceSourceAuthSettingKey(publicDeviceId);
  const value = await readDeviceSetting<{ publicDeviceId?: string; sourcePullTokenHash?: string; expiresAt?: string }>(authKey);
  if (value?.expiresAt && new Date(value.expiresAt).getTime() <= Date.now()) {
    await deleteDeviceSettings(authKey, deviceSourceQueueSettingKey(publicDeviceId));
    return { error: "Device token expired. Create a new QR activation.", status: 410 };
  }
  if (!value || value.publicDeviceId !== publicDeviceId || value.sourcePullTokenHash !== tokenHash) {
    return { error: "Device token was not accepted.", status: 401 };
  }
  return { publicDeviceId };
}

function readQueueValue(value: unknown): ProviderSourceQueueValue | null {
  const candidate = (value ?? {}) as Partial<ProviderSourceQueueValue>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.publicDeviceId !== "string" ||
    (candidate.sourceType !== "xtream" && candidate.sourceType !== "m3u")
  ) {
    return null;
  }
  return candidate as ProviderSourceQueueValue;
}

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "activation-source", limit: 12, windowSeconds: 60 });
  if (limited) return limited;

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
    if (!test.ok && !providerSourceTestAllowsHandoff(test)) {
      return json(test, { status: 422 });
    }
    const normalizedSource = test.normalizedSource ?? source;

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
      lastTestStatus: test.ok ? "success" : "failed",
      lastTestMessage: test.message,
      createdAt: now,
      updatedAt: now,
      expiresAt: pendingProviderSourceExpiresAt(),
    };

    await writeDeviceSetting(deviceSourceQueueSettingKey(activated.publicDeviceId), queueValue, {
      ttlSeconds: secondsUntil(queueValue.expiresAt, 20 * 60),
      description: "Server-only encrypted one-device provider source queue.",
    });

    return json({
      ok: true,
      status: "source_sent",
      message: test.ok
        ? "Source saved. MoPlayer will import it automatically while the activation screen is open."
        : "Source queued for the device. The website could not verify this provider, so MoPlayer will validate it locally.",
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
  const limited = await rateLimit({ request, bucket: "activation-source-pull", limit: 30, windowSeconds: 60 });
  if (limited) return limited;

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

  const key = deviceSourceQueueSettingKey(publicDeviceId);
  const authKey = deviceSourceAuthSettingKey(publicDeviceId);
  const queue = readQueueValue(await readDeviceSetting<unknown>(key));
  if (
    !queue ||
    queue.publicDeviceId !== publicDeviceId ||
    !providerSourceQueueBelongsToProduct(queue, productSlug) ||
    queue.status !== "pending"
  ) {
    return json({ status: "empty" });
  }

  if (providerSourceQueueExpired(queue)) {
    await deleteDeviceSettings(key, authKey);
    return json({ status: "empty", message: "Pending source expired. Create a new QR activation." });
  }

  if (!queue.encryptedPayload) {
    await deleteDeviceSettings(key, authKey);
    return json({ status: "empty" });
  }

  let source;
  try {
    source = publicProviderSource(decryptProviderSource(queue.encryptedPayload));
  } catch {
    await deleteDeviceSettings(key, authKey);
    return json({ status: "error", message: "Pending source could not be read. Create a new QR activation." }, { status: 500 });
  }

  const now = new Date().toISOString();
  const receiptQueue = { ...queue };
  delete receiptQueue.encryptedPayload;
  const receiptExpiresAt = fetchedProviderSourceReceiptExpiresAt();
  try {
    await writeDeviceSetting(
      key,
      {
        ...receiptQueue,
        status: "fetched",
        pulledAt: now,
        updatedAt: now,
        expiresAt: receiptExpiresAt,
      },
      {
        ttlSeconds: secondsUntil(receiptExpiresAt, 5 * 60),
        description: "Short-lived provider source delivery receipt. Sensitive source payload is removed after first fetch.",
      },
    );
  } catch {
    return json({ status: "error", message: "Could not clear pending source after fetch." }, { status: 500 });
  }

  return json({
    status: "source_available",
    sourceId: queue.id,
    source,
  });
}
