import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const icons = [
  {
    src: "/images/logo.png",
    sizes: "1024x768",
    type: "image/png",
    purpose: "any" as const,
  },
];

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const base = `/${locale}/admin`;
  const origin = new URL(request.url).origin;
  const isAr = locale === "ar";

  const manifest = {
    id: `${origin}${base}/`,
    name: "admin Moalfarras",
    short_name: "admin Moalfarras",
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
    theme_color: "#5B7CFF",
    categories: ["business", "productivity"],
    icons,
    shortcuts: [
      {
        name: isAr ? "ملفات PDF" : "PDFs",
        short_name: "PDF",
        url: `${base}/pdfs`,
        icons,
      },
      {
        name: isAr ? "الصفحات" : "Pages",
        short_name: isAr ? "صفحات" : "Pages",
        url: `${base}/pages`,
        icons,
      },
      {
        name: isAr ? "المشاريع" : "Projects",
        short_name: isAr ? "أعمال" : "Work",
        url: `${base}/projects`,
        icons,
      },
      {
        name: isAr ? "الإعدادات" : "Settings",
        short_name: isAr ? "إعدادات" : "Settings",
        url: `${base}/settings`,
        icons,
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
