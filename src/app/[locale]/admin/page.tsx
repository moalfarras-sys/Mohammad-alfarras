import { redirect } from "next/navigation";

import { AdminHomeDashboard } from "@/components/admin/admin-home-dashboard";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
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

  if (authenticated) {
    const snapshot = await readSnapshot();
    return <AdminHomeDashboard locale={locale} snapshot={snapshot} />;
  }

  const copy =
    locale === "ar"
      ? {
          brand: "M.A Admin",
          title: "تسجيل الدخول",
          subtitle: "أدخل بياناتك للوصول إلى لوحة التحكم. يمكنك لاحقاً إضافة الموقع إلى الشاشة الرئيسية كتطبيق.",
          invalid: "بيانات الدخول غير صحيحة. حاول مرة أخرى.",
          required: "سجّل الدخول للمتابعة.",
          email: "البريد الإلكتروني",
          password: "كلمة المرور",
          submit: "دخول",
          env: "يجب ضبط ADMIN_PASSWORD داخل بيئة التشغيل قبل تسجيل الدخول.",
          hint: "بعد الدخول: من المتصفح اختر «إضافة إلى الشاشة الرئيسية» لتثبيت لوحة التحكم.",
        }
      : {
          brand: "M.A Admin",
          title: "Sign in",
          subtitle: "Enter your credentials to open the control panel. Add this page to your home screen for an app-like experience.",
          invalid: "Invalid credentials. Try again.",
          required: "Sign in to continue.",
          email: "Email",
          password: "Password",
          submit: "Enter",
          env: "Set ADMIN_PASSWORD in the runtime environment before signing in.",
          hint: "After login: use Add to Home Screen in your browser to pin the admin panel.",
        };

  return (
    <section className="admin-login-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="admin-login-card max-w-lg">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-primary/25 bg-primary/10 shadow-[0_12px_40px_rgba(0,255,135,0.12)]">
            <span className="text-2xl font-black text-primary">M</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">{copy.title}</h1>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{copy.subtitle}</p>
        </div>

        {!process.env.ADMIN_PASSWORD && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
            <p className="text-xs leading-6 text-foreground-muted">{copy.env}</p>
          </div>
        )}

        {query.error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-400">{copy.invalid}</p>
          </div>
        )}

        {query.unauthorized && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
            <p className="text-sm text-foreground-muted">{copy.required}</p>
          </div>
        )}

        <AdminLoginForm
          locale={locale}
          copy={{
            email: copy.email,
            password: copy.password,
            submit: copy.submit,
          }}
        />

        <p className="text-center text-[11px] leading-5 text-foreground-soft">{copy.hint}</p>
      </div>
    </section>
  );
}
