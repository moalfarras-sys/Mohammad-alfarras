import { permanentRedirect } from "next/navigation";

import { defaultLocale } from "@/lib/i18n";

/**
 * `/app` — canonical shortcut preserved for back-links and older share URLs.
 * The real product page now lives at `/{locale}/apps/moplayer` inside the
 * unified SiteNavbar + SiteFooter shell. We 308 to the default locale variant.
 */
export default function AppRedirect() {
  permanentRedirect(`/${defaultLocale}/apps/moplayer`);
}
