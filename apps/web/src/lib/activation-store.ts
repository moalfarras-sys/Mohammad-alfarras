/**
 * Activation store — backs the MoPlayer QR device-activation handoff.
 *
 * Primary backend is Upstash Redis (free, TTL-native, decoupled from the main
 * Supabase project so activation keeps working even if Supabase is paused or
 * over-quota). When the Upstash env vars are absent it transparently falls back
 * to the legacy Supabase tables so nothing breaks in local/dev setups.
 *
 * All values are short-lived: activation requests, the source-pull auth token
 * hash, and the encrypted one-device source queue all expire on their own via
 * Redis TTL, so no IPTV provider credentials are ever durably stored.
 */
import { createSupabaseAdminClient } from "@/lib/supabase/client";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function activationStoreUsesRedis(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(UPSTASH_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN as string}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash command failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { result: T };
  return data.result;
}

async function redisGetJson<T>(key: string): Promise<T | null> {
  const raw = await redis<string | null>(["GET", key]);
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function redisSetJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const command: (string | number)[] = ["SET", key, JSON.stringify(value)];
  if (ttlSeconds && ttlSeconds > 0) {
    command.push("EX", Math.ceil(ttlSeconds));
  }
  await redis(command);
}

async function redisDel(...keys: string[]): Promise<void> {
  const real = keys.filter(Boolean);
  if (real.length) await redis(["DEL", ...real]);
}

function secondsUntil(iso: string | undefined, fallbackSeconds: number): number {
  if (!iso) return fallbackSeconds;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return fallbackSeconds;
  return Math.max(60, Math.ceil(ms / 1000));
}

// Activation requests are kept for an hour: long enough to cover the 15-minute
// code window plus device confirmation and the ~20-minute source-delivery poll.
const REQUEST_TTL_SECONDS = 60 * 60;
const DEVICE_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days

const requestKey = (code: string) => `act:req:${code}`;
const deviceCodeKey = (publicDeviceId: string) => `act:devcode:${publicDeviceId}`;
const deviceKey = (publicDeviceId: string) => `act:device:${publicDeviceId}`;
const licenseKey = (publicDeviceId: string) => `act:license:${publicDeviceId}`;

export type StoredActivationRequest = {
  publicDeviceId: string;
  productSlug: string;
  deviceCode: string;
  status: "waiting" | "activated" | "expired";
  expiresAt: string;
  activatedAt?: string;
  userAgent?: string | null;
  createdAt: string;
};

function productMatches(stored: string | null | undefined, productSlug: string): boolean {
  const value = stored ?? "moplayer";
  return value === productSlug;
}

/* ------------------------------------------------------------------ *
 * Generic device settings (source-pull auth hash + encrypted queue)  *
 * ------------------------------------------------------------------ */

export async function readDeviceSetting<T>(key: string): Promise<T | null> {
  if (activationStoreUsesRedis()) {
    return redisGetJson<T>(key);
  }
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? null) as T | null;
}

export async function writeDeviceSetting(
  key: string,
  value: unknown,
  opts?: { ttlSeconds?: number; description?: string },
): Promise<void> {
  if (activationStoreUsesRedis()) {
    await redisSetJson(key, value, opts?.ttlSeconds);
    return;
  }
  const supabase = createSupabaseAdminClient();
  await supabase.from("app_settings").upsert(
    { key, value, description: opts?.description ?? null, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
}

export async function deleteDeviceSettings(...keys: string[]): Promise<void> {
  const real = keys.filter(Boolean);
  if (!real.length) return;
  if (activationStoreUsesRedis()) {
    await redisDel(...real);
    return;
  }
  const supabase = createSupabaseAdminClient();
  await supabase.from("app_settings").delete().in("key", real);
}

/* ------------------------------------------------------------------ *
 * Devices + activation requests                                       *
 * ------------------------------------------------------------------ */

export async function registerDevice(input: {
  publicDeviceId: string;
  name?: string;
  platform?: string;
  deviceType?: string;
  appVersion?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  if (activationStoreUsesRedis()) {
    await redisSetJson(
      deviceKey(input.publicDeviceId),
      { ...input, status: "pending", lastSeenAt: now, updatedAt: now },
      DEVICE_TTL_SECONDS,
    );
    return;
  }
  const supabase = createSupabaseAdminClient();
  await supabase.from("devices").upsert(
    {
      public_device_id: input.publicDeviceId,
      name: input.name,
      platform: input.platform,
      device_type: input.deviceType,
      app_version: input.appVersion,
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: "public_device_id" },
  );
}

export async function expireDeviceWaitingRequests(publicDeviceId: string, productSlug: string): Promise<void> {
  if (activationStoreUsesRedis()) {
    const oldCode = await redis<string | null>(["GET", deviceCodeKey(publicDeviceId)]);
    if (typeof oldCode === "string" && oldCode) {
      await redisDel(requestKey(oldCode));
    }
    return;
  }
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("activation_requests")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("public_device_id", publicDeviceId)
    .eq("product_slug", productSlug)
    .eq("status", "waiting");
}

/** Returns true if the code was stored, false if it already existed (caller retries). */
export async function createActivationRequest(input: {
  publicDeviceId: string;
  productSlug: string;
  code: string;
  expiresAt: string;
  userAgent?: string | null;
}): Promise<boolean> {
  if (activationStoreUsesRedis()) {
    const record: StoredActivationRequest = {
      publicDeviceId: input.publicDeviceId,
      productSlug: input.productSlug,
      deviceCode: input.code,
      status: "waiting",
      expiresAt: input.expiresAt,
      userAgent: input.userAgent ?? null,
      createdAt: new Date().toISOString(),
    };
    // NX guarantees a unique code without a round-trip race.
    const stored = await redis<string | null>([
      "SET",
      requestKey(input.code),
      JSON.stringify(record),
      "EX",
      REQUEST_TTL_SECONDS,
      "NX",
    ]);
    if (stored !== "OK") return false;
    await redisSetJson(deviceCodeKey(input.publicDeviceId), input.code, REQUEST_TTL_SECONDS);
    return true;
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activation_requests")
    .insert({
      public_device_id: input.publicDeviceId,
      product_slug: input.productSlug,
      device_code: input.code,
      status: "waiting",
      expires_at: input.expiresAt,
      user_agent: input.userAgent ?? null,
    })
    .select("id")
    .single();
  return Boolean(!error && data);
}

export async function getActivationRequest(code: string, productSlug: string): Promise<StoredActivationRequest | null> {
  if (activationStoreUsesRedis()) {
    const record = await redisGetJson<StoredActivationRequest>(requestKey(code));
    if (!record) return null;
    if (!productMatches(record.productSlug, productSlug)) return null;
    return record;
  }
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("activation_requests")
    .select("public_device_id, device_code, product_slug, status, expires_at, activated_at")
    .eq("device_code", code)
    .or(productSlug === "moplayer" ? "product_slug.eq.moplayer,product_slug.is.null" : `product_slug.eq.${productSlug}`)
    .maybeSingle();
  if (!data) return null;
  return {
    publicDeviceId: data.public_device_id,
    productSlug: (data.product_slug as string) ?? "moplayer",
    deviceCode: data.device_code,
    status: data.status as StoredActivationRequest["status"],
    expiresAt: data.expires_at,
    activatedAt: (data.activated_at as string | null) ?? undefined,
    createdAt: "",
  };
}

export async function setActivationStatus(
  code: string,
  status: "expired" | "activated",
  extra?: { activatedAt?: string },
): Promise<void> {
  if (activationStoreUsesRedis()) {
    const record = await redisGetJson<StoredActivationRequest>(requestKey(code));
    if (!record) return;
    record.status = status;
    if (extra?.activatedAt) record.activatedAt = extra.activatedAt;
    await redisSetJson(requestKey(code), record, REQUEST_TTL_SECONDS);
    return;
  }
  const supabase = createSupabaseAdminClient();
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (extra?.activatedAt) update.activated_at = extra.activatedAt;
  await supabase.from("activation_requests").update(update).eq("device_code", code);
}

/** Marks the device active and issues/refreshes its free license. */
export async function activateDeviceAndLicense(publicDeviceId: string, deviceName: string): Promise<void> {
  const now = new Date().toISOString();
  if (activationStoreUsesRedis()) {
    const existing = (await redisGetJson<Record<string, unknown>>(deviceKey(publicDeviceId))) ?? {};
    await redisSetJson(
      deviceKey(publicDeviceId),
      { ...existing, publicDeviceId, name: deviceName, status: "active", lastSeenAt: now, updatedAt: now },
      DEVICE_TTL_SECONDS,
    );
    await redisSetJson(licenseKey(publicDeviceId), { plan: "free", status: "active", updatedAt: now });
    return;
  }
  const supabase = createSupabaseAdminClient();
  const { data: device } = await supabase
    .from("devices")
    .update({ status: "active", name: deviceName, last_seen_at: now, updated_at: now })
    .eq("public_device_id", publicDeviceId)
    .select("id")
    .single();
  if (device?.id) {
    await supabase
      .from("licenses")
      .upsert({ device_id: device.id, plan: "free", status: "active", updated_at: now }, { onConflict: "device_id" });
  }
}

export { secondsUntil };
