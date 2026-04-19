import type { Metadata } from "next";

import { AppAdminDashboard } from "@/components/admin/app-admin-dashboard";
import { AppAdminLogin } from "@/components/admin/app-admin-login";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { readAdminAppData } from "@/lib/app-ecosystem";

export const metadata: Metadata = {
  title: "Moalfarras Control Center",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; unauthorized?: string; forbidden?: string; updated?: string }>;
}) {
  const [query, admin] = await Promise.all([searchParams, getAuthenticatedAdmin()]);

  if (!admin) {
    const message = query.error
      ? "Invalid credentials or this user does not have an admin role yet."
      : query.forbidden
        ? "This account is authenticated but does not have the required admin role."
        : query.unauthorized
          ? "Please sign in with a Supabase admin account to continue."
          : undefined;

    return (
      <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 md:px-8 md:py-16">
        <AppAdminLogin message={message} />
      </main>
    );
  }

  const data = await readAdminAppData("moplayer");

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-10 md:px-8 md:py-12">
      <AppAdminDashboard
        adminEmail={admin.email}
        role={admin.role}
        updated={query.updated}
        product={data.product}
        faqs={data.faqs}
        screenshots={data.screenshots}
        releases={data.releases}
        supportRequests={data.supportRequests}
      />
    </main>
  );
}
