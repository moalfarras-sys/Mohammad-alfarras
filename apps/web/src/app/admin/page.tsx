import { permanentRedirect } from "next/navigation";

/**
 * /admin on the public site permanently redirects to the unified admin
 * subdomain (apps/admin). This keeps the public bundle free of CMS editor
 * weight and gives Mohammad a single admin URL to remember.
 */
export default function AdminRedirect() {
  const target = process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.moalfarras.space";
  permanentRedirect(target);
}
