import Image from "next/image";
import Link from "next/link";

import type { LegalPageContent } from "@/lib/legal-pages";
import type { Locale } from "@/types/cms";

export function LegalPage({ content, locale, heroImage }: { content: LegalPageContent; locale: Locale; heroImage: string }) {
  const isAr = locale === "ar";

  return (
    <main className="fresh-page" dir={isAr ? "rtl" : "ltr"}>
      <section className="fresh-hero">
        <div className="fresh-hero-copy">
          <p className="fresh-eyebrow">{isAr ? "قانوني" : "Legal"}</p>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <p className="fresh-note mt-6">{isAr ? `آخر تحديث: ${content.updated}` : `Last updated: ${content.updated}`}</p>
        </div>
        <aside className="fresh-card">
          <div className="relative mb-5 aspect-video overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={heroImage}
              alt={content.title}
              fill
              sizes="(max-width: 900px) 92vw, 420px"
              className="fresh-image"
              priority
              unoptimized={heroImage.startsWith("http")}
            />
          </div>
          <p className="fresh-eyebrow">{isAr ? "روابط مهمة" : "Important links"}</p>
          <div className="fresh-channel-list">
            <Link href={`/${locale}/privacy`}>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
            <Link href={`/${locale}/support`}>{isAr ? "الدعم" : "Support"}</Link>
            <Link href={`/${locale}/contact`}>{isAr ? "تواصل" : "Contact"}</Link>
          </div>
        </aside>
      </section>

      <section className="fresh-section">
        <div className="grid gap-4">
          {content.sections
            .filter((section) => section.body.length)
            .map((section) => (
              <article key={section.title} className="fresh-card">
                <p className="fresh-eyebrow">{section.title}</p>
                <div className="grid gap-3">
                  {section.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
