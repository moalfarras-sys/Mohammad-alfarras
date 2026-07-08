import { NextResponse } from "next/server";

import { activationExpiresAt, createActivationCode } from "@/lib/activation-code";
import {
  createActivationRequest,
  expireDeviceWaitingRequests,
  registerDevice,
  secondsUntil,
  writeDeviceSetting,
} from "@/lib/activation-store";
import {
  deviceSourceAuthSettingKey,
  hashSourcePullToken,
  isValidPublicDeviceId,
  normalizePublicDeviceId,
  normalizeSourcePullToken,
} from "@/lib/provider-source-security";
import { rateLimit } from "@/lib/request-guard";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

type CreateBody = {
  publicDeviceId?: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  appVersion?: string;
  sourcePullToken?: string;
  productSlug?: string;
};

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "activation-create", limit: 15, windowSeconds: 60 });
  if (limited) return limited;

  let body: CreateBody = {};
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return json({ status: "invalid", message: "Invalid JSON body." }, { status: 400 });
  }

  const publicDeviceId = normalizePublicDeviceId(body.publicDeviceId);
  if (!isValidPublicDeviceId(publicDeviceId)) {
    return json({ status: "invalid", message: "Invalid public device id." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const productSlug = resolveManagedAppSlug(body.productSlug);
  const sourcePullToken = normalizeSourcePullToken(body.sourcePullToken);
  const sourcePullTokenHash = sourcePullToken.length >= 32 ? hashSourcePullToken(sourcePullToken) : "";

  try {
    await registerDevice({
      publicDeviceId,
      name: String(body.deviceName ?? "MoPlayer device").slice(0, 120),
      platform: String(body.platform ?? "android").slice(0, 40),
      deviceType: String(body.deviceType ?? "android-tv").slice(0, 40),
      appVersion: String(body.appVersion ?? "").slice(0, 40),
    });
  } catch {
    return json({ status: "error", message: "Could not register device." }, { status: 500 });
  }

  if (sourcePullTokenHash) {
    const sourceAuthExpiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    try {
      await writeDeviceSetting(
        deviceSourceAuthSettingKey(publicDeviceId),
        { publicDeviceId, sourcePullTokenHash, expiresAt: sourceAuthExpiresAt, updatedAt: now },
        {
          ttlSeconds: secondsUntil(sourceAuthExpiresAt, 45 * 60),
          description: "Short-lived MoPlayer QR source handoff token hash. Cleared after source import acknowledgement.",
        },
      );
    } catch {
      return json({ status: "error", message: "Could not enable secure source sync." }, { status: 500 });
    }
  }

  try {
    await expireDeviceWaitingRequests(publicDeviceId, productSlug);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = createActivationCode();
      const expiresAt = activationExpiresAt();
      const stored = await createActivationRequest({
        publicDeviceId,
        productSlug,
        code,
        expiresAt,
        userAgent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
      });

      if (stored) {
        return json({
          status: "waiting",
          code,
          expiresAt,
          ttlSeconds: 15 * 60,
        });
      }
    }
  } catch {
    return json({ status: "error", message: "Could not create activation code." }, { status: 500 });
  }

  return json({ status: "error", message: "Could not create activation code." }, { status: 500 });
}
