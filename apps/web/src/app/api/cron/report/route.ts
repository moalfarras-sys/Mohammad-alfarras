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
 * Best-effort retention cleanup piggybacking on the cron schedule. Every delete
 * is guarded individually so a missing table (env without the migration) or a
 * transient Supabase error never blocks the report itself.
 */
async function cleanupExpiredRows(): Promise<Record<string, number>> {
  const removed: Record<string, number> = {};
  try {
    const supabase = createSupabaseAdminClient();

    const retention: Array<{ table: string; column: string; days: number }> = [
      { table: "app_device_events", column: "created_at", days: 30 },
      { table: "app_diagnostic_reports", column: "created_at", days: 60 },
    ];
    for (const rule of retention) {
      try {
        const cutoff = new Date(Date.now() - rule.days * 86_400_000).toISOString();
        const { error, count } = await supabase.from(rule.table).delete({ count: "exact" }).lt(rule.column, cutoff);
        if (!error) removed[rule.table] = count ?? 0;
      } catch {
        // Skip this table and keep going — cleanup must never fail the report.
      }
    }

    try {
      // Legacy Supabase-backed rate-limit buckets (the limiter is Upstash-first now,
      // Supabase only absorbs writes when Redis is unreachable). Buckets untouched
      // for 24h are long past any rate-limit window.
      const cutoff = new Date(Date.now() - 86_400_000).toISOString();
      const { error, count } = await supabase
        .from("app_settings")
        .delete({ count: "exact" })
        .like("key", "rate_limit:%")
        .lt("updated_at", cutoff);
      if (!error) removed["app_settings_rate_limit"] = count ?? 0;
    } catch {
      // Same best-effort contract as above.
    }
  } catch {
    // Missing Supabase env — nothing to clean up against.
  }
  return removed;
}

async function saveInboxReport(input: { title: string; body: string; payload: Record<string, unknown> }) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("automation_inbox").insert({
      title: input.title,
      body: input.body,
      severity: "info",
      status: "new",
      action_type: "site_report",
      action_payload: input.payload,
      created_by: "vercel-cron",
    });
  } catch {
    // The email report remains the primary delivery path if the inbox table is unavailable.
  }
}

/**
 * 10-day owner report: downloads (per app), visits, and new leads → one
 * cinematic email. Triggered by Vercel Cron (see vercel.json) and protected
 * by CRON_SECRET. Returns the compiled numbers so it can be verified directly.
 */
export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer CRON_SECRET` automatically when the
  // env var is set, so the bearer check is the only trustworthy gate — anyone can
  // spoof an x-vercel-cron header and spam the inbox through the public URL.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceIso = new Date(Date.now() - PERIOD_DAYS * 86_400_000).toISOString();
  const [downloads, visits, leads, cleanup] = await Promise.all([
    readDownloadCounts(),
    readVisitCount(),
    recentLeads(sinceIso),
    cleanupExpiredRows(),
  ]);

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

  await saveInboxReport({
    title: `10-day moalfarras.space report`,
    body: text,
    payload: {
      period_days: PERIOD_DAYS,
      sent,
      downloads: { total: downloads.total, ...downloads.counts },
      visits: visits.total,
      leads: leads.length,
      cleanup,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      sent,
      to: to ? "configured" : "missing",
      period_days: PERIOD_DAYS,
      downloads: { total: downloads.total, ...downloads.counts },
      visits: visits.total,
      leads: leads.length,
      cleanup,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
