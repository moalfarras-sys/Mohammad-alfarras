import { redirect } from "next/navigation";

import { defaultLocale } from "@/lib/i18n";

export default async function ActivateShortcut({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; device_code?: string; product?: string }>;
}) {
  const { code, device_code: deviceCode, product } = await searchParams;
  const params = new URLSearchParams();
  const activationCode = code || deviceCode;
  if (activationCode) {
    params.set("code", activationCode);
  }
  if (product === "moplayer2") {
    params.set("product", product);
  }

  redirect(`/${defaultLocale}/activate${params.size ? `?${params.toString()}` : ""}`);
}
