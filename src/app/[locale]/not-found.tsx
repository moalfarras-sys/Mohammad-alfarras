import Link from "next/link";

export default function LocaleNotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-6 py-20">
      <div className="section-frame relative w-full overflow-hidden px-6 py-10 text-center md:px-10 md:py-12">
        <span className="eyebrow">404</span>
        <h1 className="headline-display mt-4 text-5xl font-semibold text-foreground md:text-6xl">الصفحة غير متاحة / Page not found</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-foreground-muted md:text-lg">
          يمكنك العودة إلى الصفحة الرئيسية أو الدخول مباشرة إلى صفحة التواصل.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/ar" className="button-primary-shell">
            العربية
          </Link>
          <Link href="/en" className="button-secondary-shell">
            English
          </Link>
        </div>
      </div>
    </section>
  );
}
