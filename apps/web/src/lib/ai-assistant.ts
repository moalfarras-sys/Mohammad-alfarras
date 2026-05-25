import { createHash, randomUUID } from "crypto";

import { createSupabaseAdminClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export type AssistantMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AssistantLocale = "ar" | "en";

export type PersistedAssistantMessage = {
  id?: string;
  role: AssistantMessage["role"];
  content: string;
  metadata?: Record<string, unknown>;
};

type ProviderResult = {
  fallback: boolean;
  model?: string;
  provider: "gemini" | "openai" | "local";
  reply: string;
};

const maxMessages = 12;
const assistantEventPrefix = "site_assistant_event:";
const assistantEventTtlDays = 7;

const siteContext = {
  ar:
    "أنت المساعد الذكي لموقع محمد الفراس. أجب بالعربية الواضحة وباختصار مفيد. ساعد الزائر في فهم خدمات تصميم وتطوير الويب، MoPlayer وMoPlayer Pro، صفحات التفعيل والدعم، قناة يوتيوب، السيرة الذاتية، وطرق التواصل. استخدم فقط نطاق moalfarras.space. روابط مهمة: MoPlayer Pro: https://moalfarras.space/ar/apps/moplayer2 أو /en/apps/moplayer2، التفعيل: https://moalfarras.space/ar/activate?product=moplayer2 أو /en/activate?product=moplayer2، الدعم: /ar/support أو /en/support، التواصل: /ar/contact أو /en/contact. لا تستخدم mohammadalfarras.com ولا تخترع أسعارا أو وعودا. إذا احتاج الزائر عملا مخصصا، وجهه إلى صفحة التواصل.",
  en:
    "You are the smart assistant for Mohammad Alfarras' website. Answer clearly and concisely. Help visitors understand web design and development services, MoPlayer and MoPlayer Pro, activation and support pages, YouTube, CV, and contact options. Use only the moalfarras.space domain. Important routes: MoPlayer Pro: https://moalfarras.space/en/apps/moplayer2 or /ar/apps/moplayer2, activation: https://moalfarras.space/en/activate?product=moplayer2 or /ar/activate?product=moplayer2, support: /en/support or /ar/support, contact: /en/contact or /ar/contact. Never use mohammadalfarras.com. Do not invent prices or commitments. If the visitor needs custom work, point them to the contact page.",
} satisfies Record<AssistantLocale, string>;

export function normalizeLocale(value: unknown): AssistantLocale {
  return value === "ar" ? "ar" : "en";
}

export function normalizeMessages(value: unknown): AssistantMessage[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid input: expected array, received undefined");
  }

  const messages = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = "role" in item ? String(item.role) : "";
      const content = "content" in item ? String(item.content ?? "").trim() : "";
      if (!content || !["user", "assistant", "system"].includes(role)) return null;
      return { role: role as AssistantMessage["role"], content };
    })
    .filter(Boolean) as AssistantMessage[];

  if (!messages.some((message) => message.role === "user")) {
    throw new Error("Invalid input: missing user message");
  }

  return messages.slice(-maxMessages);
}

export function normalizeMessage(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid input: expected string, received undefined");
  }
  return value.trim().slice(0, 2000);
}

function conversationUuid(value: unknown) {
  const raw = String(value ?? "").trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }
  return randomUUID();
}

function localReply(messages: AssistantMessage[], locale: AssistantLocale): ProviderResult {
  const last = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  const isAr = locale === "ar";

  if (last.includes("moplayer2") || last.includes("pro") || last.includes("برو")) {
    return {
      fallback: true,
      provider: "local",
      reply: isAr
        ? "MoPlayer Pro يستخدم slug ثابت اسمه moplayer2 في الروابط والـ API. صفحته العامة هي /ar/apps/moplayer2 أو /en/apps/moplayer2. للتفعيل استخدم /activate?product=moplayer2 مع كود الجهاز."
        : "MoPlayer Pro keeps the internal slug moplayer2 for URLs and APIs. Its public page is /en/apps/moplayer2, and activation uses /activate?product=moplayer2 with the device code.",
    };
  }

  if (last.includes("تفعيل") || last.includes("activate") || last.includes("code") || last.includes("الكود")) {
    return {
      fallback: true,
      provider: "local",
      reply: isAr
        ? "للتفعيل افتح صفحة التفعيل، أدخل كود الجهاز، ثم أرسل بيانات المصدر من الموقع. إذا كان المنتج Pro تأكد أن الرابط يحتوي product=moplayer2."
        : "To activate, open the activation page, enter the device code, then send the source details from the website. For Pro, make sure the URL includes product=moplayer2.",
    };
  }

  return {
    fallback: true,
    provider: "local",
    reply: isAr
      ? "أهلا بك. أقدر أساعدك في خدمات الموقع، MoPlayer، التفعيل، الدعم، أو ترتيب فكرة مشروعك. ما الذي تريد فحصه أو بناؤه؟"
      : "Hi. I can help with website services, MoPlayer, activation, support, or shaping a project idea. What would you like to check or build?",
  };
}

function groundedReply(messages: AssistantMessage[], locale: AssistantLocale): ProviderResult | null {
  const last = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  const isAr = locale === "ar";
  const asksActivation =
    last.includes("activate") ||
    last.includes("activation") ||
    last.includes("code") ||
    last.includes("تفعيل") ||
    last.includes("أفعل") ||
    last.includes("افعل") ||
    last.includes("فعل") ||
    last.includes("الكود") ||
    last.includes("رمز");
  const asksPro = last.includes("moplayer pro") || last.includes("moplayer2") || last.includes("pro") || last.includes("برو");

  if (asksActivation && asksPro) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "لتفعيل MoPlayer Pro افتح https://moalfarras.space/ar/activate?product=moplayer2 أو https://moalfarras.space/en/activate?product=moplayer2، أدخل كود الجهاز، ثم أرسل بيانات المصدر من صفحة التفعيل. مهم: المنتج يبقى داخليا باسم moplayer2 في الروابط والـ API."
        : "To activate MoPlayer Pro, open https://moalfarras.space/en/activate?product=moplayer2 or https://moalfarras.space/ar/activate?product=moplayer2, enter the device code, then send the source details from the activation page. Important: the internal product slug stays moplayer2 in URLs and APIs.",
    };
  }

  if (last.includes("support") || last.includes("دعم") || last.includes("مساعدة")) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "صفحة الدعم هي https://moalfarras.space/ar/support ويمكنك أيضا استخدام https://moalfarras.space/ar/contact للتواصل المباشر."
        : "The support page is https://moalfarras.space/en/support. You can also use https://moalfarras.space/en/contact for direct contact.",
    };
  }

  return null;
}

async function callOpenAI(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const input = [
    { role: "developer", content: siteContext[locale] },
    ...messages.map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content })),
  ];

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      max_output_tokens: 700,
      text: { verbosity: "low" },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { output_text?: string };
  const reply = data.output_text?.trim();
  return reply ? { fallback: false, model, provider: "openai", reply } : null;
}

async function callGemini(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const contents = [
    {
      role: "user",
      parts: [{ text: `${siteContext[locale]}\n\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}` }],
    },
  ];

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 700,
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  return reply ? { fallback: false, model, provider: "gemini", reply } : null;
}

export async function answerSiteAssistant(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult> {
  const grounded = groundedReply(messages, locale);
  if (grounded) return grounded;

  const preferred = (process.env.AI_ASSISTANT_PROVIDER || "").toLowerCase();
  const providers =
    preferred === "openai"
      ? [callOpenAI, callGemini]
      : preferred === "gemini"
        ? [callGemini, callOpenAI]
        : [callGemini, callOpenAI];

  for (const provider of providers) {
    try {
      const result = await provider(messages, locale);
      if (result) return result;
    } catch {
      // Fall through to the next provider or local response.
    }
  }

  return localReply(messages, locale);
}

async function purgeOldAssistantEvents() {
  const cutoff = new Date(Date.now() - assistantEventTtlDays * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseAdminClient();
  await supabase.from("app_settings").delete().like("key", `${assistantEventPrefix}%`).lt("updated_at", cutoff);
}

function assistantSummary(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, 180);
}

function assistantIntent(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("moplayer") || lower.includes("تفعيل") || lower.includes("activate")) return "moplayer-support";
  if (lower.includes("website") || lower.includes("site") || lower.includes("موقع")) return "website-project";
  if (lower.includes("price") || lower.includes("cost") || lower.includes("سعر") || lower.includes("تكلفة")) return "pricing";
  return "general";
}

function assistantLeadScore(message: string) {
  const lower = message.toLowerCase();
  let score = 10;
  if (lower.includes("email") || lower.includes("@")) score += 20;
  if (lower.includes("project") || lower.includes("موقع") || lower.includes("website")) score += 20;
  if (lower.includes("price") || lower.includes("تكلفة") || lower.includes("quote")) score += 20;
  if (lower.includes("urgent") || lower.includes("ضروري") || lower.includes("asap")) score += 15;
  return Math.min(100, score);
}

export async function persistAssistantExchange(input: {
  conversationId?: string;
  locale: AssistantLocale;
  pagePath?: string;
  messages: AssistantMessage[];
  reply: string;
  provider: string;
  model?: string;
  fallback: boolean;
}) {
  const conversationId = conversationUuid(input.conversationId);
  if (!hasSupabasePublicEnv()) return { conversationId, stored: false };

  const lastUser = [...input.messages].reverse().find((message) => message.role === "user")?.content ?? "";
  try {
    const supabase = createSupabaseAdminClient();
    await purgeOldAssistantEvents();

    const now = new Date().toISOString();
    const conversation = await supabase.from("ai_conversations").upsert(
      {
        id: conversationId,
        locale: input.locale,
        channel: "website",
        page_path: input.pagePath || "/",
        status: "open",
        intent: assistantIntent(lastUser),
        summary: assistantSummary(lastUser),
        lead_score: assistantLeadScore(lastUser),
        updated_at: now,
      },
      { onConflict: "id" },
    );
    if (conversation.error) throw conversation.error;

    const lastTwo = input.messages.slice(-2).filter((message) => message.role !== "system");
    const rows = [
      ...lastTwo.map((message) => ({
        conversation_id: conversationId,
        role: message.role,
        content: message.content.slice(0, 4000),
        metadata: {},
      })),
      {
        conversation_id: conversationId,
        role: "assistant",
        content: input.reply.slice(0, 4000),
        metadata: { provider: input.provider, model: input.model ?? null, fallback: input.fallback },
      },
    ];
    const messages = await supabase.from("ai_messages").insert(rows);
    if (messages.error) throw messages.error;

    await supabase.from("app_settings").upsert({
      key: `${assistantEventPrefix}${conversationId}`,
      value: {
        locale: input.locale,
        message: lastUser.slice(0, 500),
        provider: input.provider,
        fallback: input.fallback,
        retentionDays: assistantEventTtlDays,
        createdAt: now,
      },
      updated_at: now,
    });
    return { conversationId, stored: true };
  } catch {
    // Analytics must never break the assistant response.
    return { conversationId, stored: false };
  }
}

export async function writeAssistantEvent(input: {
  conversationId?: string;
  locale: AssistantLocale;
  message: string;
  provider: string;
  fallback: boolean;
}) {
  return persistAssistantExchange({
    conversationId: input.conversationId,
    locale: input.locale,
    messages: [{ role: "user", content: input.message }],
    reply: "",
    provider: input.provider,
    fallback: input.fallback,
  });
}

export function hashAssistantOtpCode(email: string, code: string) {
  return createHash("sha256").update(`${email.trim().toLowerCase()}:${code.trim()}`).digest("hex");
}

export { conversationUuid };
