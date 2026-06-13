import type { Locale } from "@/types/cms";

import { DigitalOsPage } from "./digital-os-vnext";
import { buildSiteModel } from "./site-model";

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const model = await buildSiteModel({ locale, slug });
  return <DigitalOsPage model={model} />;
}
