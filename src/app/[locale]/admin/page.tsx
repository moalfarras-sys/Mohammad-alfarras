import { AdminDashboard } from "@/components/admin/dashboard";
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
    const loginTitle = locale === "ar" ? "تسجيل دخول لوحة التحكم" : "Control Panel Login";
    const invalidText = locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials";
    const requiredText = locale === "ar" ? "سجّل الدخول للمتابعة" : "Please login to continue";
    const emailLabel = locale === "ar" ? "البريد الإلكتروني" : "Admin email";
    const passwordLabel = locale === "ar" ? "كلمة المرور" : "Password";
    const loginLabel = locale === "ar" ? "دخول آمن" : "Secure login";
    const envText =
      locale === "ar"
        ? "يجب ضبط ADMIN_PASSWORD في بيئة التشغيل قبل الدخول."
        : "Set ADMIN_PASSWORD in the runtime environment before signing in.";

    return (
      <section className="page-section" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="container" style={{ maxWidth: 460 }}>
          <div className="admin-card glass revealed" style={{ padding: "3rem", textAlign: "center" }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "grid",
                placeItems: "center",
                color: "white",
                margin: "0 auto 1.75rem",
                fontSize: "1.6rem",
                fontWeight: 900,
                boxShadow: "0 18px 44px rgba(15, 118, 110, 0.28)",
              }}
            >
              M
            </div>
            <h1 style={{ fontSize: "1.9rem", marginBottom: "0.5rem" }}>{loginTitle}</h1>
            <p style={{ opacity: 0.72, marginBottom: "2rem" }}>
              {locale === "ar" ? "لوحة إدارة المحتوى والتصميم والوسائط" : "Content, design, and media control center"}
            </p>

            {!process.env.ADMIN_PASSWORD ? (
              <p className="error-text" style={{ color: "#ef4444", marginBottom: "1rem" }}>
                {envText}
              </p>
            ) : null}
            {query.error ? (
              <p className="error-text" style={{ color: "#ef4444", marginBottom: "1rem" }}>
                {invalidText}
              </p>
            ) : null}
            {query.unauthorized ? (
              <p className="error-text" style={{ color: "#ef4444", marginBottom: "1rem" }}>
                {requiredText}
              </p>
            ) : null}

            <form
              action={loginAdminAction}
              className="admin-form"
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "start" }}
            >
              <div className="admin-field">
                <label>{emailLabel}</label>
                <input name="email" type="email" autoComplete="username" defaultValue="mohammad.alfarras@gmail.com" required />
              </div>
              <div className="admin-field">
                <label>{passwordLabel}</label>
                <input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
              </div>
              <button className="btn primary" type="submit" style={{ marginTop: "0.5rem", width: "100%" }}>
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
      <AdminDashboard locale={locale} snapshot={snapshot} />
    </div>
  );
}
