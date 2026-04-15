import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const base = `/${locale}/admin`;

  const manifest = {
    name: "MOALFARRAS Admin",
    short_name: "Admin",
    description: "Manage your site, CV, and projects.",
    start_url: base,
    scope: base,
    display: "standalone" as const,
    orientation: "portrait-primary" as const,
    background_color: "#070b14",
    theme_color: "#00ff87",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable" as const,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
