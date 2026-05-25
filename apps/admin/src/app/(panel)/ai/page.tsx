import type { Metadata } from "next";

import { AiOperationsView } from "@/components/admin/pages/ai-operations";
import { readAiOpsData } from "@/lib/ai-ops";

export const metadata: Metadata = { title: "AI assistant", robots: { index: false, follow: false } };

type Health = {
  ok?: boolean;
  generatedAt?: string;
  checks?: Record<string, { ok?: boolean; detail?: string }>;
};

async function readAssistantHealth(): Promise<Health> {
  const base = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/automation/health`, { cache: "no-store" });
    if (!res.ok) return { ok: false };
    return (await res.json()) as Health;
  } catch {
    return { ok: false };
  }
}

export default async function AiOperationsPage() {
  const [health, ops] = await Promise.all([readAssistantHealth(), readAiOpsData()]);
  const webBase = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");

  return <AiOperationsView health={health} ops={ops} webBase={webBase} />;
}
