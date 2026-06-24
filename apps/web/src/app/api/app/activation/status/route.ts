import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import {
  deleteDeviceSettings,
  getActivationRequest,
  readDeviceSetting,
  setActivationStatus,
} from "@/lib/activation-store";
import {
  deviceSourceAuthSettingKey,
  deviceSourceQueueSettingKey,
  providerSourceQueueBelongsToProduct,
  providerSourceQueueExpired,
  type ProviderSourceQueueValue,
} from "@/lib/provider-source-security";
import { rateLimit } from "@/lib/request-guard";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function sourceDeliveryStatus(value: unknown, publicDeviceId: string, productSlug: string) {
  const queue = (value ?? {}) as Partial<ProviderSourceQueueValue>;
  if (queue.publicDeviceId !== publicDeviceId) return { pending: false, status: "none" };
  if (!providerSourceQueueBelongsToProduct(queue, productSlug)) return { pending: false, status: "none" };
  if (providerSourceQueueExpired(queue)) {
    await deleteDeviceSettings(deviceSourceQueueSettingKey(publicDeviceId), deviceSourceAuthSettingKey(publicDeviceId));
    return { pending: false, status: "expired" };
  }
  if (queue.status === "pending") return { pending: true, status: "source_sent" };
  if (queue.status === "fetched") return { pending: true, status: "source_fetched" };
  if (queue.status === "imported") return { pending: false, status: "imported" };
  if (queue.status === "failed") return { pending: false, status: "failed", message: queue.failureMessage };
  if (queue.status === "revoked") return { pending: false, status: "revoked" };
  return { pending: false, status: "none" };
}

export async function GET(request: Request) {
  const limited = await rateLimit({ request, bucket: "activation-status", limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const code = normalizeActivationCode(searchParams.get("code"));
  const productSlug = resolveManagedAppSlug(searchParams.get("product") ?? searchParams.get("productSlug"));

  if (!isValidActivationCode(code)) {
    return json({ status: "invalid", message: "Invalid activation code format." }, { status: 400 });
  }

  const data = await getActivationRequest(code, productSlug);
  if (!data) {
    return json({ status: "invalid", code, message: "Activation code was not found." }, { status: 404 });
  }

  const isExpired = new Date(data.expiresAt).getTime() <= Date.now();
  if (isExpired && data.status === "waiting") {
    await setActivationStatus(code, "expired");
    return json({ status: "expired", code, expiresAt: data.expiresAt }, { status: 410 });
  }

  if (data.status === "activated") {
    const sourceRow = await readDeviceSetting<unknown>(deviceSourceQueueSettingKey(data.publicDeviceId));
    const source = await sourceDeliveryStatus(sourceRow, data.publicDeviceId, productSlug);
    return json({
      status: "activated",
      code,
      productSlug,
      publicDeviceId: data.publicDeviceId,
      activatedAt: data.activatedAt,
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
      expiresAt: data.expiresAt,
      message: "Activation is waiting for confirmation.",
    },
    { status: 202 },
  );
}
