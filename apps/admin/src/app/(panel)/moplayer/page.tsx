import type { Metadata } from "next";

import { MoPlayerSuiteControl } from "@/components/admin/pages/moplayer-suite-control";
import { readAdminAppData } from "@/lib/app-ecosystem";

export const metadata: Metadata = { title: "MoPlayer Suite", robots: { index: false, follow: false } };

export default async function MoPlayerSuitePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [classic, pro, query] = await Promise.all([
    readAdminAppData("moplayer"),
    readAdminAppData("moplayer2"),
    searchParams,
  ]);
  return <MoPlayerSuiteControl classic={classic} pro={pro} updated={query.updated} />;
}
