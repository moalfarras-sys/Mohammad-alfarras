import { createHmac } from "crypto";

import { NextResponse } from "next/server";

import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

type LimitInput = {
  request: Request;
  bucket: string;
  limit: number;
  windowSeconds: number;
};

// Rate limiting prefers Upstash Redis (atomic INCR + EXPIRE, self-expiring keys,
// stays enforced during Supabase outages — the same store activation uses). The
// Supabase path below remains only as a fallback for environments without Redis.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function fingerprint(input: string) {
  return createHmac("sha256", process.env.REQUEST_GUARD_SECRET || process.env.ADMIN_SESSION_SECRET || "local-dev-request-guard")
    .update(input)
    .digest("hex")
    .slice(0, 32);
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

/** Returns a 429 response when limited, null when allowed or Redis unavailable but handled. */
async function rateLimitWithRedis(key: string, input: LimitInput): Promise<NextResponse | null | "unavailable"> {
  try {
    const count = await redis<number>(["INCR", key]);
    if (count === 1) {
      await redis(["EXPIRE", key, String(input.windowSeconds)]);
    }
    if (count > input.limit) {
      let ttl = await redis<number>(["TTL", key]);
      if (ttl < 0) {
        // A lost EXPIRE would otherwise lock the bucket forever — re-arm it.
        await redis(["EXPIRE", key, String(input.windowSeconds)]);
        ttl = input.windowSeconds;
      }
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfterSeconds: Math.max(1, ttl) },
        { status: 429 },
      );
    }
    return null;
  } catch {
    return "unavailable";
  }
}

export async function rateLimit(input: LimitInput): Promise<NextResponse | null> {
  const key = `rate_limit:${input.bucket}:${fingerprint(clientAddress(input.request))}`;

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const verdict = await rateLimitWithRedis(key, input);
    if (verdict !== "unavailable") return verdict;
  }

  const now = Date.now();
  const resetAt = now + input.windowSeconds * 1000;

  if (!hasSupabasePublicEnv()) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    const value = (data?.value ?? {}) as { count?: number; resetAt?: number };
    const activeWindow = Number(value.resetAt ?? 0) > now;
    const count = activeWindow ? Number(value.count ?? 0) + 1 : 1;
    const nextResetAt = activeWindow ? Number(value.resetAt) : resetAt;

    if (count > input.limit) {
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfterSeconds: Math.max(1, Math.ceil((nextResetAt - now) / 1000)) },
        { status: 429 },
      );
    }

    await supabase.from("app_settings").upsert(
      {
        key,
        value: { count, resetAt: nextResetAt, bucket: input.bucket },
        description: "Temporary server-side request guard bucket.",
        updated_at: new Date().toISOString(),
      },
      // Without onConflict the increment re-inserts the same key and the unique
      // violation is swallowed by the catch below, so the count never grows and
      // rate limiting silently no-ops. Upsert on the key to actually increment.
      { onConflict: "key" },
    );
  } catch {
    // Request guards must not take the public site offline when storage is unavailable.
  }

  return null;
}

export function serverHmac(input: string, envName: string, fallbackEnvName = "ADMIN_SESSION_SECRET") {
  const secret = process.env[envName] || process.env[fallbackEnvName] || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-hmac";
  return createHmac("sha256", secret).update(input).digest("hex");
}
