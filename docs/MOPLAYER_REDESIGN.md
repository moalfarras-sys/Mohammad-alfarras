# MoPlayer Portal Redesign Documentation

This document describes the redesign principles, color palettes, and UI rules implemented for the MoPlayer Product Hub page (`/apps/moplayer`).

## 1. Visual Strategy & Design Token System

To create an extremely premium, state-of-the-art landing page, we transitioned from basic static lists to an interactive glassmorphic shelf system. Each product in the MoPlayer ecosystem is styled using its own theme:

| Product | Accent Color | Visual Identity | Target Audience |
| --- | --- | --- | --- |
| **MoPlayer Classic** | Energetic Teal / Cyan | Clean, utility, high performance | Budget and weak Android devices, simple remote-only screens. |
| **MoPlayer Pro** | Luxurious Champagne Gold | Cinematic glassmorphism, glowing card | Flagship Android TV screens, cinematic living room setup. |
| **MoPlayer PC** | Ice Blue / Neon Cyan | Desktop installer, mouse & keyboard | Windows desktop workstations, mouse + touch input. |
| **Roadmap Apps** | Warm Amber (Translucent) | Locked feature cards, glowing indicators | Prepared placeholders for iOS, Apple TV, LG webOS, Samsung Tizen. |

## 2. Technical Implementation Details

### CSS Glassmorphism
We use CSS properties for advanced backdrop blurring and saturation:
- Backdrop filters: `backdrop-filter: blur(24px) saturate(160%)`
- Border borders: thin semitransparent borders mapped to dynamic hover variables.
- Gradients: Obsidian dark canvas using radial-gradient overlays.

```css
.moplayer-hub {
  background:
    radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(0, 114, 255, 0.08) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(0, 245, 212, 0.04) 0%, transparent 50%),
    #050505;
}
```

### Micro-Animations
- **Floating Effect**: Float animations on dashboard screens using `translateY` and keyframes.
- **Card Hovers**: Cards lift up by `6px`, border color brightens, and a soft outer drop shadow/glow matching the product accent color is cast.
- **CTA Buttons**: Dynamic hover expansions and gradient shifts.

## 3. Product Gateway Links
- Clicking **Classic** opens the classic details page (`/apps/moplayer/classic`).
- Clicking **Pro** opens the pro details page (`/apps/moplayer2`).
- Clicking **PC** downloads the latest Windows installer.
- **Future Platforms** are clearly marked as placeholders.
