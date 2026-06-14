import path from "node:path";
import type { NextConfig } from "next";

const adminAppUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.moalfarras.space";

const nextConfig: NextConfig = {
  transpilePackages: ["@moalfarras/shared"],
  async redirects() {
    return [
      { source: "/:locale(en|ar)/admin", destination: adminAppUrl, permanent: true },
      { source: "/:locale(en|ar)/admin/:path*", destination: `${adminAppUrl}/website`, permanent: true },
      // Friendly Pro aliases -> canonical moplayer2 URL (protects old links and typos).
      { source: "/:locale(en|ar)/apps/moplayerpro", destination: "/:locale/apps/moplayer2", permanent: true },
      { source: "/:locale(en|ar)/apps/moplayer-pro", destination: "/:locale/apps/moplayer2", permanent: true },
    ];
  },
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 480, 640, 750, 828, 1080, 1200, 1920],
    qualities: [60, 65, 70, 75],
    minimumCacheTTL: 2592000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ckefrnalgnbuaxsuufyx.supabase.co",
      },
      {
        protocol: "https",
        hostname: "media.api-sports.io",
      },
      {
        protocol: "https",
        hostname: "cdn.weatherapi.com",
      },
      {
        protocol: "https",
        hostname: "moalfarras.space",
      },
      {
        protocol: "https",
        hostname: "www.moalfarras.space",
      },
      {
        protocol: "https",
        hostname: "alhasakah.net",
      },
      {
        protocol: "https",
        hostname: "qamishli.net",
      },
      {
        protocol: "https",
        hostname: "xubrjnbolomqrgeutcfw.supabase.co",
      },
    ],
  },
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async headers() {
    const devScriptDirective = process.env.NODE_ENV === "production" ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; img-src 'self' https://moalfarras.space https://www.moalfarras.space https://alhasakah.net https://qamishli.net https://xubrjnbolomqrgeutcfw.supabase.co https://i.ytimg.com https://img.youtube.com https://yt3.ggpht.com https://yt3.googleusercontent.com https://ckefrnalgnbuaxsuufyx.supabase.co https://media.api-sports.io https://cdn.weatherapi.com data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src ${devScriptDirective}; connect-src 'self' https://ckefrnalgnbuaxsuufyx.supabase.co https://raw.githubusercontent.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
