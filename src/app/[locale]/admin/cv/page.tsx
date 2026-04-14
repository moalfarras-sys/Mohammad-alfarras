import { CvBuilderStudio } from "@/components/admin/cv-builder-studio";
import { loginAdminAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import { getCvBuilderData } from "@/lib/cv-builder";
import type { Locale } from "@/types/cms";

export default async function AdminCvPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string; unauthorized?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    const copy =
      locale === "ar"
        ? {
            title: "CV Studio",
            subtitle: "لوحة السيرة الاحترافية: تعديل مباشر، معاينة حية، وتصدير PDF مرتب.",
            invalid: "بيانات الدخول غير صحيحة.",
            required: "سجل الدخول للمتابعة.",
            email: "بريد الأدمن",
            password: "كلمة المرور",
            submit: "دخول إلى الاستوديو",
            env: "يجب ضبط ADMIN_PASSWORD قبل تسجيل الدخول.",
          }
        : {
            title: "CV Studio",
            subtitle: "Professional CV control panel with live preview and polished PDF export.",
            invalid: "Invalid credentials.",
            required: "Sign in to continue.",
            email: "Admin email",
            password: "Password",
            submit: "Enter studio",
            env: "Set ADMIN_PASSWORD before signing in.",
          };

    return (
      <section className="admin-login-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="admin-login-card">
          <span className="eyebrow">CV Studio</span>
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

  const snapshot = await readSnapshot();
  const cvBuilder = getCvBuilderData(snapshot);

  return <CvBuilderStudio locale={locale} snapshot={snapshot} initialData={cvBuilder} />;
}
