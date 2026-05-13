import { NextResponse } from "next/server";

import { readAppEcosystem } from "@/lib/app-ecosystem";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = resolveManagedAppSlug(url.searchParams.get("product"));
  const abi = url.searchParams.get("abi");
  const ecosystem = await readAppEcosystem(product);
  const latest = ecosystem.releases[0] ?? null;

  if (!latest) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }

  const target = new URL(`/api/app/releases/${latest.slug}/download`, request.url);
  if (abi) target.searchParams.set("abi", abi);

  return NextResponse.redirect(target, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
