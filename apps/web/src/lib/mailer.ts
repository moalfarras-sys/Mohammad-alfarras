import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { cinematicEmailHtml } from "@/lib/email-template";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
};

function readConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL ?? user;
  const fromName = process.env.SMTP_FROM_NAME ?? "Moalfarras.space";

  if (!host || !user || !pass || !fromEmail) {
    return null;
  }
  return { host, port, user, pass, fromEmail, fromName };
}

export function isSmtpConfigured(): boolean {
  return readConfig() !== null;
}

export function ownerInbox(): string | null {
  return process.env.CONTACT_TO_EMAIL ?? process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? null;
}

let cached: Transporter | null = null;

function getTransporter(config: SmtpConfig) {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  return cached;
}

export async function sendMail(input: MailInput): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;
  try {
    const transporter = getTransporter(config);
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
      headers: {
        "Content-Language": /[\u0600-\u06ff]/.test(`${input.subject}\n${input.text}`) ? "ar" : "en",
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendTransactionalMail(input: MailInput): Promise<boolean> {
  const smtpDelivered = await sendMail(input);
  if (smtpDelivered) return true;

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !resendFrom) return false;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: resendFrom,
      to: [input.to],
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html ?? `<pre>${escapeHtml(input.text)}</pre>`,
      text: input.text,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function sendAutomationAlert(input: {
  title: string;
  message: string;
  route: string;
  severity?: "warning" | "danger";
  details?: Record<string, string>;
}) {
  const to = ownerInbox();
  if (!to) return false;
  const rows: Array<[string, string]> = [
    ["Route", input.route],
    ["Severity", input.severity ?? "warning"],
    ["Time", new Date().toISOString()],
    ...Object.entries(input.details ?? {}),
  ];
  return sendTransactionalMail({
    to,
    subject: `Moalfarras automation alert: ${input.title}`,
    text: `${input.title}\n${input.message}\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`,
    html: cinematicEmailHtml({
      direction: "ltr",
      eyebrow: "Automation alert",
      title: input.title,
      intro: "The website detected an automation issue that needs review.",
      rows,
      body: input.message,
      tone: input.severity === "danger" ? "danger" : "warning",
    }),
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
