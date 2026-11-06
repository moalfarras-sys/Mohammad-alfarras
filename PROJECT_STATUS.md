# Project Status

Last updated: 2026-11-05

The current audit and operational limits are in [the November production audit](docs/_audit/PRODUCTION_AUDIT_2026-11-05.md).
The previous snapshot is preserved as [historical October status](docs/_audit/PROJECT_STATUS_2026-10-04.md); its statements about unavailable MoOS downloads, Windows 1.0.3 and Linux-only verification failures are no longer current.

## Current releases and ownership

| Product | Version | Source of truth |
| --- | --- | --- |
| MoPlayer Classic (`moplayer`) | 2.5.1 / code 26 | `apps/moplayer-android`, shared release metadata |
| MoPlayer Pro Android (`moplayer2`) | 2.7.2 / code 71 | `apps/moplayer-pro-android`, shared release metadata |
| MoPlayer PC (`moplayer2`, Windows) | 1.0.4 | GitHub Release `moplayer-pc-v1.0.4`, shared release metadata |
| MoPlayer iOS | Flutter source candidate | `apps/MoPlayer iphone ios`; Mac/Xcode release validation outstanding |
| MoOS | 44.20261014.1046 | Independent Cloudflare site, download Worker and private R2 |

Both Vercel projects use Node 24 and their existing roots (`apps/web`, `apps/admin`).
DNS is delegated to `dns1.registrar-servers.com` / `dns2.registrar-servers.com`, not Cloudflare.
The MoOS Workers belong to Cloudflare account `73a194363e5c5d6d7556d177d6929c6f`.

## Verified in this audit

- Full `npm run verify:production`: web build/lint/types and 114 tests, admin build/lint/types and 11 authentication/database tests, optional dashboard, 469 Android unit tests.
- 32 desktop/mobile Chromium browser checks in Arabic/English; product-page reduced-motion hydration repaired.
- Flutter formatting/analyzer and 6 tests; Windows type/lint/build and stream-proxy QA.
- 21 MoOS download Worker tests, static export, eight public browser views, complete ISO hash/signature and byte ranges including offsets above 4 GiB.
- Complete public Classic/Pro APK and Windows installer hashes; Windows updater SHA-512 metadata matches the downloaded installer.
- npm dependency audit has zero known findings after targeted patches (a point-in-time check, not a security guarantee).

## Remaining production gates

The original `moplayer` Supabase project is restored and healthy. Its CMS/app data, missing download analytics schema, current release metadata and RLS were checked and repaired. Vercel web/admin now point to this project and use an IPv4 pooler with verified TLS. See the audit report for deployment and authenticated admin acceptance results.

The Linux host cannot complete Windows NSIS packaging because its Wine execution fails. Windows CI now runs packaging and startup smoke. No new native release has been published by this audit; macOS/iOS and physical TV playback checks remain separate release gates.
