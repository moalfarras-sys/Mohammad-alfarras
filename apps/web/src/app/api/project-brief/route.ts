import { NextResponse } from "next/server";

import { cinematicEmailHtml } from "@/lib/email-template";
import { isSmtpConfigured, ownerInbox, sendMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/request-guard";

type Answers = {
  locale?: string;
  projectType?: string;
  goal?: string;
  goalTags?: string[];
  audience?: string;
  features?: string[];
  featuresOther?: string;
  style?: string[];
  colors?: string;
  reference?: string;
  hasReady?: string[];
  oldSite?: string;
  name?: string;
  contact?: string;
  budget?: string;
  timeline?: string;
  notes?: string;
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  website: { ar: "موقع إلكتروني", en: "Website" },
  "company-system": { ar: "نظام / منصّة لشركة", en: "Company system / platform" },
  "android-app": { ar: "تطبيق أندرويد", en: "Android app" },
  "pc-app": { ar: "تطبيق كمبيوتر", en: "Desktop app" },
  "not-sure": { ar: "غير متأكد — يحتاج استشارة", en: "Not sure — needs advice" },
};

function s(value: unknown, max = 1500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function arr(value: unknown, max = 30) {
  return Array.isArray(value) ? value.filter((x) => typeof x === "string").map((x) => String(x).slice(0, 100)).slice(0, max) : [];
}

export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "project-brief", limit: 6, windowSeconds: 10 * 60 });
  if (limited) return limited;

  let body: Answers;
  try {
    body = (await request.json()) as Answers;
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const locale = body.locale === "ar" ? "ar" : "en";
  const isAr = locale === "ar";
  const name = s(body.name, 120);
  const contact = s(body.contact, 160);
  const goal = s(body.goal, 2000);
  const features = [...arr(body.features), s(body.featuresOther, 500)].filter(Boolean);

  if (!name || !contact || (!goal && features.length === 0)) {
    return NextResponse.json(
      { error: isAr ? "أكمل اسمك ووسيلة التواصل وفكرة المشروع." : "Please add your name, contact, and project idea." },
      { status: 400 },
    );
  }

  const typeKey = s(body.projectType, 40);
  const typeLabel = typeLabels[typeKey] ? typeLabels[typeKey][locale] : isAr ? "غير محدّد" : "Unspecified";
  const email = contact.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];

  const rows: Array<[string, string]> = [
    [isAr ? "نوع المشروع" : "Project type", typeLabel],
    ...(body.goalTags && arr(body.goalTags).length ? [[isAr ? "الهدف" : "Goal", arr(body.goalTags).join(isAr ? "، " : ", ")] as [string, string]] : []),
    [isAr ? "الجمهور المستهدف" : "Audience", s(body.audience, 400) || "—"],
    [isAr ? "الميزات المطلوبة" : "Wanted features", features.join(isAr ? "، " : ", ") || "—"],
    [isAr ? "الستايل" : "Style", arr(body.style).join(isAr ? "، " : ", ") || "—"],
    [isAr ? "الألوان المفضّلة" : "Preferred colors", s(body.colors, 200) || "—"],
    [isAr ? "مرجع / إلهام" : "Reference", s(body.reference, 300) || "—"],
    [isAr ? "جاهز عند العميل" : "Client has ready", arr(body.hasReady).join(isAr ? "، " : ", ") || "—"],
    [isAr ? "موقع قديم" : "Old site", s(body.oldSite, 300) || "—"],
    [isAr ? "الميزانية" : "Budget", s(body.budget, 120) || "—"],
    [isAr ? "الوقت المطلوب" : "Timeline", s(body.timeline, 120) || "—"],
    [isAr ? "الاسم" : "Name", name],
    [isAr ? "وسيلة التواصل" : "Contact", contact],
  ];

  const to = process.env.CONTACT_TO_EMAIL ?? ownerInbox();
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;
  const hasResend = Boolean(resendKey && resendFrom && to);
  const hasSmtp = isSmtpConfigured() && Boolean(to);
  if (!hasResend && !hasSmtp) {
    return NextResponse.json({ error: isAr ? "الإرسال غير مضبوط حالياً." : "Email delivery is not configured." }, { status: 503 });
  }

  const subject = `${isAr ? "طلب تصميم جديد" : "New project brief"} — ${typeLabel} — ${name}`;
  const bodyText = goal || (isAr ? "(لم يكتب وصفاً)" : "(no description)");
  const html = cinematicEmailHtml({
    direction: isAr ? "rtl" : "ltr",
    eyebrow: isAr ? "طلب تصميم مرتّب من معالج المشروع" : "Structured project brief",
    title: isAr ? "طلب جديد لتصميم مشروع 🚀" : "New project design request 🚀",
    intro: isAr ? `${name} يريد ${typeLabel}` : `${name} wants a ${typeLabel}`,
    rows,
    body: [bodyText, s(body.notes, 1500) ? `\n\n${isAr ? "ملاحظات" : "Notes"}: ${s(body.notes, 1500)}` : ""].join(""),
    tone: "success",
  });
  const text = `${name} <${contact}>\n${typeLabel}\n\n${bodyText}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`;

  let delivered = false;
  if (hasSmtp && to) {
    delivered = await sendMail({ to, subject, replyTo: email, text, html });
  }
  if (!delivered && hasResend && resendKey && resendFrom && to) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({ from: resendFrom, to: [to], replyTo: email, subject, html });
      if (!error) delivered = true;
    } catch {
      delivered = false;
    }
  }

  // Best-effort confirmation to the client when they left an email.
  if (delivered && email && (hasSmtp || hasResend)) {
    const receiptSubject = isAr ? "استلمنا طلب مشروعك" : "We received your project request";
    const receiptHtml = cinematicEmailHtml({
      direction: isAr ? "rtl" : "ltr",
      eyebrow: isAr ? "تأكيد الاستلام" : "Request received",
      title: receiptSubject,
      intro: isAr ? `${name}، وصلنا طلبك وسأراجعه وأرد عليك شخصياً.` : `${name}, your request has arrived and I will review it and reply personally.`,
      rows: [[isAr ? "نوع المشروع" : "Project type", typeLabel]],
      body: isAr ? "شكراً لثقتك. سأتواصل معك قريباً لنتفق على التفاصيل." : "Thank you. I'll be in touch shortly to align on the details.",
      tone: "info",
    });
    try {
      if (hasSmtp) await sendMail({ to: email, subject: receiptSubject, text: receiptSubject, html: receiptHtml });
    } catch {
      // receipt is best-effort
    }
  }

  if (!delivered) {
    return NextResponse.json({ error: isAr ? "تعذّر الإرسال، حاول مجدداً أو راسلنا مباشرة." : "Delivery failed, please try again or email directly." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, delivered: true });
}
