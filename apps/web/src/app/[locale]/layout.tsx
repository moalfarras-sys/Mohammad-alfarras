import { notFound } from "next/navigation";

import { MotionProvider } from "@/components/site/motion-provider";
import { isLocale, localeMeta } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div lang={locale} dir={localeMeta[locale].dir} className="min-h-screen">
      <MotionProvider>{children}</MotionProvider>
    </div>
  );
}
