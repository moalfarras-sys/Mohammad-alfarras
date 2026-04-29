import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { supportCopy } from "@/content/legal";
import { SITE_URL } from "@/content/site";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, webPageJsonLd } from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const copy = supportCopy[loc];

  return {
    title: `${copy.eyebrow} | MoPlayer | Mohammad Alfarras`,
    description: copy.intro,
    alternates: {
      canonical: `${SITE_URL}/${loc}/support`,
      languages: {
        ar: `${SITE_URL}/ar/support`,
        en: `${SITE_URL}/en/support`,
        "x-default": `${SITE_URL}/en/support`,
      },
    },
  };
}

export default async function LocalizedSupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ support?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const copy = supportCopy[loc];
  const { product } = await readAppEcosystem("moplayer");
  const query = (await searchParams) ?? {};
  const isSent = query.support === "sent";
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: copy.eyebrow, path: `/${loc}/support` },
  ]);
  const page = webPageJsonLd({ locale: loc, path: `/${loc}/support`, name: copy.title, description: copy.intro });

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(page) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <main className="fresh-page" dir={loc === "ar" ? "rtl" : "ltr"}>
        <section className="fresh-hero">
          <div className="fresh-hero-copy">
            <p className="fresh-eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
            {isSent ? (
              <div className="fresh-note mt-6 text-blue-100">
                {copy.sent}
              </div>
            ) : null}
          </div>
          <aside className="fresh-card">
            <p className="fresh-eyebrow">{copy.directTitle}</p>
            <div className="fresh-channel-list">
                  <a href={`mailto:${product.support_email}`}>
                    {product.support_email}
                  </a>
                  <a href={product.support_whatsapp} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                  <Link href={`/${loc}/privacy`}>
                    {copy.privacy}
                  </Link>
                  <Link href={`/${loc}/apps/moplayer`}>
                    {copy.product}
                  </Link>
            </div>
          </aside>
        </section>

        <section className="fresh-section">
          <div className="fresh-contact">
            <aside className="fresh-grid">
              <article className="fresh-card">
                <p className="fresh-eyebrow">{copy.legalTitle}</p>
                <p>{copy.legal}</p>
              </article>

              <article className="fresh-card">
                <p className="fresh-eyebrow">{copy.todoTitle}</p>
                <p>{copy.todo}</p>
              </article>
            </aside>

            <form action="/api/app/support" method="post" className="fresh-form">
              <input type="hidden" name="product_slug" value={product.slug} />
              <input type="hidden" name="locale" value={loc} />
              <div className="sr-only" aria-hidden>
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <p className="fresh-eyebrow">{copy.formTitle}</p>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.name}</span>
                <input name="name" required className="fresh-input" />
              </label>
              <label className="fresh-field">
                <span className="fresh-field-label">{copy.email}</span>
                <input name="email" type="email" required className="fresh-input" />
              </label>
              <label className="fresh-field">
                <span className="fresh-field-label">{copy.message}</span>
                <textarea name="message" required rows={8} className="fresh-input fresh-textarea" />
              </label>

              <button type="submit" className="fresh-button fresh-button-primary">
                {copy.submit}
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
