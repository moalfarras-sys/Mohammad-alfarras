import { redirect } from "next/navigation";

import { loginAdminAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/auth";
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

  if (authenticated) {
    redirect(`/${locale}/admin/cv`);
  }

  const copy =
    locale === "ar"
      ? {
          title: "دخول لوحة التحكم",
          subtitle: "هذه الصفحة مجرد بوابة سريعة. التحكم الكامل بالسيرة والـ PDF داخل CV Studio.",
          invalid: "بيانات الدخول غير صحيحة.",
          required: "سجل الدخول للمتابعة.",
          email: "بريد الأدمن",
          password: "كلمة المرور",
          submit: "دخول إلى الاستوديو",
          env: "يجب ضبط ADMIN_PASSWORD داخل بيئة التشغيل قبل تسجيل الدخول.",
        }
      : {
          title: "Admin access",
          subtitle: "This page is only a quick gateway. Full CV control lives inside the CV Studio.",
          invalid: "Invalid credentials.",
          required: "Sign in to continue.",
          email: "Admin email",
          password: "Password",
          submit: "Enter studio",
          env: "Set ADMIN_PASSWORD in the runtime environment before signing in.",
        };

  return (
    <section className="admin-login-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="admin-login-card">
        <span className="eyebrow">Admin</span>
        <h1 className="headline-display text-4xl font-semibold text-foreground">{copy.title}</h1>
        <p className="text-sm leading-7 text-foreground-muted">{copy.subtitle}</p>

        {!process.env.ADMIN_PASSWORD ? (
          <div className="glass-panel-subtle rounded-[1.4rem] p-4">
            <p className="text-sm text-foreground-muted">{copy.env}</p>
          </div>
        ) : null}

        {query.error ? (
          <div className="glass-panel-subtle rounded-[1.4rem] border-red-400/20 bg-red-500/8 p-4">
            <p className="text-sm text-foreground-muted">{copy.invalid}</p>
          </div>
        ) : null}

        {query.unauthorized ? (
          <div className="glass-panel-subtle rounded-[1.4rem] p-4">
            <p className="text-sm text-foreground-muted">{copy.required}</p>
          </div>
        ) : null}

        <form action={loginAdminAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <label className="space-y-2">
            <span className="text-sm text-foreground-muted">{copy.email}</span>
            <input name="email" type="email" autoComplete="username" defaultValue="mohammad.alfarras@gmail.com" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-foreground-muted">{copy.password}</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="button-primary-shell w-full justify-center">
            {copy.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
