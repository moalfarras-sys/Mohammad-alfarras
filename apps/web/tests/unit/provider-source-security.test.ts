import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchedProviderSourceReceiptExpiresAt,
  normalizeProviderSource,
  pendingProviderSourceExpiresAt,
  providerSourceTestAllowsHandoff,
  providerSourceQueueBelongsToProduct,
  providerSourceQueueExpired,
  testProviderSource,
  type ProviderSourceQueueValue,
} from "@/lib/provider-source-security";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("normalizeProviderSource", () => {
  it("accepts bare Xtream player API URLs", () => {
    const source = normalizeProviderSource({
      type: "xtream",
      name: "Main",
      serverUrl: "iptv.example.com:8080/player_api.php?username=user&password=secret",
      username: "user",
      password: "secret",
    });

    expect(source).toMatchObject({
      type: "xtream",
      name: "Main",
      serverUrl: "http://iptv.example.com:8080",
      username: "user",
      password: "secret",
    });
  });

  it("normalizes Xtream get.php playlist URLs back to the server origin", () => {
    const source = normalizeProviderSource({
      type: "xtream",
      name: "Main",
      serverUrl: "https://iptv.example.com/panel/get.php?username=user&password=secret&type=m3u_plus",
      username: "user",
      password: "secret",
    });

    expect(source).toMatchObject({
      type: "xtream",
      serverUrl: "https://iptv.example.com/panel",
    });
  });

  it("accepts bare M3U playlist URLs and optional EPG hosts", () => {
    const source = normalizeProviderSource({
      type: "m3u",
      playlistUrl: "cdn.example.com/live/list.m3u",
      epgUrl: "epg.example.com/xmltv.xml",
    });

    expect(source).toMatchObject({
      type: "m3u",
      name: "cdn.example.com",
      playlistUrl: "http://cdn.example.com/live/list.m3u",
      epgUrl: "http://epg.example.com/xmltv.xml",
    });
  });
});

describe("providerSourceQueueBelongsToProduct", () => {
  const baseQueue: ProviderSourceQueueValue = {
    id: "src_1",
    publicDeviceId: "MO-D-1",
    sourceType: "m3u",
    displayName: "Demo",
    encryptedPayload: "encrypted",
    encryptionVersion: "aes-256-gcm:v1",
    status: "pending",
    lastTestStatus: "success",
    lastTestMessage: "ok",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
  };

  it("keeps legacy queues scoped to MoPlayer", () => {
    expect(providerSourceQueueBelongsToProduct(baseQueue, "moplayer")).toBe(true);
    expect(providerSourceQueueBelongsToProduct(baseQueue, "moplayer2")).toBe(false);
  });

  it("prevents Pro queues from being fetched or acked by MoPlayer", () => {
    const proQueue = { ...baseQueue, productSlug: "moplayer2" };

    expect(providerSourceQueueBelongsToProduct(proQueue, "moplayer2")).toBe(true);
    expect(providerSourceQueueBelongsToProduct(proQueue, "moplayer")).toBe(false);
  });

  it("expires QR handoff queues instead of treating them as permanent source storage", () => {
    const now = Date.parse("2026-05-08T00:00:00.000Z");
    const pendingExpiry = pendingProviderSourceExpiresAt(now);
    const fetchedExpiry = fetchedProviderSourceReceiptExpiresAt(now);

    expect(providerSourceQueueExpired({ ...baseQueue, expiresAt: pendingExpiry }, now + 1)).toBe(false);
    expect(providerSourceQueueExpired({ ...baseQueue, expiresAt: pendingExpiry }, Date.parse(pendingExpiry))).toBe(true);
    expect(Date.parse(fetchedExpiry) - now).toBeLessThan(Date.parse(pendingExpiry) - now);
  });
});

describe("testProviderSource", () => {
  it("retries Xtream over HTTP when HTTPS fails", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("tls failed"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user_info: { auth: 1, status: "Active", exp_date: "0" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await testProviderSource({
      type: "xtream",
      name: "Legacy",
      serverUrl: "https://iptv.example.com:8080",
      username: "user",
      password: "secret",
    });

    expect(result.ok).toBe(true);
    expect(result.normalizedSource).toMatchObject({ serverUrl: "http://iptv.example.com:8080" });
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://iptv.example.com:8080/player_api.php?username=user&password=secret");
  });

  it("returns a specific DNS failure and allows QR handoff for device-side validation", async () => {
    const error = Object.assign(new TypeError("fetch failed"), {
      cause: new Error("getaddrinfo ENOTFOUND m3mlink.site"),
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));

    const result = await testProviderSource({
      type: "xtream",
      name: "Provider",
      serverUrl: "http://m3mlink.site:80",
      username: "user",
      password: "secret",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("unreachable");
    expect(result.message).toContain("could not be resolved");
    expect(providerSourceTestAllowsHandoff(result)).toBe(true);
  });

  it("blocks QR handoff when the Xtream API explicitly rejects credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ user_info: { auth: 0, message: "bad credentials" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const result = await testProviderSource({
      type: "xtream",
      name: "Provider",
      serverUrl: "http://iptv.example.com:80",
      username: "user",
      password: "wrong",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("auth_failed");
    expect(providerSourceTestAllowsHandoff(result)).toBe(false);
  });
});
