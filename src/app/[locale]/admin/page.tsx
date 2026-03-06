import Link from "next/link";

import { PremiumAdminDashboard } from "@/components/admin/premium-dashboard";
import { loginAdminAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string; unauthorized?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    const loginTitle = locale === "ar" ? "تسجيل دخول القائد" : "Command Center Login";
    const invalidText = locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials";
    const requiredText = locale === "ar" ? "سجّل الدخول للمتابعة" : "Please login to proceed";
    const emailLabel = locale === "ar" ? "البريد الإلكتروني" : "Admin Email";
    const passwordLabel = locale === "ar" ? "كلمة المرور" : "Master Password";
    const loginLabel = locale === "ar" ? "دخول آمن" : "Secure Login";

    return (
      <section className="page-section" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="container" style={{ maxWidth: 450 }}>
          <div className="admin-card glass reveal-item revealed" style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--primary)", display: "grid", placeItems: "center", color: "white", margin: "0 auto 2rem", fontSize: "1.5rem", fontWeight: 900, boxShadow: "0 10px 30px rgba(var(--primary-rgb), 0.4)" }}>M</div>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{loginTitle}</h2>
            <p style={{ opacity: 0.6, marginBottom: "2rem" }}>{locale === "ar" ? "لوحة تحكم محمد الفراس" : "Mohammad Alfarras Dashboard"}</p>

            {query.error ? <p className="error-text" style={{ color: "#ef4444", marginBottom: "1rem" }}>{invalidText}</p> : null}
            {query.unauthorized ? <p className="error-text" style={{ color: "#ef4444", marginBottom: "1rem" }}>{requiredText}</p> : null}

            <form action={loginAdminAction} className="admin-form" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "left" }}>
              <div className="admin-field">
                <label>{emailLabel}</label>
                <input name="email" type="email" defaultValue="mohammad.alfarras@gmail.com" required placeholder="admin@moalfarras.space" />
              </div>
              <div className="admin-field">
                <label>{passwordLabel}</label>
                <input name="password" type="password" required placeholder="••••••••" />
              </div>
              <button className="btn primary w-full" type="submit" style={{ marginTop: "1rem", width: "100%" }}>
                {loginLabel}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const snapshot = await readSnapshot();

  return (
    <div className="admin-page-wrapper">
      <PremiumAdminDashboard locale={locale} snapshot={snapshot} />
    </div>
  );
}
