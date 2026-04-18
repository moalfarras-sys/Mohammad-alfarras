import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local") });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!url || !serviceKey || !email || !password) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, or ADMIN_PASSWORD.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) throw list.error;

  const existing = list.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  const userId = existing?.id;

  if (userId) {
    const updated = await supabase.auth.admin.updateUserById(userId, {
      email,
      password,
      email_confirm: true,
    });
    if (updated.error) throw updated.error;
    console.log(`Updated existing admin auth user: ${email}`);
  } else {
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user?.id) throw created.error ?? new Error("Failed to create admin user.");
    console.log(`Created admin auth user: ${email}`);
  }

  const finalList = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (finalList.error) throw finalList.error;
  const finalUser = finalList.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!finalUser?.id) throw new Error("Admin user could not be resolved after create/update.");

  const roleInsert = await supabase.from("app_admin_roles").upsert(
    {
      user_id: finalUser.id,
      role: "admin",
    },
    { onConflict: "user_id" },
  );
  if (roleInsert.error) throw roleInsert.error;

  console.log(`Admin role assigned to ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
