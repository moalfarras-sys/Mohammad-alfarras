import { randomInt } from "crypto";

import { NextResponse } from "next/server";

import { conversationUuid, hashAssistantOtpCode } from "@/lib/ai-assistant";
import { sendTransactionalMail } from "@/lib/mailer";
import { rateLimit, serverHmac } from "@/lib/request-guard";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "assistant-otp-request", limit: 5, windowSeconds: 10 * 60 });
  if (limited) return limited;

  const body = (await request.json().catch(() => ({}))) as { conversationId?: string; email?: string; locale?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Also throttle per destination mailbox (hashed into the bucket key) so one
  // address can't be flooded with codes: 3 per 10 minutes on top of the IP limit.
  const limitedByEmail = await rateLimit({
    request,
    bucket: `assistant-otp-email:${serverHmac(email, "REQUEST_GUARD_SECRET").slice(0, 16)}`,
    limit: 3,
    windowSeconds: 10 * 60,
  });
  if (limitedByEmail) return limitedByEmail;

  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Verification is not configured" }, { status: 503 });
  }

  const conversationId = conversationUuid(body.conversationId);
  // crypto.randomInt: OTPs must come from a CSPRNG, not the guessable Math.random().
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const supabase = createSupabaseAdminClient();

  const conversation = await supabase.from("ai_conversations").upsert(
    {
      id: conversationId,
      locale: body.locale === "ar" ? "ar" : "en",
      channel: "website",
      page_path: "/ai",
      visitor_email: email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (conversation.error) {
    return NextResponse.json({ error: "Could not prepare verification" }, { status: 500 });
  }

  const otp = await supabase.from("ai_email_otps").insert({
    conversation_id: conversationId,
    email,
    code_hash: hashAssistantOtpCode(email, code),
    expires_at: expiresAt,
  });
  if (otp.error) {
    return NextResponse.json({ error: "Could not create verification code" }, { status: 500 });
  }

  const sent = await sendTransactionalMail({
    to: email,
    subject: body.locale === "ar" ? "رمز التحقق من مساعد Moalfarras" : "Moalfarras assistant verification code",
    text: body.locale === "ar" ? `رمز التحقق: ${code}` : `Your verification code: ${code}`,
  });

  return NextResponse.json({ ok: true, conversationId, sent });
}
