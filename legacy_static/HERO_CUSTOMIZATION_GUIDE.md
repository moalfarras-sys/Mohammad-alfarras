# 🎨 Cinematic Hero Customization Guide

Complete guide for customizing your premium cinematic hero section with mathematical precision.

---

## 📐 CSS Variables System

All key dimensions are controlled via CSS variables at `:root` level for easy customization.

### Desktop (Default)
```css
:root {
  --orbit-radius: 200px;        /* Distance from portrait center */
  --bubble-size: 60px;          /* Glass bubble diameter */
  --icon-size: 24px;            /* SVG icon dimensions */
}
```

### Tablet (768px breakpoint)
```css
@media (max-width: 768px) {
  :root {
    --orbit-radius: 140px;
    --bubble-size: 44px;
    --icon-size: 20px;
  }
}
```

### Mobile (480px breakpoint)
```css
@media (max-width: 480px) {
  :root {
    --orbit-radius: 110px;
    --bubble-size: 40px;
    --icon-size: 18px;
  }
}
```

---

## 🔵 Icon Orbit Customization

### Adjust Orbit Radius
Change the distance of icons from the portrait center:

```css
:root {
  --orbit-radius: 250px;  /* Larger orbit */
  --orbit-radius: 150px;  /* Smaller orbit */
}
```

### Perfect Circular Positioning Formula
Icons are positioned using trigonometric transforms at 45° intervals:

```css
.floating-icon:nth-child(N) {
  transform: translate(cos(angle) × radius, sin(angle) × radius);
}
```

**8 Icon Positions:**
- Icon 1 (0°): `translate(0, -200px)` — Top
- Icon 2 (45°): `translate(141.4px, -141.4px)` — Top-right (0.707 × 200)
- Icon 3 (90°): `translate(200px, 0)` — Right
- Icon 4 (135°): `translate(141.4px, 141.4px)` — Bottom-right
- Icon 5 (180°): `translate(0, 200px)` — Bottom
- Icon 6 (225°): `translate(-141.4px, 141.4px)` — Bottom-left
- Icon 7 (270°): `translate(-200px, 0)` — Left
- Icon 8 (315°): `translate(-141.4px, -141.4px)` — Top-left

**Note:** 0.707 = cos(45°) = sin(45°)

### Add More Icons (9+ Icons)
To add a 9th icon at 40° intervals:

```css
/* 9 icons = 360° ÷ 9 = 40° spacing */
.floating-icon:nth-child(9) {
  transform: translate(
    calc(var(--orbit-radius) * 0.643),   /* cos(40°) */
    calc(var(--orbit-radius) * -0.766)   /* sin(40°) */
  );
  animation: iconFloatParallax 7.6s ease-in-out infinite;
  animation-delay: 7.2s;
}
```

**Common trigonometric values:**
- 30° = cos: 0.866, sin: 0.5
- 36° = cos: 0.809, sin: 0.588
- 40° = cos: 0.766, sin: 0.643
- 60° = cos: 0.5, sin: 0.866

---

## 💎 Glass Bubble Styling

### Bubble Size
```css
:root {
  --bubble-size: 60px;   /* Desktop (default) */
  --bubble-size: 70px;   /* Larger bubbles */
  --bubble-size: 50px;   /* Smaller bubbles */
}
```

### Glass Effect Variables
Located around line **4291-4295**:

```css
:root {
  --bubble-bg: rgba(255, 255, 255, 0.15);
  --bubble-border: rgba(255, 255, 255, 0.35);
  --bubble-blur: 10px;
}
```

### Custom Glass Styles
Modify `.floating-icon` class (line **4297**):

```css
.floating-icon {
  background: var(--bubble-bg);
  border: 1px solid var(--bubble-border);
  backdrop-filter: blur(var(--bubble-blur));
  
  /* Multi-layer shadow for depth */
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
}
```

### Hover Effects
```css
.floating-icon:hover {
  transform: scale(1.05) translateY(-4px);
  box-shadow: 
    0 8px 24px rgba(118, 121, 247, 0.35),
    0 4px 12px rgba(118, 121, 247, 0.25),
    inset 0 1px 1px rgba(255, 255, 255, 0.35);
}
```

---

## 🎭 SVG Icon Customization

### Icon Size
```css
:root {
  --icon-size: 24px;   /* Desktop (default) */
  --icon-size: 28px;   /* Larger icons */
  --icon-size: 20px;   /* Smaller icons */
}
```

### Replace SVG Icons
Edit `index.html` (line ~90-165) and `en/index.html`:

```html
<div class="floating-icon" title="Your Title">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="YOUR_SVG_PATH_DATA"/>
  </svg>
</div>
```

**Icon Resources:**
- [Feather Icons](https://feathericons.com/)
- [Lucide Icons](https://lucide.dev/)
- [Heroicons](https://heroicons.com/)

### Icon Styling
```css
.floating-icon svg {
  width: var(--icon-size);
  height: var(--icon-size);
  stroke-width: 2px;
  stroke: currentColor;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## ✨ Animation Customization

### Parallax Floating Animation
Located at line **4373**:

```css
@keyframes iconFloatParallax {
  0%, 100% { 
    transform: translateY(0px) translateX(0px) rotate(0deg); 
  }
  25% { 
    transform: translateY(-6px) translateX(2px) rotate(0.5deg); 
  }
  50% { 
    transform: translateY(-10px) translateX(0px) rotate(0deg); 
  }
  75% { 
    transform: translateY(-6px) translateX(-2px) rotate(-0.5deg); 
  }
}
```

**Customize Motion:**
```css
/* More dramatic motion */
50% { transform: translateY(-15px) translateX(3px) rotate(1deg); }

/* Subtle motion */
50% { transform: translateY(-4px) translateX(1px) rotate(0.2deg); }
```

### Animation Timing
Each icon has individual duration and delay (line **4461-4510**):

```css
.floating-icon:nth-child(1) {
  animation: iconFloatParallax 7.2s ease-in-out infinite;
  animation-delay: 0s;
}

.floating-icon:nth-child(2) {
  animation: iconFloatParallax 7.5s ease-in-out infinite;
  animation-delay: 0.9s;
}
```

**Customization tips:**
- **Duration**: 6-8s = smooth, 4-6s = energetic, 8-12s = calming
- **Delay**: Stagger by 0.8-1.2s for wave effect
- **Easing**: `ease-in-out` = smooth, `cubic-bezier(0.4, 0, 0.2, 1)` = custom

---

## 🌟 Portrait Glow Customization

### Radial Glow Settings
Located at line **4207**:

```css
.cinematic-portrait-container::before {
  width: 450px;                    /* Glow diameter */
  height: 450px;
  filter: blur(40px);              /* Blur intensity */
  opacity: 0.35;                   /* Dark theme opacity */
  background: radial-gradient(
    circle,
    rgba(118, 121, 247, 1) 0%,     /* Center color */
    rgba(118, 121, 247, 0.6) 35%,  /* Mid glow */
    transparent 65%                /* Fade edge */
  );
  animation: glowPulse 10s ease-in-out infinite;
}
```

**Customization options:**
```css
/* Brighter glow */
opacity: 0.5;
filter: blur(45px);

/* Tighter glow */
width: 350px;
height: 350px;
filter: blur(30px);

/* Different color */
background: radial-gradient(
  circle,
  rgba(14, 168, 154, 1) 0%,       /* Teal glow */
  transparent 65%
);
```

### Glow Pulse Animation
```css
@keyframes glowPulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.35; 
  }
  50% { 
    transform: scale(1.1); 
    opacity: 0.5; 
  }
}
```

---

## 📱 Mobile Responsive Behavior

### Icon Visibility
**Tablet (768px):** Shows 5 icons
```css
.floating-icon:nth-child(6),
.floating-icon:nth-child(7),
.floating-icon:nth-child(8) {
  display: none;
}
```

**Mobile (480px):** Shows 4 icons
```css
.floating-icon:nth-child(5) {
  display: none;
}
```

### Adjust Mobile Orbit
```css
@media (max-width: 480px) {
  :root {
    --orbit-radius: 120px;  /* Increase for more space */
    --bubble-size: 36px;    /* Decrease for tight layout */
  }
}
```

---

## 🎨 Color Theme Customization

### Primary Colors
Located at `:root` (line **13-40**):

```css
:root {
  /* Dark theme */
  --primary: #7679f7;              /* Indigo */
  --secondary: #12c9b8;            /* Teal */
  
  /* Light theme */
  --primary-light: #5b5fc7;
  --secondary-light: #0ea89a;
}
```

### Apply to Icon Bubbles
```css
.floating-icon {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--secondary) 100%
  );
}
```

---

## 🎯 Navbar Glass Styling

### Language Toggle Button
Located at line **439**:

```css
.language-toggle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.18);
  backdrop-filter: blur(12px);
  border: 1.2px solid rgba(99, 102, 241, 0.3);
}
```

### Theme Toggle (Sun/Moon)
Located at line **494**:

```css
.theme-toggle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(20, 184, 166, 0.18);
}

/* Moon icon (dark theme) */
.theme-toggle::after {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  transform: scale(1) rotate(0deg);
}

/* Sun icon (light theme) */
html[data-theme="light"] .theme-toggle::before {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  transform: scale(1) rotate(0deg);  /* Now rotates 180° on switch */
}
```

---

## 🛠️ Quick Customization Checklist

### Basic Changes (5 minutes)
- [ ] Adjust `--orbit-radius` for icon distance
- [ ] Change `--bubble-size` for icon bubble diameter
- [ ] Modify `--icon-size` for SVG dimensions
- [ ] Update glow `opacity` for brightness

### Moderate Changes (15 minutes)
- [ ] Swap SVG icons in HTML
- [ ] Adjust animation durations (6-8s range)
- [ ] Modify parallax motion intensity
- [ ] Change glow color gradient
- [ ] Update mobile breakpoint values

### Advanced Changes (30+ minutes)
- [ ] Add 9th or 10th icon with calculated angles
- [ ] Create custom animation keyframes
- [ ] Design new glass effect patterns
- [ ] Implement alternative positioning (spiral, random)
- [ ] Add interactive hover transformations

---

## 📚 Key File Locations

| Element | File | Line Range |
|---------|------|-----------|
| CSS Variables | `assets/css/style.css` | 13-17, 4288-4295 |
| Icon Orbit Position | `assets/css/style.css` | 4459-4510 |
| Glass Bubble Style | `assets/css/style.css` | 4297-4335 |
| Parallax Animation | `assets/css/style.css` | 4373-4386 |
| Portrait Glow | `assets/css/style.css` | 4207-4237 |
| SVG Icon HTML | `index.html` | 90-165 |
| SVG Icon HTML (EN) | `en/index.html` | 90-165 |
| Mobile Responsive | `assets/css/style.css` | 4543-4655 |
| Navbar Toggles | `assets/css/style.css` | 439-580 |

---

## 🎓 Mathematical Reference

### Circular Positioning Formula
```
X = radius × cos(angle)
Y = radius × sin(angle)
```

### Common Angle Values
| Angle | cos | sin | Usage |
|-------|-----|-----|-------|
| 0° | 1.0 | 0.0 | Top |
| 30° | 0.866 | 0.5 | — |
| 45° | 0.707 | 0.707 | Diagonal |
| 60° | 0.5 | 0.866 | — |
| 90° | 0.0 | 1.0 | Right |
| 180° | -1.0 | 0.0 | Bottom |
| 270° | 0.0 | -1.0 | Left |

### Calculate Custom Angles
```javascript
// For 9 icons at equal spacing (40°)
const angle = (360 / 9) * iconIndex;
const radians = angle * (Math.PI / 180);
const x = radius * Math.cos(radians);
const y = radius * Math.sin(radians);
```

---

## 🔍 Troubleshooting

### Icons Not Forming Perfect Circle
- Check `--orbit-radius` is set correctly
- Verify all 8 `.floating-icon:nth-child(N)` rules exist
- Ensure no conflicting positioning CSS

### Animation Feels Choppy
- Reduce parallax motion distance (10px → 6px)
- Increase animation duration (7s → 9s)
- Use `will-change: transform` for performance

### Mobile Layout Broken
- Verify CSS variables in media queries
- Check icon visibility rules (display: none)
- Test `--orbit-radius` scales appropriately

### Glow Too Bright/Dark
- Adjust `opacity` (0.2-0.5 range)
- Modify `blur()` value (30-50px)
- Change gradient stop percentages

---

## 💡 Pro Tips

1. **Always test on mobile** after changing `--orbit-radius`
2. **Use browser DevTools** to live-edit CSS variables
3. **Keep animation durations** between 6-8s for best UX
4. **Stagger delays** by 0.8-1.2s for organic feel
5. **Maintain 0.707 coefficient** for 45° angles
6. **Use CSS variables** instead of hardcoded values
7. **Test RTL layouts** after position changes
8. **Backup before major customization**

---

**Last Updated:** After premium circular alignment implementation  
**Version:** 2.0 - Mathematical Precision System
