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
          brand: "M.A Admin",
          title: "دخول لوحة التحكم",
          subtitle: "بوابة سريعة للوصول إلى أدوات إدارة الموقع والسيرة الذاتية.",
          invalid: "بيانات الدخول غير صحيحة. حاول مرة أخرى.",
          required: "سجل الدخول للمتابعة.",
          email: "بريد الأدمن",
          password: "كلمة المرور",
          submit: "دخول إلى الاستوديو",
          env: "يجب ضبط ADMIN_PASSWORD داخل بيئة التشغيل قبل تسجيل الدخول.",
        }
      : {
          brand: "M.A Admin",
          title: "Admin access",
          subtitle: "Quick gateway to manage your website, CV, and content.",
          invalid: "Invalid credentials. Try again.",
          required: "Sign in to continue.",
          email: "Admin email",
          password: "Password",
          submit: "Enter studio",
          env: "Set ADMIN_PASSWORD in the runtime environment before signing in.",
        };

  return (
    <section className="admin-login-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="admin-login-card">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8">
            <span className="text-xl font-black text-primary">M</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">{copy.title}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground-muted">{copy.subtitle}</p>
        </div>

        {!process.env.ADMIN_PASSWORD && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/8 p-4">
            <p className="text-xs leading-6 text-foreground-muted">{copy.env}</p>
          </div>
        )}

        {query.error && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/8 p-4">
            <p className="text-sm text-red-400">{copy.invalid}</p>
          </div>
        )}

        {query.unauthorized && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/8 p-4">
            <p className="text-sm text-foreground-muted">{copy.required}</p>
          </div>
        )}

        <form action={loginAdminAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-foreground-muted">{copy.email}</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue="mohammad.alfarras@gmail.com"
              required
              className="w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-foreground-muted">{copy.password}</span>
            <input name="password" type="password" autoComplete="current-password" required className="w-full" />
          </label>
          <button type="submit" className="button-primary-shell w-full justify-center">
            {copy.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
