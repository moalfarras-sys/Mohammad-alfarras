import { NextResponse } from "next/server";
import { z } from "zod";

import { saveSupportRequest } from "@/lib/app-ecosystem";

const supportSchema = z.object({
  product_slug: z.string().trim().min(1).default("moplayer"),
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(160),
  message: z.string().trim().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = supportSchema.parse({
      product_slug: String(formData.get("product_slug") ?? "moplayer"),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
    });

    await saveSupportRequest(payload);
    return NextResponse.redirect(new URL("/support?support=sent", request.url), { status: 303 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid support request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
