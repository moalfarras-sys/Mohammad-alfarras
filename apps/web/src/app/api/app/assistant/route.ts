import { NextResponse } from "next/server";

import { answerSiteAssistant, normalizeLocale, normalizeMessage } from "@/lib/ai-assistant";
import { rateLimit } from "@/lib/request-guard";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit({ request, bucket: "app-assistant", limit: 40, windowSeconds: 60 });
    if (limited) return limited;

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
  // Mirror the real answer chain in answerSiteAssistant (gemini → custom → openai
  // → local): AI_ASSISTANT_PROVIDER and Anthropic are intentionally not part of it.
  const providers = {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    custom: Boolean(process.env.CUSTOM_AI_API_KEY && process.env.CUSTOM_AI_BASE_URL),
    openai: Boolean(process.env.OPENAI_API_KEY),
  };
  return NextResponse.json({
    ok: true,
    fallback: false,
    ready: true,
    provider: providers.gemini ? "gemini" : providers.custom ? "custom" : providers.openai ? "openai" : "local",
    providers,
  });
}
