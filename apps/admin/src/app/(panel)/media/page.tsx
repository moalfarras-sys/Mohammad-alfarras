import type { Metadata } from "next";

import { MediaControlCenter } from "@/components/admin/pages/media-control-center";
import { readAdminAppData } from "@/lib/app-ecosystem";
import { readWebsiteCmsData } from "@/lib/website-cms";

export const metadata: Metadata = { title: "Media Library", robots: { index: false, follow: false } };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [website, classic, pro, query] = await Promise.all([
    readWebsiteCmsData(),
    readAdminAppData("moplayer"),
    readAdminAppData("moplayer2"),
    searchParams,
  ]);

  return <MediaControlCenter website={website} classic={classic} pro={pro} updated={query.updated} />;
}
