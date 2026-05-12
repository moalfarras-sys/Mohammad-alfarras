import { afterEach, describe, expect, it, vi } from "vitest";

import {
  normalizeProviderSource,
  providerSourceQueueBelongsToProduct,
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
      serverUrl: "http://iptv.example.com:8080/player_api.php?username=user&password=secret",
      username: "user",
      password: "secret",
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
});
