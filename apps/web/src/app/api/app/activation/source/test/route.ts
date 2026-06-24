import { NextResponse } from "next/server";

import { isValidActivationCode, normalizeActivationCode } from "@/lib/activation-code";
import { getActivationRequest } from "@/lib/activation-store";
import { normalizeProviderSource, testProviderSource } from "@/lib/provider-source-security";
import { rateLimit } from "@/lib/request-guard";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function getActivatedDevice(code: string, productSlug: string) {
  const data = await getActivationRequest(code, productSlug);
  if (!data) return { error: "Activation code was not found.", status: 404 };
  if (data.status !== "activated") return { error: "Activate the device before adding a source.", status: 409 };
  if (new Date(data.expiresAt).getTime() <= Date.now()) return { error: "Activation code expired.", status: 410 };
  return { publicDeviceId: data.publicDeviceId };
}

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "activation-source-test", limit: 12, windowSeconds: 60 });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const code = normalizeActivationCode(String(body.code ?? ""));
  const productSlug = resolveManagedAppSlug(String(body.productSlug ?? body.product_slug ?? ""));
  if (!isValidActivationCode(code)) {
    return json({ ok: false, message: "Invalid activation code." }, { status: 400 });
  }

  const activated = await getActivatedDevice(code, productSlug);
  if (!activated.publicDeviceId) {
    return json({ ok: false, message: activated.error }, { status: activated.status ?? 500 });
  }

  try {
    const source = normalizeProviderSource(body.source);
    const result = await testProviderSource(source);
    return json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid source." },
      { status: 400 },
    );
  }
}
