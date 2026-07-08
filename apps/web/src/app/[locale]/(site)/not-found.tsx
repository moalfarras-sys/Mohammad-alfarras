import Link from "next/link";

// 404 boundary for the (site) group: notFound() thrown from site pages (e.g. an
// invalid product slug) renders here, inside the navbar/footer shell, instead of
// falling back to the bare [locale]/not-found.tsx outside the site layout.
export default function SiteNotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 py-20">
      <div className="section-frame relative w-full overflow-hidden px-6 py-10 text-center md:px-10 md:py-12">
        <span className="eyebrow">404</span>
        <h1 className="headline-display mt-4 text-4xl font-semibold text-foreground md:text-5xl">الصفحة غير متاحة / Page not found</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-foreground-muted md:text-lg">
          الرابط الذي فتحته غير موجود أو تم نقله. يمكنك العودة إلى الرئيسية، تصفح التطبيقات، أو التواصل مباشرة.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/ar" className="button-primary-shell">
            الرئيسية / Home
          </Link>
          <Link href="/ar/apps" className="button-secondary-shell">
            التطبيقات / Apps
          </Link>
          <Link href="/ar/contact" className="button-secondary-shell">
            تواصل / Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
