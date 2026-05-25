import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { answerSiteAssistant, normalizeLocale, normalizeMessages, persistAssistantExchange } from "@/lib/ai-assistant";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { conversationId?: string; locale?: string; messages?: unknown; pagePath?: string };
    const locale = normalizeLocale(body.locale);
    const messages = normalizeMessages(body.messages);
    const conversationId = body.conversationId || randomUUID();
    const result = await answerSiteAssistant(messages, locale);

    const persisted = await persistAssistantExchange({
      conversationId,
      locale,
      pagePath: body.pagePath,
      messages,
      reply: result.reply,
      provider: result.provider,
      model: result.model,
      fallback: result.fallback,
    });

    return NextResponse.json({
      conversationId: persisted.conversationId,
      stored: persisted.stored,
      reply: result.reply,
      provider: result.provider,
      model: result.model,
      fallback: result.fallback,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid input" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    ready: true,
    retentionDays: 7,
    provider: process.env.AI_ASSISTANT_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : "local"),
  });
}
