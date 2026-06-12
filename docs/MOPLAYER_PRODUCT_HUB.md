# MoPlayer Product Hub

## Purpose

`/[locale]/apps/moplayer` is now the public MoPlayer product-family hub, not the Classic-only product page.

The hub is the doorway for:

- `MoPlayer Classic`: lightweight Android/Android TV app for normal and weak devices.
- `MoPlayer Pro`: modern gold Android/Android TV app with richer IPTV workflows.
- `MoPlayer PC`: Windows desktop app and installer path.
- Future native products: iOS, Apple TV, LG webOS, and Samsung Tizen.

## Current Routes

- Family hub: `/en/apps/moplayer`, `/ar/apps/moplayer`
- Classic details: `/en/apps/moplayer/classic`, `/ar/apps/moplayer/classic`
- Pro details: `/en/apps/moplayer2`, `/ar/apps/moplayer2`
- Classic latest download: `/api/app/download/latest?product=moplayer`
- Pro latest download: `/api/app/download/latest?product=moplayer2`
- Windows setup download: `/api/app/download/latest?product=moplayer2&platform=windows`
- Windows portable download: `/api/app/download/latest?product=moplayer2&platform=windows&portable=1`

## Files

- Hub component: `apps/web/src/components/app/moplayer-product-hub.tsx`
- Hub route: `apps/web/src/app/[locale]/(site)/apps/moplayer/page.tsx`
- Classic route: `apps/web/src/app/[locale]/(site)/apps/moplayer/classic/page.tsx`
- Styling: `apps/web/src/app/globals.css`
- Admin shortcut actions: `apps/admin/src/components/admin/pages/app-control.tsx`

## Future Product Pattern

Do not add future platform slugs to `packages/shared/src/app-products.ts` until the real app has a release/config/activation story.

For a visual placeholder only, edit the `futures` list in `moplayer-product-hub.tsx`.

When a platform becomes real:

1. Add product identity and download metadata deliberately.
2. Add a platform-specific page or route.
3. Add admin controls for release assets and runtime config only if the app consumes them.
4. Keep provider/source credentials local to the app or one-time QR handoff. Do not persist playlist/Xtream secrets in Supabase.
5. Verify web, admin, and the target app before publishing.

## Shared Service Direction

The hub should keep communicating that MoPlayer products share one ecosystem idea:

- Weather widgets use the website weather API/fallback approach.
- Football/matches use the website match provider fallback approach.
- Mo AI/support guidance should remain centralized where possible.
- Release/download APIs stay product-aware through `product` and `platform` parameters.

If a paid provider fails, prefer a safe free/cached fallback over breaking the user-facing widget.

## Design Intent

The page should feel like a premium product shelf, not a generic APK page:

- First viewport shows the product family clearly.
- Classic, Pro, and PC each have a distinct message and CTA.
- Coming-soon platform cards are visible but do not pretend downloads exist.
- Motion is decorative only and must respect `prefers-reduced-motion`.
- The design uses real MoPlayer images/assets and avoids fake stock imagery.
