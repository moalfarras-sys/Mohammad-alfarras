import type { SiteProject } from "@/components/site/site-view-model";

export type WorkCategory = "all" | "websites" | "platforms" | "products";

/** Category derived from the real project data (slug + highlight style). */
export function categoryOf(project: Pick<SiteProject, "slug" | "highlightStyle">): Exclude<WorkCategory, "all"> {
  if (project.slug.includes("moplayer")) return "products";
  if (project.highlightStyle === "editorial" || project.highlightStyle === "app") return "platforms";
  return "websites";
}

/** The project's real mobile screenshot, when its gallery ships one. */
export function mobileShotOf(project: Pick<SiteProject, "gallery">): string | undefined {
  return project.gallery.find((src) => /-mobile\.(webp|png|jpe?g)$/i.test(src));
}

/** Host name of an external URL (browser bars, "Visit" links). */
export function hostOf(href?: string) {
  if (!href || !/^https?:\/\//.test(href)) return "";
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Client work first (by featured rank), then the products. */
export function orderProjects(projects: SiteProject[]) {
  const isProduct = (p: SiteProject) => categoryOf(p) === "products";
  return [...projects].sort((a, b) => Number(isProduct(a)) - Number(isProduct(b)) || a.featuredRank - b.featuredRank);
}
