import type { Metadata } from "next";

import { AppControl } from "@/components/admin/pages/app-control";
import { readAdminAppData } from "@/lib/app-ecosystem";

export const metadata: Metadata = { title: "MoPlayer Classic", robots: { index: false, follow: false } };

export default async function MoPlayerClassicPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [data, query] = await Promise.all([readAdminAppData("moplayer"), searchParams]);
  return <AppControl slug="moplayer" data={data} updated={query.updated} />;
}
