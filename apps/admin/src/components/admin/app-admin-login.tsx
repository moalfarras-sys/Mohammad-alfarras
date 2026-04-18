import { loginAdminAction } from "@/app/actions";

export function AppAdminLogin({ message }: { message?: string }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)),rgba(6,10,18,0.9)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,135,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.18),transparent_28%)]" />
      <div className="relative mx-auto max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Moalfarras Control Center</p>
          <h1 className="text-3xl font-black text-foreground md:text-4xl">Supabase Admin Sign In</h1>
          <p className="text-sm leading-7 text-foreground-muted">
            Secure access for product releases, MoPlayer content, screenshots, FAQs, and support inbox management.
          </p>
        </div>

        {message ? (
          <div className="rounded-[1.25rem] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-foreground-muted">
            {message}
          </div>
        ) : null}

        <form action={loginAdminAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
              placeholder="admin@moalfarras.space"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-black text-black transition hover:brightness-110"
          >
            Sign In
          </button>
        </form>
      </div>
    </section>
  );
}
