import { NextResponse } from "next/server";

import { readAppEcosystem } from "@/lib/app-ecosystem";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

export async function GET(request: Request) {
  const product = resolveManagedAppSlug(new URL(request.url).searchParams.get("product"));
  const ecosystem = await readAppEcosystem(product);
  const latest = ecosystem.releases[0] ?? null;

  if (!latest) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }

  return NextResponse.redirect(new URL(`/api/app/releases/${latest.slug}/download`, request.url), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
