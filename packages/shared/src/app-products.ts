export const managedAppSlugs = ["moplayer", "moplayer2"] as const;

export type ManagedAppSlug = (typeof managedAppSlugs)[number];

export type ManagedAppDefinition = {
  slug: ManagedAppSlug;
  name: string;
  label: string;
  route: string;
  runtimeConfigKey: string;
};

export const managedApps: ManagedAppDefinition[] = [
  {
    slug: "moplayer",
    name: "MoPlayer",
    label: "MoPlayer Classic",
    route: "/apps/moplayer",
    runtimeConfigKey: "moplayer_public_config",
  },
  {
    slug: "moplayer2",
    name: "MoPlayer Pro",
    label: "MoPlayer Pro",
    route: "/apps/moplayer2",
    runtimeConfigKey: "moplayer2_public_config",
  },
];

export function isManagedAppSlug(value: string): value is ManagedAppSlug {
  return managedAppSlugs.includes(value as ManagedAppSlug);
}

export function resolveManagedAppSlug(value: string | null | undefined): ManagedAppSlug {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (normalized === "moplayer-pro" || normalized === "mo-player-pro" || normalized === "pro") {
    return "moplayer2";
  }
  return isManagedAppSlug(normalized) ? normalized : "moplayer";
}

export function getManagedApp(slug: string | null | undefined): ManagedAppDefinition {
  const normalized = resolveManagedAppSlug(slug);
  return managedApps.find((app) => app.slug === normalized) ?? managedApps[0];
}
