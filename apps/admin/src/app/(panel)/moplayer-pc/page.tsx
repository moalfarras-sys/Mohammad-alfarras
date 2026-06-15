import type { Metadata } from "next";

import { PcControl } from "@/components/admin/pages/pc-control";
import { readAppDownloadMetrics } from "@/lib/app-ecosystem";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export const metadata: Metadata = { title: "MoPlayer PC", robots: { index: false, follow: false } };

async function readWindowsRelease(): Promise<Record<string, unknown>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("site_settings").select("value_json").eq("key", "windows_release").maybeSingle();
    return data?.value_json && typeof data.value_json === "object" ? (data.value_json as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default async function MoPlayerPcPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [windowsRelease, downloadStats, query] = await Promise.all([
    readWindowsRelease(),
    readAppDownloadMetrics("moplayer2", "windows"),
    searchParams,
  ]);
  return <PcControl windowsRelease={windowsRelease} downloadStats={downloadStats} updated={query.updated} />;
}
