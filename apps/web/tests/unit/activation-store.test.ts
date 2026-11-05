// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Redis mode is chosen from env at import time, so the module is imported after the env is set.
let getActivationRequest: typeof import("@/lib/activation-store").getActivationRequest;
let storage: typeof import("@/lib/activation-store");

const records: Record<string, unknown> = {
  "act:req:MO-PR2K": {
    publicDeviceId: "MO-D-PRO12345",
    productSlug: "moplayer2",
    deviceCode: "MO-PR2K",
    status: "waiting",
    expiresAt: "2099-01-01T00:00:00.000Z",
    createdAt: "2026-09-30T12:00:00.000Z",
  },
  "act:req:MO-CL4X": {
    publicDeviceId: "MO-D-CLASSIC1",
    deviceCode: "MO-CL4X",
    status: "waiting",
    expiresAt: "2099-01-01T00:00:00.000Z",
    createdAt: "2026-09-30T12:00:00.000Z",
  },
};

beforeAll(async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      const [command, key, ...args] = JSON.parse(init.body) as string[];
      let value: unknown = command === "GET" && key in records ? JSON.stringify(records[key]) : null;
      if (command === "SET" && !(args.includes("NX") && key in records)) {
        records[key] = JSON.parse(args[0]);
        value = "OK";
      }
      if (command === "EVAL") {
        const [, settingKey, expected, replacement] = args;
        value = JSON.stringify(records[settingKey]) === expected ? 1 : 0;
        if (value === 1) records[settingKey] = JSON.parse(replacement);
      }
      return new Response(JSON.stringify({ result: value }), { status: 200 });
    }),
  );
  storage = await import("@/lib/activation-store");
  ({ getActivationRequest } = storage);
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("QR replacement and one-time delivery", () => {
  it("expires the previous JSON-encoded legacy QR code", async () => {
    records["act:devcode:MO-D-LEGACY1"] = "MO-OLD1";
    records["act:req:MO-OLD1"] = {
      publicDeviceId: "MO-D-LEGACY1", productSlug: "moplayer2", status: "waiting",
    };
    await storage.expireDeviceWaitingRequests("MO-D-LEGACY1", "moplayer2");
    expect(records["act:req:MO-OLD1"]).toMatchObject({ status: "expired" });
  });

  it("does not expire another product's QR for the same device id", async () => {
    const publicDeviceId = "MO-D-SHARED01";
    for (const [productSlug, code] of [["moplayer", "MO-SHA1"], ["moplayer2", "MO-SHA2"]]) {
      await storage.createActivationRequest({ publicDeviceId, productSlug, code, expiresAt: "2099-01-01T00:00:00Z" });
    }
    await storage.expireDeviceWaitingRequests(publicDeviceId, "moplayer2");
    expect(await getActivationRequest("MO-SHA1", "moplayer")).toMatchObject({ status: "waiting" });
    expect(await getActivationRequest("MO-SHA2", "moplayer2")).toMatchObject({ status: "expired" });
  });

  it("preserves a legacy index belonging to another product", async () => {
    records["act:devcode:MO-D-LEGACY2"] = "MO-OLD2";
    records["act:req:MO-OLD2"] = { publicDeviceId: "MO-D-LEGACY2", status: "waiting" };
    await storage.expireDeviceWaitingRequests("MO-D-LEGACY2", "moplayer2");
    expect(records["act:req:MO-OLD2"]).toMatchObject({ status: "waiting" });
  });

  it("replaces pending credentials only once and preserves a newer queue", async () => {
    const pending = { id: "source-1", encryptedPayload: "sealed", status: "pending" };
    const receipt = { id: "source-1", status: "fetched" };
    records.queue = pending;
    const replace = () => storage.replaceDeviceSettingIfUnchanged("queue", pending, receipt, { ttlSeconds: 900 });
    expect(await Promise.all([replace(), replace()])).toEqual([true, false]);
    expect(records.queue).toEqual(receipt);
    records.queue = { ...pending, id: "source-2" };
    expect(await replace()).toBe(false);
    expect(records.queue).toMatchObject({ id: "source-2", encryptedPayload: "sealed" });
  });

  it("does not accept an HTTP 200 Redis error as a successful write", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: "ERR command rejected" })));
    await expect(storage.writeDeviceSetting("queue", {})).rejects.toThrow("storage request failed");
  });
});

describe("getActivationRequest (Redis)", () => {
  it("keeps explicit product lookups scoped", async () => {
    expect(await getActivationRequest("MO-PR2K", "moplayer2")).toMatchObject({ publicDeviceId: "MO-D-PRO12345" });
    expect(await getActivationRequest("MO-PR2K", "moplayer")).toBeNull();
    expect(await getActivationRequest("MO-CL4X", "moplayer")).toMatchObject({ publicDeviceId: "MO-D-CLASSIC1" });
    expect(await getActivationRequest("MO-CL4X", "moplayer2")).toBeNull();
  });

  it("finds a code under any product when no product is given", async () => {
    expect(await getActivationRequest("MO-PR2K", null)).toMatchObject({ productSlug: "moplayer2" });
    // Legacy records without a product slug belong to Classic.
    expect(await getActivationRequest("MO-CL4X", null)).toMatchObject({ productSlug: "moplayer" });
    expect(await getActivationRequest("MO-ZZZZ", null)).toBeNull();
  });
});
