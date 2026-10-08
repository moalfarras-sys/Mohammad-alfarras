// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ available: true, maintenance: false }));
const recordDownload = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (callback: () => unknown) => void callback() };
});
vi.mock("@/lib/download-counter", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/download-counter")>(), recordDownload,
}));
vi.mock("@/lib/moos-release", () => ({ readLatestMoosRelease: vi.fn(async () => ({
  maintenance: state.maintenance,
  editions: [{ id: "desktop", installer: "/downloads/moos/moos-install.sh" }],
  iso: { available: state.available, url: "https://downloads.example.org/moos.iso",
    signatureUrl: "https://downloads.example.org/moos.iso.sig", checksumUrl: "https://downloads.example.org/moos.iso.sha256" },
})) }));
const { GET } = await import("@/app/api/os/download/route");
function request(query = "type=iso", headers = {}) {
  return new Request(`https://moalfarras.space/api/os/download?${query}`, { headers: { "user-agent": "Mozilla/5.0 Chrome/154", ...headers } });
}
beforeEach(() => { state.available = true; state.maintenance = false; recordDownload.mockClear(); });

describe("MoOS public download links", () => {
  it("redirects the ISO while preserving the stable website entrypoint", async () => {
    const response = await GET(request());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://downloads.example.org/moos.iso");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(recordDownload).toHaveBeenCalledOnce();
  });
  it.each(["signature", "checksum"])("routes %s without counting another ISO download", async (asset) => {
    const response = await GET(request(`type=iso&asset=${asset}`));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`https://downloads.example.org/moos.iso.${asset === "signature" ? "sig" : "sha256"}`);
    expect(recordDownload).not.toHaveBeenCalled();
  });
  it("does not inflate counts when a client resumes the ISO", async () => {
    expect((await GET(request("type=iso", { Range: "bytes=4294967296-" }))).status).toBe(307);
    expect(recordDownload).not.toHaveBeenCalled();
  });
  it("retains maintenance/unqualified guards and rejects an arbitrary asset selector", async () => {
    state.available = false; expect((await GET(request())).status).toBe(503);
    state.available = true; state.maintenance = true; expect((await GET(request())).status).toBe(503);
    state.maintenance = false; expect((await GET(request("type=iso&asset=unknown"))).status).toBe(400);
  });
});
