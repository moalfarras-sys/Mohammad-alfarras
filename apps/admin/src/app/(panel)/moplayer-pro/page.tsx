import type { Metadata } from "next";

import { AppControl } from "@/components/admin/pages/app-control";
import { readAdminAppData } from "@/lib/app-ecosystem";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export const metadata: Metadata = { title: "MoPlayer Pro", robots: { index: false, follow: false } };

async function readWindowsRelease(): Promise<Record<string, unknown>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("site_settings").select("value_json").eq("key", "windows_release").maybeSingle();
    return data?.value_json && typeof data.value_json === "object" ? (data.value_json as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default async function MoPlayerProPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [data, windowsRelease, query] = await Promise.all([
    readAdminAppData("moplayer2"),
    readWindowsRelease(),
    searchParams,
  ]);
  return <AppControl slug="moplayer2" data={data} updated={query.updated} windowsRelease={windowsRelease} />;
}
