import { NextResponse } from "next/server";

const MAX_JSON_BYTES = 24 * 1024;

export async function readBoundedJson(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > MAX_JSON_BYTES) {
    throw new Error("Payload too large");
  }
  if (!raw.trim()) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected JSON object");
  }
  return parsed as Record<string, unknown>;
}

export function requireAutomationSecret(request: Request, envName = "AUTOMATION_API_KEY"): NextResponse | null {
  const expected = process.env[envName] || process.env.AUTOMATION_API_KEY;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "automation_secret_not_configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const headerKey = request.headers.get("x-automation-key")?.trim() ?? "";

  if (bearer === expected || headerKey === expected) return null;
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
