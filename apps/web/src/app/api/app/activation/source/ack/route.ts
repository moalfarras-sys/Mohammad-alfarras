import { NextResponse } from "next/server";

import { deleteDeviceSettings, readDeviceSetting } from "@/lib/activation-store";
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
import { rateLimit } from "@/lib/request-guard";

function readQueueValue(value: unknown): ProviderSourceQueueValue | null {
  const candidate = (value ?? {}) as Partial<ProviderSourceQueueValue>;
  if (typeof candidate.id !== "string" || typeof candidate.publicDeviceId !== "string") {
    return null;
  }
  return candidate as ProviderSourceQueueValue;
}

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "activation-source-ack", limit: 30, windowSeconds: 60 });
  if (limited) return limited;

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

  const key = deviceSourceQueueSettingKey(publicDeviceId);
  const authKey = deviceSourceAuthSettingKey(publicDeviceId);

  const authValue = await readDeviceSetting<{ publicDeviceId?: string; sourcePullTokenHash?: string; expiresAt?: string }>(authKey);
  if (!authValue || authValue.publicDeviceId !== publicDeviceId || authValue.sourcePullTokenHash !== hashSourcePullToken(token)) {
    return NextResponse.json({ ok: false, message: "Device token was not accepted." }, { status: 401 });
  }

  if (authValue.expiresAt && new Date(authValue.expiresAt).getTime() <= Date.now()) {
    await deleteDeviceSettings(key, authKey);
    return NextResponse.json({ ok: true, status, alreadyCleared: true });
  }

  const queue = readQueueValue(await readDeviceSetting<unknown>(key));
  if (!queue || queue.publicDeviceId !== publicDeviceId || queue.id !== sourceId) {
    await deleteDeviceSettings(authKey);
    return NextResponse.json({ ok: true, status, alreadyCleared: true });
  }

  if (providerSourceQueueExpired(queue)) {
    await deleteDeviceSettings(key, authKey);
    return NextResponse.json({ ok: true, status, alreadyCleared: true });
  }

  try {
    await deleteDeviceSettings(key, authKey);
  } catch {
    return NextResponse.json({ ok: false, message: "Could not acknowledge source import." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
