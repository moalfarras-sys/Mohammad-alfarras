import { NextResponse } from "next/server";

import { hashAssistantOtpCode } from "@/lib/ai-assistant";
import { rateLimit } from "@/lib/request-guard";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "assistant-otp-verify", limit: 10, windowSeconds: 10 * 60 });
  if (limited) return limited;

  const body = (await request.json().catch(() => ({}))) as { conversationId?: string; email?: string; code?: string };
  const conversationId = String(body.conversationId ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();
  if (!conversationId || !email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, verified: false, error: "Invalid verification input" }, { status: 400 });
  }
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ ok: false, verified: false, error: "Verification is not configured" }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_email_otps")
    .select("id,code_hash,attempts,expires_at,verified_at")
    .eq("conversation_id", conversationId)
    .eq("email", email)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, verified: false }, { status: 400 });
  }

  const attempts = Number(data.attempts ?? 0);
  const expired = new Date(String(data.expires_at)).getTime() <= Date.now();
  const matches = data.code_hash === hashAssistantOtpCode(email, code);
  if (expired || attempts >= 5 || !matches) {
    await supabase.from("ai_email_otps").update({ attempts: attempts + 1 }).eq("id", data.id);
    return NextResponse.json({ ok: false, verified: false }, { status: 400 });
  }

  const now = new Date().toISOString();
  await Promise.all([
    supabase.from("ai_email_otps").update({ verified_at: now, attempts: attempts + 1 }).eq("id", data.id),
    supabase.from("ai_conversations").update({ visitor_email: email, visitor_email_verified_at: now, updated_at: now }).eq("id", conversationId),
  ]);

  return NextResponse.json({ ok: true, verified: true });
}
