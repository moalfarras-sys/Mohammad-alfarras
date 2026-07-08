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
  provider: "gemini" | "openai" | "custom" | "local";
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
    "اللغة: ردّ دائمًا بنفس لغة الزائر — عربي أو إنجليزي أو ألماني. اكتشف لغته من رسالته وطابِقها. استخدم كلمات بسيطة وواضحة وسهلة الفهم للجميع. إذا كتب بالألمانية فردّ بألماني واضح وبسيط.\n\n" +
    "النبرة: مرحة ولطيفة ومحترفة في آنٍ واحد — اجعل المحادثة ممتعة وجميلة وجذّابة، ويمكنك استخدام إيموجي مناسب باعتدال (مثل ✨ 👋 🚀) لإضافة دفء، بدون مبالغة.\n\n" +
    "الروابط (مهم): كلما وجّهت الزائر إلى صفحة، اكتب الرابط بصيغة ماركداون مع العنوان الكامل https://moalfarras.space ليكون قابلًا للنقر ويأخذه للصفحة مباشرة — مثل: [تواصل مع محمد](https://moalfarras.space/ar/contact) أو [صفحة MoPlayer Pro](https://moalfarras.space/ar/apps/moplayer2) أو [صفحة التفعيل](https://moalfarras.space/ar/activate?product=moplayer2). لا تكتب الرابط كنص عادي أبدًا، واجعل نص الرابط وصفيًا وواضحًا.\n\n" +
    "مهم جدًا: لا تقل أبدًا إن رسالة الزائر «غير واضحة» أو اطلب منه إعادتها طالما فيها طلب مفهوم. حتى لو كانت مختصرة، افهم المقصود وتفاعل معه فورًا وأعطِ قيمة، ثم اسأل سؤال متابعة واحدًا قصيرًا عند الحاجة فقط. تجنّب الردود العامة على شكل قائمة خيارات؛ ردّ تحديدًا على ما كتبه الزائر.\n\n" +
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
    "Language: ALWAYS reply in the SAME language the visitor writes in — Arabic, English, or German. Detect their language from their message and match it. Use simple, clear, easy words anyone can understand. If they write in German, reply in clear simple German.\n\n" +
    "Tone: cheerful, friendly AND professional at once — make the conversation enjoyable, polished and engaging. You may use a fitting emoji sparingly (e.g. ✨ 👋 🚀) for warmth, without overdoing it.\n\n" +
    "Links (important): whenever you point the visitor to a page, write it as a Markdown link with the full https://moalfarras.space URL so it is clickable and takes them straight there — e.g. [Talk to Mohammad](https://moalfarras.space/en/contact), [MoPlayer Pro page](https://moalfarras.space/en/apps/moplayer2), or [activation page](https://moalfarras.space/en/activate?product=moplayer2). Never write a link as plain text, and make the link text descriptive.\n\n" +
    "Very important: NEVER say the visitor's message is 'unclear' or ask them to rephrase as long as it contains an understandable request. Even if it's short, infer the intent, engage with it immediately and give value, then ask at most one short follow-up only if truly needed. Avoid generic menu-style replies; respond specifically to what the visitor wrote.\n\n" +
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
      // Cap each message so oversized bodies cannot burn LLM tokens/cost.
      const content = "content" in item ? String(item.content ?? "").trim().slice(0, 2000) : "";
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

export type AssistantLang = "ar" | "en" | "de";

/** Detect the language the visitor is writing in (Arabic / German / English). */
export function detectLanguage(text: string): AssistantLang {
  if (/[؀-ۿ]/.test(text)) return "ar";
  if (
    /[äöüßÄÖÜ]/.test(text) ||
    /\b(ich|und|möchte|brauche|nicht|eine?|für|kann|webseite|seite|erstellen|kosten|guten|hallo|danke|bitte|wie|was|mein|sehr|website erstellen)\b/i.test(text)
  ) {
    return "de";
  }
  return "en";
}

// Contextual quick-reply suggestions: change with the conversation topic so the
// chips under the chat stay relevant (and in the visitor's language).
const SUGGESTIONS: Record<string, Record<AssistantLang, string[]>> = {
  web: {
    ar: ["كم يستغرق إنشاء الموقع؟", "هل يكون متجاوبًا مع الجوال؟", "أريد أن أرى أعمال محمد"],
    en: ["How long does a website take?", "Will it be mobile-friendly?", "Show me Mohammad's work"],
    de: ["Wie lange dauert eine Website?", "Ist sie für Handys optimiert?", "Zeig mir Mohammads Arbeiten"],
  },
  store: {
    ar: ["هل يدعم الدفع الإلكتروني؟", "هل فيه لوحة تحكم للمتجر؟", "كم منتجًا يمكن إضافته؟"],
    en: ["Does it support online payments?", "Is there a store dashboard?", "How many products can I add?"],
    de: ["Werden Online-Zahlungen unterstützt?", "Gibt es ein Shop-Dashboard?", "Wie viele Produkte kann ich hinzufügen?"],
  },
  app: {
    ar: ["هل فيه لوحة تحكم أدمن؟", "هل يمكن ربطه بقاعدة بيانات؟", "كم يستغرق التطوير؟"],
    en: ["Is there an admin dashboard?", "Can it connect to a database?", "How long does development take?"],
    de: ["Gibt es ein Admin-Dashboard?", "Kann es an eine Datenbank angebunden werden?", "Wie lange dauert die Entwicklung?"],
  },
  moplayer: {
    ar: ["كيف أفعّل MoPlayer على التلفزيون؟", "من أين أحمّل أحدث إصدار؟", "ما الفرق بين Pro و Classic؟"],
    en: ["How do I activate MoPlayer on TV?", "Where do I download the latest version?", "Pro vs Classic — what's the difference?"],
    de: ["Wie aktiviere ich MoPlayer am TV?", "Wo lade ich die neueste Version herunter?", "Pro oder Classic — der Unterschied?"],
  },
  price: {
    ar: ["ما الذي يحدّد السعر؟", "كيف أحصل على عرض سعر؟", "أريد التواصل مع محمد"],
    en: ["What affects the price?", "How do I get a quote?", "I want to contact Mohammad"],
    de: ["Was beeinflusst den Preis?", "Wie bekomme ich ein Angebot?", "Ich möchte Mohammad kontaktieren"],
  },
  contact: {
    ar: ["كيف أتواصل مع محمد مباشرة؟", "ما هي طرق التواصل؟", "أريد بدء مشروع الآن"],
    en: ["How do I contact Mohammad directly?", "What are the contact options?", "I want to start a project now"],
    de: ["Wie kontaktiere ich Mohammad direkt?", "Welche Kontaktmöglichkeiten gibt es?", "Ich möchte jetzt starten"],
  },
  default: {
    ar: ["أريد موقعًا احترافيًا", "أريد متجرًا إلكترونيًا", "كيف أتواصل مع محمد؟"],
    en: ["I want a professional website", "I want an online store", "How do I contact Mohammad?"],
    de: ["Ich möchte eine professionelle Website", "Ich möchte einen Online-Shop", "Wie kontaktiere ich Mohammad?"],
  },
};

/** Pick contextual follow-up chips from the visitor's recent turns, in the given language. */
export function suggestFollowups(messages: AssistantMessage[], lang: AssistantLang): string[] {
  // Detect the topic from the VISITOR's own words (not the assistant reply, which
  // mentions many things and would skew the topic).
  const recent = messages
    .filter((m) => m.role === "user")
    .slice(-2)
    .map((m) => m.content)
    .join("\n")
    .toLowerCase();
  let topic = "default";
  if (/moplayer|classic|كلاسيك|برو|تفعيل|activ|iptv|m3u|xtream/.test(recent)) topic = "moplayer";
  else if (/store|shop|webshop|ecommerce|e-commerce|متجر|تسوق|بيع|online[- ]?shop/.test(recent)) topic = "store";
  else if (/web ?app|dashboard|admin|نظام|تطبيق|لوحة تحكم|منصة|anwendung|\bsystem\b/.test(recent)) topic = "app";
  else if (/price|cost|quote|budget|سعر|تكلفة|كلفة|قديش|ميزانية|preis|kosten|angebot/.test(recent)) topic = "price";
  else if (/website|web ?site|landing|موقع|صفحة|webseite|homepage|\bseite\b/.test(recent)) topic = "web";
  else if (/contact|تواصل|اتصل|kontakt|whatsapp|واتساب/.test(recent)) topic = "contact";
  return SUGGESTIONS[topic][lang];
}

/** Best-effort name extraction from "my name is X" / "اسمي X". Conservative. */
function extractName(text: string): string | undefined {
  const ar = text.match(/اسمي\s+([^\s,،.\d]{2,20})/);
  const en = text.match(/(?:my name is|i am|i'm)\s+([A-Za-z]{2,20})/i);
  const raw = (ar?.[1] || en?.[1] || "").trim();
  return raw.length >= 2 ? raw : undefined;
}

/**
 * Warm, on-brand offline fallback used only when every LLM provider is
 * unreachable. It still reads intent, sounds like the Mo Ai sales persona, and
 * always steers the visitor toward contacting Mohammad — never a cold checklist.
 */
function localReply(messages: AssistantMessage[], locale: AssistantLocale): ProviderResult {
  const text = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lower = last.toLowerCase();
  const isAr = locale === "ar";
  const { email, phone } = extractContact(text);
  const name = extractName(text);
  const hi = name ? (isAr ? `أهلاً ${name}! ` : `Hi ${name}! `) : isAr ? "أهلاً! " : "Hi! ";
  const cta = isAr
    ? "تقدر تتواصل مع محمد مباشرة من زر «تواصل مباشرة مع محمد» بالأسفل، وهو بيرد عليك شخصيًا."
    : "You can reach Mohammad directly via the “Talk directly to Mohammad” button below — he replies personally.";
  const reply = (body: string): ProviderResult => ({ fallback: true, provider: "local", reply: body });

  // Strong lead: they shared contact details → confirm warmly and route to contact.
  if (email || phone) {
    const got = [email, phone].filter(Boolean).join(" · ");
    return reply(
      isAr
        ? `${hi}تمام، سجّلت تفاصيلك (${got}). أفضل خطوة تالية إنك تتواصل مع محمد مباشرة ليتفق معك على التفاصيل والتنفيذ. ${cta}`
        : `${hi}Great — I’ve noted your details (${got}). The best next step is to contact Mohammad directly so he can align on scope and delivery. ${cta}`,
    );
  }

  // Project / build intent.
  if (/(iptv|website|web app|landing|dashboard|store|platform|\bapp\b|build|develop|design|موقع|مشروع|تطبيق|متجر|منصة|صفحة|تصميم|بناء)/.test(lower)) {
    return reply(
      isAr
        ? `${hi}فكرة حلوة، وهذا بالضبط شغل محمد — يبني مواقع وتطبيقات ويب احترافية وسريعة تجيب نتائج. احكِ لي باختصار: شو هدف المشروع ولمين موجّه؟ وعشان نمشي بسرعة، ${cta}`
        : `${hi}Love it — this is exactly what Mohammad does: fast, professional websites and web apps that get results. Tell me briefly what the goal is and who it’s for, and to move fast, ${cta}`,
    );
  }

  // Pricing.
  if (/(price|cost|quote|budget|سعر|تكلفة|كلفة|قديش|كم سعر|ميزانية)/.test(lower)) {
    return reply(
      isAr
        ? `${hi}السعر بيعتمد على حجم المشروع وما تحتاجه بالضبط، وعشان هيك محمد بيعطيك عرض واضح بعد ما يفهم فكرتك. احكِ لي باختصار شو بدك تبني، و${cta}`
        : `${hi}Pricing depends on the scope and exactly what you need, so Mohammad gives you a clear quote once he understands your idea. Tell me briefly what you want to build, and ${cta}`,
    );
  }

  // Direct contact request.
  if (/(contact|reach|talk|تواصل|اتصل|كيف احكي|كيف اتواصل|رقم محمد|ايميل محمد)/.test(lower)) {
    return reply(
      isAr
        ? `${hi}${cta} اكتب له فكرتك أو سؤالك وهو بيرجعلك بأقرب وقت.`
        : `${hi}${cta} Drop your idea or question and he’ll get back to you shortly.`,
    );
  }

  // Default warm welcome.
  return reply(
    isAr
      ? `${hi}أنا Mo Ai، مساعد محمد الفراس. بقدر أساعدك في مواقع وتطبيقات ويب احترافية، تطبيقات MoPlayer (التفعيل والتحميل والدعم)، أو ترتيب فكرة مشروعك. شو بتحب نبدأ فيه؟`
      : `${hi}I’m Mo Ai, Mohammad Alfarras’ assistant. I can help with professional websites & web apps, the MoPlayer apps (activation, downloads, support), or shaping your project idea. Where would you like to start?`,
  );
}

/**
 * Accurate offline answers for the MoPlayer / activation / support topics. Returns
 * null for everything else so localReply() handles the warm, sales-oriented path.
 * Used only when every LLM provider is unreachable.
 */
function groundedReply(messages: AssistantMessage[], locale: AssistantLocale): ProviderResult | null {
  const last = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  const isAr = locale === "ar";
  const reply = (body: string): ProviderResult => ({ fallback: true, provider: "local", reply: body });

  const asksMoPlayer = /moplayer|moplayer2|classic|كلاسيك|برو/.test(last) || /\bpro\b/.test(last);
  const asksActivation = /activate|activation|\bqr\b|تفعيل|الكود|كود الجهاز|رمز التفعيل/.test(last);
  // App context required for support/update routing so generic sales phrases like
  // "كيف يساعدني محمد" / "I need help with my website" are NOT hijacked into a
  // MoPlayer support answer — those fall through to the warm sales fallback.
  const mentionsApp = asksMoPlayer || /\bapp\b|تطبيق|اندرويد|أندرويد|android|fire ?tv|تلفزيون|الجهاز/.test(last);
  const asksUpdate = /update|latest version|تحديث|أحدث إصدار|تنزيل التطبيق|تحميل التطبيق/.test(last);
  const asksProblem = /\berror\b|crash|not work|won'?t|لا يعمل|ما يشتغل|ما بيشتغل|توقف|تعليق|خطأ|مشكلة/.test(last);

  if (asksActivation && asksMoPlayer) {
    return reply(
      isAr
        ? "لتفعيل MoPlayer Pro (أندرويد/أندرويد تي في): افتح صفحة التطبيق https://moalfarras.space/ar/apps/moplayer2 ثم صفحة التفعيل https://moalfarras.space/ar/activate?product=moplayer2، وأدخل كود الجهاز أو امسح رمز QR الظاهر على شاشة التلفزيون. إذا ظهر خطأ أرسل لي نوع الجهاز ونص الخطأ وأوجّهك خطوة بخطوة."
        : "To activate MoPlayer Pro (Android / Android TV): open the app page https://moalfarras.space/en/apps/moplayer2, then the activation page https://moalfarras.space/en/activate?product=moplayer2, and enter the device code or scan the QR shown on the TV. If you see an error, send me the device type and exact error text and I’ll guide you step by step.",
    );
  }

  if (asksActivation) {
    return reply(
      isAr
        ? "للتفعيل افتح صفحة التفعيل https://moalfarras.space/ar/activate وأدخل كود الجهاز. لو المنتج MoPlayer Pro استخدم الرابط مع product=moplayer2. أرسل لي اسم التطبيق ونوع الجهاز إذا واجهت أي خطأ."
        : "To activate, open https://moalfarras.space/en/activate and enter your device code. For MoPlayer Pro use the link with product=moplayer2. Send me the app name and device type if you hit any error.",
    );
  }

  if (asksMoPlayer) {
    return reply(
      isAr
        ? "MoPlayer Pro و Classic كلاهما تطبيقات أندرويد وأندرويد تي في؛ Pro هو الأحدث الموجّه للتلفزيون مع تفعيل عبر رمز QR وتحكّم Live IPTV، وClassic الإصدار الكلاسيكي المستقر. لأحدث إصدار افتح الصفحة الرسمية https://moalfarras.space/ar/apps/moplayer2 وحمّل من زر التحميل. لو في مشكلة، أرسل نوع الجهاز ورقم النسخة ونص الخطأ، أو افتح صفحة الدعم https://moalfarras.space/ar/support."
        : "MoPlayer Pro and Classic are both Android & Android TV apps; Pro is the newer TV-first build with QR-code activation and Live IPTV controls, and Classic is the stable classic release. For the latest version open the official page https://moalfarras.space/en/apps/moplayer2 and use the download button. If something’s wrong, send the device type, version number and error text, or open support https://moalfarras.space/en/support.",
    );
  }

  if ((asksProblem || asksUpdate) && mentionsApp) {
    return reply(
      isAr
        ? "صفحة الدعم: https://moalfarras.space/ar/support — اكتب اسم التطبيق ونوع الجهاز ونص المشكلة وأساعدك بأسرع طريقة. وللطلبات أو الاتفاق المباشر تقدر تتواصل مع محمد من زر «تواصل مباشرة مع محمد» بالأسفل."
        : "Support page: https://moalfarras.space/en/support — share the app name, device type and the issue and I’ll help the fastest way. For requests or to agree directly, reach Mohammad via the “Talk directly to Mohammad” button below.",
    );
  }

  return null;
}

/**
 * fetch() that retries transient failures (rate limits / gateway errors) with a
 * short backoff. Permanent errors (400/401/403/404) are returned immediately so
 * we don't waste time, and the caller falls through to the next provider.
 */
async function fetchWithRetry(url: string, init: RequestInit, retries = 2, backoffMs = 450): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || ![429, 500, 502, 503, 504].includes(res.status) || attempt === retries) return res;
    } catch {
      if (attempt === retries) return null;
    }
    await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
  }
  return null;
}

async function callOpenAI(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  // `reasoning` and `text.verbosity` are GPT-5 / o-series only. Sending them to a
  // non-reasoning model (e.g. gpt-4.1-mini) returns HTTP 400 and silently kills
  // the whole assistant, so gate them by model family.
  const isReasoningModel = /^(gpt-5|o\d)/i.test(model);
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
      ...(isReasoningModel ? { reasoning: { effort: "low" }, text: { verbosity: "low" } } : {}),
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

  const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
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

  if (!res || !res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  return reply ? { fallback: false, model, provider: "gemini", reply } : null;
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
  // This gateway is currently the most reliable provider but it throws transient
  // 429/502s under load, so retry before giving up.
  const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
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

  if (!res || !res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const reply = data.choices?.[0]?.message?.content?.trim();
  return reply ? { fallback: false, model, provider: "custom", reply } : null;
}

export async function answerSiteAssistant(messages: AssistantMessage[], locale: AssistantLocale): Promise<ProviderResult> {
  // The LLM drives the conversation so it can actually converse, qualify the
  // visitor, and sell. The grounded/local canned replies are kept ONLY as an
  // offline fallback for when every provider is unreachable (see end of fn).
  // Fixed quality order, Gemini-first: Gemini is the verified working,
  // high-quality provider (free tier, resets daily); the synterolink gateway is
  // the functional backup; OpenAI stays in the chain and auto-activates the
  // moment its billing is restored. (Anthropic was removed — its key was
  // genuinely invalid.) We intentionally do NOT read AI_ASSISTANT_PROVIDER here:
  // the production value points at the out-of-quota OpenAI account, which would
  // otherwise starve every request with a doomed 429 first. A failing/absent
  // provider falls through to the next, then to the canned reply.
  const providers = [callGemini, callOpenAICompatible, callOpenAI];

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
