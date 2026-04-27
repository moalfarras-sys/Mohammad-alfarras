import { loginAdminAction } from "@/app/actions";
import { ShieldCheck, Terminal, Lock } from "lucide-react";

export function AppAdminLogin({ message, initialEmail }: { message?: string; initialEmail?: string }) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)),rgba(6,10,18,0.95)] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl md:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,135,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(108,99,255,0.15),transparent_38%)]" />
      
      <div className="relative mx-auto max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-2xl backdrop-blur-xl">
             <Terminal className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <p className="eyebrow mx-auto">Access Restricted</p>
          <h1 className="headline-display text-4xl font-black text-foreground">Digital OS Login</h1>
          <p className="text-sm leading-7 text-foreground-muted">
            Authenticate to manage the Mohammad Alfarras ecosystem, MoPlayer releases, and website CMS.
          </p>
        </div>

        {message ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}

        <form action={loginAdminAction} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground-soft">
              Admin Identity (Email)
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              defaultValue={initialEmail || "admin@moalfarras.space"}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              placeholder="admin@moalfarras.space"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground-soft">
              Security Key (Password)
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="button-primary-shell w-full py-4 text-sm uppercase tracking-widest"
          >
            Authenticate Identity
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-foreground-soft">
          <ShieldCheck className="h-3 w-3 text-primary" />
          <span>AES-256 Encrypted Session</span>
        </div>
      </div>
    </section>
  );
}
