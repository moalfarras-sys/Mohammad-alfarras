import { redirect } from "next/navigation";

import {
  createAdminSession as createLegacyAdminSession,
  destroyAdminSession as destroyLegacyAdminSession,
  getAdminSessionEmail as getLegacyAdminSessionEmail,
} from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServer, hasSupabasePublicEnv } from "@/lib/supabase/client";
import type { AppAdminRole } from "@/types/app-ecosystem";

type AuthenticatedAdmin = {
  userId: string;
  email: string;
  role: AppAdminRole;
};

export async function signInAdmin(email: string, password: string) {
  let supabaseSuccess = false;

  if (hasSupabasePublicEnv()) {
    try {
      const supabase = await createSupabaseServer();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!error) {
        supabaseSuccess = true;
      }
    } catch {
      // fall back to legacy auth
    }
  }

  const legacyOk = await createLegacyAdminSession(email, password);

  if (!supabaseSuccess && !legacyOk) {
    throw new Error("Invalid admin credentials.");
  }
}

export async function signOutAdmin() {
  if (hasSupabasePublicEnv()) {
    try {
      const supabase = await createSupabaseServer();
      await supabase.auth.signOut();
    } catch {
      // continue with legacy sign out
    }
  }

  await destroyLegacyAdminSession();
}

export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  if (hasSupabasePublicEnv()) {
    try {
      const supabase = await createSupabaseServer();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id && user.email) {
        const { data, error } = await supabase
          .from("app_admin_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data?.role && (data.role === "admin" || data.role === "editor")) {
          return {
            userId: user.id,
            email: user.email,
            role: data.role,
          };
        }
      }
    } catch {
      // continue with legacy fallback
    }
  }

  const legacyEmail = await getLegacyAdminSessionEmail();
  if (!legacyEmail) {
    return null;
  }

  return {
    userId: `legacy:${legacyEmail}`,
    email: legacyEmail,
    role: "admin",
  };
}

export async function requireAuthenticatedAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin?unauthorized=1");
  }
  return admin;
}

export async function requireAdminRole(required: AppAdminRole = "editor"): Promise<AuthenticatedAdmin> {
  const admin = await requireAuthenticatedAdmin();
  if (required === "admin" && admin.role !== "admin") {
    redirect("/admin?forbidden=1");
  }
  return admin;
}

export async function upsertAdminRole(userId: string, role: AppAdminRole) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("app_admin_roles").upsert(
    {
      user_id: userId,
      role,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
