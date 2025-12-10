# Quick Reference - Image Usage Guide

## 📸 Image Mapping (Quick Reference)

| Image | Use For | Don't Use For |
|-------|---------|---------------|
| **00.jpeg** | Homepage hero mini, personal galleries | Blog cards, YouTube sections |
| **000.jpeg** | Homepage/blog hero (intro) | CV, contact, random placeholders |
| **11.jpeg** | YouTube/content creation ONLY | Homepage hero, blog, CV |
| **22.jpeg** | Blog planning, workspace context | YouTube hero, personal galleries |
| **33-88** | YouTube videos grid ONLY | Blog, CV, contact, homepage gallery |
| **portrait.jpg** | CV hero, formal About sections | Contact hero, blog hero |
| **logo.png** | Navbar, contact hero, footer | As replacement for face photos |

---

## ✅ Current Status (All Pages)

```
index.html       →  6 images  ✅  (portrait, 00, 11, 000, 22, logo)
blog.html        →  3 images  ✅  (000, 22, logo)
youtube.html     →  4 images  ✅  (11, 33, 44, logo)
cv.html          →  4 images  ✅  (portrait, 77, 88, logo)
contact.html     →  1 image   ✅  (logo only)
```

---

## 🚀 Quick Commands

### Verify image usage across site:
```bash
# Check all pages
for file in *.html en/*.html; do
  echo "$file:" && grep -o '[0-9]*\.jpeg\|portrait\.jpg' $file | sort | uniq -c
done

# Verify no thumbnails outside YouTube
grep -l '33\.jpeg\|44\.jpeg\|55\.jpeg\|66\.jpeg' *.html | grep -v youtube
# Should return: nothing
```

### Check blog page is minimal:
```bash
# Count images (should be 3: logo x2 + 000 + 22)
grep -c 'img src' blog.html en/blog.html

# Verify only 000 and 22
grep -E '(000|22)\.jpeg' blog.html
```

### Verify file sizes:
```bash
wc -l blog.html en/blog.html
# Should be: 309 lines each
```

---

## 📝 Blog Content Structure (Text-Focused)

```
1. Hero Section
   └── 000.jpeg (intro design)

2. Projects (Text-Only)
   ├── IKEA Route Management
   ├── 159+ Videos on YouTube
   ├── Simple Website Design
   └── Team Management

3. Planning Image (Optional)
   └── 22.jpeg (workspace)

4. Articles (Text-Only)
   ├── How Disposition Works
   ├── 10 Things from Managing Drivers
   ├── Customer-Driver Communication
   ├── Life & Work in Germany
   ├── Building Simple Website
   └── Content Creation Daily

5. Services (Text-Only)
   └── 8 detailed descriptions

6. Social Icons
   └── 6 minimal 40px icons
```

---

## 🎨 CSS Classes for Blog

```css
.blog-text-section        /* Main container */
.blog-text-item           /* Article wrapper */
.blog-text-title          /* 1.35rem heading */
.blog-text-meta           /* Category tag */
.blog-text-content        /* Body text */
.blog-article-item        /* Article list item */
.collab-list-detailed     /* Services grid */
.collab-detail-item       /* Service card */
.social-icons-minimal     /* 40px icons */
```

---

## 🔧 How to Update an Image

1. **Replace in HTML:**
   ```bash
   # Example: Change hero image on blog
   sed -i 's/000\.jpeg/new-image.jpeg/g' blog.html
   sed -i 's/000\.jpeg/new-image.jpeg/g' en/blog.html
   ```

2. **Update documentation:**
   Edit `IMAGE_MAPPING_SUMMARY.md` with new image purpose

3. **Verify:**
   ```bash
   grep -rn "new-image.jpeg" *.html en/*.html
   ```

---

## 📚 Full Documentation

- `IMAGE_MAPPING_SUMMARY.md` - Complete mapping guide
- `CHANGELOG.md` - Detailed changes log
- This file - Quick reference

---

## ⚠️ Rules to Remember

1. **Never** use YouTube thumbnails (33-88) outside YouTube page
2. **Always** use logo (not face) in contact page
3. **Keep** blog pages text-focused (3 images max)
4. **Match** image context to content (no workspace on YouTube hero)
5. **Document** any new images in IMAGE_MAPPING_SUMMARY.md

---

**Last Updated:** December 2024  
**Status:** ✅ Complete
