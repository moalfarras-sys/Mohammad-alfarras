#!/usr/bin/env node
/**
 * Upload a built APK to Supabase Storage and publish its metadata into the
 * current MoPlayer schema (`app_releases` + `app_release_assets`).
 *
 * Usage:
 *   node scripts/publish-android-release.mjs \
 *     --version 2.0.1 \
 *     --versionCode 3 \
 *     --apk android/moplayer/build-output/app/outputs/apk/sideload/release/app-sideload-arm64-v8a-release.apk \
 *     --abi arm64-v8a \
 *     --notes "Bug fixes + faster startup."
 *
 * Storage-only upload while hosted database migrations are not applied yet:
 *   node scripts/publish-android-release.mjs --version 2.0.1 --versionCode 3 --apk <path> --uploadOnly
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const DEFAULT_BUCKET = "app-releases";

loadEnv({ path: resolve(process.cwd(), "apps/web/.env.local"), quiet: true });
loadEnv({ quiet: true });

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

function fail(message, error) {
  const detail = error?.message ? `\n${error.message}` : "";
  throw new Error(`${message}${detail}`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      version: { type: "string" },
      versionCode: { type: "string" },
      apk: { type: "string" },
      slug: { type: "string", default: "moplayer" },
      notes: { type: "string", default: "" },
      abi: { type: "string", default: "arm64-v8a" },
      minSdk: { type: "string", default: "24" },
      targetSdk: { type: "string", default: "35" },
      bucket: { type: "string", default: DEFAULT_BUCKET },
      uploadOnly: { type: "boolean", default: false },
      primary: { type: "boolean", default: false },
    },
  });

  if (!values.version || !values.versionCode || !values.apk) {
    fail("Usage: publish-android-release.mjs --version 2.0.1 --versionCode 3 --apk <path>");
  }

  const supabase = createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const apkBytes = await readFile(values.apk);
  const apkStat = await stat(values.apk);
  const sha256 = createHash("sha256").update(apkBytes).digest("hex");
  const fileName = `${values.slug}-${values.version}-${values.abi}.apk`;
  const storagePath = `${values.slug}/${values.version}/${fileName}`;
  const isPrimary = values.primary || values.abi === "arm64-v8a";

  console.log(
    `Uploading ${values.apk} -> ${storagePath} (${(apkStat.size / 1024 / 1024).toFixed(1)} MB, sha256 ${sha256.slice(0, 12)}...)`,
  );

  await supabase.storage.createBucket(values.bucket, { public: true }).catch(() => null);

  const upload = await supabase.storage.from(values.bucket).upload(storagePath, apkBytes, {
    contentType: "application/vnd.android.package-archive",
    upsert: true,
  });
  if (upload.error) fail("Upload failed.", upload.error);

  const publicUrl = supabase.storage.from(values.bucket).getPublicUrl(storagePath).data.publicUrl;

  if (values.uploadOnly) {
    console.log(`Uploaded ${values.abi} APK.`);
    console.log(`APK URL: ${publicUrl}`);
    console.log(`Size: ${apkStat.size}`);
    console.log(`SHA-256: ${sha256}`);
    return;
  }

  const { data: product, error: productError } = await supabase
    .from("app_products")
    .select("slug")
    .eq("slug", values.slug)
    .maybeSingle();

  if (productError || !product) {
    fail(`Product not found for slug "${values.slug}". Apply Supabase migrations first.`, productError);
  }

  const { data: release, error: releaseError } = await supabase
    .from("app_releases")
    .upsert(
      {
        product_slug: product.slug,
        slug: `${values.slug}-${values.version}`,
        version_name: values.version,
        version_code: Number(values.versionCode),
        release_notes: values.notes,
        compatibility_notes: `Android ${values.minSdk}+ / target SDK ${values.targetSdk} / arm64-v8a primary, armeabi-v7a secondary`,
        published_at: new Date().toISOString(),
        is_published: true,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();

  if (releaseError || !release) fail("Release insert failed.", releaseError);

  const hideOld = await supabase
    .from("app_releases")
    .update({ is_published: false })
    .eq("product_slug", product.slug)
    .neq("id", release.id);
  if (hideOld.error) fail("Failed to archive old releases.", hideOld.error);

  const deleteOldAsset = await supabase
    .from("app_release_assets")
    .delete()
    .eq("release_id", release.id)
    .eq("abi", values.abi);
  if (deleteOldAsset.error) fail("Failed to replace old asset metadata.", deleteOldAsset.error);

  const asset = await supabase
    .from("app_release_assets")
    .insert({
      release_id: release.id,
      asset_type: "apk",
      label: `${values.abi} sideload APK`,
      abi: values.abi,
      storage_bucket: values.bucket,
      storage_path: storagePath,
      external_url: publicUrl,
      mime_type: "application/vnd.android.package-archive",
      file_size_bytes: apkStat.size,
      checksum_sha256: sha256,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (asset.error) fail("Asset insert failed.", asset.error);

  console.log(`Release ${values.version} (code ${values.versionCode}) published.`);
  console.log(`APK URL: ${publicUrl}`);
  console.log(`Slug: ${release.slug}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
