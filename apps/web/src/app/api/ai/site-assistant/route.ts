import { randomUUID } from "crypto";

import { after, NextResponse } from "next/server";

import {
  answerSiteAssistant,
  detectLanguage,
  maybeNotifyOwnerOfLead,
  normalizeLocale,
  normalizeMessages,
  persistAssistantExchange,
  suggestFollowups,
} from "@/lib/ai-assistant";
import { rateLimit } from "@/lib/request-guard";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit({ request, bucket: "site-assistant", limit: 30, windowSeconds: 60 });
    if (limited) return limited;

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

    after(() =>
      maybeNotifyOwnerOfLead({
        conversationId: persisted.conversationId,
        locale,
        messages,
        pagePath: body.pagePath,
      }),
    );

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const lang = detectLanguage(lastUser);
    const suggestions = suggestFollowups(messages, lang);

    return NextResponse.json({
      conversationId: persisted.conversationId,
      traceId: persisted.conversationId,
      stored: persisted.stored,
      reply: result.reply,
      provider: result.provider,
      model: result.model,
      fallback: result.fallback,
      lang,
      suggestions,
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
    provider: process.env.GEMINI_API_KEY ? "gemini" : process.env.CUSTOM_AI_API_KEY ? "custom" : process.env.OPENAI_API_KEY ? "openai" : "local",
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      custom: Boolean(process.env.CUSTOM_AI_API_KEY && process.env.CUSTOM_AI_BASE_URL),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
  });
}
