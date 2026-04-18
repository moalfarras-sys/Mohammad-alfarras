import Image from "next/image";

import { AdminHomeDashboard } from "@/components/admin/admin-home-dashboard";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminProfileDocument, resolveBrandAssetPaths } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string; unauthorized?: string }>;
}) {
  const [{ locale }, query, authenticated, snapshot] = await Promise.all([
    params,
    searchParams,
    isAdminAuthenticated(),
    readSnapshot(),
  ]);

  if (authenticated) {
    return <AdminHomeDashboard locale={locale} snapshot={snapshot} />;
  }

  const brandMedia = resolveBrandAssetPaths(snapshot);
  const adminProfile = getAdminProfileDocument(snapshot);
  const copy =
    locale === "ar"
      ? {
          brand: "Moalfarras Control Center",
          title: "دخول لوحة التحكم",
          subtitle:
            "واجهة إدارية حقيقية لإدارة صفحات الموقع والمشاريع والسيرة والوسائط وملفات PDF من مكان واحد.",
          invalid: "بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور ثم حاول مجدداً.",
          required: "سجل الدخول للمتابعة إلى مركز التحكم.",
          email: "البريد الإلكتروني",
          password: "كلمة المرور",
          submit: "دخول",
          env: "اضبط ADMIN_ALLOWLIST و ADMIN_PASSWORD_HASH و ADMIN_SESSION_SECRET داخل بيئة التشغيل قبل استخدام لوحة التحكم.",
          hint: "يمكن تثبيت اللوحة كتطبيق من المتصفح بعد تسجيل الدخول.",
          secure: "وصول إداري محمي",
          bullets: [
            "الموقع العام واللوحة يستخدمان نفس المحتوى.",
            "إدارة ثنائية اللغة للعربية والإنجليزية.",
            "تحكم من الجوال أو سطح المكتب.",
          ],
        }
      : {
          brand: "Moalfarras Control Center",
          title: "Control Center sign in",
          subtitle: "A premium internal workspace for pages, projects, CV content, media, and PDF operations.",
          invalid: "Invalid credentials. Check your email and password and try again.",
          required: "Sign in to continue to the Control Center.",
          email: "Email",
          password: "Password",
          submit: "Sign in",
          env: "Set ADMIN_ALLOWLIST, ADMIN_PASSWORD_HASH, and ADMIN_SESSION_SECRET in the runtime environment before signing in.",
          hint: "After login, you can pin this screen as an app from the browser menu.",
          secure: "Protected internal access",
          bullets: [
            "The website and CMS read the same content model.",
            "Bilingual editing for Arabic and English.",
            "Optimized for mobile and desktop control.",
          ],
        };

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 md:px-8"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,229,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(180deg,rgba(7,10,18,0.88),rgba(7,10,18,0.96))]" />

      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-primary">
              {copy.secure}
            </span>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/20">
                <Image src={brandMedia.logo} alt="Moalfarras logo" width={72} height={72} className="h-14 w-14 object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">{copy.brand}</p>
                <h2 className="mt-2 text-3xl font-black text-foreground">{adminProfile.displayName[locale]}</h2>
                <p className="mt-2 text-sm text-foreground-muted">{adminProfile.role[locale]}</p>
              </div>
            </div>
            <p className="mt-8 max-w-xl text-base leading-8 text-foreground-muted">{copy.subtitle}</p>
          </div>

          <div className="grid gap-4">
            {copy.bullets.map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-white/8 bg-black/10 px-4 py-3 text-sm text-foreground-muted">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)),rgba(7,10,18,0.86)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:p-8">
          <div className="mx-auto max-w-lg space-y-5">
            <div className="text-center lg:text-start">
              <div className="mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-[1.7rem] border border-primary/25 bg-primary/10 shadow-[0_18px_50px_rgba(0,229,255,0.14)] lg:mx-0">
                <Image src={brandMedia.logo} alt="Moalfarras logo" width={56} height={56} className="h-11 w-11 object-contain" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">{copy.brand}</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">{copy.title}</h1>
              <p className="mt-3 text-sm leading-8 text-foreground-muted">{copy.subtitle}</p>
            </div>

            {!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD && (
              <div className="rounded-[1.4rem] border border-amber-400/25 bg-amber-500/10 p-4">
                <p className="text-xs leading-6 text-foreground-muted">{copy.env}</p>
              </div>
            )}

            {query.error && (
              <div className="rounded-[1.4rem] border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-sm font-semibold text-red-300">{copy.invalid}</p>
              </div>
            )}

            {query.unauthorized && (
              <div className="rounded-[1.4rem] border border-amber-400/25 bg-amber-500/10 p-4">
                <p className="text-sm text-foreground-muted">{copy.required}</p>
              </div>
            )}

            <div className="rounded-[1.8rem] border border-white/10 bg-black/12 p-5">
              <AdminLoginForm
                locale={locale}
                copy={{
                  email: copy.email,
                  password: copy.password,
                  submit: copy.submit,
                }}
              />
            </div>

            <p className="text-center text-[11px] leading-6 text-foreground-soft">{copy.hint}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
