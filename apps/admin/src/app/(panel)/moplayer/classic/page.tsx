import type { Metadata } from "next";

import { AppControl } from "@/components/admin/pages/app-control";
import { readAdminAppData } from "@/lib/app-ecosystem";
import { readWebsiteCmsData } from "@/lib/website-cms";

export const metadata: Metadata = { title: "MoPlayer Classic", robots: { index: false, follow: false } };

export default async function MoPlayerClassicPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [data, website, query] = await Promise.all([readAdminAppData("moplayer"), readWebsiteCmsData(), searchParams]);
  return <AppControl slug="moplayer" data={data} mediaAssets={website.mediaAssets} updated={query.updated} />;
}
