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
  const page = webPageJsonLd({
    locale: loc,
    path: `/${loc}/support`,
    name: copy.title,
    description: copy.intro,
  });

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(page) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <section className="pt-10 md:pt-16">
        <div className="section-frame">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{copy.eyebrow}</p>
            <h1 className="headline-display mt-4 text-[clamp(2.1rem,6vw,4.5rem)] font-black leading-tight text-[var(--text-1)]">
              {copy.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--text-2)]">{copy.intro}</p>
          </div>

          {isSent ? (
            <div className="mt-6 rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {copy.sent}
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.45fr_0.55fr]">
            <aside className="space-y-4">
              <section className="glass rounded-[var(--radius-lg)] p-6">
                <h2 className="text-xl font-bold text-[var(--text-1)]">{copy.directTitle}</h2>
                <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--text-2)]">
                  <a href={`mailto:${product.support_email}`} className="text-[var(--accent)]">
                    {product.support_email}
                  </a>
                  <a href={product.support_whatsapp} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)]">
                    WhatsApp
                  </a>
                  <Link href={`/${loc}/privacy`} className="text-[var(--accent)]">
                    {copy.privacy}
                  </Link>
                  <Link href={`/${loc}/apps/moplayer`} className="text-[var(--accent)]">
                    {copy.product}
                  </Link>
                </div>
              </section>
              <section className="glass rounded-[var(--radius-lg)] p-6">
                <h2 className="text-xl font-bold text-[var(--text-1)]">{copy.legalTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{copy.legal}</p>
              </section>
              <section className="glass rounded-[var(--radius-lg)] p-6">
                <h2 className="text-xl font-bold text-[var(--text-1)]">{copy.todoTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{copy.todo}</p>
              </section>
            </aside>

            <form action="/api/app/support" method="post" className="glass grid gap-4 rounded-[var(--radius-lg)] p-6">
              <input type="hidden" name="product_slug" value={product.slug} />
              <input type="hidden" name="locale" value={loc} />
              <div className="sr-only" aria-hidden>
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-1)]">{copy.formTitle}</h2>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-2)]">{copy.name}</span>
                <input name="name" required className="w-full min-h-12 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-2)]">{copy.email}</span>
                <input name="email" type="email" required className="w-full min-h-12 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-2)]">{copy.message}</span>
                <textarea name="message" required rows={7} className="w-full min-h-40 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)]" />
              </label>
              <button type="submit" className="button-liquid-primary justify-center">
                {copy.submit}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
