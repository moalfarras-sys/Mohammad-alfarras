import { config } from "dotenv";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local") });
config();

const [filePath, versionName, versionCodeRaw, abiRaw] = process.argv.slice(2);

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!filePath || !versionName || !versionCodeRaw) {
    throw new Error("Usage: npm run publish:moplayer-release -- <apk-path> <version-name> <version-code> [abi]");
  }

  const versionCode = Number(versionCodeRaw);
  if (!Number.isFinite(versionCode)) {
    throw new Error("version-code must be numeric.");
  }

  const bytes = await readFile(path.resolve(filePath));
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const abi = abiRaw || "universal";
  const releaseSlug = slugify(`moplayer-v${versionName}`);
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await supabase.storage.createBucket("app-downloads", { public: false }).catch(() => null);
  const storagePath = `${versionName}/${path.basename(filePath)}`;
  const upload = await supabase.storage.from("app-downloads").upload(storagePath, bytes, {
    contentType: "application/vnd.android.package-archive",
    upsert: true,
  });
  if (upload.error) throw upload.error;

  const releaseUpsert = await supabase
    .from("app_releases")
    .upsert(
      {
        product_slug: "moplayer",
        slug: releaseSlug,
        version_name: versionName,
        version_code: versionCode,
        release_notes: `Release ${versionName}`,
        compatibility_notes:
          abi === "universal"
            ? "Recommended universal TV APK. Advanced ABI-specific builds may also be available."
            : `${abi} build`,
        published_at: new Date().toISOString(),
        is_published: true,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (releaseUpsert.error || !releaseUpsert.data?.id) throw releaseUpsert.error ?? new Error("Release row not created.");

  const clearPrimary = await supabase
    .from("app_release_assets")
    .update({ is_primary: false })
    .eq("release_id", releaseUpsert.data.id);
  if (clearPrimary.error) throw clearPrimary.error;

  const existingAsset = await supabase
    .from("app_release_assets")
    .select("id")
    .eq("release_id", releaseUpsert.data.id)
    .eq("storage_path", storagePath)
    .maybeSingle();
  if (existingAsset.error) throw existingAsset.error;

  const assetPayload = {
    release_id: releaseUpsert.data.id,
    asset_type: "apk",
    label: abi === "universal" ? "Recommended TV APK" : "Recommended APK",
    abi,
    storage_bucket: "app-downloads",
    storage_path: storagePath,
    external_url: null,
    mime_type: "application/vnd.android.package-archive",
    file_size_bytes: bytes.byteLength,
    checksum_sha256: checksum,
    is_primary: true,
  };

  if (existingAsset.data?.id) {
    const update = await supabase.from("app_release_assets").update(assetPayload).eq("id", existingAsset.data.id);
    if (update.error) throw update.error;
  } else {
    const insert = await supabase.from("app_release_assets").insert(assetPayload);
    if (insert.error) throw insert.error;
  }

  console.log(`Published ${versionName} from ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
