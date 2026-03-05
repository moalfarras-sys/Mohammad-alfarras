# Dynamic Content System & Glass Photo Frames Guide

## ✅ What Was Implemented

### 1. Dynamic Content System

A rotating tagline/note system that automatically cycles through different phrases across the site in both Arabic and English.

**Features:**
- Automatic language detection (AR/EN)
- Smooth fade-out/fade-in transitions (400ms)
- 10-second rotation interval
- Separate content arrays for different sections

---

## 📍 File Locations

### Dynamic Content Data
**File:** `/data/dynamic-content.json`

This JSON file contains all rotating phrases organized by section and language:

```json
{
  "hero_taglines": {
    "ar": [ ... ],
    "en": [ ... ]
  },
  "cv_highlights": {
    "ar": [ ... ],
    "en": [ ... ]
  },
  "youtube_notes": {
    "ar": [ ... ],
    "en": [ ... ]
  }
}
```

### JavaScript Loader
**File:** `/assets/js/main.js` (bottom section)

The dynamic content system is initialized at the end of main.js with:
- Language detection
- JSON loading
- Fade animations
- Rotation timers

---

## 🎯 HTML Element IDs for Dynamic Text

Add these IDs to any element where you want dynamic rotating text:

### Currently Implemented:

1. **Home Page Hero Tagline**
   - ID: `#hero-dynamic-text`
   - Location: index.html & en/index.html
   - Class: `.eyebrow`
   - Data source: `hero_taglines[lang]`

2. **CV Page Highlight Note**
   - ID: `#cv-dynamic-note`
   - Location: cv.html & en/cv.html
   - Class: `.eyebrow`
   - Data source: `cv_highlights[lang]`

3. **YouTube Page Note**
   - ID: `#youtube-dynamic-note`
   - Location: youtube.html & en/youtube.html
   - Class: `.eyebrow`
   - Data source: `youtube_notes[lang]`

### How to Add More Dynamic Elements:

1. **Add a new element in your HTML:**
   ```html
   <p class="eyebrow dynamic-text" id="your-new-id">Default text</p>
   ```

2. **Add content to `/data/dynamic-content.json`:**
   ```json
   "your_new_section": {
     "ar": [
       "النص الأول بالعربي",
       "النص الثاني بالعربي"
     ],
     "en": [
       "First English text",
       "Second English text"
     ]
   }
   ```

3. **Initialize rotation in main.js:**
   ```javascript
   if (data.your_new_section && data.your_new_section[currentLang]) {
     startRotation('your-new-id', data.your_new_section[currentLang]);
   }
   ```

---

## 🎨 Glass Photo Frames - CSS Classes

### Base Component: `.glass-photo`

**Default styling:**
```css
.glass-photo {
  border-radius: 24px;
  overflow: hidden;
  padding: 4px;
  background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(20,184,166,0.16));
  box-shadow: 0 18px 40px rgba(15,23,42,0.35);
  /* Glass effect with blur */
}
```

**Default hover:**
- Image scales to `1.03` and translates up `6px`
- Enhanced shadow and border glow
- Smooth 220ms transition

### Variants:

#### 1. `.glass-photo--floating`
Adds continuous subtle floating animation (10s cycle):
```html
<div class="glass-photo glass-photo--floating">
  <img src="portrait.jpg" alt="..." />
</div>
```

**Animation:** Floats up/down 6px smoothly over 10 seconds.

#### 2. `.glass-photo--thumb`
Smaller radius and shadow for thumbnails/cards:
```html
<div class="glass-photo glass-photo--thumb">
  <img src="thumbnail.jpg" alt="..." />
</div>
```

**Uses:**
- Video thumbnails
- Small gallery items
- Card images

#### 3. `.image-frame` (legacy support)
The old `.image-frame` class now inherits the same `.glass-photo` styling for consistency.

---

## 🔧 Customization Guide

### Change Animation Speed

**Rotation interval (main.js line ~245):**
```javascript
const ROTATION_INTERVAL = 10000; // Change to any value in ms
```

**Fade transition speed (main.js line ~246):**
```javascript
const FADE_DURATION = 400; // Change to any value in ms
```

**Floating animation speed (CSS):**
```css
@keyframes floatPhoto {
  /* Change animation-duration in .glass-photo--floating */
}
.glass-photo--floating img {
  animation: floatPhoto 10s ease-in-out infinite; /* Change 10s here */
}
```

### Change Glass Frame Colors

**Edit `/assets/css/style.css` around line 190:**

```css
.glass-photo,
.image-frame {
  background: linear-gradient(135deg, 
    rgba(99,102,241,0.18),  /* Indigo - change these */
    rgba(20,184,166,0.16)   /* Teal - change these */
  );
}
```

### Change Border Radius Globally

**Edit glass-photo border radius:**
```css
.glass-photo {
  border-radius: 24px; /* Change this value */
}

.glass-photo--thumb {
  border-radius: 16px; /* Smaller for thumbs */
}
```

### Change Hover Transform

**Edit hover behavior:**
```css
.glass-photo:hover img {
  transform: translateY(-6px) scale(1.03); /* Adjust these values */
}
```

### Disable Animations (Accessibility)

All animations respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .glass-photo--floating img {
    animation: none !important;
  }
  .dynamic-text.fade-out,
  .dynamic-text.fade-in {
    animation: none !important;
  }
}
```

---

## 📦 Where Glass Photos Are Applied

### Home Page (`index.html` & `en/index.html`)
- Hero portrait: `.glass-photo--floating`
- Two mini photos: `.glass-photo--thumb`

### CV Page (`cv.html` & `en/cv.html`)
- Main portrait: `.glass-photo--floating`
- Two mini photos: `.glass-photo--thumb`

### Gallery Sections
- All gallery images use `.image-frame` (which inherits `.glass-photo` styling)

### YouTube Page
- Channel hero images use `.glass` with inline styles
- Can be converted to `.glass-photo--thumb` for consistency

---

## 🚀 Adding Dynamic Content to New Pages

### Step 1: Add HTML Element
```html
<p class="eyebrow dynamic-text" id="contact-dynamic-text">Default message</p>
```

### Step 2: Add Content to JSON
```json
"contact_messages": {
  "ar": [
    "رسالة 1",
    "رسالة 2",
    "رسالة 3"
  ],
  "en": [
    "Message 1",
    "Message 2",
    "Message 3"
  ]
}
```

### Step 3: Initialize in main.js
Add this block in the `initDynamicContent()` function after line ~285:

```javascript
if (data.contact_messages && data.contact_messages[currentLang]) {
  startRotation('contact-dynamic-text', data.contact_messages[currentLang]);
}
```

---

## 🎬 Animation Classes Reference

### For Dynamic Text:
- `.dynamic-text` - Base class (applied automatically)
- `.fade-out` - Applied during fade-out transition
- `.fade-in` - Applied during fade-in transition

### For Photos:
- `.glass-photo` - Base glass frame
- `.glass-photo--floating` - Adds floating animation
- `.glass-photo--thumb` - Thumbnail variant

---

## 🔍 Debugging

### Check if dynamic content is loading:
Open browser console and look for:
```
Dynamic content not loaded: [error]
```

If you see this, check:
1. `/data/dynamic-content.json` exists and is valid JSON
2. Server is serving the `/data` folder correctly
3. Element IDs match in HTML and main.js

### Check animations:
- Elements with `#hero-dynamic-text`, `#cv-dynamic-note`, `#youtube-dynamic-note` should exist
- They should have class `.dynamic-text` added dynamically
- Text should change every 10 seconds with fade effect

---

## 📝 Current Content Summary

### Hero Taglines (5 each):
- Rotation through personal journey phrases
- Mix of professional + creative identity
- Mention key numbers (159+ videos, Disposition, IKEA)

### CV Highlights (5 each):
- Focus on logistics expertise
- Specific responsibilities (50+ drivers, IKEA operations)
- Professional achievements

### YouTube Notes (5 each):
- Content volume (159+ videos)
- Honest, unfiltered approach
- Practical tips and real experiences

**All content is natural, NOT literal translations between AR/EN.**

---

## ✅ Testing Checklist

- [ ] Home page hero tagline rotates (AR & EN)
- [ ] CV page highlight rotates (AR & EN)
- [ ] YouTube page note rotates (AR & EN)
- [ ] All photos use `.glass-photo` styling
- [ ] Hero portraits have floating animation
- [ ] Thumbnail variants look correct
- [ ] Hover effects work smoothly
- [ ] Fade transitions are smooth (not jarring)
- [ ] Language detection works (AR/EN)
- [ ] No console errors related to dynamic content

---

## 🎨 Design Tokens

### Glass Photo Frame:
- Border radius: `24px` (base), `16px` (thumb)
- Padding: `4px`
- Shadow: `0 18px 40px rgba(15,23,42,0.35)`
- Gradient: Indigo → Teal

### Animations:
- Float cycle: `10s`
- Hover transition: `220ms ease-out`
- Text fade: `400ms ease`
- Rotation interval: `10s`

---

**Last Updated:** December 9, 2025
**Version:** 1.0
**Status:** ✅ Production Ready
