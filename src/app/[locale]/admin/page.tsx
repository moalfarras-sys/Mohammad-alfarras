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
      <section className="page-section" style={{ minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", zIndex: 10 }}>
        <div className="container" style={{ maxWidth: 440 }}>
          <div className="admin-card" style={{ padding: "3.5rem 3rem", textAlign: "center", position: "relative" }}>
            {/* Glowing Backdrop for Logo */}
            <div style={{ position: "absolute", top: "3.5rem", left: "50%", transform: "translate(-50%, -50%)", width: "120px", height: "120px", background: "rgba(var(--primary-rgb), 0.3)", filter: "blur(40px)", borderRadius: "50%", zIndex: 0 }}></div>

            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "grid",
                placeItems: "center",
                color: "white",
                margin: "0 auto 2rem",
                fontSize: "1.8rem",
                fontWeight: 900,
                boxShadow: "0 10px 30px rgba(var(--primary-rgb), 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)",
                position: "relative",
                zIndex: 1
              }}
            >
              M
            </div>

            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", fontWeight: 800, background: "linear-gradient(135deg, var(--text), var(--primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {loginTitle}
            </h1>
            <p style={{ opacity: 0.7, marginBottom: "2.5rem", fontSize: "1.05rem" }}>
              {locale === "ar" ? "لوحة إدارة المحتوى والتصميم والوسائط" : "Content, design, and media control center"}
            </p>

            {!process.env.ADMIN_PASSWORD ? (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <p style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>{envText}</p>
              </div>
            ) : null}
            {query.error ? (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <p style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>{invalidText}</p>
              </div>
            ) : null}
            {query.unauthorized ? (
              <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <p style={{ color: "#f59e0b", margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>{requiredText}</p>
              </div>
            ) : null}

            <form
              action={loginAdminAction}
              className="galaxy-form"
              style={{ textAlign: "start" }}
            >
              <label>
                <span>{emailLabel}</span>
                <input name="email" type="email" autoComplete="username" defaultValue="mohammad.alfarras@gmail.com" required style={{ padding: "1rem" }} />
              </label>
              <label>
                <span>{passwordLabel}</span>
                <input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" style={{ padding: "1rem" }} />
              </label>
              <button className="btn primary" type="submit" style={{ marginTop: "1rem", width: "100%", padding: "1rem", fontSize: "1.05rem" }}>
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
