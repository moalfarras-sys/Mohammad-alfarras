// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StoredActivationRequest } from "@/lib/activation-store";

// In-memory stand-in for the Redis/Supabase activation store, with the same product-scoping rule.
const fake = vi.hoisted(() => ({
  settings: new Map<string, unknown>(),
  requests: new Map<string, StoredActivationRequest>(),
  failWrites: false,
}));

vi.mock("@/lib/request-guard", () => ({ rateLimit: vi.fn(async () => null) }));

vi.mock("@/lib/activation-store", () => ({
  secondsUntil: (_iso: string | undefined, fallback: number) => fallback,
  readDeviceSetting: vi.fn(async (key: string) => fake.settings.get(key) ?? null),
  writeDeviceSetting: vi.fn(async (key: string, value: unknown) => {
    if (fake.failWrites) throw new Error("store unavailable");
    fake.settings.set(key, value);
  }),
  deleteDeviceSettings: vi.fn(async (...keys: string[]) => {
    for (const key of keys) fake.settings.delete(key);
  }),
  getActivationRequest: vi.fn(async (code: string, productSlug: string | null) => {
    const record = fake.requests.get(code);
    if (!record) return null;
    if (productSlug !== null && (record.productSlug || "moplayer") !== productSlug) return null;
    return { ...record, productSlug: record.productSlug || "moplayer" };
  }),
  setActivationStatus: vi.fn(async (code: string, status: "expired" | "activated", extra?: { activatedAt?: string }) => {
    const record = fake.requests.get(code);
    if (record) fake.requests.set(code, { ...record, status, ...(extra?.activatedAt ? { activatedAt: extra.activatedAt } : {}) });
  }),
  activateDeviceAndLicense: vi.fn(async () => undefined),
}));

vi.stubEnv("MOPLAYER_PROVIDER_ENCRYPTION_KEY", "unit-test-provider-key");

const { GET: statusGET } = await import("@/app/api/app/activation/status/route");
const { POST: confirmPOST } = await import("@/app/api/app/activation/confirm/route");
const { POST: ackPOST } = await import("@/app/api/app/activation/source/ack/route");
const { POST: sourcePOST } = await import("@/app/api/app/activation/source/route");
const store = await import("@/lib/activation-store");
const security = await import("@/lib/provider-source-security");

const PRO_DEVICE = "MO-D-PRO12345";
const PRO_CODE = "MO-PR2K";
const CLASSIC_DEVICE = "MO-D-CLASSIC1";
const CLASSIC_CODE = "MO-CL4X";
const TOKEN = "t".repeat(43);
const future = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();

function request(code: string, status: StoredActivationRequest["status"], publicDeviceId: string, productSlug: string) {
  fake.requests.set(code, {
    publicDeviceId,
    productSlug,
    deviceCode: code,
    status,
    expiresAt: future(),
    createdAt: new Date().toISOString(),
  });
}

function authorize(publicDeviceId: string) {
  fake.settings.set(security.deviceSourceAuthSettingKey(publicDeviceId), {
    publicDeviceId,
    sourcePullTokenHash: security.hashSourcePullToken(TOKEN),
    expiresAt: future(),
  });
}

function queueSource(publicDeviceId: string, status: "pending" | "fetched") {
  const queue = {
    id: "src_1",
    publicDeviceId,
    productSlug: "moplayer2",
    sourceType: "xtream",
    displayName: "iptv.example.com",
    encryptedPayload: status === "pending" ? "aes-256-gcm:v1:iv:tag:data" : undefined,
    encryptionVersion: "aes-256-gcm:v1",
    status,
    lastTestStatus: "success",
    lastTestMessage: "Xtream connection works.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: future(),
  };
  fake.settings.set(security.deviceSourceQueueSettingKey(publicDeviceId), queue);
}

const status = (query: string) => statusGET(new Request(`https://moalfarras.space/api/app/activation/status?${query}`));
const post = (handler: (request: Request) => Promise<Response>, body: unknown) =>
  handler(new Request("https://moalfarras.space/api", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  fake.settings.clear();
  fake.requests.clear();
  fake.failWrites = false;
  vi.clearAllMocks();
});

describe("activation status product discovery (F046)", () => {
  it("resolves a Pro code typed on the bare /activate URL", async () => {
    request(PRO_CODE, "waiting", PRO_DEVICE, "moplayer2");
    const response = await status(`code=${PRO_CODE}`);
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: "pending", productSlug: "moplayer2" });
  });

  it("keeps Classic devices that poll without a product working", async () => {
    request(CLASSIC_CODE, "waiting", CLASSIC_DEVICE, "moplayer");
    const response = await status(`code=${CLASSIC_CODE}`);
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: "pending", productSlug: "moplayer" });
  });

  it("keeps explicit products scoped and names the right app on a mismatch", async () => {
    request(PRO_CODE, "waiting", PRO_DEVICE, "moplayer2");
    expect((await status(`code=${PRO_CODE}&product=moplayer2`)).status).toBe(202);

    const mismatch = await status(`code=${PRO_CODE}&product=moplayer`);
    expect(mismatch.status).toBe(409);
    const body = await mismatch.json();
    expect(body).toMatchObject({ status: "wrong_product", productSlug: "moplayer2" });
    expect(body).not.toHaveProperty("publicDeviceId");
  });

  it("returns not found for unknown codes", async () => {
    expect((await status("code=MO-ZZZZ")).status).toBe(404);
    expect((await status("code=MO-ZZZZ&product=moplayer2")).status).toBe(404);
  });

  it("reports a code replaced by a newer one as expired, not pending", async () => {
    request(PRO_CODE, "expired", PRO_DEVICE, "moplayer2");
    const response = await status(`code=${PRO_CODE}`);
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ status: "expired" });
  });

  it("confirm stays product-scoped: a mismatch is reported and nothing is activated", async () => {
    request(PRO_CODE, "waiting", PRO_DEVICE, "moplayer2");
    const mismatch = await post(confirmPOST, { code: PRO_CODE, productSlug: "moplayer" });
    expect(mismatch.status).toBe(409);
    expect(await mismatch.json()).toMatchObject({ status: "wrong_product", productSlug: "moplayer2" });
    expect(store.activateDeviceAndLicense).not.toHaveBeenCalled();

    const confirmed = await post(confirmPOST, { code: PRO_CODE, productSlug: "moplayer2" });
    expect(confirmed.status).toBe(200);
    expect(await confirmed.json()).toMatchObject({ status: "activated", productSlug: "moplayer2" });
    expect(fake.requests.get(PRO_CODE)?.status).toBe("activated");
  });
});

describe("source import acknowledgement (F047)", () => {
  const ack = (body: Record<string, unknown>) =>
    post(ackPOST, { publicDeviceId: PRO_DEVICE, token: TOKEN, sourceId: "src_1", ...body });
  const queueKey = () => security.deviceSourceQueueSettingKey(PRO_DEVICE);
  const authKey = () => security.deviceSourceAuthSettingKey(PRO_DEVICE);

  beforeEach(() => {
    request(PRO_CODE, "activated", PRO_DEVICE, "moplayer2");
    authorize(PRO_DEVICE);
    queueSource(PRO_DEVICE, "fetched");
  });

  it("replaces the queue with a non-sensitive receipt and retires the device token", async () => {
    const response = await ack({ status: "imported" });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, status: "imported" });

    const receipt = fake.settings.get(queueKey()) as Record<string, unknown>;
    expect(receipt).toMatchObject({ id: "src_1", status: "imported", productSlug: "moplayer2" });
    for (const key of ["encryptedPayload", "displayName", "lastTestMessage"]) expect(receipt).not.toHaveProperty(key);
    expect(fake.settings.has(authKey())).toBe(false);

    const page = await status(`code=${PRO_CODE}&product=moplayer2`);
    expect(await page.json()).toMatchObject({ status: "activated", sourceStatus: "imported", sourcePending: false });
  });

  it("shows the device's failure message on the page, sanitized", async () => {
    await ack({ status: "failed", message: "Provider rejected http://demo:secret@iptv.example.com:8080" });

    const page = await status(`code=${PRO_CODE}`);
    const body = await page.json();
    expect(body).toMatchObject({ status: "activated", productSlug: "moplayer2", sourceStatus: "failed" });
    expect(body.sourceMessage).toBe("Provider rejected [link]");
  });

  it("answers a repeated ack from the receipt instead of failing", async () => {
    await ack({ status: "imported" });
    const repeat = await ack({ status: "failed", message: "late failure" });
    expect(repeat.status).toBe(200);
    expect(await repeat.json()).toMatchObject({ ok: true, status: "imported", alreadyAcknowledged: true });
    expect((fake.settings.get(queueKey()) as { status: string }).status).toBe("imported");
  });

  it("rejects an unknown token when there is no matching receipt", async () => {
    const response = await post(ackPOST, { publicDeviceId: PRO_DEVICE, token: "x".repeat(43), sourceId: "other", status: "imported" });
    expect(response.status).toBe(401);
  });

  it("drops the queue row when the receipt cannot be written", async () => {
    queueSource(PRO_DEVICE, "pending");
    fake.failWrites = true;
    const response = await ack({ status: "imported" });
    expect(response.status).toBe(200);
    expect(fake.settings.has(queueKey())).toBe(false);
    expect(fake.settings.has(authKey())).toBe(false);
  });

  it("refuses a new source once the device token is retired", async () => {
    await ack({ status: "imported" });
    const response = await post(sourcePOST, {
      code: PRO_CODE,
      productSlug: "moplayer2",
      source: { type: "m3u", playlistUrl: "https://cdn.example.com/list.m3u" },
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, status: "device_not_ready" });
  });
});
