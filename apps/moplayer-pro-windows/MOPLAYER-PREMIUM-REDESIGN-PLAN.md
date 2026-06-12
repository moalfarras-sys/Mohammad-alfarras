# MoPlayer Pro Premium Glass Orange — Redesign Plan

**Product:** MoPlayer Pro for Windows  
**Design System:** MoPlayer Pro Premium Glass Orange  
**Date:** June 11, 2026

---

## 1. Current Visual Problems

| Area | Issue |
|------|-------|
| **Color identity** | Gold/amber (`#f1cc83`) dominates; feels Android-TV ported, not a premium Windows desktop product |
| **Navigation** | Bottom floating dock is mobile/TV-first; not native desktop UX |
| **Splash** | Static image + spinner only; no branded progress, no orange glow animation |
| **Activation** | Missing Copy Code button; QR frame is plain white box; no animated waiting state |
| **Home** | Hero stats are small pills; no large media-hub destination cards |
| **Architecture** | All UI in monolithic `App.tsx` (~1,800 lines); no reusable component library |
| **Installer** | NSIS uses programmatic gold art; limited to BMP sidebar/header — cannot be full glass UI |
| **Website** | `/apps/moplayer-pc` does not show version, file size, release date from `latest-windows.json` |
| **Tokens** | CSS variables exist but scattered in one file; no dedicated token module |

---

## 2. Files To Modify

### Windows App (`apps/moplayer-pro-windows`)

| File | Change |
|------|--------|
| `src/renderer/theme/tokens.css` | **NEW** — design tokens |
| `src/renderer/components/ui/*.tsx` | **NEW** — reusable UI components |
| `src/renderer/styles.css` | Premium Glass Orange overhaul, sidebar layout, splash progress |
| `src/renderer/App.tsx` | Sidebar nav, splash component, home hub cards, activation copy |
| `src/renderer/copy.ts` | `copyCode`, `waitingActivation` labels |
| `src/renderer/main.tsx` | Import tokens |
| `src/main/main.ts` | Window `backgroundColor` + titlebar overlay colors |
| `scripts/prepare-installer-art.mjs` | Orange/copper installer BMP palette |

### Website (`apps/web`)

| File | Change |
|------|--------|
| `src/app/[locale]/(site)/apps/moplayer-pc/page.tsx` | Load `latest-windows.json` |
| `src/components/app/moplayer-pc-landing.tsx` | Premium download section with metadata + steps |
| `src/lib/windows-release.ts` | **NEW** — typed Windows release reader |

---

## 3. New Design System — Premium Glass Orange

### Colors

```css
--bg-deep: #030304          /* near black */
--bg-base: #0a0a0c           /* primary background */
--bg-elevated: #141418       /* charcoal panels */
--bg-graphite: #1c1c22       /* secondary surfaces */
--glass-panel: rgba(18, 16, 20, 0.62)
--glass-strong: rgba(10, 9, 12, 0.88)
--accent-orange: #ff6b2c     /* primary accent */
--accent-amber: #ff9248      /* secondary accent */
--accent-copper: #e8a04a     /* luxury highlight */
--accent-glow: rgba(255, 107, 44, 0.45)
--success: #6ee7a0
--error: #ff5c6c
--text-primary: #faf9f7
--text-secondary: #a8a29e
--text-muted: #6b6560
```

### Gradients

- `--gradient-orange`: linear orange → amber
- `--gradient-cinematic`: deep black radial with orange edge glow
- `--gradient-glass-border`: transparent white/orange border shimmer

### Effects

- `backdrop-filter: blur(24px) saturate(1.4)` on glass panels
- Orange box-shadow glow on focus/hover
- Subtle `light-sweep` animation on hero cards (reduced-motion safe)
- Border: `1px solid rgba(255, 107, 44, 0.18)`

### Typography

- LTR: MoManrope · RTL: MoCairo
- Display: 800 weight, tight tracking
- UI: 600–700 weight

### Spacing & Radius

- `--space-xs` 4px → `--space-2xl` 32px
- `--radius-sm` 10px · `--radius-md` 16px · `--radius-lg` 22px · `--radius-xl` 28px

---

## 4. App Redesign Plan

### Layout

Replace bottom dock with **left premium sidebar** (220px):
- Brand mark at top
- Nav items with icon + label + active orange glow bar
- Collapses gracefully on narrow widths (1024px)

### Screens

| Screen | Enhancement |
|--------|-------------|
| Splash | Cinematic bg, logo glow pulse, animated progress bar, version tag |
| Activation | Glass QR panel, copy code button, pulsing wait indicator |
| Login | Orange glass tabs, elevated inputs, premium card shell |
| Home | Hero + **6 hub cards** (Live, Movies, Series, Favorites, Search, Settings) |
| Live/Movies/Series | Existing browse layout + stronger glass panels |
| Player | Orange progress, glass overlay controls (existing structure enhanced) |
| Search | Larger search bar, premium empty state |
| Favorites | Encouraging empty state with CTA |
| Settings | Reorganized sections; legal note prominent |
| License/Support | Glass cards with device info actions |

### Keyboard (preserved + documented)

| Key | Action |
|-----|--------|
| F | Fullscreen (in player) |
| Space | Play/Pause (player) |
| Esc | Back |
| Ctrl+F | Search |
| Ctrl+R | Refresh playlist |
| Arrow keys | Navigation (player zap) |

### Window State

Already persisted via `store.updateWindowState` — no backend change needed.

---

## 5. Installer Improvement Plan

**Platform:** electron-builder NSIS  
**Constraints:** NSIS cannot render glassmorphism; customization limited to:
- `installerIcon` / `uninstallerIcon` (ICO)
- `installerSidebar.bmp` (164×314)
- `installerHeader.bmp` (150×57)
- `license.txt` (bilingual)
- Metadata: `productName`, shortcuts, languages

**Actions:**
1. Regenerate BMP art with orange/copper palette (not gold)
2. Keep bilingual license with clear legal disclaimer
3. Compensate with premium first-launch splash inside the app

---

## 6. Website Download Plan

1. Server-read `public/downloads/moplayer/windows/latest-windows.json`
2. Show: version, size, release date, Windows 10/11, installer type
3. Steps: Download → Install → Open → Activate → Add source
4. Hide download CTA if JSON or EXE missing
5. Optional portable download link (`&portable=1`)

**Hosting note:** EXEs (~115 MB) are gitignored; production needs Supabase Storage / GitHub Releases / R2 before public deploy on Vercel.

---

## 7. Technical Constraints

- No React Router — keep `ScreenId` state machine
- No new heavy dependencies (performance first)
- Tailwind v4 present but unused — stay on semantic CSS + tokens
- Do not break activation API (`moplayer2` slug)
- Do not store credentials in Supabase
- Blur effects capped; `will-change` used sparingly
- Monolithic `App.tsx` partially refactored via UI components only where safe

---

## 8. Testing Plan

```powershell
# From repo root
npm run verify:windows
npm run dist:windows

# Packaged smoke
npm --prefix apps/moplayer-pro-windows run smoke

# Visual QA screenshots
npm --prefix apps/moplayer-pro-windows run qa:screens
```

**Manual checklist:** install → splash → activation → login → Xtream/M3U → Live/Movies/Series → player fullscreen → keyboard → settings → relaunch → uninstall.

**Web:**
```powershell
npm run verify:web
```

---

## 9. Component Library

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Glass panel wrapper |
| `OrangeButton` | Primary CTA |
| `IconButton` | Toolbar actions |
| `PageHeader` | Screen title + eyebrow |
| `EmptyState` | No content states |
| `LoadingState` | Shimmer loading |
| `ErrorState` | Error with retry |
| `PremiumSidebar` | Desktop navigation |
| `SplashScreen` | Launch screen |
| `HubCard` | Home destination cards |
| `MediaCard` | Poster/channel cards (extracted) |

---

## 10. Success Criteria

- [ ] Visually distinct orange glass identity (not gold TV skin)
- [ ] Sidebar desktop navigation
- [ ] All 12 screens polished
- [ ] TypeScript + build pass
- [ ] Installer builds with new art
- [ ] Website shows release metadata
- [ ] No broken activation or playback
