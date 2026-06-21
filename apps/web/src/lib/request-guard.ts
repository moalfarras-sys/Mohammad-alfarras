import { createHmac } from "crypto";

import { NextResponse } from "next/server";

import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

type LimitInput = {
  request: Request;
  bucket: string;
  limit: number;
  windowSeconds: number;
};

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

export async function rateLimit(input: LimitInput): Promise<NextResponse | null> {
  const key = `rate_limit:${input.bucket}:${fingerprint(clientAddress(input.request))}`;
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
