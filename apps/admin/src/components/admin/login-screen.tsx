"use client";

import { Globe, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { loginAdminAction } from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";

export function LoginScreen({ message, initialEmail }: { message?: string; initialEmail?: string }) {
  const { t, locale, toggle } = useLocale();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 start-[-60px] h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="absolute bottom-[-80px] end-[-40px] h-80 w-80 rounded-full bg-[rgba(99,102,241,0.18)] blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand side */}
        <section className="glass relative hidden flex-col justify-between overflow-hidden rounded-[28px] p-9 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--accent-soft)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(34,211,238,0.25),rgba(99,102,241,0.22))] text-xs font-black text-[var(--accent)]">
                MF
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">Moalfarras OS</p>
              <p className="text-sm font-bold text-[var(--text-2)]">Control Center</p>
            </div>
          </div>

          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-2)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              {t({ en: "One panel, full control", ar: "لوحة واحدة، تحكم كامل" })}
            </span>
            <h1 className="headline text-4xl font-black text-[var(--text-1)]">
              {t({
                en: "Run your website and both MoPlayer apps from one beautiful place.",
                ar: "أدِر موقعك وتطبيقَي MoPlayer من مكان واحد أنيق.",
              })}
            </h1>
            <p className="max-w-md text-sm leading-7 text-[var(--text-2)]">
              {t({
                en: "Content, releases, runtime switches, activations, devices, messages, and user replies — clear and mobile-first.",
                ar: "المحتوى، الإصدارات، مفاتيح التشغيل، التفعيلات، الأجهزة، الرسائل، والردود على المستخدمين — بوضوح وعلى الجوال أولاً.",
              })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Globe className="h-4 w-4" />, label: t({ en: "Website", ar: "الموقع" }) },
              { icon: <ShieldCheck className="h-4 w-4" />, label: t({ en: "MoPlayer", ar: "موبلاير" }) },
              { icon: <Sparkles className="h-4 w-4" />, label: t({ en: "Pro", ar: "برو" }) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--line)] bg-white/[0.03] p-4">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
                  {item.icon}
                </span>
                <p className="text-[11px] font-black text-[var(--text-2)]">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form side */}
        <section className="glass-solid relative overflow-hidden rounded-[28px] p-7 sm:p-9">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[var(--accent)]">
                {t({ en: "Access restricted", ar: "وصول محصور" })}
              </p>
              <h2 className="mt-1.5 text-2xl font-black text-[var(--text-1)]">{t({ en: "Sign in", ar: "تسجيل الدخول" })}</h2>
            </div>
            <button type="button" onClick={toggle} className="btn btn-sm">
              {locale === "ar" ? "EN" : "ع"}
            </button>
          </div>

          {message ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] p-4 text-sm leading-6 text-[var(--warning)]">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}

          <form action={loginAdminAction} className="space-y-4">
            <Field label={t({ en: "Admin email", ar: "البريد الإداري" })} name="email" type="email" required defaultValue={initialEmail ?? ""} placeholder="admin@moalfarras.space" />
            <Field label={t({ en: "Password", ar: "كلمة المرور" })} name="password" type="password" required placeholder="••••••••" />
            <button type="submit" className="btn btn-primary btn-block mt-2 h-12">
              {t({ en: "Enter Control Center", ar: "دخول مركز التحكم" })}
            </button>
          </form>

          <p className="mt-6 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/[0.03] p-3 text-xs leading-6 text-[var(--text-3)]">
            <span className="live-dot" />
            {t({ en: "Private, no-index, encrypted session.", ar: "خاص، غير مفهرس، وجلسة مشفّرة." })}
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
