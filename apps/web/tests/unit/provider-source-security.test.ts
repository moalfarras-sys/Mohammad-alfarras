import { afterEach, describe, expect, it, vi } from "vitest";

import {
  acknowledgedProviderSourceReceipt,
  fetchedProviderSourceReceipt,
  fetchedProviderSourceReceiptExpiresAt,
  normalizeProviderSource,
  pendingProviderSourceExpiresAt,
  providerSourceTestAllowsHandoff,
  providerSourceQueueBelongsToProduct,
  providerSourceQueueExpired,
  sanitizeDeviceImportMessage,
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

describe("provider source receipts", () => {
  const now = Date.parse("2026-09-30T12:00:00.000Z");
  const pendingQueue: ProviderSourceQueueValue = {
    id: "src_pro",
    publicDeviceId: "MO-D-ABCDEF12",
    productSlug: "moplayer2",
    sourceType: "xtream",
    displayName: "iptv.example.com",
    encryptedPayload: "aes-256-gcm:v1:iv:tag:secret",
    encryptionVersion: "aes-256-gcm:v1",
    status: "pending",
    lastTestStatus: "failed",
    lastTestMessage: "Provider says: user demo expired on iptv.example.com",
    createdAt: "2026-09-30T11:58:00.000Z",
    updatedAt: "2026-09-30T11:58:00.000Z",
    expiresAt: "2026-09-30T12:18:00.000Z",
  };
  const sensitiveKeys = ["encryptedPayload", "displayName", "lastTestMessage", "encryptionVersion"];

  it("keeps only delivery status after the device fetches the source", () => {
    const receipt = fetchedProviderSourceReceipt(pendingQueue, now);

    for (const key of sensitiveKeys) expect(receipt).not.toHaveProperty(key);
    expect(receipt).toMatchObject({
      id: "src_pro",
      publicDeviceId: "MO-D-ABCDEF12",
      productSlug: "moplayer2",
      sourceType: "xtream",
      status: "fetched",
      pulledAt: "2026-09-30T12:00:00.000Z",
    });
    // Long enough for the first library sync that runs before the device acknowledges.
    expect(Date.parse(receipt.expiresAt ?? "") - now).toBe(15 * 60 * 1000);
    expect(providerSourceQueueBelongsToProduct(receipt, "moplayer2")).toBe(true);
  });

  it("records a short-lived import result without any source details", () => {
    const fetched = fetchedProviderSourceReceipt(pendingQueue, now - 60_000);
    const receipt = acknowledgedProviderSourceReceipt(fetched, { status: "imported", message: "ignored" }, now);

    for (const key of sensitiveKeys) expect(receipt).not.toHaveProperty(key);
    expect(receipt).toMatchObject({ status: "imported", importedAt: "2026-09-30T12:00:00.000Z", productSlug: "moplayer2" });
    expect(receipt.failureMessage).toBeUndefined();
    expect(receipt.pulledAt).toBe(fetched.pulledAt);
    expect(Date.parse(receipt.expiresAt ?? "") - now).toBe(10 * 60 * 1000);
  });

  it("strips a raw queue down even if the payload is still present at ack time", () => {
    const receipt = acknowledgedProviderSourceReceipt(
      pendingQueue,
      { status: "failed", message: "Login failed for http://demo:secret@iptv.example.com:8080/get.php?username=demo&password=secret" },
      now,
    );

    for (const key of sensitiveKeys) expect(receipt).not.toHaveProperty(key);
    expect(receipt.status).toBe("failed");
    expect(receipt.failedAt).toBe("2026-09-30T12:00:00.000Z");
    expect(receipt.failureMessage).toBe("Login failed for [link]");
    expect(JSON.stringify(receipt)).not.toMatch(/secret|demo|example\.com/);
  });

  it("removes hosts, addresses and credentials from device messages", () => {
    expect(sanitizeDeviceImportMessage("Could not reach the IPTV server")).toBe("Could not reach the IPTV server");
    expect(sanitizeDeviceImportMessage("Timeout at 192.168.1.20:8080/player_api.php")).toBe("Timeout at [host]");
    expect(sanitizeDeviceImportMessage("DNS failed for line.iptv-host.net:80")).toBe("DNS failed for [host]");
    expect(sanitizeDeviceImportMessage("rejected username=demo password=hunter2")).toBe("rejected username=*** password=***");
    expect(sanitizeDeviceImportMessage("auth demo:hunter2@panel failed")).toBe("auth [link] failed");
    expect(sanitizeDeviceImportMessage("line one\nline\ttwo")).toBe("line one line two");
    expect(sanitizeDeviceImportMessage("x".repeat(500))).toHaveLength(200);
    expect(sanitizeDeviceImportMessage("   ")).toBeUndefined();
    expect(sanitizeDeviceImportMessage(undefined)).toBeUndefined();
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
