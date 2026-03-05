import Link from "next/link";

import { AdminDashboard } from "@/components/admin/dashboard";
import { AdminLiteDashboard } from "@/components/admin/lite-dashboard";
import { loginAdminAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string; unauthorized?: string; mode?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    const loginTitle = locale === "ar" ? "تسجيل دخول الأدمن" : "Admin Login";
    const invalidText = locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials";
    const requiredText = locale === "ar" ? "سجّل الدخول أولًا" : "Please login first";
    const emailLabel = locale === "ar" ? "البريد الإلكتروني" : "Email";
    const passwordLabel = locale === "ar" ? "كلمة المرور" : "Password";
    const loginLabel = locale === "ar" ? "دخول" : "Login";

    return (
      <section className="page-section">
        <div className="container section-stack admin-login-card">
          <h2>{loginTitle}</h2>
          {query.error ? <p className="error-text">{invalidText}</p> : null}
          {query.unauthorized ? <p className="error-text">{requiredText}</p> : null}
          <form action={loginAdminAction} className="token-form">
            <label>
              <span>{emailLabel}</span>
              <input name="email" type="email" defaultValue="mohammad.alfarras@gmail.com" required />
            </label>
            <label>
              <span>{passwordLabel}</span>
              <input name="password" type="password" required />
            </label>
            <button className="btn primary" type="submit">
              {loginLabel}
            </button>
          </form>
        </div>
      </section>
    );
  }

  const snapshot = await readSnapshot();
  const isAdvanced = query.mode === "advanced";

  return (
    <section className="page-section">
      <div className="container section-stack">
        <h1>{locale === "ar" ? "لوحة التحكم" : "Admin Control Panel"}</h1>
        <p>
          {locale === "ar"
            ? "لوحة إدارة احترافية مع وضع مبسط للموبايل ووضع متقدم عند الحاجة."
            : "Professional admin with a mobile-friendly simple mode and an advanced mode when needed."}
        </p>
        {isAdvanced ? (
          <>
            <div className="actions-row">
              <Link href={`/${locale}/admin`} className="btn secondary">
                {locale === "ar" ? "العودة للوضع المبسط" : "Back to simple mode"}
              </Link>
            </div>
            <AdminDashboard locale={locale} snapshot={snapshot} />
          </>
        ) : (
          <AdminLiteDashboard locale={locale} snapshot={snapshot} />
        )}
      </div>
    </section>
  );
}
