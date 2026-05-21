import { NextResponse } from "next/server";
import { z } from "zod";

import { saveSupportRequest } from "@/lib/app-ecosystem";
import { isSmtpConfigured, ownerInbox, sendMail, sendTransactionalMail } from "@/lib/mailer";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

const supportSchema = z.object({
  product_slug: z.string().trim().min(1).default("moplayer"),
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(160),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(["ar", "en"]).default("en"),
  website: z.string().trim().max(0).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = supportSchema.parse({
      product_slug: String(formData.get("product_slug") ?? "moplayer"),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      locale: String(formData.get("locale") ?? "en"),
      website: String(formData.get("website") ?? ""),
    });

    if (payload.website) {
      return NextResponse.redirect(new URL(`/${payload.locale}/support?support=sent`, request.url), { status: 303 });
    }

    const productSlug = resolveManagedAppSlug(payload.product_slug);
    const requestId = await saveSupportRequest({ ...payload, product_slug: productSlug });

    const to = ownerInbox();
    if (isSmtpConfigured() && to) {
      await sendMail({
        to,
        subject: `New ${productSlug} support request — ${payload.name}`,
        replyTo: payload.email,
        text: `${payload.name} <${payload.email}>\nProduct: ${productSlug}\nRequest: ${requestId}\n\n${payload.message}`,
      html: supportEmailHtml({
        direction: payload.locale === "ar" ? "rtl" : "ltr",
        accent: productSlug === "moplayer2" ? "#f5c66b" : "#22d3ee",
        eyebrow: "App support request",
        title: `${productSlug} support`,
        intro: `${payload.name} <${payload.email}>`,
        requestId,
        productSlug,
        body: payload.message,
      }),
      });
    }

    await sendTransactionalMail({
      to: payload.email,
      replyTo: to ?? undefined,
      subject: payload.locale === "ar" ? "تم استلام طلب الدعم" : "We received your support request",
      text:
        payload.locale === "ar"
          ? `تم استلام طلب دعم ${productSlug}.\nرقم الطلب: ${requestId}\nالحالة: جديد`
          : `We received your ${productSlug} support request.\nRequest: ${requestId}\nStatus: new`,
      html: supportEmailHtml({
        direction: payload.locale === "ar" ? "rtl" : "ltr",
        accent: productSlug === "moplayer2" ? "#f5c66b" : "#22d3ee",
        eyebrow: payload.locale === "ar" ? "تأكيد استلام الدعم" : "Support request received",
        title: payload.locale === "ar" ? "تم استلام طلب الدعم" : "We received your support request",
        intro: payload.locale === "ar" ? "طلبك ظاهر الآن في لوحة الإدارة وسيتم الرد على هذا البريد." : "Your request is now visible in the admin panel and we will reply to this email.",
        requestId,
        productSlug,
        body: payload.message,
      }),
    });

    return NextResponse.redirect(new URL(`/${payload.locale}/support?support=sent`, request.url), { status: 303 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid support request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function supportEmailHtml({
  direction,
  accent,
  eyebrow,
  title,
  intro,
  requestId,
  productSlug,
  body,
}: {
  direction: "rtl" | "ltr";
  accent: string;
  eyebrow: string;
  title: string;
  intro: string;
  requestId: string;
  productSlug: string;
  body: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;direction:${direction}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:collapse">
      <tr>
        <td style="border:1px solid #cbd5e1;border-radius:28px;overflow:hidden;background:#ffffff;box-shadow:0 18px 50px rgba(15,23,42,.14)">
          <div style="padding:28px;background:linear-gradient(135deg,#ecfeff,#eef2ff 62%,#ffffff)">
            <p style="margin:0 0 12px;color:${accent};font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
            <h1 style="margin:0;color:#0f172a;font-size:30px;line-height:1.2;letter-spacing:-.03em">${escapeHtml(title)}</h1>
            <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.75">${escapeHtml(intro)}</p>
          </div>
          <div style="padding:28px">
            <div style="display:block;border-radius:20px;background:#f8fafc;border:1px solid #dbeafe;padding:18px;margin-bottom:18px">
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700">Request</p>
              <p style="margin:0;color:#0f172a;font-size:16px;font-weight:900">${escapeHtml(requestId)}</p>
              <p style="margin:12px 0 0;color:#64748b;font-size:13px">Product: <strong style="color:${accent}">${escapeHtml(productSlug)}</strong></p>
            </div>
            <div style="border-radius:22px;background:#ffffff;border:1px solid #cbd5e1;padding:22px;color:#0f172a;font-size:16px;line-height:1.85">
              ${escapeHtml(body).replace(/\n/g, "<br/>")}
            </div>
            <p style="margin:22px 0 0;color:#64748b;font-size:13px;line-height:1.65">
              <strong style="color:#0f172a">Moalfarras.space</strong><br/>Official app support and activation control center.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
