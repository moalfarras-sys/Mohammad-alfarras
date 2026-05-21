import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

function readConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL ?? user;
  const fromName = process.env.SMTP_FROM_NAME ?? "Moalfarras";

  if (!host || !user || !pass || !fromEmail) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL.");
  }

  return { host, port, user, pass, fromEmail, fromName };
}

let cached: Transporter | null = null;

function getTransporter() {
  if (cached) return cached;
  const config = readConfig();
  cached = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  return cached;
}

export async function sendMail(input: MailInput) {
  const config = readConfig();
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });
}

export function isMailerConfigured() {
  try {
    readConfig();
    return true;
  } catch {
    return false;
  }
}
