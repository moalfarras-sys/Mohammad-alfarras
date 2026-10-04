import Link from "next/link";

import { PageHero } from "@/components/studio/primitives";
import type { LegalPageContent } from "@/lib/legal-pages";
import type { Locale } from "@/types/cms";

type LegalSection = { title: string; body: string[] };

/**
 * One calm document layout for every legal page: a hero, a sticky table of
 * contents and readable numbered sections. Server-rendered, no client JS.
 */
export function LegalDocument({
  locale,
  label,
  title,
  description,
  updated,
  sections,
}: {
  locale: Locale;
  label: string;
  title: string;
  description?: string;
  updated?: string;
  sections: LegalSection[];
}) {
  const isAr = locale === "ar";
  const visible = sections.filter((section) => section.body.some((line) => line.trim()));
  const related = [
    { href: `/${locale}/privacy`, label: isAr ? "سياسة الخصوصية" : "Privacy policy" },
    { href: `/${locale}/impressum`, label: isAr ? "البيانات القانونية" : "Impressum" },
    { href: `/${locale}/terms`, label: isAr ? "الشروط" : "Terms" },
    { href: `/${locale}/support`, label: isAr ? "الدعم" : "Support" },
    { href: `/${locale}/contact`, label: isAr ? "تواصل" : "Contact" },
  ];

  return (
    <div className="st-page st-legal">
      <PageHero pill={label} title={title} lead={description}>
        {updated ? <p className="st-legal-updated st-mono">{updated}</p> : null}
      </PageHero>

      <section className="st-section st-section--tight">
        <div className="st-container st-legal-grid">
          <nav className="st-legal-toc" aria-label={isAr ? "محتويات الصفحة" : "On this page"}>
            <p className="st-meta st-mono">{isAr ? "المحتويات" : "On this page"}</p>
            <ol>
              {visible.map((section, index) => (
                <li key={section.title}>
                  <a href={`#legal-${index + 1}`}>
                    <span className="st-mono">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
            <p className="st-meta st-mono st-legal-related-label">{isAr ? "صفحات ذات صلة" : "Related"}</p>
            <ul>
              {related.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} prefetch={false}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <article className="st-legal-body">
            {visible.map((section, index) => (
              <section key={section.title} id={`legal-${index + 1}`} className="st-legal-section">
                <h2>
                  <span className="st-mono" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                {section.body
                  .filter((line) => line.trim())
                  .map((line) => (
                    <p key={line}>{line}</p>
                  ))}
              </section>
            ))}
          </article>
        </div>
      </section>
    </div>
  );
}

export function LegalPage({ content, locale }: { content: LegalPageContent; locale: Locale; heroImage?: string }) {
  const isAr = locale === "ar";
  return (
    <LegalDocument
      locale={locale}
      label={isAr ? "قانوني" : "Legal"}
      title={content.title}
      description={content.description}
      updated={isAr ? `آخر تحديث: ${content.updated}` : `Last updated: ${content.updated}`}
      sections={content.sections}
    />
  );
}
