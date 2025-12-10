# Glass Photo Component System

## Overview
Unified image component system with modern glass aesthetic, implemented across the entire website. All images now use consistent styling with variant modifiers for different use cases.

## Component Variants

### Base Component
```html
<div class="glass-photo">
  <img src="path/to/image.jpg" alt="description" />
</div>
```
- Border radius: 22px
- Soft gradient background (indigo/teal)
- Elevated shadow with blur
- Hover: translateY(-6px) scale(1.03)

### Portrait (CV Pages)
```html
<div class="glass-photo glass-photo--portrait glass-photo--floating">
  <img src="portrait.jpg" alt="..." />
</div>
```
- Aspect ratio: 3/4
- Max width: 320px
- Used for: CV portrait photos
- Includes 8s floating animation

### Hero (Main Showcase)
```html
<div class="glass-photo glass-photo--hero glass-photo--floating">
  <img src="hero.jpg" alt="..." />
</div>
```
- Aspect ratio: 4/5 (mobile), 1/1 (desktop)
- Responsive sizing
- Used for: Home page hero, blog/contact/YouTube hero images
- Includes floating animation

### Mini (Small Grid Items)
```html
<div class="glass-photo glass-photo--mini">
  <img src="mini.jpg" alt="..." />
</div>
```
- Aspect ratio: 1/1
- Full width within container
- Used for: Hero photo rows (2-column grids)

### Gallery (Standard Content)
```html
<figure class="glass-photo glass-photo--gallery">
  <img src="gallery.jpg" alt="..." />
</figure>
```
- Aspect ratio: 4/3
- Full width within grid
- Used for: Gallery grids on home page

### Thumbnail (Video/Media)
```html
<div class="glass-photo glass-photo--thumb">
  <img src="thumb.jpg" alt="..." />
</div>
```
- Aspect ratio: 16/9
- Smaller radius and shadow
- Used for: Video thumbnails (when needed)

## Floating Animation
Add `.glass-photo--floating` to any variant for a subtle floating effect:
- Duration: 8 seconds
- Movement: 0 → -6px → 0
- Pauses on hover

## Implementation Status

### ✅ Completed Pages

**Home Pages (AR/EN)**
- Hero images: 1 main (--hero --floating) + 2 minis (--mini)
- Gallery: 5 images (--gallery)

**CV Pages (AR/EN)**
- Portrait: 1 main (--portrait --floating)
- Mini grid: 2 images (--mini)

**YouTube Pages (AR/EN)**
- Hero image: 1 main (--hero --floating)
- Mini grid: 2 images (--mini)

**Blog Pages (AR/EN)**
- Hero image: 1 (--hero --floating)

**Contact Pages (AR/EN)**
- Hero image: 1 (--hero --floating)

## Customization Guide

### Global Settings (style.css)
```css
/* Line 195 - Border radius */
.glass-photo {
  border-radius: 22px; /* Change this value */
}

/* Line 197 - Shadow intensity */
box-shadow: 0 18px 42px rgba(0, 0, 0, 0.25); /* Adjust blur and alpha */

/* Line 227 - Hover lift amount */
.glass-photo:hover {
  transform: translateY(-6px) scale(1.03); /* Change -6px or 1.03 */
}

/* Line 270 - Float animation speed */
.glass-photo--floating {
  animation: floatPhoto 8s ease-in-out infinite; /* Change 8s */
}
```

### Variant Aspect Ratios (style.css lines 231-268)
```css
.glass-photo--portrait { aspect-ratio: 3/4; }    /* Line 231 */
.glass-photo--hero { aspect-ratio: 4/5; }        /* Line 238 */
.glass-photo--thumb { aspect-ratio: 16/9; }      /* Line 251 */
.glass-photo--mini { aspect-ratio: 1/1; }        /* Line 257 */
.glass-photo--gallery { aspect-ratio: 4/3; }     /* Line 262 */
```

### Gradient Overlay (line 199)
```css
.glass-photo::after {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.15),  /* Indigo - adjust alpha */
    rgba(20, 184, 166, 0.15)   /* Teal - adjust alpha */
  );
}
```

## Layout Patterns

### Hero with Photo Grid
```html
<aside class="hero-aside">
  <div class="glass-photo glass-photo--hero glass-photo--floating">
    <img src="main.jpg" alt="..." />
  </div>
  <div class="hero-photo-row">
    <div class="glass-photo glass-photo--mini">
      <img src="mini1.jpg" alt="..." />
    </div>
    <div class="glass-photo glass-photo--mini">
      <img src="mini2.jpg" alt="..." />
    </div>
  </div>
</aside>
```

### Gallery Grid
```html
<div class="gallery-grid">
  <figure class="glass-photo glass-photo--gallery">
    <img src="1.jpg" alt="..." />
  </figure>
  <figure class="glass-photo glass-photo--gallery">
    <img src="2.jpg" alt="..." />
  </figure>
  <!-- More images... -->
</div>
```

## CSS Architecture

**Location:** `/assets/css/style.css` lines 190-360

**Structure:**
1. Base `.glass-photo` (lines 190-230)
   - Container styling, gradient overlay, animations
2. Variant modifiers (lines 231-268)
   - --portrait, --hero, --thumb, --mini, --gallery
   - Each with specific aspect ratio and sizing
3. Float animation (lines 270-275)
4. Legacy support (lines 277-280)
   - `.image-frame` mirrors `.glass-photo` for backward compatibility

## RTL/LTR Support
All components work correctly in both Arabic (RTL) and English (LTR) layouts. No special handling needed.

## Mobile Responsiveness
- All variants use `aspect-ratio` for consistent scaling
- Hero variant adjusts from 4/5 (mobile) to 1/1 (tablet+)
- Max-width constraints prevent oversized images
- Grid layouts use `auto-fit` for flexible columns

## Performance Notes
- `loading="lazy"` on all images for deferred loading
- `decoding="async"` on English pages for non-blocking decode
- CSS animations use GPU-accelerated transforms
- Backdrop-filter may impact performance on low-end devices

## Browser Support
- Modern browsers (Chrome 88+, Firefox 94+, Safari 15.4+)
- Graceful degradation: images display without glass effect on older browsers
- `aspect-ratio` fallback: images may not maintain ratio on IE11/older browsers
