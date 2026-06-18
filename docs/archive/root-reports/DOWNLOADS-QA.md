# Downloads QA

Date: 2026-06-15 · Verified via local server (reads production Supabase).

## Android APKs — verified

| App | Resolver | Final file | HTTP | Content-Type | Size (bytes) |
|---|---|---|---|---|---|
| MoPlayer Classic | `/api/app/download/latest?product=moplayer` (307) | `/downloads/moplayer/app-sideload-universal-release.apk` | 200 | `application/vnd.android.package-archive` | 52,792,635 |
| MoPlayer Pro | `/api/app/download/latest?product=moplayer2` (307) | `/downloads/moplayer2/app-release.apk` | 200 | `application/vnd.android.package-archive` | 49,260,800 |

- Local file sizes match the served `Content-Length` exactly.
- Runtime config read from **live Supabase** (`source:"supabase"`): both apps `enabled:true`, `maintenanceMode:false`. Classic `2.2.16` (code 22), Pro `2.5.20` (code 58).

## Version + maintenance binding
- Version shown on `/en/apps/moplayer2` (`2.5.20`) === config API `latestVersionName` (`2.5.20`).
- `/api/app/download/latest` returns **503** when `enabled===false` (disabled) or maintenance; PC returns 503 when `release.maintenance`.
- Landing component hides the download button and shows "App under maintenance" / "Downloads temporarily disabled" based on `runtimeConfig.enabled`/`maintenanceMode`.

## Not tested this session
- **MoPlayer PC** Setup/Portable downloads are hosted on **GitHub Releases** (`windows_release` setting) — not downloaded in a browser this session.
- Download-counter increment was not asserted by repeated live downloads (would inflate real counters). Counters are recorded via `analytics_events` + `site_settings.download_counts` on each redirect.
- SHA-256 not re-hashed this session; tracked checksums: Classic `79701639678373dda3b44c07347c22bd799975767a2eb260943c50609f1f9a0d`, Pro `477beee677797ae489ec6afce71fe369a31f020ecb18fd3d12ec0d4192907a0f`.
