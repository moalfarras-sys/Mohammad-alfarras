import { NextResponse } from "next/server";

const packageNames = ["com.mo.moplayer", "com.moalfarras.moplayerpro"];

export const dynamic = "force-dynamic";

function fingerprints() {
  return String(process.env.ANDROID_APP_CERT_SHA256 ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function GET() {
  const certFingerprints = fingerprints();
  const body = certFingerprints.length
    ? packageNames.map((package_name) => ({
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name,
          sha256_cert_fingerprints: certFingerprints,
        },
      }))
    : [];

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-AssetLinks-Status": certFingerprints.length ? "configured" : "missing-fingerprint",
    },
  });
}
