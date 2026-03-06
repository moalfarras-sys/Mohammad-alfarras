import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { syncYoutubeLatest } from "@/lib/content/store";

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_API_SECRET || "";
  const token = request.headers.get("x-admin-secret") || "";
  const hasCookieSession = request.cookies.get("mf_admin_session")?.value === "ok";

  if (!hasCookieSession && !(secret && token === secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { maxResults?: number; channelId?: string };
    const synced = await syncYoutubeLatest({
      maxResults: body.maxResults,
      channelId: body.channelId,
    });
    return NextResponse.json({ ok: true, synced });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}
