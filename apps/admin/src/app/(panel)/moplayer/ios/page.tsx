import type { Metadata } from "next";

import { MoPlayerIosControl } from "@/components/admin/pages/moplayer-ios-control";
import { readAdminAppData } from "@/lib/app-ecosystem";
import { readWebsiteCmsData } from "@/lib/website-cms";

export const metadata: Metadata = { title: "MoPlayer iOS", robots: { index: false, follow: false } };

export default async function MoPlayerIosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [pro, website, query] = await Promise.all([
    readAdminAppData("moplayer2"),
    readWebsiteCmsData(),
    searchParams,
  ]);
  return <MoPlayerIosControl pro={pro} mediaAssets={website.mediaAssets} updated={query.updated} />;
}
