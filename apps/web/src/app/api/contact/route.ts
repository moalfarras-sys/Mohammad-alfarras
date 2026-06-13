import { NextResponse } from "next/server";

import { contactFieldErrors, contactMessageSchema } from "@/lib/contact-schema";
import { cinematicEmailHtml } from "@/lib/email-template";
import { isSmtpConfigured, ownerInbox, sendMail, sendTransactionalMail } from "@/lib/mailer";
import { hasDatabaseUrl, queryRows } from "@/lib/server-db";
import { createSupabaseAdminClient, getSupabaseEnv } from "@/lib/supabase/client";

const copy = {
  en: {
    subject: "Website inquiry",
    configured: "Contact is not configured. Set SMTP / Resend env vars or a database URL.",
    delivery: "Email delivery failed.",
    invalid: "Please check the highlighted fields.",
    receiptSubject: "We received your request",
    receiptIntro: "Your request has been received. I will review it and reply to this email.",
    receiptStatus: "Current status: new",
  },
  ar: {
    subject: "طلب تواصل من الموقع",
    configured: "نموذج التواصل غير مضبوط. أضف متغيرات SMTP / Resend أو رابط قاعدة البيانات.",
    delivery: "تعذر إرسال البريد.",
    invalid: "راجع الحقول المحددة.",
    receiptSubject: "تم استلام طلبك",
    receiptIntro: "تم استلام طلبك. سأراجعه وأرد على هذا البريد الإلكتروني.",
    receiptStatus: "الحالة الحالية: جديد",
  },
} as const;

export async function POST(request: Request) {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactMessageSchema.safeParse(raw);
  const locale = typeof raw === "object" && raw && (raw as Record<string, unknown>).locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: t.invalid,
        fieldErrors: contactFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (payload.honeypot) {
    return NextResponse.json({ success: true, ignored: true, timestamp: new Date().toISOString() });
  }

  const requestId = crypto.randomUUID();
  const subject = payload.subject || `${t.subject} - ${payload.name}`;
  const messageForStorage = [
    `[Project type: ${payload.projectType}]`,
    `[Budget range: ${payload.budgetRange}]`,
    `[Timeline: ${payload.timeline}]`,
    `[Consent accepted: yes]`,
    "",
    payload.message,
  ].join("\n");

  const html = cinematicEmailHtml({
    direction: locale === "ar" ? "rtl" : "ltr",
    eyebrow: locale === "ar" ? "طلب جديد من الموقع" : "New website inquiry",
    title: t.subject,
    intro: `${payload.name} <${payload.email}>`,
    rows: [
      ["Request", requestId],
      ["WhatsApp", payload.whatsapp || "-"],
      ["Project type", payload.projectType],
      ["Budget", payload.budgetRange],
      ["Timeline", payload.timeline],
    ],
    body: payload.message,
    tone: "info",
  });
  const text = `${payload.name} <${payload.email}>\n${payload.whatsapp ? `WhatsApp: ${payload.whatsapp}\n` : ""}Project: ${payload.projectType} / ${payload.budgetRange} / ${payload.timeline}\n\n${payload.message}`;
  const receiptHtml = cinematicEmailHtml({
    direction: locale === "ar" ? "rtl" : "ltr",
    eyebrow: locale === "ar" ? "تأكيد الاستلام" : "Request received",
    title: t.receiptSubject,
    intro: t.receiptIntro,
    rows: [
      ["Request", requestId],
      [locale === "ar" ? "الحالة" : "Status", locale === "ar" ? "جديد" : "New"],
    ],
    body: locale === "ar" ? `${payload.name}، سنراجع رسالتك ونرد على هذا البريد.` : `${payload.name}, we will review your message and reply to this email.`,
    tone: "success",
  });
  const receiptText = `${t.receiptSubject}\n\n${t.receiptIntro}\nRequest: ${requestId}\n${t.receiptStatus}`;

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL ?? ownerInbox();
  const hasResend = Boolean(resendKey && resendFrom && to);
  const hasSmtp = isSmtpConfigured() && Boolean(to);
  const hasDb = hasDatabaseUrl();
  const hasSupabase = Boolean(getSupabaseEnv().url && getSupabaseEnv().service);

  if (!hasResend && !hasSmtp && !hasDb && !hasSupabase) {
    return NextResponse.json({ error: t.configured }, { status: 503 });
  }

  let delivered = false;
  let customerReceipt = false;

  if (hasSmtp && to) {
    delivered = await sendMail({ to, subject, replyTo: payload.email, text, html });
  }

  if (!delivered && hasResend && resendKey && resendFrom && to) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({ from: resendFrom, to: [to], replyTo: payload.email, subject, html });
    if (!error) delivered = true;
  }

  const projectTypes = [payload.projectType, payload.timeline, "consent-accepted"];
  let stored = false;
  if (hasDb) {
    try {
      await queryRows(
        `insert into contact_messages
          (id, name, email, phone, whatsapp, subject, message, budget, locale, project_types, project_type, timeline, consent_accepted, source)
         values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, true, 'website')`,
        [
          requestId,
          payload.name,
          payload.email,
          payload.whatsapp || null,
          payload.whatsapp || null,
          subject,
          messageForStorage,
          payload.budgetRange,
          payload.locale,
          JSON.stringify(projectTypes),
          payload.projectType,
          payload.timeline,
        ],
      );
      stored = true;
    } catch {
      stored = false;
    }
  }

  if (!stored && hasSupabase) {
    try {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("contact_messages").insert({
        id: requestId,
        name: payload.name,
        email: payload.email,
        phone: payload.whatsapp || null,
        whatsapp: payload.whatsapp || null,
        subject,
        message: messageForStorage,
        budget: payload.budgetRange,
        locale: payload.locale,
        project_types: projectTypes,
        project_type: payload.projectType,
        timeline: payload.timeline,
        consent_accepted: true,
        source: "website",
      });
      stored = !error;
    } catch {
      stored = false;
    }
  }

  if (!delivered && !stored) {
    return NextResponse.json({ error: t.delivery }, { status: 502 });
  }

  if (delivered || stored) {
    customerReceipt = await sendTransactionalMail({
      to: payload.email,
      subject: t.receiptSubject,
      text: receiptText,
      html: receiptHtml,
      replyTo: to ?? undefined,
    });
  }

  return NextResponse.json({ success: true, requestId, delivered, stored, customerReceipt, timestamp: new Date().toISOString() });
}
