import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

export type ProviderSourceType = "xtream" | "m3u";

export type ProviderSourcePayload =
  | {
      type: "xtream";
      name: string;
      serverUrl: string;
      username: string;
      password: string;
    }
  | {
      type: "m3u";
      name: string;
      playlistUrl: string;
      epgUrl?: string;
    };

export type ProviderSourceTestResult = {
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
  normalizedSource?: ProviderSourcePayload;
};

export type ProviderSourceQueueStatus = "pending" | "fetched" | "imported" | "failed" | "revoked";

export type ProviderSourceQueueValue = {
  id: string;
  publicDeviceId: string;
  sourceType: ProviderSourceType;
  displayName: string;
  encryptedPayload?: string;
  encryptionVersion: "aes-256-gcm:v1";
  status: ProviderSourceQueueStatus;
  lastTestStatus: "success" | "failed";
  lastTestMessage: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  pulledAt?: string;
  importedAt?: string;
  failedAt?: string;
  failureMessage?: string;
  productSlug?: string;
};

const ENCRYPTION_PREFIX = "aes-256-gcm:v1";
const MAX_TEST_BYTES = 192 * 1024;
const PENDING_SOURCE_TTL_MS = 20 * 60 * 1000;
const FETCHED_SOURCE_RECEIPT_TTL_MS = 5 * 60 * 1000;

function serverSecret() {
  const value = process.env.MOPLAYER_PROVIDER_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error("Missing MOPLAYER_PROVIDER_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }
  return value;
}

function encryptionKey() {
  return createHash("sha256").update(serverSecret()).digest();
}

function normalizeHttpUrl(value: unknown, fieldName: string) {
  let raw = String(value ?? "").trim();
  if (raw && !/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    raw = `http://${raw}`;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${fieldName} must start with http:// or https://.`);
  }

  if (!url.hostname) {
    throw new Error(`${fieldName} must include a host.`);
  }

  return url.toString().replace(/\/$/, "");
}

function cleanText(value: unknown, fallback: string, max = 160) {
  return String(value ?? fallback).trim().slice(0, max) || fallback;
}

export function normalizeProviderSource(input: unknown): ProviderSourcePayload {
  const body = (input ?? {}) as Record<string, unknown>;
  const type = String(body.type ?? "").toLowerCase();

  if (type === "xtream") {
    const serverUrl = normalizeHttpUrl(body.serverUrl, "Server URL");
    const username = cleanText(body.username, "", 240);
    const password = cleanText(body.password, "", 240);
    if (!username || !password) {
      throw new Error("Xtream username and password are required.");
    }
    return {
      type: "xtream",
      name: cleanText(body.name, new URL(serverUrl).hostname),
      serverUrl,
      username,
      password,
    };
  }

  if (type === "m3u") {
    const playlistUrl = normalizeHttpUrl(body.playlistUrl, "Playlist URL");
    const epgUrl = String(body.epgUrl ?? "").trim();
    return {
      type: "m3u",
      name: cleanText(body.name, new URL(playlistUrl).hostname || "M3U playlist"),
      playlistUrl,
      epgUrl: epgUrl ? normalizeHttpUrl(epgUrl, "EPG URL") : undefined,
    };
  }

  throw new Error("Source type must be xtream or m3u.");
}

export function encryptProviderSource(payload: ProviderSourcePayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptProviderSource(value: string): ProviderSourcePayload {
  const [prefix, version, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  const actualPrefix = `${prefix}:${version}`;
  if (actualPrefix !== ENCRYPTION_PREFIX || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Unsupported provider source encryption format.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");

  return normalizeProviderSource(JSON.parse(decrypted));
}

export function hashSourcePullToken(token: string) {
  return createHmac("sha256", serverSecret()).update(token).digest("hex");
}

export function normalizePublicDeviceId(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 48);
}

export function isValidPublicDeviceId(value: string) {
  return /^MO-D-[A-Z0-9-]{8,40}$/.test(value);
}

function deviceSettingHash(publicDeviceId: string) {
  return createHash("sha256").update(publicDeviceId).digest("hex").slice(0, 48);
}

export function deviceSourceAuthSettingKey(publicDeviceId: string) {
  return `moplayer_device_auth:${deviceSettingHash(publicDeviceId)}`;
}

export function deviceSourceQueueSettingKey(publicDeviceId: string) {
  return `moplayer_device_source:${deviceSettingHash(publicDeviceId)}`;
}

export function providerSourceQueueBelongsToProduct(
  queue: Partial<ProviderSourceQueueValue> | null | undefined,
  productSlug: string,
) {
  const queueProduct = queue?.productSlug ?? "moplayer";
  return queueProduct === productSlug;
}

export function pendingProviderSourceExpiresAt(now = Date.now()) {
  return new Date(now + PENDING_SOURCE_TTL_MS).toISOString();
}

export function fetchedProviderSourceReceiptExpiresAt(now = Date.now()) {
  return new Date(now + FETCHED_SOURCE_RECEIPT_TTL_MS).toISOString();
}

export function providerSourceQueueExpired(queue: Partial<ProviderSourceQueueValue> | null | undefined, now = Date.now()) {
  if (!queue?.expiresAt) return false;
  return new Date(queue.expiresAt).getTime() <= now;
}

export function normalizeSourcePullToken(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9._~-]/g, "")
    .slice(0, 160);
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, done: () => clearTimeout(timeout) };
}

/**
 * Detect if an M3U URL is actually an Xtream get.php endpoint.
 * Returns extracted credentials or null.
 */
function extractXtreamFromM3uUrl(raw: string): { serverUrl: string; username: string; password: string } | null {
  try {
    const url = new URL(raw);
    const username = url.searchParams.get("username") ?? "";
    const password = url.searchParams.get("password") ?? "";
    if (!username || !password || !url.pathname.toLowerCase().includes("get.php")) return null;
    return {
      serverUrl: `${url.protocol}//${url.host}`,
      username,
      password,
    };
  } catch {
    return null;
  }
}

function xtreamApiUrl(serverUrl: string, username: string, password: string) {
  const base = serverUrl.replace(/\/player_api\.php$/i, "").replace(/\/$/, "");
  const url = new URL(`${base}/player_api.php`);
  url.searchParams.set("username", username);
  url.searchParams.set("password", password);
  return url;
}

function insecureFallbackSource(payload: ProviderSourcePayload): ProviderSourcePayload | null {
  if (payload.type !== "xtream" || !payload.serverUrl.startsWith("https://")) return null;
  return { ...payload, serverUrl: payload.serverUrl.replace(/^https:\/\//i, "http://") };
}

async function readLimitedText(response: Response, maxBytes = MAX_TEST_BYTES) {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    const available = Math.min(value.length, maxBytes - total);
    chunks.push(value.slice(0, available));
    total += available;
    if (available < value.length) break;
  }
  await reader.cancel().catch(() => undefined);
  return Buffer.concat(chunks).toString("utf8");
}

export async function testProviderSource(payload: ProviderSourcePayload): Promise<ProviderSourceTestResult> {
  if (payload.type === "xtream") {
    const candidates = [payload, insecureFallbackSource(payload)].filter(Boolean) as ProviderSourcePayload[];
    for (const candidate of candidates) {
      if (candidate.type !== "xtream") continue;
      const timeout = withTimeout(12_000);
      try {
        const response = await fetch(xtreamApiUrl(candidate.serverUrl, candidate.username, candidate.password), {
          signal: timeout.controller.signal,
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        const text = await response.text();
        if (!response.ok) {
          if (candidate === candidates[candidates.length - 1]) return { ok: false, message: `Server responded with HTTP ${response.status}.` };
          continue;
        }
        const json = JSON.parse(text) as { user_info?: { auth?: number; status?: string; exp_date?: string; message?: string } };
        const userInfo = json.user_info;
        if (userInfo?.auth !== 1) {
          return { ok: false, message: userInfo?.message || "Xtream credentials were not accepted." };
        }
        if (String(userInfo.status ?? "").toLowerCase() === "expired") {
          return { ok: false, message: "Xtream account appears to be expired." };
        }
        return {
          ok: true,
          message: "Xtream connection works.",
          normalizedSource: candidate,
          details: {
            status: userInfo.status ?? "active",
            expDate: userInfo.exp_date ?? null,
          },
        };
      } catch (error) {
        if (candidate === candidates[candidates.length - 1]) {
          return { ok: false, message: error instanceof Error && error.name === "AbortError" ? "Server timeout." : "Could not test Xtream connection." };
        }
      } finally {
        timeout.done();
      }
    }
    return { ok: false, message: "Could not test Xtream connection." };
  }

  // For M3U type: check if this is actually an Xtream get.php URL and try the API first
  const xtreamFromUrl = extractXtreamFromM3uUrl(payload.playlistUrl);
  if (xtreamFromUrl) {
    const xtreamPayload: ProviderSourcePayload = {
      type: "xtream",
      name: payload.name,
      serverUrl: xtreamFromUrl.serverUrl,
      username: xtreamFromUrl.username,
      password: xtreamFromUrl.password,
    };
    const xtreamResult = await testProviderSource(xtreamPayload);
    if (xtreamResult.ok) {
      // The Xtream API works — return success but keep the original M3U payload
      return {
        ok: true,
        message: xtreamResult.message,
        normalizedSource: payload,
        details: xtreamResult.details,
      };
    }
    // Xtream API failed — fall through to test the M3U URL directly
  }

  const timeout = withTimeout(15_000);
  try {
    const response = await fetch(payload.playlistUrl, {
      signal: timeout.controller.signal,
      headers: {
        accept: "application/vnd.apple.mpegurl,audio/mpegurl,text/plain,*/*",
        range: `bytes=0-${MAX_TEST_BYTES - 1}`,
        "user-agent": "MoPlayer-Website-Activation/1.0",
      },
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, message: "الرابط مرفوض من السيرفر (خطأ في الصلاحيات). تأكد من اسم المستخدم وكلمة المرور. / Server rejected the request (authorization error). Check username and password." };
    }
    if (!response.ok) {
      return { ok: false, message: `الرابط أرجع خطأ HTTP ${response.status}. تأكد من صحة العنوان. / Playlist responded with HTTP ${response.status}.` };
    }

    const sample = await readLimitedText(response);

    if (!sample || sample.trim().length === 0) {
      return { ok: false, message: "الرابط أرجع رداً فارغاً. تأكد من السيرفر واسم المستخدم وكلمة المرور. / The server returned an empty response." };
    }

    // Strip BOM and leading whitespace for header detection
    const cleaned = sample.replace(/^\uFEFF/, "").trimStart();

    // Check for HTML responses (login pages, error pages)
    const looksLikeHtml = /^\s*<(!DOCTYPE|html|head|body)/i.test(cleaned) || cleaned.includes("<html") || cleaned.includes("<!DOCTYPE");
    if (looksLikeHtml) {
      return { ok: false, message: "الرابط لا يرجع ملف M3U صالح — يبدو أنه يعرض صفحة ويب. تأكد من السيرفر واسم المستخدم وكلمة المرور. / The URL returned an HTML page instead of an M3U file. Check server, username, and password." };
    }

    const hasM3uHeader = cleaned.includes("#EXTM3U");
    const hasExtinf = cleaned.includes("#EXTINF");

    // Accept if: has #EXTM3U header OR has #EXTINF entries
    if (hasM3uHeader || hasExtinf) {
      return {
        ok: true,
        message: "M3U playlist is reachable.",
        normalizedSource: payload,
        details: {
          sampleBytes: sample.length,
          hasM3uHeader,
        },
      };
    }

    // Last resort: check if response is binary/compressed (some servers gzip M3U)
    const hasBinarySignature = sample.charCodeAt(0) === 0x1f && sample.charCodeAt(1) === 0x8b; // gzip
    if (hasBinarySignature) {
      return {
        ok: true,
        message: "M3U playlist appears to be compressed but reachable.",
        normalizedSource: payload,
        details: { sampleBytes: sample.length, compressed: true },
      };
    }

    return { ok: false, message: "الرابط لا يرجع ملف M3U صالح. تأكد من السيرفر واسم المستخدم وكلمة المرور. / The playlist did not look like a playable M3U file. Check server, username, and password." };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, message: "انتهت مهلة الاتصال بالسيرفر. تأكد من العنوان واتصال الإنترنت. / Server timeout. Check the address and your connection." };
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      return { ok: false, message: "تعذّر الاتصال بالسيرفر. تأكد من صحة العنوان. / Could not connect to the server. Check the address." };
    }
    if (msg.includes("certificate") || msg.includes("SSL") || msg.includes("TLS")) {
      return { ok: false, message: "مشكلة في شهادة SSL للسيرفر. جرّب http:// بدلاً من https://. / SSL certificate error. Try http:// instead of https://." };
    }
    return { ok: false, message: "تعذّر اختبار رابط M3U. تأكد من العنوان واتصال الإنترنت. / Could not test M3U playlist. Check the address and your connection." };
  } finally {
    timeout.done();
  }
}

export function publicProviderSource(source: ProviderSourcePayload) {
  if (source.type === "xtream") {
    return {
      type: source.type,
      name: source.name,
      serverUrl: source.serverUrl,
      username: source.username,
      password: source.password,
    };
  }

  return {
    type: source.type,
    name: source.name,
    playlistUrl: source.playlistUrl,
    epgUrl: source.epgUrl ?? "",
  };
}
