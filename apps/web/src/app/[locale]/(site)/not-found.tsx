import { NotFoundView } from "@/components/site/not-found-view";

// 404 boundary for the (site) group: notFound() thrown from site pages (e.g. an
// invalid product slug) renders here, inside the navbar/footer shell, instead of
// falling back to the bare [locale]/not-found.tsx outside the site layout.
export default function SiteNotFound() {
  return <NotFoundView />;
}
