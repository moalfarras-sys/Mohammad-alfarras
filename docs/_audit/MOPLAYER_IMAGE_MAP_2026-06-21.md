# MoPlayer Image Management Map & Fix Plan — 2026-06-21

Read-only audit of every MoPlayer image across web product surfaces, admin controls, on-disk files, and the Supabase media library. Goal: make every MoPlayer image **deletable / replaceable / pickable-from-the-media-library**, with a clear "where is this shown" map; remove duplicates; correct misplaced/wrong-order renders; hide images that genuinely cannot be edited.

Products: **Classic** (`moplayer`), **Pro** (`moplayer2`), **PC** (`moplayer-pc`), **iOS**.

Source legend: **CMS** = Supabase product/site fields; **library** = `media_assets` shared pool; **hardcoded** = literal `/images/*.png` path baked into a component; **mixed** = CMS/runtime value with a hardcoded fallback.

Admin-editable legend: **yes-upload+library** = upload + pick-from-library + delete/clear; **yes-upload** = upload + delete but no library picker; **partial** = upload and/or manual path only, no library picker, no real delete; **no** = not editable anywhere in admin.

---

## 1. Unified image map

| Image / slot | Product | Source | Reference (key or path) | Rendered where | Admin-editable? | Issue |
|---|---|---|---|---|---|---|
| Logo (website brand) | Classic / Pro | CMS | `app_products.logo_path` — app-control.tsx:847 (ProductImageField), actions.ts:224,249 (saveProductAction); preview media-control-center.tsx:561 | Web app hero brand card (moplayer-landing.tsx, moplayer2-landing.tsx); product hub card | partial | No library picker, no delete; must hand-clear advanced path. Read-only in media center. |
| Hero image | Classic / Pro | CMS | `app_products.hero_image_path` — app-control.tsx:848; actions.ts:225,250 | Web hero: moplayer-landing.tsx:58,186; moplayer2-landing.tsx:217,346; hub moplayer-product-hub.tsx:172,248,258 | partial | No library picker, no delete. Falls back to tv_banner then hardcoded `/images/*.png`. |
| TV banner | Classic / Pro | CMS | `app_products.tv_banner_path` — app-control.tsx:849; actions.ts:226,251 | Web hero fallback (moplayer-landing.tsx:58; moplayer2-landing.tsx:217); hub fallback :172 | partial | No library picker, no delete. |
| Screenshots gallery | Classic / Pro | CMS | `app_screenshots` — app-control.tsx:914-939,958-974 (saveScreenshotAction actions.ts:290), delete :950 (deleteScreenshotAction actions.ts:323) | Web gallery: moplayer-landing.tsx:84; moplayer2-landing.tsx:219; hub :176,232,233 | yes-upload | Upload + replace + delete, but reorder only via sort_order number; no library picker. Empty → hardcoded fallback arrays admin can't touch. |
| In-app logoUrl / backgroundUrl (runtime) | Classic / Pro | CMS | runtime config logoUrl/backgroundUrl — app-control.tsx:421-422; saveRuntimeConfigAction actions.ts:511-512 | In-app Android + admin runtime preview app-control.tsx:425-443; NOT on public web | partial | Plain text URL only — no upload/library/delete. Distinct "logo" from website logo_path → confusing duplication. |
| iOS preview image | iOS | CMS | `moplayer2_public_config.ios.heroImageUrl` — moplayer-ios-control.tsx:138-172 (MediaChooser + upload), saveIosRuntimeConfigAction actions.ts:584-622 | iOS public page; hub iOS card moplayer-product-hub.tsx:203,282-283; media center iOS preview :395 | yes-upload+library | ONLY product slot with a real library picker. No true delete (Clear reverts to Pro fallback). iOS has only this one slot. |
| PC Hero image | PC | CMS | `windows_release.heroImage/heroAlt` — pc-control.tsx:219-256; savePcHeroImageAction actions.ts:1143 / clear :1218 | Web PC hero moplayer-pc-landing.tsx:117,307; hub PC fallback :237 | yes-upload | Upload + remove; no library picker. |
| PC Card image | PC | CMS | `windows_release.cardImage/cardAlt` — pc-control.tsx:259-298; savePcCardImageAction actions.ts:1155 / clear :1225 | Web family/apps card: hub pcCardImage moplayer-product-hub.tsx:236,268 | yes-upload | Upload + remove; no library picker. |
| PC Screenshots | PC | CMS | `windows_release.screenshotItems[]` — pc-control.tsx:300-349; add actions.ts:1167 / meta :1186 / delete :1207 | Web PC gallery moplayer-pc-landing.tsx:111 | yes-upload | Upload + per-item alt/order + delete; reorder via number only; no library picker. |
| Hub card hero (Pro) | Pro | mixed | `appHeroImage(data.pro, "/images/moplayer-pro-showcase-2.png")` hub:248; render :467-479 | Hub Pro card main image | partial | Falls back to screenshots[0] → **duplicates gallery thumb #1**. Hardcoded final fallback. |
| Hub card gallery thumbs (Pro) | Pro | mixed | `appGalleryImages(data.pro, [...])` hub:232; render .slice(0,2) :483-496 | Hub Pro card right thumbnails | partial | Never excludes hero → hero can render twice in same card. |
| Hub card hero (Classic) | Classic | mixed | `appHeroImage(data.classic, "/images/moplayer-tv-hero.png")` hub:258 | Hub Classic card main image | partial | Duplicates classicGallery[0] when CMS hero empty. |
| Hub card gallery thumbs (Classic) | Classic | mixed | `classicGallery = appGalleryImages(data.classic, [...])` hub:233 | Hub Classic card thumbnails | partial | CMS screenshots or 3-item hardcoded array. |
| Hub card hero (PC) | PC | mixed | `pcCardImage = cardImage \|\| heroImage \|\| pcGallery[0] \|\| "/images/moplayer-pc-desktop.png"` hub:235-240; heroImage:268 | Hub PC card main image | yes-upload | If cardImage AND heroImage unset → hero == gallery thumb #1 (duplicate). Hardcoded final fallback. |
| Hub card gallery thumbs (PC) | PC | CMS | `pcGallery = windowsGalleryImages(...)` hub:234,180-185; galleryImages :269 | Hub PC card thumbnails | yes-upload | Empty → `[pcCardImage]` makes thumb identical to hero. |
| Hub card hero (iOS) | iOS | mixed | `iosConfig.heroImage = ios.heroImageUrl \|\| appHeroImage(pro, "/images/moplayer-pro-home.webp")` hub:203; heroImage:282 | Hub iOS card main image | partial | **MISPLACED**: borrows Pro hero/screenshots when unset. Hardcoded Pro fallback. |
| Hub card gallery thumbs (iOS) | iOS | mixed | `galleryImages: [iosConfig.heroImage, ...proGallery...]` hub:283 | Hub iOS card thumbnails | partial | **DUPLICATE (hardcoded)**: hero prepended to gallery → always shown twice. **MISPLACED**: Pro screenshots under iOS. |
| Classic landing hero | Classic | mixed | `heroImage = ...hero_image_path \|\| tv_banner_path \|\| "/images/moplayer-tv-hero.png"` moplayer-landing.tsx:58; render :186 | apps/moplayer/classic hero | partial | CMS editable; hardcoded fallback not editable. |
| Classic landing full-bleed background | Classic | hardcoded | `<Image src="/images/moplayer-classic-bg.png">` moplayer-landing.tsx:92 | Classic page fixed background | no | Literal path; cannot replace/delete from admin. |
| Classic "Pro Switch" preview | Classic (shows Pro) | hardcoded | `<Image src="/images/moplayer-pro-home.webp" alt="Pro Preview">` moplayer-landing.tsx:233 | Classic "Try MoPlayer Pro" promo card | no | **MISPLACED**: hardcoded Pro image on Classic page; goes stale; not editable. |
| Classic gallery (Coverflow) | Classic | mixed | `galleryShots = screenshots \|\| fallbackGalleryShots` moplayer-landing.tsx:77-84; render :269-277 | apps/moplayer/classic screenshots | partial | 5-item hardcoded fallback :78-82; fallback[1] reuses tv-hero (= hero) → hero repeats in gallery. |
| Pro landing hero | Pro | mixed | `...hero_image_path \|\| tv_banner_path \|\| "/images/moplayer-pro-hero.webp"` moplayer2-landing.tsx:217; render :346 | apps/moplayer2 hero | partial | CMS editable; hardcoded fallback not editable. |
| Pro landing full-bleed background | Pro | hardcoded | `<Image src="/images/moplayer-pro-bg.png">` moplayer2-landing.tsx:252 | apps/moplayer2 fixed background | no | Literal path; not editable. |
| Pro gallery (Coverflow) | Pro | mixed | `galleryScreenshots = screenshots \|\| mp2Screenshots` moplayer2-landing.tsx:219-226; hardcoded :166-173; render :441-444 | apps/moplayer2 preview gallery | partial | 6-item hardcoded; pro-hero.webp also hero fallback → hero repeats. |
| PC landing background | PC | hardcoded | `<Image src="/images/moplayer_pc_bg.png">` moplayer-pc-landing.tsx:201 | apps/moplayer-pc fixed background | no | Literal path; underscore-named; not editable. |
| PC landing interface/hero showcase | PC | mixed | `heroImageSrc = windowsRelease.heroImage \|\| "/images/moplayer-pc-desktop.png"` moplayer-pc-landing.tsx:117; render :306-313 | apps/moplayer-pc interface showcase | yes-upload | Page uses heroImage first but hub uses cardImage first → two different "main" images across surfaces. |
| PC landing gallery (Coverflow) | PC | CMS | `pcShots` moplayer-pc-landing.tsx:109-116; render :350-358 | apps/moplayer-pc screenshots | yes-upload | `gallery_shots` secondary fallback (:116) is dead — AppProduct has no such field. |
| iOS page background | iOS (shows Pro) | hardcoded | `<Image src="/images/moplayer-pro-bg.png" fill>` apps/moplayer-ios/page.tsx:182-187 | apps/moplayer-ios hero background | no | **MISPLACED**: Pro background on iOS page; not editable. |
| iOS page hero mockup | iOS | mixed | `ios.heroImage = ios.heroImageUrl \|\| "/images/moplayer-pro-home.webp"` apps/moplayer-ios/page.tsx:130; render :217 | apps/moplayer-ios phone mockup | partial | Editable via iOS control. **MISPLACED fallback** (Pro image). Card label hardcoded "MoPlayer Pro" :222. |
| OG/Twitter meta images | All | mixed | hub page.tsx:35; [productSlug] :58-62; classic :45-50; moplayer-pc :38-46 | Social share cards | partial | Derived from CMS hero/tv_banner/screenshots with hardcoded fallbacks. |
| 8 generic site_images slots | (site, not product) | CMS | `site_settings.site_images.{home_portrait,home_product_hero,home_product_secondary,activation_hero,apps_hero,ai_hero,support_hero,legal_hero}` — media-control-center.tsx:56-137,358-368,499; saveMediaSiteImagesAction actions.ts:972 | Home, /activate, /apps/moplayer, /ai, /support, legal pages | yes-upload+library | Full capability but NONE are per-product MoPlayer hero/card slots. |
| Media library assets (shared pool) | (shared) | library | `media_assets` — media-control-center.tsx:446-467,267 (uploadMediaLibraryAction actions.ts:866), delete :708 (deleteMediaLibraryAction actions.ts:899) | Source pool for iOS picker + 8 site slots | yes-upload+library | Only iOS + 8 site slots can PICK from it; Classic/Pro/PC editors cannot. |

### On-disk file ↔ library registration map

| File | In `media_assets`? | md5 / status | Notes |
|---|---|---|---|
| moplayer-hero-3d-final.png | yes (m34) | f9f27bf9a17b | **Dup cluster head** (4 names, 1 image). |
| moplayer-app-cover.jpeg | no | f9f27bf9a17b | Dup of hero-3d (wrong .jpeg name). |
| moplayer_ui_now_playing-final.png | no | f9f27bf9a17b | Dup of hero-3d — "now playing" shows the 3D hero. |
| moplayer_ui_now_playing.png | no | f9f27bf9a17b | Dup + dead alias → -final. |
| moplayer-brand-logo-final.png | no | efd8e9f3b640 | == icon-512 (one logo, two names). |
| moplayer-icon-512.png | no | efd8e9f3b640 | == brand-logo-final. |
| moplayer-tv-banner-final.png | no | f97a6e68964e | == tv-banner.png. |
| moplayer-tv-banner.png | no | f97a6e68964e | Dup + dead alias → -final. |
| moplayer_ui_playlist-final.png | no | e8d286d10e40 | == playlist.png. |
| moplayer_ui_playlist.png | no | e8d286d10e40 | Dup + dead alias → -final. |
| moplayer-cinema-frame.webp | no | only alias → hero-3d | Effectively orphan; never rendered. |
| moplayer-pc-interface.png | no | 9fd6ee09dd3b | **TRUE ORPHAN** (630KB, zero refs). |
| moplayer-pro-hero.webp | yes (m57) | 983d90c7cf5e | Active; NOT dup of pro-home. |
| moplayer-pro-home.webp | no | 07732d6959c6 | Active (iOS/Pro); not pickable. |
| moplayer-activation-flow.webp | yes (site-activation-flow) | — | Bound to 3 site slots. |
| moplayer-pc-desktop.png | yes (site-moplayer-pc-desktop) | — | Plus uploaded override media-8dbd68de842299. |
| moplayer-tv-hero.png | no | — | Classic hero; not pickable. |
| moplayer-release-panel.webp | no | unique | Classic gallery; not pickable. |
| moplayer-pro-activation.webp | no | unique | Pro gallery; not pickable. |
| moplayer-pro-player.webp | no | unique | Pro gallery + Windows poster; not pickable. |
| moplayer-pro-showcase-1.png | no | adc84180ccc5 | Pro hardcoded; not pickable. |
| moplayer-pro-showcase-2.png | no | dbbf1afc1cc2 | Pro hero fallback; not pickable. |
| moplayer-pro-bg.png | no | — | Pro + iOS background; not pickable. |
| moplayer-classic-bg.png | no | — | Classic background; not pickable. |
| moplayer-classic-promo.png | no | unique | Classic showcase/hub; not pickable. |
| moplayer_pc_bg.png | no | — | PC background; underscore name. |
| media-8dbd68de842299 | yes | uploaded 2026-06-15 | Only genuine user-uploaded MoPlayer asset (PC card). |

---

## 2. Duplicates to remove

**File-level (byte-identical, confirmed by md5):**

1. **md5 `f9f27bf9a17b` — 4 names, 1 image** (HIGH): `moplayer-hero-3d-final.png` (canonical), `moplayer-app-cover.jpeg`, `moplayer_ui_now_playing-final.png`, `moplayer_ui_now_playing.png`. The "app cover" and "now playing" screenshots are literally the 3D hero — the Classic gallery shows the hero where a now-playing screenshot belongs. → Replace `now_playing-final` and `app-cover` with correct distinct screenshots, or delete and point refs at the one canonical hero; delete dead alias `now_playing.png`.
2. **md5 `efd8e9f3b640`** (MEDIUM): `moplayer-brand-logo-final.png` == `moplayer-icon-512.png`. One logo stored twice. → Keep one canonical, repoint the other, delete the dup.
3. **md5 `f97a6e68964e`** (MEDIUM): `moplayer-tv-banner.png` == `moplayer-tv-banner-final.png`. Non-final is a dead alias (asset-url.ts:12, admin asset-url.ts:29-30). → Delete `moplayer-tv-banner.png` + alias branch (after DB migration of api/app/config/route.ts:229-230 stored values).
4. **md5 `e8d286d10e40`** (MEDIUM): `moplayer_ui_playlist.png` == `moplayer_ui_playlist-final.png`. Non-final is a dead alias (asset-url.ts:11). → Delete non-final file + alias branch.

**Render-level (same image drawn twice / wrong source):**

5. **Hub hero == gallery thumb #1** (HIGH): `appHeroImage()` falls back to `screenshots[0]` (hub:172) while `appGalleryImages()` returns the same `screenshots[]` (hub:176); card renders hero + gallery.slice(0,2) (hub:467,483). → Exclude resolved hero from gallery before slicing. Affects Classic, Pro.
6. **iOS hub hero shown twice (hardcoded)** (HIGH): gallery built as `[iosConfig.heroImage, ...proGallery]` (hub:283) and hero also rendered as main (hub:282). → Drop the prepended hero.
7. **PC hub hero == gallery thumb #1** (MEDIUM): pcCardImage falls back to pcGallery[0] (hub:235-240) and galleryImages falls back to `[pcCardImage]` (hub:269). → Render gallery without its first item when it is the hero, or require a distinct card image.
8. **Fallback array hero repeat** (LOW): Classic `fallbackGalleryShots[1]` = moplayer-tv-hero.png (= hero fallback :58); Pro `mp2Screenshots` includes moplayer-pro-hero.webp (= hero fallback :217). → Remove hero from fallback arrays or dedupe gallery vs resolved hero.

---

## 3. Not editable → must wire to admin (with media-library picker)

**Product images that lack a library picker and/or delete (HIGH):**

- **Classic & Pro logo / hero / tv_banner** — `app_products.{logo_path,hero_image_path,tv_banner_path}` (ProductImageField app-control.tsx:1088-1163; saveProductAction actions.ts:204). Add MediaChooser (pattern from moplayer-ios-control.tsx:189) + a "Remove image" button submitting an empty path.
- **Classic/Pro/PC screenshots** — add library picker (reuse SiteImageSlotCard "Choose from library" select, media-control-center.tsx:526-536) so existing assets can be reused without re-upload.
- **PC hero / card** — add library picker (pc-control.tsx).
- **PC logo/icon slot** — does not exist; add one.
- **iOS card + screenshots** — only one slot exists; add a card and/or screenshots array if the public page needs them.

**Images not editable anywhere — wire to CMS or surface as read-only "hardcoded" entries (HIGH/MEDIUM):**

- Backgrounds: `moplayer-classic-bg.png` (moplayer-landing.tsx:92), `moplayer-pro-bg.png` (moplayer2-landing.tsx:252 + moplayer-ios/page.tsx:182), `moplayer_pc_bg.png` (moplayer-pc-landing.tsx:201). Add a `backgroundUrl` per product (CMS/runtime) with library picker.
- Classic "Try MoPlayer Pro" preview `moplayer-pro-home.webp` (moplayer-landing.tsx:233) — drive from Pro CMS hero or expose a dedicated editable field.
- All hardcoded fallback gallery arrays (moplayer-product-hub.tsx:232-233; moplayer-landing.tsx:77-83; moplayer2-landing.tsx:166-173) — seed CMS screenshots + add reset/clear so code fallbacks are never used.
- ~20 MoPlayer files not in `media_assets` (tv-hero, tv-banner-final, brand-logo, icon-512, all pro-* screenshots/bg, classic-bg, classic-promo, release-panel, ui screenshots) — register each as a `media_assets` row so they appear in the library grid (media-control-center.tsx:457-460) and "Choose from library" dropdown (:530-534).
- **media-control-center AppImagePanel** (media-control-center.tsx:557-600) shows Classic/Pro logo/hero/tv_banner as read-only previews with only a "jump to app editor" link — embed real upload/library/delete controls, or relabel so it's clear product images live on each app page.

---

## 4. Misplaced / wrong order

1. **iOS borrows Pro art entirely** (HIGH): iOS hub card hero falls back to `appHeroImage(pro,...)` (hub:203) and gallery uses `proGallery` (hub:283); iOS page uses `moplayer-pro-bg.png` (page.tsx:182) and `moplayer-pro-home.webp` (page.tsx:130). Pro images render under the iOS product. → Add iOS-specific hero + background + screenshots fields; stop falling back to Pro images. Also card label hardcoded "MoPlayer Pro" (page.tsx:222) on the iOS page.
2. **Classic page hardcodes a Pro image** (MEDIUM): `moplayer-pro-home.webp` on the Classic "Try MoPlayer Pro" card (moplayer-landing.tsx:233). Same asset is also iOS fallback (hub:203) and a Pro gallery shot → the single image appears under three products. → Make it a dedicated CMS slot or point each surface at its own product asset.
3. **PC "main" image differs across surfaces** (MEDIUM): PC landing uses `heroImage` first (moplayer-pc-landing.tsx:117) but the hub PC card uses `cardImage` first (hub:235). Same product can show two different main images. → Pick one precedence and apply consistently.
4. **Now-playing screenshot shows the 3D hero** (HIGH): `moplayer_ui_now_playing-final.png` is byte-identical to the hero → the Classic gallery's "now playing" slot displays the wrong image. → Replace with the real now-playing screenshot.
5. **Screenshot reorder is number-only** (LOW): Classic/Pro/PC galleries reorder only by editing a sort_order/order number (app-control.tsx:958-974; pc-control.tsx:300-349) — no drag. → Add drag-reorder.

---

## 5. Orphan files to delete

| File | Action | Confidence |
|---|---|---|
| `apps/web/public/images/moplayer-pc-interface.png` | Delete — zero refs in apps/web/src or apps/admin/src (630KB) | High (no code change needed) |
| `apps/web/public/images/moplayer-cinema-frame.webp` | Delete after confirming no stored CMS value == this path; remove alias branches asset-url.ts:13 + admin asset-url.ts:31 | Medium |
| `apps/web/public/images/moplayer-tv-banner.png` | Delete after DB migration; remove alias asset-url.ts:12 + admin :29-30 | Medium (dead alias, byte-dup) |
| `apps/web/public/images/moplayer_ui_playlist.png` | Delete; remove alias asset-url.ts:11 + admin :27 (only test ref asset-url.test.ts:20) | Medium |
| `apps/web/public/images/moplayer_ui_now_playing.png` | Delete; remove alias asset-url.ts:9-10 + admin :25 | Medium |
| `apps/web/public/images/moplayer-app-cover.jpeg` | Delete or replace with real cover; repoint app-ecosystem.ts:412 + admin :657 | Medium (byte-dup of hero) |
| `apps/web/public/images/moplayer_ui_now_playing-final.png` | Replace with real now-playing screenshot (do NOT just delete — it's a live gallery slot) | High priority, not a plain delete |

Note: `moplayer-pro-home.webp` vs `moplayer-pro-hero.webp` are **NOT** duplicates (distinct md5) — both actively used; keep both.

---

## 6. Prioritized FIX PLAN

### Phase 0 — Zero-risk cleanup (no behavior change)
1. Delete `moplayer-pc-interface.png` (true orphan).
2. Replace `moplayer_ui_now_playing-final.png` with the correct now-playing screenshot (fixes the wrong-image-in-gallery bug). If no real asset exists, repoint app-ecosystem.ts:420 to a genuine screenshot and drop the bad name.

### Phase 1 — Stop duplicates & misplacement on the web (web changes only)
3. **Exclude hero from galleries** before slicing in `moplayer-product-hub.tsx`: filter `galleryImages` against the resolved `heroImage` for Classic (:258/:233), Pro (:248/:232), PC (:268/:269), and stop prepending `iosConfig.heroImage` to the iOS gallery (:283).
4. **Fix Classic fallback dup**: remove `moplayer-tv-hero.png` from `fallbackGalleryShots` (moplayer-landing.tsx:78-82); remove `moplayer-pro-hero.webp` from `mp2Screenshots` (moplayer2-landing.tsx:166-173).
5. **Decide PC main-image precedence** and apply the same order in moplayer-pc-landing.tsx:117 and moplayer-product-hub.tsx:235.

### Phase 2 — Wire missing admin controls (CMS keys + admin + web)
6. **Library picker + delete on Classic/Pro product images**: extend `ProductImageField` (app-control.tsx:1088) with MediaChooser (from moplayer-ios-control.tsx:189) + "Remove image" (empty path) for `logo_path` / `hero_image_path` / `tv_banner_path`. saveProductAction already accepts empty (actions.ts:204).
7. **Library picker on PC hero/card/screenshots** (pc-control.tsx) and on Classic/Pro screenshots (app-control.tsx:914-974) — reuse SiteImageSlotCard select (media-control-center.tsx:526-536).
8. **Register all MoPlayer files in `media_assets`** (one-time seed: id + path for tv-hero, tv-banner-final, brand-logo, icon-512, pro-* set, classic-bg, classic-promo, release-panel, ui screenshots, pro-home, pro-bg, pc_bg) so they appear in the library grid + picker.
9. **Add per-product `backgroundUrl` CMS/runtime field** for Classic/Pro/PC/iOS and read it in each landing component instead of the literal bg path (moplayer-landing.tsx:92; moplayer2-landing.tsx:252; moplayer-pc-landing.tsx:201; moplayer-ios/page.tsx:182). Expose with library picker.
10. **Give iOS its own art**: add `runtimeConfig.ios.{heroImageUrl (exists), backgroundUrl, screenshots[]}` and a label override; stop falling back to Pro (hub:203,283; page.tsx:130,182,222). Add iOS card/screenshots editors to moplayer-ios-control.tsx.
11. **Classic "Try Pro" preview**: drive moplayer-landing.tsx:233 from the Pro product's CMS hero, or add a dedicated editable slot — remove the hardcoded `moplayer-pro-home.webp`.
12. **Add a PC logo/icon slot** in pc-control.tsx for parity.

### Phase 3 — Consolidate duplicates & dead aliases (after DB migration)
13. Keep one canonical logo (`moplayer-brand-logo-final.png`), repoint `moplayer-icon-512.png` refs, delete the dup.
14. One-time DB migration of stored old paths (api/app/config/route.ts:229-230), then delete dead-alias files `moplayer-tv-banner.png`, `moplayer_ui_playlist.png`, `moplayer_ui_now_playing.png`, `moplayer-cinema-frame.webp` and remove their alias branches in apps/web/src/lib/asset-url.ts (lines 9-13) and apps/admin/src/lib/asset-url.ts (lines 25-31). Update asset-url.test.ts:20.
15. Resolve the 4-name hero cluster: delete/replace `moplayer-app-cover.jpeg`; repoint app-ecosystem.ts:412 + admin :657.

### Phase 4 — Make the Media Control Center the real hub & clarify labels
16. Embed real per-product upload/library/delete controls inside the Media Control Center AppImagePanel (media-control-center.tsx:557-600), or relabel to point at each app page.
17. Label the two "logo" concepts: "Website logo" (`app_products.logo_path`) vs "In-app logo" (`runtimeConfig.logoUrl`, app-control.tsx:421) so editing one doesn't surprise the owner.
18. Surface genuinely hardcoded/uneditable images as read-only "hardcoded — needs code change" entries in the media center with a "where shown" note, so the owner knows they exist.
19. Remove the dead `gallery_shots` fallback (moplayer-pc-landing.tsx:116) — AppProduct has no such field.
20. Add drag-reorder to screenshot lists (Classic/Pro app-control.tsx; PC pc-control.tsx).

### Outcome
After Phases 0-2 every visible MoPlayer image is deletable/replaceable/pickable from the media library with a documented "where shown" mapping; Phase 3 removes byte-duplicates and dead aliases; Phase 4 makes the Media Control Center the single source of truth and hides/flags the few images that still require a code change.
