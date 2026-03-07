import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "mf_admin_session";

function expectedAdminEmails() {
  const fromAllowlist = (process.env.ADMIN_ALLOWLIST || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (fromAllowlist.length) return fromAllowlist;
  return [(process.env.ADMIN_EMAIL ?? "mohammad.alfarras@gmail.com").trim().toLowerCase()];
}

function expectedPassword() {
  return process.env.ADMIN_PASSWORD;
}

export async function createAdminSession(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!expectedAdminEmails().includes(normalizedEmail)) {
    return false;
  }

  const expected = expectedPassword();
  if (!expected || password !== expected) {
    return false;
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return true;
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "ok";
}

export async function requireAdmin() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/ar/admin?unauthorized=1");
  }
}
