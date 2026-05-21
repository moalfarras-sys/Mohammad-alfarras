import type { Metadata } from "next";

import { WebsiteControl } from "@/components/admin/pages/website-control";
import { readWebsiteCmsData } from "@/lib/website-cms";

export const metadata: Metadata = { title: "Website", robots: { index: false, follow: false } };

export default async function WebsitePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [data, query] = await Promise.all([readWebsiteCmsData(), searchParams]);
  return <WebsiteControl data={data} updated={query.updated} />;
}
