import { after, NextResponse } from "next/server";

import { recordVisit } from "@/lib/visit-counter";

// Records one visit (called once per browser session by the client beacon).
// Counting runs post-response via after(), so it never delays anything.
export async function POST() {
  after(() => recordVisit());
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
