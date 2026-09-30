// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Redis mode is chosen from env at import time, so the module is imported after the env is set.
let getActivationRequest: typeof import("@/lib/activation-store").getActivationRequest;

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
      const [command, key] = JSON.parse(init.body) as string[];
      const value = command === "GET" && key in records ? JSON.stringify(records[key]) : null;
      return new Response(JSON.stringify({ result: value }), { status: 200 });
    }),
  );
  ({ getActivationRequest } = await import("@/lib/activation-store"));
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
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
