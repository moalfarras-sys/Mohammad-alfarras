import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import { activateDeviceAndLicense, getActivationRequest, setActivationStatus } from "@/lib/activation-store";
import { rateLimit } from "@/lib/request-guard";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "activation-confirm", limit: 20, windowSeconds: 60 });
  if (limited) return limited;

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

  const data = await getActivationRequest(code, productSlug);
  if (!data) {
    return json({ status: "invalid", code, message: "Activation code was not found." }, { status: 404 });
  }

  if (new Date(data.expiresAt).getTime() <= Date.now()) {
    await setActivationStatus(code, "expired");
    return json({ status: "expired", code, expiresAt: data.expiresAt }, { status: 410 });
  }

  const now = new Date().toISOString();
  const deviceName = String(body.deviceName ?? "MoPlayer device").slice(0, 120);

  await activateDeviceAndLicense(data.publicDeviceId, deviceName);
  await setActivationStatus(code, "activated", { activatedAt: now });

  return json({
    status: "activated",
    code,
    productSlug,
    publicDeviceId: data.publicDeviceId,
    activatedAt: now,
  });
}
