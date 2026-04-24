import type { Locale } from "@/types/cms";

import { navigationItems } from "./site";

export function getNavigation(locale: Locale) {
  return navigationItems[locale].map((item) => ({
    id: item.id,
    label: item.label,
    href: item.slug ? `/${locale}/${item.slug}` : `/${locale}`,
  }));
}
