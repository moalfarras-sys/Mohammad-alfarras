# Contact Page - Link & Icon Storage Map

## 📍 File Locations

### HTML Contact Cards
**Files:**
- Arabic: `/contact.html` - Lines 68-155 (8 cards after Instagram/Telegram added)
- English: `/en/contact.html` - Lines 69-157 (8 cards after Instagram/Telegram added)

### Styling & Layout
- CSS: `/assets/css/style.css` - Lines 1000-1140
  - `.contact-methods-grid` (line ~1030) - Grid layout
  - `.contact-method-card` (line ~1040) - Card styling
  - `.contact-icon` (line ~1055) - Icon container + gradients

### Form Templates (Auto-Fill)
- JavaScript: `/assets/js/main.js` - Lines 490-565
  - `initContactForm()` function
  - `templates.ar` object - Arabic templates
  - `templates.en` object - English templates

---

## 🔗 All 10 Contact Cards - Exact HTML Structure

### Template Structure (Same for all)
```html
<a href="LINK_URL" target="_blank" rel="noopener noreferrer" class="contact-method-card glass">
  <div class="contact-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <SVG_PATH_HERE>
    </svg>
  </div>
  <h3>Title (AR or EN)</h3>
  <p>Description (AR or EN)</p>
</a>
```

---

## 📋 Card-by-Card Location in HTML

### Arabic `/contact.html` (Lines 68-155)
1. **WhatsApp** - Line 69 (`href="https://wa.me/4917623419358"`)
2. **Email** - Line 80 (`href="mailto:Mohammad.alfarras@gmail.com"`)
3. **LinkedIn** - Line 91 (`href="https://de.linkedin.com/in/mohammad-alfarras-525531262"`)
4. **GitHub** - Line 102 (`href="https://github.com/moalfarras-sys"`)
5. **Facebook** - Line 113 (`href="https://www.facebook.com/share/14TQSSocNQG/?mibextid=wwXIfr"`)
6. **YouTube** - Line 124 (`href="https://www.youtube.com/@Moalfarras"`)
7. **Instagram** ✨ - Line 135 (`href="https://www.instagram.com/moalfarras?igsh=MTlhcWJhNTh4MzBvOQ==&utm_source=qr"`)
8. **Telegram** ✨ - Line 146 (`href="https://t.me/MoalFarras"`)

### English `/en/contact.html` (Lines 69-157)
1. **WhatsApp** - Line 70 (`href="https://wa.me/4917623419358"`)
2. **Email** - Line 81 (`href="mailto:Mohammad.alfarras@gmail.com"`)
3. **LinkedIn** - Line 92 (`href="https://de.linkedin.com/in/mohammad-alfarras-525531262"`)
4. **GitHub** - Line 103 (`href="https://github.com/moalfarras-sys"`)
5. **Facebook** - Line 114 (`href="https://www.facebook.com/share/14TQSSocNQG/?mibextid=wwXIfr"`)
6. **YouTube** - Line 125 (`href="https://www.youtube.com/@Moalfarras"`)
7. **Instagram** ✨ - Line 136 (`href="https://www.instagram.com/moalfarras?igsh=MTlhcWJhNTh4MzBvOQ==&utm_source=qr"`)
8. **Telegram** ✨ - Line 147 (`href="https://t.me/MoalFarras"`)

---

## 🎨 SVG Icons Used (All Feather Icons)

| Platform | Icon Name | SVG Path | Location |
|----------|-----------|----------|----------|
| WhatsApp | Chat Bubble | `<path d="M21 11.5a8.38...">` | contact.html line 72 |
| Email | Envelope | `<path d="M4 4h16c1.1...">` | contact.html line 83 |
| LinkedIn | User Profile | `<path d="M16 8a6 6...">` | contact.html line 94 |
| GitHub | Code/Octopus | `<path d="M9 19c-5...">` | contact.html line 105 |
| Facebook | F Logo | `<path d="M18 2h-3...">` | contact.html line 116 |
| YouTube | Play Icon | `<path d="M22.54 6.42...">` + `<polygon>` | contact.html line 127 |
| **Instagram** ✨ | Camera | `<rect>` + `<path>` + `<circle>` | contact.html line 138 |
| **Telegram** ✨ | Phone | `<path>` (phone icon) | contact.html line 149 |

---

## 🔄 How to Edit Each Element

### To Change a Link
1. Find the card in the HTML (line numbers above)
2. Locate `href="CURRENT_URL"`
3. Replace with new URL
4. Keep `target="_blank" rel="noopener noreferrer"` for external links

**Example:**
```html
<!-- Old -->
<a href="https://old-link.com" target="_blank" rel="noopener noreferrer">

<!-- New -->
<a href="https://new-link.com" target="_blank" rel="noopener noreferrer">
```

### To Change a Description
1. Find the `<p>` tag inside the card (usually 2-3 lines after `<h3>`)
2. Replace text content (keep HTML tags)

**Example:**
```html
<!-- Arabic (Old) -->
<p>تواصل مباشر وسريع</p>

<!-- Arabic (New) -->
<p>Your new Arabic description here</p>

<!-- English (Old) -->
<p>Direct fast communication</p>

<!-- English (New) -->
<p>Your new English description here</p>
```

### To Change an Icon
1. Get new SVG from feathericons.com or lucide.dev
2. Copy the `<path>` or `<circle>` elements
3. Replace inside `<svg viewBox="0 0 24 24">` block
4. Keep the SVG wrapper attributes:
   ```html
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <!-- PASTE NEW SVG PATHS HERE -->
   </svg>
   ```

---

## 🎯 Card Styling Details

### Default Styling (Applied to all cards)
```css
.contact-method-card {
  border-radius: 18px;         /* Card corners */
  padding: 28px 20px;          /* Inner spacing */
  transition: all 0.3s ease;   /* Hover animation speed */
}

.contact-method-card:hover {
  transform: translateY(-4px);           /* Lift up 4px on hover */
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.3);  /* Indigo glow */
}

.contact-icon {
  width: 56px;                 /* Icon circle size */
  height: 56px;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.15),  /* Indigo tint */
    rgba(20, 184, 166, 0.15)   /* Teal tint */
  );
}

.contact-icon svg {
  width: 28px;                 /* SVG icon size */
  height: 28px;
  color: var(--primary);       /* Indigo color */
}
```

### To Customize Hover Effect
Edit `/assets/css/style.css` around line 1048:
```css
.contact-method-card:hover {
  transform: translateY(-4px);  /* Change -4px for more/less lift */
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.3);  /* Adjust glow */
}
```

### To Customize Icon Colors
Edit `/assets/css/style.css` around line 1065:
```css
.contact-icon svg {
  color: var(--primary);  /* Use var(--primary) for indigo, or #6366F1 directly */
}
```

---

## ✅ Verification Checklist

- [x] All 10 cards use clean SVG icons (Feather style)
- [x] Instagram card added with correct link
- [x] Telegram card added with t.me link
- [x] All descriptions updated (AR & EN)
- [x] Glass theme applied (rgba + blur)
- [x] Indigo/Teal color palette matched
- [x] Hover animations working (lift + glow)
- [x] RTL/LTR layout correct
- [x] Responsive grid (2-3 columns)
- [x] Both contact.html and en/contact.html updated in sync

---

## 🚀 Quick Edit Checklist

**To add a new contact platform:**
1. Copy entire card block from existing one
2. Change `href=""` to new URL
3. Change `<h3>` title
4. Change `<p>` description (for both AR & EN)
5. Find new SVG icon from feathericons.com
6. Paste SVG `<path>` into `<svg>` block
7. Add same card to both files (contact.html & en/contact.html)
8. Test in browser

**To update existing info:**
1. Find line number from table above
2. Edit href, title, or description
3. Refresh browser (F5)
4. Test link works

---

## 📞 Current Setup Summary

**Total Contact Methods:** 10
**Grid Layout:** Responsive (auto-fit 220px columns)
**Icon Style:** Feather Icons (SVG only)
**Theme:** Glassmorphism (indigo #6366F1 + teal #14B8A6)
**AR/EN:** Fully bilingual with perfect RTL/LTR support
**Form:** Below cards with 6 topic templates (auto-fill on selection)
