import { NextResponse } from "next/server";

import { readAppEcosystem } from "@/lib/app-ecosystem";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

export async function GET(request: Request) {
  const product = resolveManagedAppSlug(new URL(request.url).searchParams.get("product"));
  const ecosystem = await readAppEcosystem(product);
  const latest = ecosystem.releases[0] ?? null;

  const response = NextResponse.json({
    product: {
      slug: ecosystem.product.slug,
      name: ecosystem.product.product_name,
    },
    latestRelease: latest,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
