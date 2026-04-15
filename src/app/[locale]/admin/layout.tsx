import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import { logoutAdminAction } from "@/lib/admin-actions";
import type { Locale } from "@/types/cms";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <>{children}</>;
  }

  const isArabic = locale === "ar";
  const nav = isArabic
    ? { dashboard: "لوحة التحكم", cv: "CV Studio", projects: "الأعمال", back: "عودة للموقع", logout: "تسجيل خروج" }
    : { dashboard: "Dashboard", cv: "CV Studio", projects: "Projects", back: "Back to site", logout: "Logout" };

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen">
      <header className="admin-topbar">
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/admin`} className="admin-topbar-brand">
            M<span className="text-primary">.</span>A
          </Link>
          <span className="hidden text-xs font-bold uppercase tracking-[0.2em] text-foreground-soft sm:inline">
            Admin
          </span>
        </div>

        <nav className="admin-topbar-nav" aria-label="Admin navigation">
          <Link href={`/${locale}/admin`} className="admin-topbar-link">
            {nav.dashboard}
          </Link>
          <Link href={`/${locale}/admin/cv`} className="admin-topbar-link">
            {nav.cv}
          </Link>
          <Link href={`/${locale}/admin/projects`} className="admin-topbar-link">
            {nav.projects}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            target="_blank"
            className="hidden text-xs font-semibold text-foreground-muted hover:text-primary sm:inline-flex"
          >
            {nav.back} &rarr;
          </Link>
          <form action={logoutAdminAction}>
            <button type="submit" className="admin-topbar-logout">
              {nav.logout}
            </button>
          </form>
        </div>
      </header>

      <main className="pt-16">{children}</main>
    </div>
  );
}
