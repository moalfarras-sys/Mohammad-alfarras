import type { Metadata } from "next";

import { HomeDashboard } from "@/components/admin/pages/home-dashboard";
import { readAdminAppData, readAdminHealthStatus } from "@/lib/app-ecosystem";
import { readWebsiteCmsData } from "@/lib/website-cms";
import { managedApps } from "@moalfarras/shared/app-products";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const [appData, website] = await Promise.all([
    Promise.all(managedApps.map((app) => readAdminAppData(app.slug))),
    readWebsiteCmsData(),
  ]);
  const health = await readAdminHealthStatus();

  const apps = managedApps.map((app, index) => ({
    slug: app.slug,
    name: app.name,
    label: app.label,
    data: appData[index],
  }));

  return <HomeDashboard apps={apps} website={website} health={health} />;
}
