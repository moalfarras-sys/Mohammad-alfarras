import { randomUUID } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { saveSupportRequest } from "@/lib/app-ecosystem";
import { isSmtpConfigured, ownerInbox, sendAutomationAlert, sendMail, sendTransactionalMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/request-guard";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

export const runtime = "nodejs";

const screenshotMaxBytes = 8 * 1024 * 1024;
const screenshotTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const supportSchema = z.object({
  support_product: z.enum(["moplayer2", "moplayer", "moplayer-pc", "website", "other"]).default("moplayer2"),
  issue_type: z.enum(["activation", "download", "playback", "source", "account", "website", "other"]).default("other"),
  device_type: z.enum(["android-tv", "fire-tv", "android-phone", "windows", "browser", "other"]).default("other"),
  app_version: z.string().trim().max(80).optional().default(""),
  whatsapp: z.string().trim().max(80).optional().default(""),
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(160),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(["ar", "en"]).default("en"),
  website: z.string().trim().max(500).optional().default(""),
});

type ScreenshotUpload = {
  filename: string;
  size: number;
  type: string;
  storagePath?: string;
  signedUrl?: string;
  error?: string;
};

function supportSuccessResponse(request: Request, locale: "ar" | "en", requestId?: string) {
  const accept = request.headers.get("accept") || "";
  const requestedWith = request.headers.get("x-requested-with") || "";
  if (accept.includes("application/json") || requestedWith.toLowerCase() === "fetch") {
    return NextResponse.json({ ok: true, id: requestId ?? null });
  }
  return NextResponse.redirect(new URL(`/${locale}/support?support=sent`, request.url), { status: 303 });
}

function productSlugForSupport(product: z.infer<typeof supportSchema>["support_product"]) {
  if (product === "moplayer") return "moplayer";
  return "moplayer2";
}

function labelFor(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function safeFilename(value: string) {
  const name = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return name.slice(0, 90) || "screenshot";
}

async function uploadScreenshot(file: FormDataEntryValue | null, requestId: string): Promise<ScreenshotUpload | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const type = file.type || "application/octet-stream";
  if (file.size > screenshotMaxBytes) {
    throw new Error("Screenshot is too large. Use an image under 8 MB.");
  }
  if (!screenshotTypes.has(type)) {
    throw new Error("Screenshot must be PNG, JPEG, WebP, or GIF.");
  }

  const filename = safeFilename(file.name);
  const storagePath = `${requestId}/${Date.now()}-${filename}`;
  try {
    const supabase = createSupabaseAdminClient();
    const upload = await supabase.storage.from("support-uploads").upload(storagePath, new Uint8Array(await file.arrayBuffer()), {
      contentType: type,
      upsert: false,
    });
    if (upload.error) {
      return { filename, size: file.size, type, error: upload.error.message };
    }
    const signed = await supabase.storage.from("support-uploads").createSignedUrl(storagePath, 14 * 24 * 60 * 60);
    return {
      filename,
      size: file.size,
      type,
      storagePath,
      signedUrl: signed.data?.signedUrl,
      error: signed.error?.message,
    };
  } catch (error) {
    return {
      filename,
      size: file.size,
      type,
      error: error instanceof Error ? error.message : "Storage unavailable",
    };
  }
}

function supportDetails(payload: z.infer<typeof supportSchema>, screenshot: ScreenshotUpload | null) {
  const lines = [
    "Support diagnostics",
    `Product/area: ${labelFor(payload.support_product)}`,
    `Issue type: ${labelFor(payload.issue_type)}`,
    `Device: ${labelFor(payload.device_type)}`,
    `App version: ${payload.app_version || "not provided"}`,
    `WhatsApp/phone: ${payload.whatsapp || "not provided"}`,
  ];

  if (screenshot) {
    lines.push(`Screenshot: ${screenshot.filename} (${Math.round(screenshot.size / 1024)} KB, ${screenshot.type})`);
    if (screenshot.storagePath) lines.push(`Screenshot storage path: ${screenshot.storagePath}`);
    if (screenshot.signedUrl) lines.push(`Screenshot signed URL (14 days): ${screenshot.signedUrl}`);
    if (screenshot.error) lines.push(`Screenshot upload note: ${screenshot.error}`);
  }

  return `${lines.join("\n")}\n\nMessage:\n${payload.message}`;
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimit({ request, bucket: "support-request", limit: 6, windowSeconds: 10 * 60 });
    if (limited) return limited;

    const formData = await request.formData();
    const payload = supportSchema.parse({
      support_product: String(formData.get("support_product") ?? formData.get("product_slug") ?? "moplayer2"),
      issue_type: String(formData.get("issue_type") ?? "other"),
      device_type: String(formData.get("device_type") ?? "other"),
      app_version: String(formData.get("app_version") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      locale: String(formData.get("locale") ?? "en"),
      website: String(formData.get("website") ?? ""),
    });

    if (payload.website) {
      return supportSuccessResponse(request, payload.locale);
    }

    const requestId = randomUUID();
    const productSlug = resolveManagedAppSlug(productSlugForSupport(payload.support_product));
    const screenshot = await uploadScreenshot(formData.get("screenshot"), requestId);
    const message = supportDetails(payload, screenshot);
    const { stored } = await saveSupportRequest({ id: requestId, product_slug: productSlug, name: payload.name, email: payload.email, message });

    const to = ownerInbox();
    let ownerDelivered = false;
    if (isSmtpConfigured() && to) {
      ownerDelivered = await sendMail({
        to,
        subject: `New ${payload.support_product} support request - ${payload.name}`,
        replyTo: payload.email,
        text: `${payload.name} <${payload.email}>\nProduct: ${payload.support_product}\nRequest: ${requestId}\n\n${message}`,
        html: supportEmailHtml({
          direction: payload.locale === "ar" ? "rtl" : "ltr",
          accent: productSlug === "moplayer2" ? "#f5c66b" : "#22d3ee",
          eyebrow: "App support request",
          title: `${labelFor(payload.support_product)} support`,
          intro: `${payload.name} <${payload.email}>`,
          requestId,
          productSlug: payload.support_product,
          body: message,
        }),
      });
    }

    await sendTransactionalMail({
      to: payload.email,
      replyTo: to ?? undefined,
      subject: payload.locale === "ar" ? "تم استلام طلب الدعم" : "We received your support request",
      text:
        payload.locale === "ar"
          ? `تم استلام طلب دعم ${labelFor(payload.support_product)}.\nرقم الطلب: ${requestId}\nالحالة: جديد`
          : `We received your ${labelFor(payload.support_product)} support request.\nRequest: ${requestId}\nStatus: new`,
      html: supportEmailHtml({
        direction: payload.locale === "ar" ? "rtl" : "ltr",
        accent: productSlug === "moplayer2" ? "#f5c66b" : "#22d3ee",
        eyebrow: payload.locale === "ar" ? "تأكيد استلام الدعم" : "Support request received",
        title: payload.locale === "ar" ? "تم استلام طلب الدعم" : "We received your support request",
        intro:
          payload.locale === "ar"
            ? "تم استلام طلب الدعم وسيتم الرد على هذا البريد."
            : "Your support request has been received and we will reply to this email.",
        requestId,
        productSlug: payload.support_product,
        body: payload.message,
      }),
    });

    // Total failure: nothing persisted AND the owner email did not go out.
    // Tell the visitor honestly instead of a false "received", and alert the owner.
    if (stored === false && !ownerDelivered) {
      await sendAutomationAlert({
        title: "Support request not stored or emailed",
        message: `A ${payload.support_product} support request from ${payload.email} could not be saved or emailed.`,
        route: "/api/app/support",
        severity: "danger",
        details: { requestId, product: payload.support_product },
      }).catch(() => {});
      return NextResponse.json(
        {
          error:
            payload.locale === "ar"
              ? "تعذّر استلام طلب الدعم حالياً. حاول مرة أخرى بعد قليل أو تواصل عبر واتساب."
              : "We couldn't receive your support request right now. Please try again shortly or reach us on WhatsApp.",
        },
        { status: 502 },
      );
    }

    return supportSuccessResponse(request, payload.locale, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid support request" }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Screenshot")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
<html lang="${direction === "rtl" ? "ar" : "en"}" dir="${direction}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;background:#f8fafc;padding:18px 10px;font-family:Arial,Tahoma,Helvetica,sans-serif;color:#0f172a;direction:${direction};text-align:${direction === "rtl" ? "right" : "left"}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:collapse">
      <tr>
        <td style="border:1px solid #cbd5e1;border-radius:18px;overflow:hidden;background:#ffffff;box-shadow:0 12px 32px rgba(15,23,42,.10)">
          <div style="padding:24px;background:#ffffff;border-bottom:1px solid #e2e8f0">
            <p style="display:inline-block;margin:0 0 12px;border-radius:999px;background:#eff6ff;padding:7px 11px;color:${accent};font-size:12px;font-weight:900">${escapeHtml(eyebrow)}</p>
            <h1 style="margin:0;color:#0f172a;font-size:28px;line-height:1.3;font-weight:900">${escapeHtml(title)}</h1>
            <p style="margin:14px 0 0;color:#334155;font-size:16px;line-height:1.75">${escapeHtml(intro)}</p>
          </div>
          <div style="padding:24px">
            <div style="display:block;border-radius:16px;background:#f8fafc;border:1px solid #cbd5e1;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:700">Request</p>
              <p style="margin:0;color:#0f172a;font-size:15px;font-weight:900;word-break:break-word">${escapeHtml(requestId)}</p>
              <p style="margin:12px 0 0;color:#64748b;font-size:13px">Product: <strong style="color:${accent}">${escapeHtml(productSlug)}</strong></p>
            </div>
            <div style="border-radius:16px;background:#ffffff;border:1px solid #cbd5e1;padding:20px;color:#0f172a;font-size:17px;line-height:1.9;font-weight:700">
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
