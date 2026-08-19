import { after, NextResponse } from "next/server";

import { rateLimit } from "@/lib/request-guard";
import { recordVisit } from "@/lib/visit-counter";

// Records one visit (called once per browser session by the client beacon).
// Counting runs post-response via after(), so it never delays anything.
//
// The limit is per IP, and mobile carriers put thousands of real visitors
// behind one CGNAT address — at 5/min every page view after the first few
// returned 429, which both lost visit counts and logged console errors for
// ordinary users. This endpoint only increments a counter, so a limit in line
// with the rest of the API is the right trade.
export async function POST(request: Request) {
  const limited = await rateLimit({ request, bucket: "track", limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  after(() => recordVisit());
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
