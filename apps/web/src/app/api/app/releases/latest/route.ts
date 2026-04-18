import { NextResponse } from "next/server";

import { readAppEcosystem } from "@/lib/app-ecosystem";

export async function GET() {
  const ecosystem = await readAppEcosystem("moplayer");
  const latest = ecosystem.releases[0] ?? null;

  return NextResponse.json({
    product: {
      slug: ecosystem.product.slug,
      name: ecosystem.product.product_name,
    },
    latestRelease: latest,
  });
}
