import { createSupabaseAdminClient } from "@/lib/supabase/client";

/**
 * Lightweight, approximate visit counter (unique per browser session) stored
 * in the `visit_counts` site setting. Best-effort: every call is wrapped in
 * try/catch and is meant to run via `after()` so it never blocks a response.
 */
const SETTING_KEY = "visit_counts";

export type VisitCounts = { total: number; since?: string; updatedAt?: string };

export async function recordVisit(): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("site_settings").select("value_json").eq("key", SETTING_KEY).maybeSingle();
    const current = (data?.value_json && typeof data.value_json === "object" ? data.value_json : {}) as Partial<VisitCounts>;
    const value: VisitCounts = {
      total: (Number(current.total) || 0) + 1,
      since: typeof current.since === "string" ? current.since : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await supabase.from("site_settings").upsert({ key: SETTING_KEY, value_json: value }, { onConflict: "key" });
  } catch {
    // Visit counting must never affect the page.
  }
}

export async function readVisitCount(): Promise<VisitCounts> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("site_settings").select("value_json").eq("key", SETTING_KEY).maybeSingle();
    const v = (data?.value_json && typeof data.value_json === "object" ? data.value_json : {}) as Partial<VisitCounts>;
    return { total: Number(v.total) || 0, since: typeof v.since === "string" ? v.since : undefined };
  } catch {
    return { total: 0 };
  }
}
