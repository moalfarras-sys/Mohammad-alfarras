import { NextResponse } from "next/server";

import { answerSiteAssistant, normalizeLocale, normalizeMessage } from "@/lib/ai-assistant";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { locale?: string; message?: unknown; history?: Array<{ role?: string; content?: string }> };
    const locale = normalizeLocale(body.locale);
    const message = normalizeMessage(body.message);
    const history = Array.isArray(body.history)
      ? body.history
          .filter((item) => item.role === "user" || item.role === "assistant")
          .map((item) => ({ role: item.role as "user" | "assistant", content: String(item.content ?? "") }))
      : [];
    const result = await answerSiteAssistant([...history, { role: "user", content: message }], locale);

    return NextResponse.json({ ok: true, fallback: result.fallback, reply: result.reply, provider: result.provider, model: result.model });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid input" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    fallback: false,
    ready: true,
    provider: process.env.AI_ASSISTANT_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : "local"),
  });
}
