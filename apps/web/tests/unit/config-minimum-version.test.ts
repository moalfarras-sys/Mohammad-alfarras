// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ value: { minimumVersionCode: 72, forceUpdate: false } as Record<string, unknown> | null }));
vi.mock("@/lib/supabase/client", () => ({
  hasSupabasePublicEnv: () => true,
  createSupabaseDataClient: () => ({ from: (table: string) => {
    const query = { select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: table === "app_settings" && state.value ? { value: state.value } : null, error: null }) };
    return query;
  } }),
}));
vi.mock("@/lib/app-ecosystem", () => ({ readAppEcosystem: async () => ({ releases: [
  { version_code: 74, version_name: "2.7.4", assets: [{ id: "apk-74", abi: "universal", is_primary: true, file_size_bytes: 123, checksum_sha256: "verified" }] },
] }) }));
import { GET } from "@/app/api/app/config/route";
beforeEach(() => { state.value = { minimumVersionCode: 72, forceUpdate: false }; });
async function config() { return (await (await GET(new Request("https://example.com/api/app/config?product=moplayer2"))).json()).config; }
it("publishes the new APK without raising the admin's supported minimum", async () => {
  const c = await config();
  expect(c.latestVersionCode).toBe(74); expect(c.minimumVersionCode).toBe(72); expect(c.forceUpdate).toBe(false);
  expect(c.update.latestVersionCode).toBe(74); expect(c.update.checksumSha256).toBe("verified");
});
it("honors the explicit minimum even with forced updates enabled", async () => {
  state.value = { minimumVersionCode: 71, forceUpdate: true };
  const c = await config(); expect(c.minimumVersionCode).toBe(71); expect(c.forceUpdate).toBe(true);
});
it("keeps the fallback supported minimum when only a release exists", async () => {
  state.value = null; const c = await config(); expect(c.minimumVersionCode).toBe(50); expect(c.latestVersionCode).toBe(74);
});
it("rejects invalid configured minimum versions", async () => {
  state.value = { minimumVersionCode: "invalid" }; expect((await config()).minimumVersionCode).toBe(50);
});
