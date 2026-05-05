import { redirect } from "next/navigation";

import { defaultLocale } from "@/lib/i18n";

export default async function ActivateShortcut({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; device_code?: string }>;
}) {
  const { code, device_code: deviceCode } = await searchParams;
  const params = new URLSearchParams();
  const activationCode = code || deviceCode;
  if (activationCode) {
    params.set("code", activationCode);
  }

  redirect(`/${defaultLocale}/activate${params.size ? `?${params.toString()}` : ""}`);
}
