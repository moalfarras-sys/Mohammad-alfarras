import type { Metadata } from "next";

import { AdminOS } from "@/components/admin/admin-os";
import { AppAdminLogin } from "@/components/admin/app-admin-login";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { readAdminAppData } from "@/lib/app-ecosystem";
import { readWebsiteCmsData } from "@/lib/website-cms";
import { managedApps } from "@moalfarras/shared/app-products";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; unauthorized?: string; forbidden?: string; updated?: string; email?: string; app?: string }>;
}) {
  const [query, admin] = await Promise.all([searchParams, getAuthenticatedAdmin()]);

  if (!admin) {
    const message = query.error
      ? decodeURIComponent(query.error)
      : query.forbidden
        ? "This account is authenticated but does not have the required admin role."
        : query.unauthorized
          ? "Please sign in with a Supabase admin account to continue."
          : undefined;

    return (
      <main className="admin-shell min-h-screen px-4 py-5 sm:px-6 md:px-8">
        <AppAdminLogin message={message} initialEmail={query.email ? decodeURIComponent(query.email) : undefined} />
      </main>
    );
  }

  const [appData, website] = await Promise.all([
    Promise.all(managedApps.map((app) => readAdminAppData(app.slug))),
    readWebsiteCmsData(),
  ]);
  const data = appData[0];

  return (
    <main className="admin-shell min-h-screen">
      <AdminOS
        adminEmail={admin.email}
        role={admin.role}
        updated={query.updated}
        selectedApp={query.app}
        appData={appData}
        product={data.product}
        faqs={data.faqs}
        screenshots={data.screenshots}
        releases={data.releases}
        supportRequests={data.supportRequests}
        devices={data.devices}
        activationRequests={data.activationRequests}
        licenses={data.licenses}
        providerSources={data.providerSources}
        runtimeConfig={data.runtimeConfig}
        website={website}
      />
    </main>
  );
}
