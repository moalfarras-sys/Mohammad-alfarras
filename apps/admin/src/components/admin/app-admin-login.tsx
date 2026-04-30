import Image from "next/image";
import { Lock, Radar, ShieldCheck, Smartphone, TerminalSquare } from "lucide-react";

import { loginAdminAction } from "@/app/actions";

export function AppAdminLogin({ message, initialEmail }: { message?: string; initialEmail?: string }) {
  return (
    <section className="admin-login-stage mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-7xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative overflow-hidden rounded-[2.25rem] border border-cyan-200/10 bg-black/55 p-6 shadow-[0_40px_140px_rgba(0,0,0,0.72)] backdrop-blur-3xl sm:p-8 md:rounded-[3rem] md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(91,220,255,0.2),transparent_28%),radial-gradient(circle_at_88%_72%,rgba(255,255,255,0.08),transparent_26%)]" />
        <div className="relative z-10">
          <div className="mb-10 flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] border border-cyan-200/20 bg-cyan-200/8 shadow-[0_0_45px_rgba(91,220,255,0.18)]">
              <Image src="/images/logo.png" alt="Moalfarras Admin" width={52} height={52} className="h-12 w-12 rounded-2xl object-contain" priority />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200">Moalfarras OS</p>
              <h1 className="headline-display text-3xl font-black tracking-tight text-white sm:text-4xl">Command Login</h1>
            </div>
          </div>

          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-cyan-200/15 bg-cyan-200/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              Secure PWA Control Center
            </p>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl">
              Control your website, MoPlayer, releases, and device fleet from one clear place.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Sign in to operate the public brand, publish APK releases, manage runtime switches, monitor activations, and keep the ecosystem clean from one focused mobile-first dashboard.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Radar className="h-4 w-4" />, label: "Fleet HUD" },
              { icon: <TerminalSquare className="h-4 w-4" />, label: "CMD+K Ready" },
              { icon: <Smartphone className="h-4 w-4" />, label: "PWA Native Feel" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-white">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-200/8 text-cyan-200">
                  {item.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035)),rgba(0,0,0,0.72)] p-5 shadow-[0_34px_110px_rgba(0,0,0,0.62)] backdrop-blur-3xl sm:p-7 md:rounded-[3rem] md:p-9">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <div className="relative z-10 space-y-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">Access Restricted</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Authenticate identity</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          {message ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}

          <form action={loginAdminAction} className="space-y-5">
            <div className="admin-field">
              <label htmlFor="admin-email">Admin identity</label>
              <input id="admin-email" name="email" type="email" required defaultValue={initialEmail || "admin@moalfarras.space"} placeholder="admin@moalfarras.space" />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">Security key</label>
              <input id="admin-password" name="password" type="password" required placeholder="Enter password" />
            </div>
            <button type="submit" className="admin-primary-button w-full">
              Unlock Command Center
            </button>
          </form>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.7)]" />
              Encrypted admin session
            </div>
            <p className="text-xs leading-6 text-slate-400">
              The dashboard stays private, no-index, and optimized for standalone mobile use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
