import { redirect } from "next/navigation";

export default async function LocaleAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/cv`);
}
