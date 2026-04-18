import { loginAdminAction } from "@/app/admin/actions";
import { Lock } from "lucide-react";

export function AppAdminLogin({ message }: { message?: string }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center font-sans antialiased">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0A0F1A] p-8 shadow-sm ring-1 ring-white/5 relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent" />
        
        <div className="mb-8 space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Admin Sign In</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Secure access to manage MoPlayer releases, content, and support infrastructure.
          </p>
        </div>

        {message ? (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500 text-center text-balance">
            {message}
          </div>
        ) : null}

        <form action={loginAdminAction} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Email Address
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-colors focus:border-[#00E5FF] focus:bg-white/10 focus:outline-none"
              placeholder="admin@moalfarras.space"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-colors focus:border-[#00E5FF] focus:bg-white/10 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
          >
            Authenticate
          </button>
        </form>
      </div>
    </section>
  );
}
