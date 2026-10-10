import { hydrateRoot } from "react-dom/client";
import type { MoosRelease } from "../../src/lib/moos-release";
import { MoosV3 } from "../../src/components/v3/moos-v3";

export type PageData = { locale: "ar" | "en"; release: MoosRelease; siteOrigin: string };

export function App({ locale, release, siteOrigin }: PageData) {
  const ar = locale === "ar";
  return <div className="liquid-site" lang={locale} dir={ar ? "rtl" : "ltr"}>
    <a className="moos-skip" href="#main-content">{ar ? "تخطّ إلى المحتوى" : "Skip to content"}</a>
    <header className="moos-static-nav">
      <a className="moos-static-brand" href={`/${locale}/`} aria-label="MoOS">
        {/* Static images are served directly by Cloudflare Assets. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/moos/moos-logo.png" alt="" width={32} height={32} />MoOS
      </a>
      <nav aria-label={ar ? "التنقل" : "Navigation"}>
        <a href="#mira">{ar ? "ميرا" : "Mira"}</a>
        <a href="#download">{ar ? "التنزيل" : "Download"}</a>
        <a href={release.repoUrl} target="_blank" rel="noopener noreferrer">{ar ? "المصدر" : "Source"}</a>
        <a href={ar ? "/en/" : "/ar/"} lang={ar ? "en" : "ar"} hrefLang={ar ? "en" : "ar"}>{ar ? "English" : "العربية"}</a>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <MoosV3 locale={locale} release={release} staticDownloadOrigin={siteOrigin} showAppDirectory={false} />
    </main>
    <footer className="moos-static-footer">
      <span>{ar ? "MoOS — من التطوير إلى جهازك، بإصدار موقّع يمكن التحقق منه." : "MoOS — signed, verifiable releases from development to your computer."}</span>
      <a href="/downloads/moos/delivery-proof.json">{ar ? "إثبات ملف التنزيل" : "Download proof"}</a>
    </footer>
  </div>;
}

if (typeof document !== "undefined") {
  const data = document.getElementById("moos-page-data");
  const root = document.getElementById("moos-root");
  if (data && root) hydrateRoot(root, <App {...JSON.parse(data.textContent ?? "{}")} />);
}
