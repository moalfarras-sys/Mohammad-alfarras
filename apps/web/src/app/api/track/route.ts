import { after, NextResponse } from "next/server";

import { rateLimit } from "@/lib/request-guard";
import { recordVisit } from "@/lib/visit-counter";

// Records one visit (called once per browser session by the client beacon).
// Counting runs post-response via after(), so it never delays anything.
export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "track", limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  after(() => recordVisit());
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
