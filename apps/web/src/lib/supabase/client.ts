import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function resolveAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_KEY
  );
}

export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    anon: resolveAnonKey(),
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function hasSupabasePublicEnv(): boolean {
  const { url, anon } = getSupabaseEnv();
  return Boolean(url && anon);
}

export function createSupabaseBrowser() {
  const { url, anon } = getSupabaseEnv();
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and publishable/anon key");
  }
  return createBrowserClient(url, anon);
}

export function createSupabaseDataClient() {
  const { url, anon } = getSupabaseEnv();
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and publishable/anon key");
  }

  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const { url, service } = getSupabaseEnv();
  if (!url || !service) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, service, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createSupabaseServer() {
  const { url, anon } = getSupabaseEnv();
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and publishable/anon key");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        for (const item of items) {
          cookieStore.set(item.name, item.value, item.options);
        }
      },
    },
  });
}
