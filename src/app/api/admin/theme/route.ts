import { NextResponse } from "next/server";

import { updateThemeToken } from "@/lib/content/store";
import { themeTokenUpdateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = themeTokenUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await updateThemeToken(parsed.data.mode, parsed.data.tokenKey, parsed.data.tokenValue);
  return NextResponse.json({ ok: true });
}
