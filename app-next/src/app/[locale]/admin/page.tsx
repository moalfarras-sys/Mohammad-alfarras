import { AdminDashboard } from "@/components/admin/dashboard";
import { loginAdminAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/auth";
import { readThemeTokens, readVideos } from "@/lib/content/store";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; unauthorized?: string }>;
}) {
  const params = await searchParams;
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <section className="page-section">
        <div className="container section-stack admin-login-card">
          <h2>Admin Login</h2>
          {params.error ? <p className="error-text">Invalid credentials</p> : null}
          {params.unauthorized ? <p className="error-text">Please login first</p> : null}
          <form action={loginAdminAction} className="token-form">
            <label>
              <span>Email</span>
              <input name="email" type="email" defaultValue="mohammad.alfarras@gmail.com" required />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" required />
            </label>
            <button className="btn primary" type="submit">
              Login
            </button>
          </form>
        </div>
      </section>
    );
  }

  const tokensLight = await readThemeTokens("light");
  const tokensDark = await readThemeTokens("dark");
  const videos = await readVideos();

  return (
    <section className="page-section">
      <div className="container section-stack">
        <h1>Admin Control Panel</h1>
        <p>Manage theme tokens and YouTube content. Full schema is ready for Supabase migration.</p>
        <AdminDashboard tokensLight={tokensLight} tokensDark={tokensDark} videos={videos} />
      </div>
    </section>
  );
}
