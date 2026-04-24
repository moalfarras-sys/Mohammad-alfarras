import { NextResponse } from "next/server";

import { contactFieldErrors, contactMessageSchema } from "@/lib/contact-schema";
import { hasDatabaseUrl, queryRows } from "@/lib/server-db";

const copy = {
  en: {
    subject: "Website inquiry",
    configured: "Contact is not configured. Set Resend email env vars or a database URL.",
    delivery: "Email delivery failed.",
    invalid: "Please check the highlighted fields.",
  },
  ar: {
    subject: "طلب تواصل من الموقع",
    configured: "نموذج التواصل غير مضبوط. أضف متغيرات Resend أو رابط قاعدة البيانات.",
    delivery: "تعذر إرسال البريد.",
    invalid: "راجع الحقول المحددة.",
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

  const subject = payload.subject || `${t.subject} — ${payload.name}`;
  const messageForStorage = [
    `[Project type: ${payload.projectType}]`,
    `[Budget range: ${payload.budgetRange}]`,
    `[Timeline: ${payload.timeline}]`,
    `[Consent accepted: yes]`,
    "",
    payload.message,
  ].join("\n");

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  const hasEmail = Boolean(resendKey && from && to);
  const hasDb = hasDatabaseUrl();

  if (!hasEmail && !hasDb) {
    return NextResponse.json({ error: t.configured }, { status: 503 });
  }

  if (resendKey && from && to) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const html = `
      <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      ${payload.whatsapp ? `<p><strong>WhatsApp:</strong> ${escapeHtml(payload.whatsapp)}</p>` : ""}
      <p><strong>Project type:</strong> ${escapeHtml(payload.projectType)}</p>
      <p><strong>Budget range:</strong> ${escapeHtml(payload.budgetRange)}</p>
      <p><strong>Timeline:</strong> ${escapeHtml(payload.timeline)}</p>
      <p><strong>Consent:</strong> accepted</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(payload.message).replace(/\n/g, "<br/>")}</p>
    `;

    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: payload.email,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: t.delivery }, { status: 502 });
    }
  }

  if (hasDb) {
    try {
      await queryRows(
        `insert into contact_messages
          (name, email, phone, subject, message, budget, locale, project_types)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
        [
          payload.name,
          payload.email,
          payload.whatsapp || null,
          subject,
          messageForStorage,
          payload.budgetRange,
          payload.locale,
          JSON.stringify([payload.projectType, payload.timeline, "consent-accepted"]),
        ],
      );
    } catch {
      if (!hasEmail) {
        return NextResponse.json({ error: "Database write failed." }, { status: 502 });
      }
    }
  }

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
