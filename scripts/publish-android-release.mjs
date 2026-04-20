#!/usr/bin/env node
/**
 * publish-android-release.mjs
 *
 * Upload a built APK to Supabase Storage and write the matching row into
 * `app_releases` + `app_release_assets` so the website and Android client
 * pick up the new version automatically.
 *
 * USAGE (from repo root):
 *   node scripts/publish-android-release.mjs \
 *     --version 2.0.1 \
 *     --versionCode 3 \
 *     --apk android/moplayer/build-output/app/outputs/apk/sideload/release/moplayer-release.apk \
 *     --slug moplayer \
 *     --notes "Bug fixes + faster startup."
 *
 * ENV (required):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { parseArgs } from "node:util";

const STORAGE_BUCKET = "app-releases";

function getEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const { values } = parseArgs({
    options: {
      version: { type: "string" },
      versionCode: { type: "string" },
      apk: { type: "string" },
      slug: { type: "string", default: "moplayer" },
      notes: { type: "string", default: "" },
      abi: { type: "string", default: "universal" },
      minSdk: { type: "string", default: "24" },
      targetSdk: { type: "string", default: "35" },
    },
  });

  if (!values.version || !values.versionCode || !values.apk) {
    console.error("Usage: publish-android-release.mjs --version 2.0.1 --versionCode 3 --apk <path>");
    process.exit(1);
  }

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // 1. Resolve product row
  const { data: product, error: productErr } = await supabase
    .from("app_products")
    .select("id, slug")
    .eq("slug", values.slug)
    .maybeSingle();

  if (productErr || !product) {
    console.error("Product not found for slug:", values.slug, productErr?.message);
    process.exit(1);
  }

  // 2. Read APK
  const apkBytes = await readFile(values.apk);
  const apkStat = await stat(values.apk);
  const sha256 = createHash("sha256").update(apkBytes).digest("hex");
  const fileName = `${values.slug}-${values.version}-${values.abi}.apk`;
  const storagePath = `${values.slug}/${values.version}/${fileName}`;

  console.log(`Uploading ${values.apk} → ${storagePath} (${(apkStat.size / 1024 / 1024).toFixed(1)} MB, sha256: ${sha256.slice(0, 12)}…)`);

  // 3. Upload APK to Storage (upsert)
  const upload = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, apkBytes, {
    contentType: "application/vnd.android.package-archive",
    upsert: true,
  });
  if (upload.error) {
    console.error("Upload failed:", upload.error.message);
    process.exit(1);
  }

  const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;

  // 4. Upsert app_releases row
  const { data: release, error: releaseErr } = await supabase
    .from("app_releases")
    .upsert(
      {
        product_id: product.id,
        slug: `${values.slug}-${values.version}`,
        version_name: values.version,
        version_code: Number(values.versionCode),
        release_notes: values.notes,
        published_at: new Date().toISOString(),
        is_current: true,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();

  if (releaseErr || !release) {
    console.error("Release insert failed:", releaseErr?.message);
    process.exit(1);
  }

  // Demote all other releases of this product — only one is_current=true
  await supabase
    .from("app_releases")
    .update({ is_current: false })
    .eq("product_id", product.id)
    .neq("id", release.id);

  // 5. Upsert asset row
  const asset = await supabase
    .from("app_release_assets")
    .upsert(
      {
        release_id: release.id,
        file_name: fileName,
        file_path: storagePath,
        file_url: publicUrl,
        file_size_bytes: apkStat.size,
        sha256,
        abi: values.abi,
        min_sdk: Number(values.minSdk),
        target_sdk: Number(values.targetSdk),
        is_primary: true,
      },
      { onConflict: "release_id,abi" },
    )
    .select()
    .single();

  if (asset.error) {
    console.error("Asset insert failed:", asset.error.message);
    process.exit(1);
  }

  console.log(`✓ Release ${values.version} (code ${values.versionCode}) published.`);
  console.log(`  APK URL: ${publicUrl}`);
  console.log(`  Slug:    ${release.slug}`);
  console.log(`\nNext: revalidate /app or wait for on-demand fetch.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
