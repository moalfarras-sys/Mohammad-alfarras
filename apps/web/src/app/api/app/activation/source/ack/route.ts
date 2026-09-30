import { NextResponse } from "next/server";

import { deleteDeviceSettings, readDeviceSetting, secondsUntil, writeDeviceSetting } from "@/lib/activation-store";
import {
  acknowledgedProviderSourceReceipt,
  deviceSourceAuthSettingKey,
  deviceSourceQueueSettingKey,
  hashSourcePullToken,
  isValidPublicDeviceId,
  normalizePublicDeviceId,
  normalizeSourcePullToken,
  providerSourceQueueExpired,
  type ProviderSourceReceipt,
} from "@/lib/provider-source-security";
import { rateLimit } from "@/lib/request-guard";

type QueueRow = Pick<ProviderSourceReceipt, "id" | "publicDeviceId" | "sourceType" | "status" | "createdAt"> &
  Partial<ProviderSourceReceipt> & { encryptedPayload?: string };

function readQueueValue(value: unknown): QueueRow | null {
  const candidate = (value ?? {}) as Partial<QueueRow>;
  if (typeof candidate.id !== "string" || typeof candidate.publicDeviceId !== "string") {
    return null;
  }
  return candidate as QueueRow;
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
    // The first ack removes the device token, so a repeated ack for the same source is answered from the
    // receipt it left behind. Nothing is changed, and the receipt holds no source details.
    const receipt = readQueueValue(await readDeviceSetting<unknown>(key));
    if (
      receipt &&
      receipt.publicDeviceId === publicDeviceId &&
      receipt.id === sourceId &&
      (receipt.status === "imported" || receipt.status === "failed")
    ) {
      return NextResponse.json({ ok: true, status: receipt.status, alreadyAcknowledged: true });
    }
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

  // Replace the queue row with a short-lived, non-sensitive receipt (import result only) so the
  // activation page can show "Imported on your TV" or the device's error, then retire the token.
  const receipt = acknowledgedProviderSourceReceipt(queue, { status, message: body.message });
  try {
    await writeDeviceSetting(key, receipt, {
      ttlSeconds: secondsUntil(receipt.expiresAt, 10 * 60),
      description: "Short-lived provider source import receipt. Holds the import status only, never the source.",
    });
  } catch {
    // Never leave the queue row behind when the receipt cannot replace it.
    try {
      await deleteDeviceSettings(key);
    } catch {
      return NextResponse.json({ ok: false, message: "Could not acknowledge source import." }, { status: 500 });
    }
  }

  try {
    await deleteDeviceSettings(authKey);
  } catch {
    return NextResponse.json({ ok: false, message: "Could not acknowledge source import." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
