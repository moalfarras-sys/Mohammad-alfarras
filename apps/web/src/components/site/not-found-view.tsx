import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Not-found boundaries receive no route params, so the page speaks both
// languages instead of guessing one.
const routes = [
  { href: "/en/work", en: "Work", ar: "الأعمال" },
  { href: "/en/services", en: "Services", ar: "الخدمات" },
  { href: "/en/apps/moplayer", en: "MoPlayer", ar: "MoPlayer" },
  { href: "/en/moos", en: "MoOS", ar: "MoOS" },
  { href: "/en/contact", en: "Contact", ar: "تواصل" },
];

export function NotFoundView() {
  return (
    <section className="st-404" aria-labelledby="not-found-title">
      <div>
        <p className="st-404-code" aria-hidden="true">
          404
        </p>
        <h1 id="not-found-title">
          Page not found · <span lang="ar" dir="rtl">الصفحة غير موجودة</span>
        </h1>
        <p className="st-404-lead">The link may be old, moved or mistyped. Pick a route below to continue.</p>
        <p className="st-404-lead" lang="ar" dir="rtl">
          ربما تغيّر الرابط أو كُتب بشكل غير صحيح. اختر وجهة من الأسفل للمتابعة.
        </p>
        <div className="st-actions st-actions--center">
          <Link href="/en" prefetch={false} className="st-btn st-btn--primary">
            English home
            <ArrowUpRight size={17} aria-hidden />
          </Link>
          <Link href="/ar" prefetch={false} className="st-btn st-btn--ghost" lang="ar">
            الرئيسية بالعربية
          </Link>
        </div>
        <ul className="st-404-routes">
          {routes.map((route) => (
            <li key={route.href}>
              <Link href={route.href} prefetch={false}>
                {route.en}
                {route.ar !== route.en ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span lang="ar" dir="rtl">
                      {route.ar}
                    </span>
                  </>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
