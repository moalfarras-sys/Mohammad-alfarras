import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/admin/login-screen";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; unauthorized?: string; forbidden?: string; email?: string }>;
}) {
  const [query, admin] = await Promise.all([searchParams, getAuthenticatedAdmin()]);
  if (admin) {
    redirect("/");
  }

  const message = query.error
    ? decodeURIComponent(query.error)
    : query.forbidden
      ? "This account is authenticated but does not have an admin role."
      : query.unauthorized
        ? "Please sign in to continue."
        : undefined;

  return <LoginScreen message={message} initialEmail={query.email ? decodeURIComponent(query.email) : undefined} />;
}
