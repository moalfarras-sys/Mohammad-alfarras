import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/request-guard";
import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "assistant-feedback", limit: 20, windowSeconds: 60 });
  if (limited) return limited;

  const body = (await request.json().catch(() => ({}))) as {
    conversationId?: string;
    messageId?: string;
    rating?: string;
    comment?: string;
  };
  const rating = String(body.rating ?? "").trim().toLowerCase();
  const comment = String(body.comment ?? "").trim().slice(0, 1200);
  if (!["up", "down", "neutral", "helpful", "unhelpful"].includes(rating)) {
    return NextResponse.json({ ok: false, error: "Invalid rating" }, { status: 400 });
  }

  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("ai_feedback").insert({
      conversation_id: body.conversationId || null,
      message_id: body.messageId || null,
      rating,
      comment,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}
