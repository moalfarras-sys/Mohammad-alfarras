// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appTvInstall, currentAppReleases } from "@moalfarras/shared/app-releases";

const state = vi.hoisted(() => ({
  ecosystemError: null as Error | null,
  resolveReturnsNull: false,
  runtime: { enabled: true, maintenanceMode: false } as { enabled?: boolean; maintenanceMode?: boolean },
  latestUrl: {} as Record<string, string>,
}));

const recordDownload = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  // `after()` needs a request scope; run the callback inline instead.
  return { ...actual, after: (callback: () => unknown) => void callback() };
});

vi.mock("@/lib/download-counter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download-counter")>();
  return { ...actual, recordDownload };
});

vi.mock("@/lib/app-ecosystem", () => ({
  readAppEcosystem: vi.fn(async (slug: "moplayer" | "moplayer2") => {
    if (state.ecosystemError) throw state.ecosystemError;
    const release = currentAppReleases[slug];
    return {
      product: { product_name: slug === "moplayer2" ? "MoPlayer Pro" : "MoPlayer" },
      runtimeConfig: state.runtime,
      releases: [{ slug: release.releaseSlug, assets: [] }],
    };
  }),
  resolveDownloadBySlug: vi.fn(async (releaseSlug: string) => {
    if (state.resolveReturnsNull) return null;
    const release = Object.values(currentAppReleases).find((item) => item.releaseSlug === releaseSlug)!;
    return {
      filename: `${releaseSlug}.apk`,
      redirectUrl: state.latestUrl[releaseSlug] ?? release.asset.url,
      asset: { id: release.asset.id },
    };
  }),
}));

const { GET: classicGET, HEAD: classicHEAD } = await import("@/app/mp/route");
const { GET: proGET, HEAD: proHEAD } = await import("@/app/mp2/route");

const browserUa = "Mozilla/5.0 (Linux; Android 9; AFTMM) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36";

function request(path: string, method = "GET", userAgent = browserUa) {
  return new Request(`https://moalfarras.space${path}`, { method, headers: { "user-agent": userAgent } });
}

beforeEach(() => {
  state.ecosystemError = null;
  state.resolveReturnsNull = false;
  state.runtime = { enabled: true, maintenanceMode: false };
  state.latestUrl = {};
  recordDownload.mockClear();
});

describe("TV short download links", () => {
  it("keeps the short paths and codes in the shared install record", () => {
    expect(appTvInstall.moplayer.shortPath).toBe("/mp");
    expect(appTvInstall.moplayer2.shortPath).toBe("/mp2");
    expect(appTvInstall.moplayer.shortUrl).toBe("moalfarras.space/mp");
    expect(appTvInstall.moplayer2.shortUrl).toBe("moalfarras.space/mp2");
    expect(appTvInstall.moplayer.downloaderCode).toMatch(/^\d+$/);
    expect(appTvInstall.moplayer2.downloaderCode).toMatch(/^\d+$/);
  });

  it("/mp redirects (307, no-store) to the latest MoPlayer Classic universal APK", async () => {
    const response = await classicGET(request("/mp"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(currentAppReleases.moplayer.asset.url);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(currentAppReleases.moplayer.asset.abi).toBe("universal");
  });

  it("/mp2 redirects (307, no-store) to the latest MoPlayer Pro APK", async () => {
    const response = await proGET(request("/mp2"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(currentAppReleases.moplayer2.asset.url);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("follows whatever release the database marks as latest", async () => {
    const next = "https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-android-9.9.9/app.apk";
    state.latestUrl[currentAppReleases.moplayer.releaseSlug] = next;
    const response = await classicGET(request("/mp"));
    expect(response.headers.get("location")).toBe(next);
  });

  it("answers HEAD with the same redirect and does not count it", async () => {
    const classic = await classicHEAD(request("/mp", "HEAD"));
    const pro = await proHEAD(request("/mp2", "HEAD"));
    expect(classic.status).toBe(307);
    expect(classic.headers.get("location")).toBe(currentAppReleases.moplayer.asset.url);
    expect(pro.status).toBe(307);
    expect(pro.headers.get("location")).toBe(currentAppReleases.moplayer2.asset.url);
    expect(recordDownload).not.toHaveBeenCalled();
  });

  it("counts a real GET exactly like the download route, tagged with the short link", async () => {
    await proGET(request("/mp2"));
    expect(recordDownload).toHaveBeenCalledTimes(1);
    const [product, platform, event] = recordDownload.mock.calls[0] as unknown as [string, string | undefined, Record<string, unknown>];
    expect(product).toBe("moplayer2");
    expect(platform).toBeUndefined();
    expect(event).toMatchObject({
      releaseSlug: currentAppReleases.moplayer2.releaseSlug,
      assetId: currentAppReleases.moplayer2.asset.id,
      targetUrl: currentAppReleases.moplayer2.asset.url,
      metadata: { shortLink: "/mp2" },
    });
  });

  it("does not count crawlers", async () => {
    await classicGET(request("/mp", "GET", "Googlebot/2.1"));
    expect(recordDownload).not.toHaveBeenCalled();
  });

  it("falls back to the shared release constant when the release lookup throws", async () => {
    state.ecosystemError = new Error("database unavailable");
    const classic = await classicGET(request("/mp"));
    const pro = await proGET(request("/mp2"));
    expect(classic.status).toBe(307);
    expect(classic.headers.get("location")).toBe(currentAppReleases.moplayer.asset.url);
    expect(pro.headers.get("location")).toBe(currentAppReleases.moplayer2.asset.url);
  });

  it("falls back to the shared release constant when no asset resolves", async () => {
    state.resolveReturnsNull = true;
    const response = await classicGET(request("/mp"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(currentAppReleases.moplayer.asset.url);
  });

  it("sends visitors to the /tv page while downloads are paused", async () => {
    state.runtime = { enabled: true, maintenanceMode: true };
    const response = await classicGET(request("/mp"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://moalfarras.space/tv");
    expect(recordDownload).not.toHaveBeenCalled();
  });
});
