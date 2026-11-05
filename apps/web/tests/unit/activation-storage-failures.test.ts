// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const backend = vi.hoisted(() => ({ error: { code: "42P01", message: "missing relation" } as { code: string; message: string } | null, data: null as unknown }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseAdminClient: () => {
    const query = {
      select: () => query, eq: () => query, or: () => query, in: () => query,
      upsert: () => query, insert: () => query, update: () => query, delete: () => query,
      maybeSingle: () => query, single: () => query,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: backend.data, error: backend.error }).then(resolve),
    };
    return { from: () => query };
  },
}));
let store: typeof import("@/lib/activation-store");
beforeAll(async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  store = await import("@/lib/activation-store");
});
afterAll(() => vi.unstubAllEnvs());

describe("Supabase activation persistence failures", () => {
  it("propagates failures instead of reporting successful handoffs or acknowledgements", async () => {
    const operations = [
      () => store.readDeviceSetting("queue"),
      () => store.writeDeviceSetting("queue", {}),
      () => store.deleteDeviceSettings("queue"),
      () => store.registerDevice({ publicDeviceId: "MO-D-TEST1234" }),
      () => store.expireDeviceWaitingRequests("MO-D-TEST1234", "moplayer"),
      () => store.getActivationRequest("MO-TEST", "moplayer"),
      () => store.setActivationStatus("MO-TEST", "activated"),
      () => store.activateDeviceAndLicense("MO-D-TEST1234", "Test TV"),
      () => store.replaceDeviceSettingIfUnchanged("queue", {}, {}, { ttlSeconds: 900 }),
    ];
    for (const operation of operations) await expect(operation()).rejects.toThrow("Could not");
  });

  it("retries only actual code collisions", async () => {
    const create = () => store.createActivationRequest({
      publicDeviceId: "MO-D-TEST1234", productSlug: "moplayer", code: "MO-TEST", expiresAt: "2099-01-01T00:00:00Z",
    });
    await expect(create()).rejects.toThrow("Could not create activation code");
    backend.error = { code: "23505", message: "duplicate code" };
    expect(await create()).toBe(false);
    backend.error = null;
    backend.data = { id: "stored-code" };
    expect(await create()).toBe(true);
  });

  it("returns false when another pull already replaced the source", async () => {
    backend.error = null;
    backend.data = null;
    expect(await store.replaceDeviceSettingIfUnchanged("queue", {}, {}, { ttlSeconds: 900 })).toBe(false);
    backend.data = { key: "queue" };
    expect(await store.replaceDeviceSettingIfUnchanged("queue", {}, {}, { ttlSeconds: 900 })).toBe(true);
  });
});
