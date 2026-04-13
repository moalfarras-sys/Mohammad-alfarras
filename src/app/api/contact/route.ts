import { NextResponse } from "next/server";
import { z } from "zod";

import { hasDatabaseUrl, queryRows } from "@/lib/server-db";

const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(160),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(180),
  message: z.string().trim().min(10).max(5000),
  budget: z.string().trim().max(120).optional().or(z.literal("")),
  locale: z.enum(["ar", "en"]).default("ar"),
  projectTypes: z.array(z.string().trim().min(1).max(40)).max(6).optional().default([]),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "Contact storage is not configured" }, { status: 503 });
  }

  try {
    const payload = contactMessageSchema.parse(await request.json());

    const result = await queryRows<{ id: string; created_at: string }>(
      `insert into contact_messages
        (name, email, phone, subject, message, budget, locale, project_types)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       returning id, created_at`,
      [
        payload.name,
        payload.email,
        payload.phone || null,
        payload.subject,
        payload.message,
        payload.budget || null,
        payload.locale,
        JSON.stringify(payload.projectTypes),
      ],
    );

    return NextResponse.json({
      success: true,
      id: result.rows[0]?.id ?? null,
      timestamp: result.rows[0]?.created_at ?? new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
