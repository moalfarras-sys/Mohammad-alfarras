import type { Metadata } from "next";

import { AppControl } from "@/components/admin/pages/app-control";
import { readAdminAppData } from "@/lib/app-ecosystem";

export const metadata: Metadata = { title: "MoPlayer Pro", robots: { index: false, follow: false } };

export default async function MoPlayerProPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [data, query] = await Promise.all([readAdminAppData("moplayer2"), searchParams]);
  return <AppControl slug="moplayer2" data={data} updated={query.updated} />;
}
