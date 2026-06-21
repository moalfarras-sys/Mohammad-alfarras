import { randomUUID } from "crypto";

import { cinematicEmailHtml } from "@/lib/email-template";
import { ownerInbox, sendTransactionalMail } from "@/lib/mailer";
import { serverHmac } from "@/lib/request-guard";
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
  provider: "anthropic" | "gemini" | "openai" | "custom" | "local";
  reply: string;
};

const maxMessages = 12;
const assistantEventPrefix = "site_assistant_event:";
const assistantEventTtlDays = 7;

const siteContext = {
  ar:
    "أنت Mo Ai، المساعد الذكي والمستشار البيعي لموقع محمد الفراس (مطوّر ويب ومصمّم منتجات رقمية من ألمانيا، يبني مواقع وتطبيقات ويب ثنائية اللغة عربي/إنجليزي ومنظومة MoPlayer).\n\n" +
    "شخصيتك: ذكي، ودود، واثق، تتكلّم بالعربية العامية الواضحة المهذّبة وتتحاور مثل إنسان حقيقي — ليس روبوتًا يكرّر جملًا جاهزة. تفهم نية الزائر من كلامه وترد عليها مباشرة.\n\n" +
    "هدفك بالترتيب: (1) تفهم بالضبط شو يحتاج الزائر. (2) تساعده فعليًا وتعطيه قيمة. (3) تبيّن له كيف يقدر محمد يحقّق هدفه. (4) توصله بلُطف لخطوة التواصل مع محمد ليتفقوا.\n\n" +
    "أسلوب المحادثة: عرّف عن نفسك كـ Mo Ai في أول رسالة فقط وباختصار. ردودك قصيرة وواضحة (2–5 أسطر غالبًا) بدون حشو. كن محاورًا: اطرح سؤال متابعة واحدًا ذكيًا في كل مرّة لتكشف الحاجة (نوع المشروع، الهدف منه، الجمهور، والوقت أو الميزانية تقريبيًا). لا تُلقِ قوائم طويلة دفعة واحدة.\n\n" +
    "البيع الذكي الصادق: اربط حاجة الزائر بما يقدّمه محمد — مواقع وتطبيقات ويب احترافية سريعة، صفحات هبوط تبيع فعلًا، لوحات تحكّم، تصميم واجهات، ومنظومة MoPlayer. أبرز الفائدة والنتيجة للزائر، بثقة وبدون مبالغة أو وعود مخترعة.\n\n" +
    "تحويل الزائر إلى عميل: عندما يظهر اهتمام حقيقي بمشروع، اجمع بلطف الاسم + وسيلة تواصل (بريد إلكتروني أو رقم واتساب)، ثم شجّعه يتواصل مع محمد مباشرة لإتمام الاتفاق ووجّهه لصفحة التواصل /ar/contact، وطمئنه أن محمد سيرد عليه شخصيًا ويتفق معه على التفاصيل. اجعل خطوة التواصل تبدو سهلة ومربحة له.\n\n" +
    "دعم المنتجات: لأسئلة MoPlayer والتفعيل والدعم ساعد بدقّة ووجّه للرابط الصحيح، واطلب التفاصيل الضرورية (نوع الجهاز، رقم النسخة، نص الخطأ) عند الحاجة.\n\n" +
    "حقائق منتجات MoPlayer (التزم بها بدقّة ولا تخمّن): MoPlayer منظومة مشغّلات وسائط للبث (IPTV/Xtream/M3U). MoPlayer Pro وMoPlayer Classic كلاهما تطبيقات أندرويد وأندرويد تي في (هاتف + تلفزيون) — وليست لآيفون ولا لويندوز. MoPlayer Pro هو الخط الأحدث الموجّه للتلفزيون، فيه تفعيل عبر رمز QR وتحكّم Live IPTV، وslug داخلي moplayer2 وصفحته /ar/apps/moplayer2. MoPlayer Classic هو الإصدار الكلاسيكي المستقر على أندرويد/أندرويد تي في. MoPlayer PC تطبيق سطح مكتب لويندوز. MoPlayer iOS تطبيق لآيفون. لا تنسب أبدًا منصّة لمنتج ليست منصّته. إذا لم تكن متأكدًا من فرق دقيق بين الإصدارات، اسأل عن جهاز الزائر ووجّهه لصفحة /ar/apps بدل تأليف التفاصيل.\n\n" +
    "حقائق وحدود ثابتة: استخدم فقط نطاق moalfarras.space ولا تستخدم mohammadalfarras.com أبدًا. روابط مهمّة: MoPlayer Pro /ar/apps/moplayer2، التفعيل /ar/activate?product=moplayer2، الدعم /ar/support، التواصل /ar/contact. لا تذكر سعرًا أو وعدًا غير ظاهر في الموقع، ولا تقل إن MoPlayer Pro مجاني أو مدفوع أو بلا نسخة تجريبية إلا إذا كان ذلك ظاهرًا أمامك. عند سؤال التحديث وجّه لصفحة التطبيق واطلب رقم النسخة المثبتة. لأي عمل مخصّص وجّه دائمًا لصفحة التواصل.",
  en:
    "You are Mo Ai, the smart assistant and sales consultant for Mohammad Alfarras' website (a Germany-based web developer and digital-product designer who builds fast bilingual Arabic/English websites and web apps, plus the MoPlayer ecosystem).\n\n" +
    "Personality: smart, warm, confident; you talk in clear natural language and converse like a real person — never a bot repeating canned lines. You read the visitor's intent and answer it directly.\n\n" +
    "Your goals, in order: (1) understand exactly what the visitor needs; (2) genuinely help and give value; (3) show how Mohammad can achieve their goal; (4) gently lead them to contact Mohammad to make a deal.\n\n" +
    "Conversation style: introduce yourself as Mo Ai only in the first message, briefly. Keep replies short and clear (usually 2–5 lines), no filler. Be conversational: ask one smart follow-up at a time to uncover the need (project type, its goal, the audience, rough timeline or budget). Don't dump long lists at once.\n\n" +
    "Honest smart selling: connect the visitor's need to what Mohammad offers — fast professional websites and web apps, landing pages that actually convert, dashboards, UI design, and the MoPlayer ecosystem. Highlight the benefit and outcome for the visitor, with confidence and without exaggeration or invented promises.\n\n" +
    "Turning visitors into clients: when real interest in a project appears, gently collect the name + a contact method (email or WhatsApp number), then encourage them to reach Mohammad directly to close the deal and point them to /en/contact, reassuring them that Mohammad will reply personally and agree the details. Make contacting feel easy and worth it.\n\n" +
    "Product support: for MoPlayer, activation, and support questions, help accurately and point to the right route, asking for the needed details (device type, version number, exact error) when relevant.\n\n" +
    "MoPlayer product facts (follow precisely, never guess): MoPlayer is a family of streaming media players (IPTV/Xtream/M3U). MoPlayer Pro and MoPlayer Classic are BOTH Android & Android TV apps (phone + TV) — NOT for iPhone or Windows. MoPlayer Pro is the newer TV-first line with QR-code activation and Live IPTV controls, internal slug moplayer2, page /en/apps/moplayer2. MoPlayer Classic is the stable classic Android/Android TV release. MoPlayer PC is a Windows desktop app. MoPlayer iOS is an iPhone app. Never assign a platform to a product that isn't its platform. If unsure about an exact version difference, ask which device the visitor uses and point them to /en/apps instead of inventing details.\n\n" +
    "Fixed facts and limits: use only the moalfarras.space domain, never mohammadalfarras.com. Routes: MoPlayer Pro /en/apps/moplayer2, activation /en/activate?product=moplayer2, support /en/support, contact /en/contact. Do not state any price or promise not visible on the site, and do not say MoPlayer Pro is paid, free, or trial-less unless visible. For update questions, point to the app page and ask for the installed version. For any custom work, always route to the contact page.",
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

  const isUpdateQuestion =
    last.includes("update") ||
    last.includes("latest") ||
    last.includes("version") ||
    last.includes("old") ||
    last.includes("download") ||
    last.includes("تحديث") ||
    last.includes("أحدث") ||
    last.includes("نسخة") ||
    last.includes("قديم");

  if ((last.includes("moplayer") || last.includes("برو")) && isUpdateQuestion) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "نعم، إذا كانت النسخة المثبتة قديمة فافتح صفحة التطبيق الرسمية وحمل أحدث إصدار من زر التحميل. MoPlayer Pro صفحته: https://moalfarras.space/ar/apps/moplayer2 ويستخدم داخليا product=moplayer2 في روابط التحديث. أرسل رقم النسخة المثبتة ونوع الجهاز إذا لم يظهر التحديث."
        : "Yes. If your installed version is old, open the official app page and use the download button for the latest release. MoPlayer Pro is at https://moalfarras.space/en/apps/moplayer2 and uses product=moplayer2 internally for update APIs. Send your installed version and device type if the update does not appear.",
    };
  }

  if (last.includes("moplayer2") || last.includes("moplayer") || last.includes("pro") || last.includes("برو")) {
    return {
      fallback: true,
      provider: "local",
      reply: isAr
        ? "MoPlayer Pro يستخدم slug ثابت اسمه moplayer2 في الروابط والـ API. إذا كانت نسختك قديمة افتح https://moalfarras.space/ar/apps/moplayer2 وحمل أحدث إصدار من زر التحميل. للتفعيل استخدم /activate?product=moplayer2 مع كود الجهاز. إذا ظهر خطأ أرسل نوع الجهاز ورقم النسخة ونص الخطأ."
        : "MoPlayer Pro keeps the internal slug moplayer2 for URLs and APIs. If your installed version is old, open https://moalfarras.space/en/apps/moplayer2 and use the download button for the latest release. Activation uses /activate?product=moplayer2 with the device code. If an error appears, send the device type, app version, and exact error text.",
    };
  }

  if (last.includes("تفعيل") || last.includes("activate") || last.includes("code") || last.includes("الكود")) {
    return {
      fallback: true,
      provider: "local",
      reply: isAr
        ? "للتفعيل افتح صفحة التفعيل، أدخل كود الجهاز، ثم أرسل بيانات المصدر من الموقع. إذا كان المنتج Pro تأكد أن الرابط يحتوي product=moplayer2. أرسل لي كود الجهاز أو وصف الخطأ حتى أوجهك للخطوة الصحيحة."
        : "To activate, open the activation page, enter the device code, then send the source details from the website. For Pro, make sure the URL includes product=moplayer2. Send the device code or error text so I can guide the next step.",
    };
  }

  if (
    last.includes("iptv") ||
    last.includes("website") ||
    last.includes("site") ||
    last.includes("project") ||
    last.includes("موقع") ||
    last.includes("مشروع") ||
    last.includes("تطبيق")
  ) {
    return {
      fallback: true,
      provider: "local",
      reply: isAr
        ? "أكيد. لنبدأ بذكاء: أحتاج منك 4 أشياء حتى أرتب الطلب وأرسله للدعم بشكل واضح: نوع المشروع، الجمهور المستهدف، أهم 3 ميزات تريدها، والبريد أو واتساب للتواصل. إذا كان المشروع IPTV أو تطبيق بث، اذكر أيضا هل تحتاج صفحة تحميل، تفعيل أكواد، لوحة أدمن، أو مساعد داخل التطبيق."
        : "Absolutely. To shape this properly, I need four details: project type, target users, the top 3 features you want, and an email or WhatsApp contact. If this is an IPTV or streaming app project, also mention whether you need a download page, activation codes, admin dashboard, or in-app assistant.",
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
  const asksProject =
    last.includes("iptv") ||
    last.includes("website") ||
    last.includes("site") ||
    last.includes("project") ||
    last.includes("موقع") ||
    last.includes("مشروع") ||
    last.includes("تطبيق");
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
  const asksPro = last.includes("moplayer") || last.includes("moplayer2") || last.includes("pro") || last.includes("برو");
  const asksUpdate =
    last.includes("update") ||
    last.includes("latest") ||
    last.includes("version") ||
    last.includes("old") ||
    last.includes("download") ||
    last.includes("تحديث") ||
    last.includes("أحدث") ||
    last.includes("نسخة") ||
    last.includes("قديم");
  const asksProblem =
    last.includes("error") ||
    last.includes("issue") ||
    last.includes("problem") ||
    last.includes("خطأ") ||
    last.includes("مشكلة") ||
    last.includes("تشغيل");

  if (asksProject && !asksPro) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "أكيد. لبناء مساعد ذكي لموقع أو تطبيق IPTV، أول خطوة هي جمع البيانات التي يحتاجها الدعم: نوع المشروع، الجمهور المستهدف، أهم 3 ميزات، البريد أو واتساب، وهل تحتاج صفحة تحميل أو تفعيل أكواد أو لوحة أدمن. أرسل هذه التفاصيل وسأرتبها لك كطلب واضح."
        : "Absolutely. For an IPTV website or app assistant, the first step is collecting the support-ready details: project type, target audience, top 3 features, email or WhatsApp, and whether you need a download page, activation codes, or admin dashboard. Send those details and I will structure the request clearly.",
    };
  }

  if (asksPro && asksUpdate) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "نعم، إذا كانت النسخة المثبتة قديمة فافتح صفحة MoPlayer Pro الرسمية: https://moalfarras.space/ar/apps/moplayer2 ثم حمل أحدث إصدار من زر التحميل. التطبيق يعتمد داخليا على product=moplayer2 في روابط التحديث والـ API. أرسل لي رقم النسخة المثبتة عندك ونوع الجهاز إذا لم يظهر التحديث."
        : "Yes. If your installed version is old, open the official MoPlayer Pro page at https://moalfarras.space/en/apps/moplayer2 and use the download button for the latest release. The app update APIs use product=moplayer2 internally. Send me your installed version number and device type if the update does not appear.",
    };
  }

  if (asksPro && asksProblem) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "لمشكلة في MoPlayer Pro افتح صفحة الدعم https://moalfarras.space/ar/support واكتب: نوع الجهاز، رقم النسخة، نص الخطأ، وهل المشكلة في التفعيل أم تشغيل القنوات. إذا كان عندك كود جهاز أرسله أيضا حتى نراجع الطلب بسرعة."
        : "For a MoPlayer Pro issue, open https://moalfarras.space/en/support and include the device type, app version, exact error text, and whether the issue is activation or playback. If you have a device code, include it so support can review it faster.",
    };
  }

  if (asksActivation && asksPro) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "لتفعيل MoPlayer Pro افتح https://moalfarras.space/ar/activate?product=moplayer2 أو https://moalfarras.space/en/activate?product=moplayer2، أدخل كود الجهاز، ثم أرسل بيانات المصدر من صفحة التفعيل. مهم: المنتج يبقى داخليا باسم moplayer2 في الروابط والـ API. إذا ظهر خطأ، أرسل نص الخطأ وكود الجهاز."
        : "To activate MoPlayer Pro, open https://moalfarras.space/en/activate?product=moplayer2 or https://moalfarras.space/ar/activate?product=moplayer2, enter the device code, then send the source details from the activation page. Important: the internal product slug stays moplayer2 in URLs and APIs. If you see an error, send the error text and device code.",
    };
  }

  if (last.includes("support") || last.includes("دعم") || last.includes("مساعدة")) {
    return {
      fallback: false,
      provider: "local",
      reply: isAr
        ? "صفحة الدعم هي https://moalfarras.space/ar/support ويمكنك أيضا استخدام https://moalfarras.space/ar/contact للتواصل المباشر. اكتب اسم التطبيق ونوع الجهاز ونص الخطأ حتى نحل المشكلة أسرع."
        : "The support page is https://moalfarras.space/en/support. You can also use https://moalfarras.space/en/contact for direct contact. Include the app name, device type, and exact error text so we can solve it faster.",
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
      // Reasoning tokens count against this budget too; keep headroom so the
      // visible answer is never truncated mid-sentence.
      max_output_tokens: 1200,
      reasoning: { effort: "low" },
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
        // Flash "thinking" otherwise eats the output budget and truncates the
        // reply mid-sentence; disable it and give the answer room to finish.
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 1024,
        temperature: 0.6,
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

function anthropicBaseUrl() {
  return (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");
}

async function callAnthropic(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult | null> {
  const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
  const res = await fetch(`${anthropicBaseUrl()}/v1/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      system: siteContext[locale],
      max_tokens: 900,
      temperature: 0.6,
      messages: messages
        .filter((message) => message.role !== "system")
        .map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content })),
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { content?: Array<{ text?: string; type?: string }> };
  const reply = data.content?.map((part) => part.text ?? "").join("").trim();
  return reply ? { fallback: false, model, provider: "anthropic", reply } : null;
}

/**
 * Generic OpenAI-compatible provider (e.g. a self-hosted gateway). Configured via
 * CUSTOM_AI_BASE_URL + CUSTOM_AI_API_KEY (+ CUSTOM_AI_MODEL). Used as a resilient
 * backup so the assistant keeps answering if the primary providers are down.
 */
async function callOpenAICompatible(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult | null> {
  const apiKey = process.env.CUSTOM_AI_API_KEY;
  const baseUrl = (process.env.CUSTOM_AI_BASE_URL || "").replace(/\/+$/, "");
  if (!apiKey || !baseUrl) return null;

  const model = process.env.CUSTOM_AI_MODEL || "gpt-5.4-mini";
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: siteContext[locale] },
        ...messages
          .filter((message) => message.role !== "system")
          .map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content })),
      ],
      max_tokens: 900,
      temperature: 0.6,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const reply = data.choices?.[0]?.message?.content?.trim();
  return reply ? { fallback: false, model, provider: "custom", reply } : null;
}

export async function answerSiteAssistant(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult> {
  // The LLM drives the conversation so it can actually converse, qualify the
  // visitor, and sell. The grounded/local canned replies are kept ONLY as an
  // offline fallback for when every provider is unreachable (see end of fn).
  const preferred = (process.env.AI_ASSISTANT_PROVIDER || "").toLowerCase();
  const base =
    preferred === "openai"
      ? [callOpenAI, callGemini, callAnthropic]
      : preferred === "gemini"
        ? [callGemini, callOpenAI, callAnthropic]
        : preferred === "anthropic" || preferred === "claude"
          ? [callAnthropic, callOpenAI, callGemini]
          : preferred === "custom" || preferred === "synterolink"
            ? [callOpenAICompatible, callOpenAI, callGemini, callAnthropic]
            : [callOpenAI, callGemini, callAnthropic];

  // Always keep the OpenAI-compatible custom backup in the chain (last), unless it
  // was explicitly promoted to first via AI_ASSISTANT_PROVIDER=custom. Every key is
  // kept; a failing/absent provider simply falls through to the next one.
  const providers = base.includes(callOpenAICompatible) ? base : [...base, callOpenAICompatible];

  for (const provider of providers) {
    try {
      const result = await provider(messages, locale);
      if (result) return result;
    } catch {
      // Fall through to the next provider or local response.
    }
  }

  // Every LLM provider was unreachable: serve an accurate grounded answer when
  // we have one, otherwise a friendly conversational fallback.
  return groundedReply(messages, locale) ?? localReply(messages, locale);
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

/** Extracts a contact from free text: email and/or a WhatsApp/phone number. */
function extractContact(text: string): { email?: string; phone?: string } {
  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];
  // International-style number (optional + / 00) or a plain run of digits.
  const phoneRaw = text.match(/(?:\+|00)\s?\d[\d\s-]{7,}\d|\b\d{9,}\b/)?.[0];
  const phone = phoneRaw && phoneRaw.replace(/\D/g, "").length >= 8 ? phoneRaw.replace(/[^\d+]/g, "") : undefined;
  return { email, phone };
}

function assistantLeadScore(message: string) {
  const lower = message.toLowerCase();
  const { email, phone } = extractContact(message);
  let score = 10;
  if (email || phone) score += 25;
  if (/(project|website|web app|landing|dashboard|store|platform|\bapp\b|build|hire|develop|موقع|مشروع|تطبيق|متجر|منصة|صفحة|تصميم)/.test(lower)) score += 20;
  if (/(price|cost|quote|budget|deal|تكلفة|سعر|عرض سعر|ميزانية|اتفاق|نتفق|نتفاهم)/.test(lower)) score += 20;
  if (/(contact|whatsapp|واتساب|تواصل|اتصل|رقمي|ايميلي|بريدي)/.test(lower)) score += 15;
  if (/(urgent|asap|ضروري|بسرعة|مستعجل)/.test(lower)) score += 10;
  return Math.min(100, score);
}

/**
 * Emails the owner once per conversation when a visitor looks like a real lead
 * (clear need + contact email). Best-effort, runs post-response via after().
 */
export async function maybeNotifyOwnerOfLead(input: {
  conversationId: string;
  locale: AssistantLocale;
  messages: AssistantMessage[];
  pagePath?: string;
}): Promise<void> {
  try {
    if (!hasSupabasePublicEnv()) return;
    const userText = input.messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
    const score = assistantLeadScore(userText);
    const { email, phone } = extractContact(userText);
    const contact = email || phone;
    if (score < 40 || !contact) return; // only strong leads that left a way to reach them
    const to = ownerInbox();
    if (!to) return;

    const supabase = createSupabaseAdminClient();
    const flagKey = `lead_notified:${input.conversationId}`;
    const existing = await supabase.from("app_settings").select("key").eq("key", flagKey).maybeSingle();
    if (existing.data) return; // already notified for this conversation

    const intent = assistantIntent(userText);
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const rows: Array<[string, string]> = [
      ...(email ? [["البريد", email] as [string, string]] : []),
      ...(phone ? [["واتساب / هاتف", phone] as [string, string]] : []),
      ["الاهتمام", intent],
      ["درجة الأهمية", `${score}/100`],
      ["الصفحة", input.pagePath || "/"],
      ["اللغة", input.locale],
    ];
    const sent = await sendTransactionalMail({
      to,
      replyTo: email,
      subject: `عميل محتمل من موقع moalfarras.space (${intent})`,
      text: `عميل محتمل\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nالرسالة: ${lastUser.slice(0, 600)}`,
      html: cinematicEmailHtml({
        direction: "rtl",
        eyebrow: "عميل محتمل من المساعد الذكي",
        title: "زائر يحتاج خدمة 👋",
        intro: "تحدّث زائر مع المساعد الذكي وترك بريده — قد يكون عميلاً محتملاً تتابعه.",
        rows,
        body: lastUser.slice(0, 600) || "—",
        tone: "success",
      }),
    });
    if (sent) {
      await supabase.from("app_settings").upsert({
        key: flagKey,
        value: { notifiedAt: new Date().toISOString(), email: email ?? null, phone: phone ?? null, intent, score },
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // Lead notification must never break the assistant.
  }
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
  return serverHmac(`${email.trim().toLowerCase()}:${code.trim()}`, "ASSISTANT_OTP_SECRET");
}

export { conversationUuid };
