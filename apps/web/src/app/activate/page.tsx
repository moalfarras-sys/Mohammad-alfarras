import { redirect } from "next/navigation";

import { defaultLocale } from "@/lib/i18n";

export default async function ActivateShortcut({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; device_code?: string; product?: string; platform?: string }>;
}) {
  const { code, device_code: deviceCode, product, platform } = await searchParams;
  const params = new URLSearchParams();
  const activationCode = code || deviceCode;
  if (activationCode) {
    params.set("code", activationCode);
  }
  if (product === "moplayer2" || product === "moplayer-pc") {
    params.set("product", product);
  }
  if (platform) {
    params.set("platform", platform);
  }

  redirect(`/${defaultLocale}/activate${params.size ? `?${params.toString()}` : ""}`);
}
