import { NextResponse } from "next/server";

import { readDownloadCounts } from "@/lib/download-counter";
import { cinematicEmailHtml } from "@/lib/email-template";
import { ownerInbox, sendTransactionalMail } from "@/lib/mailer";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { readVisitCount } from "@/lib/visit-counter";

export const dynamic = "force-dynamic";

const PERIOD_DAYS = 10;

type Lead = { name?: string | null; email?: string | null; message?: string | null; created_at?: string | null };

async function recentLeads(sinceIso: string): Promise<Lead[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("contact_messages")
      .select("name,email,message,created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(20);
    return Array.isArray(data) ? (data as Lead[]) : [];
  } catch {
    return [];
  }
}

/**
 * 10-day owner report: downloads (per app), visits, and new leads → one
 * cinematic email. Triggered by Vercel Cron (see vercel.json) and protected
 * by CRON_SECRET. Returns the compiled numbers so it can be verified directly.
 */
export async function GET(request: Request) {
  // Only Vercel Cron (which sets x-vercel-cron) or a caller with CRON_SECRET
  // may trigger this — otherwise the public URL could be hit to spam the inbox.
  const secret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get("x-vercel-cron") !== null;
  const hasSecret = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  if (!isVercelCron && !hasSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceIso = new Date(Date.now() - PERIOD_DAYS * 86_400_000).toISOString();
  const [downloads, visits, leads] = await Promise.all([readDownloadCounts(), readVisitCount(), recentLeads(sinceIso)]);

  const rows: Array<[string, string]> = [
    ["إجمالي التحميلات", String(downloads.total)],
    ["MoPlayer Classic", String(downloads.counts["moplayer"] || 0)],
    ["MoPlayer Pro", String(downloads.counts["moplayer2"] || 0)],
    ["MoPlayer PC", String(downloads.counts["moplayer2:windows"] || 0)],
    ["إجمالي الزيارات", String(visits.total)],
    [`رسائل/طلبات آخر ${PERIOD_DAYS} يوم`, String(leads.length)],
  ];

  const leadLines = leads
    .slice(0, 10)
    .map((l) => `• ${(l.name || "—").trim()} (${(l.email || "—").trim()}): ${(l.message || "").replace(/\s+/g, " ").slice(0, 90)}`)
    .join("\n");

  const html = cinematicEmailHtml({
    direction: "rtl",
    eyebrow: "تقرير الموقع",
    title: `تقرير كل ${PERIOD_DAYS} أيام`,
    intro: "ملخّص أداء موقع moalfarras.space والتطبيقات خلال الفترة الأخيرة.",
    rows,
    body: leadLines || "لا توجد رسائل أو طلبات جديدة في هذه الفترة.",
    tone: "info",
  });
  const text = `تقرير كل ${PERIOD_DAYS} أيام — moalfarras.space\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nالرسائل:\n${leadLines || "لا جديد."}`;

  const to = ownerInbox();
  let sent = false;
  if (to) {
    sent = await sendTransactionalMail({
      to,
      subject: `تقرير موقع moalfarras.space — كل ${PERIOD_DAYS} أيام`,
      text,
      html,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      sent,
      to: to ? "configured" : "missing",
      period_days: PERIOD_DAYS,
      downloads: { total: downloads.total, ...downloads.counts },
      visits: visits.total,
      leads: leads.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
