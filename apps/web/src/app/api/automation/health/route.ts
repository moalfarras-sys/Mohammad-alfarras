import { NextResponse } from "next/server";

async function check(baseUrl: string, path: string) {
  try {
    const res = await fetch(new URL(path, baseUrl), { cache: "no-store" });
    return { ok: res.ok || res.status === 307, detail: `${res.status}` };
  } catch {
    return { ok: false, detail: "failed" };
  }
}

async function checkFootball(baseUrl: string) {
  try {
    const res = await fetch(new URL("/api/football", baseUrl), { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { source?: string; matches?: unknown[]; error?: string };
    const source = data.source ?? "unknown";
    const configured = source !== "not_configured" && source !== "disabled" && source !== "network_error";
    return {
      ok: res.ok && configured,
      detail: `${res.status}:${source}`,
      matches: Array.isArray(data.matches) ? data.matches.length : 0,
      error: data.error,
    };
  } catch {
    return { ok: false, detail: "failed", matches: 0 };
  }
}

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const [siteHome, appPageClassic, appPagePro, assistant, appAssistant, appEvents, diagnostics, weather, football, configClassic, downloadClassic, configPro, downloadPro] = await Promise.all([
    check(baseUrl, "/en"),
    check(baseUrl, "/en/apps/moplayer"),
    check(baseUrl, "/en/apps/moplayer2"),
    check(baseUrl, "/api/ai/site-assistant"),
    check(baseUrl, "/api/app/assistant"),
    check(baseUrl, "/api/app/events"),
    check(baseUrl, "/api/app/diagnostics"),
    check(baseUrl, "/api/weather"),
    checkFootball(baseUrl),
    check(baseUrl, "/api/app/config?product=moplayer"),
    check(baseUrl, "/api/app/download/latest?product=moplayer"),
    check(baseUrl, "/api/app/config?product=moplayer2"),
    check(baseUrl, "/api/app/download/latest?product=moplayer2"),
  ]);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    checks: {
      automation: { ok: true, detail: process.env.N8N_WEBHOOK_URL ? "n8n configured" : "n8n disabled/local" },
      site_home: siteHome,
      page_moplayer: appPageClassic,
      page_moplayer2: appPagePro,
      assistant,
      app_assistant: appAssistant,
      app_events: appEvents,
      diagnostics,
      supabase: { ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing" },
      smtp: { ok: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)), detail: process.env.SMTP_HOST ? "configured" : "missing" },
      weather,
      football,
      youtube: { ok: true, detail: "available" },
      config_moplayer: configClassic,
      download_moplayer: downloadClassic,
      config_moplayer2: configPro,
      download_moplayer2: downloadPro,
    },
  });
}
