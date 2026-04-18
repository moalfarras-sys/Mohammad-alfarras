import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const icon = {
  src: "/icons/icon.svg",
  sizes: "any",
  type: "image/svg+xml",
  purpose: "any maskable" as const,
};

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const base = `/${locale}/admin`;
  const origin = new URL(request.url).origin;
  const isAr = locale === "ar";

  const manifest = {
    id: `${origin}${base}/`,
    name: isAr ? "Moalfarras — لوحة التحكم" : "Moalfarras Control Center",
    short_name: isAr ? "التحكم" : "Control",
    description: isAr
      ? "إدارة الموقع، السيرة، المشاريع، الوسائط وملفات PDF."
      : "Manage the site, CV, projects, media, and PDFs.",
    lang: isAr ? "ar" : "en",
    dir: isAr ? ("rtl" as const) : ("ltr" as const),
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone" as const,
    display_override: ["standalone", "minimal-ui"] as const,
    orientation: "any" as const,
    background_color: "#070b14",
    theme_color: "#00E5FF",
    categories: ["business", "productivity"],
    icons: [icon],
    shortcuts: [
      {
        name: isAr ? "ملفات PDF" : "PDFs",
        short_name: "PDF",
        url: `${base}/pdfs`,
        icons: [icon],
      },
      {
        name: isAr ? "الصفحات" : "Pages",
        short_name: isAr ? "صفحات" : "Pages",
        url: `${base}/pages`,
        icons: [icon],
      },
      {
        name: isAr ? "المشاريع" : "Projects",
        short_name: isAr ? "أعمال" : "Work",
        url: `${base}/projects`,
        icons: [icon],
      },
      {
        name: isAr ? "الإعدادات" : "Settings",
        short_name: isAr ? "إعدادات" : "Settings",
        url: `${base}/settings`,
        icons: [icon],
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
