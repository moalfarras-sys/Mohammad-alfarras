// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fallback = vi.hoisted(() => vi.fn(() => false));
vi.mock("@/lib/supabase/client", () => ({
  hasSupabasePublicEnv: fallback,
  createSupabaseAdminClient: vi.fn(),
}));
const input = { request: new Request("https://example.test"), bucket: "test", limit: 3, windowSeconds: 60 };
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("limits requests using the atomic counter's remaining lifetime", async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ result: [4, 17] })));
  vi.stubGlobal("fetch", fetchMock);
  const { rateLimit } = await import("@/lib/request-guard");
  const response = await rateLimit(input);
  expect(response?.status).toBe(429);
  expect(response?.headers.get("Retry-After")).toBe("17");
  expect(await response?.json()).toMatchObject({ retryAfterSeconds: 17 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("allows requests within the counter limit", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ result: [3, 60] }))));
  const { rateLimit } = await import("@/lib/request-guard");
  expect(await rateLimit(input)).toBeNull();
  expect(fallback).not.toHaveBeenCalled();
});
it.each([{ error: "ERR rejected" }, { result: [null, -1] }, {}])(
  "uses the availability fallback on a storage error: %j", async (body) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body))));
    const { rateLimit } = await import("@/lib/request-guard");
    expect(await rateLimit(input)).toBeNull();
    expect(fallback).toHaveBeenCalledOnce();
  },
);
