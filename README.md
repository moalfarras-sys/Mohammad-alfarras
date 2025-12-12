# Moalfarras Space – Personal Website

هذا المستودع يحتوي ملفات موقع **moalfarras.space** بنسخته الساكنة (Static HTML/CSS/JS)، مع دعم لغتين عربي/إنجليزي، وثيم زجاجي، ودمج Google AdSense.

This repository contains the source for **moalfarras.space**, a static bilingual (Arabic/English) personal site built with plain HTML/CSS/JS and a glassmorphism-inspired theme, including Google AdSense integration.

---

## 🚀 How to run locally

### عربي

1. نزّل (Download) ملفات المشروع إلى جهازك.
2. افتح الملف `index.html` مباشرة في المتصفّح (Double‑click).
3. للتجربة بشكل أقرب للإستضافة، يفضّل تشغّل سيرفر بسيط، مثلاً باستخدام Python:

```bash
python -m http.server 8080
```

ثم افتح في المتصفّح:

```
http://localhost:8080/
```

### English

1. Clone or download this repository.
2. Open `index.html` directly in a browser, **or** run a simple HTTP server (recommended):

```bash
python -m http.server 8080
```

Then go to:

```
http://localhost:8080/
```

---

## 🚀 Deploy to Vercel (Recommended)

This site is optimized for **Vercel** deployment with automatic continuous deployment from GitHub.

### Quick Start (5 minutes)
See **[VERCEL_QUICK_START.md](VERCEL_QUICK_START.md)** for fast deployment checklist.

### Detailed Setup Guide
See **[VERCEL_SETUP_GUIDE.md](VERCEL_SETUP_GUIDE.md)** for complete step-by-step instructions.

### What's Included
✅ `vercel.json` - Full configuration for security headers, caching, redirects  
✅ `.vercelignore` - Excludes documentation and unnecessary files  
✅ Verification script: `bash verify-vercel.sh`  
✅ Clean URLs, custom 404, multi-language support  
✅ Zero-config deployment - just import from GitHub!

---

## 🌐 Deploy to GitHub Pages (Alternative)

### 1. Create the repository

1. Create a new repo on GitHub, for example: `moalfarras-space`.
2. Push all files from this folder (the contents of `Moalfarras-space-main`) to the `main` branch.

### 2. Enable Pages via GitHub Actions (recommended)

This project comes with a GitHub Actions workflow at:

```
.github/workflows/deploy-pages.yml
```

Steps:

1. On GitHub, open **Settings → Pages**.
2. Under "Build and deployment", select:
   - **Source: GitHub Actions**
3. The workflow will automatically deploy the site on every push to `main`.

The site will be available at:

```
https://<your-username>.github.io/<repo-name>/
```

---

## 🔗 Custom Domain: moalfarras.space

To use the custom domain **moalfarras.space**:

1. In **Settings → Pages → Custom domain**, set:

   ```
   moalfarras.space
   ```

2. In your domain DNS panel, create these records:

   **A records:**

   ```text
   @  185.199.108.153
   @  185.199.109.153
   @  185.199.110.153
   @  185.199.111.153
   ```

   **CNAME:**

   ```text
   www  <your-username>.github.io
   ```

3. Back in GitHub Pages, enable:

   - **Enforce HTTPS**

Once DNS has propagated, the site will be reachable via:

```text
https://moalfarras.space
```

---

## 📄 404 Page

A custom `404.html` page is included.  
GitHub Pages will automatically serve this page for unknown routes (e.g. broken links).

---

## 💰 Google AdSense

The site already includes:

- Global AdSense script and account meta tag inside `<head>`:
  - `data-ad-client="ca-pub-5537213929748711"`
- `ads.txt` file at the project root:
  - `google.com, pub-5537213929748711, DIRECT, f08c47fec0942fa0`
- In‑page AdSense blocks inside the blog / streaming sections (Arabic & English).

To complete setup, replace the placeholder `data-ad-slot="0000000000"` values with **your actual Ad Unit IDs** from your AdSense account.

---

## 🔍 SEO basics

The main pages (`index.html`, `en/index.html`, `blog.html`, `en/blog.html`, etc.) contain:

- `<title>` optimized for the name "Mohammad Alfarras / محمد الفراس".
- Basic `<meta name="description">` tags.
- Open Graph tags (`og:title`, `og:description`, `og:type`, `og:site_name`) for better sharing.

You can adjust the descriptions any time to reflect changes in your content (e.g. streaming offers, YouTube focus, etc.).

---

## 🧩 Structure

- `index.html` – الصفحة الرئيسية (عربي)
- `en/index.html` – Home (English)
- `blog.html` – المدونة والعروض (streaming + أعمال)
- `en/blog.html` – Blog & Work (streaming + offers)
- `cv.html` / `en/cv.html` – السيرة الذاتية / CV
- `youtube.html` – صفحة اليوتيوب
- `contact.html` – صفحة التواصل
- `reviews.html` – آراء الزوار
- `assets/css/style.css` – التنسيقات العامة
- `assets/js/main.js` – السلوكيات، الأنيميشن الخفيفة، تبديل الثيم
- `ads.txt` – ملف AdSense الرسمي

---

## 🛠️ Customization

- لتعديل الألوان أو الثيم (لايت/دارك) استخدم المتغيرات في `style.css` داخل :root / html / html.dark.
- لتعديل النصوص، افتح الملفات `.html` وغيّر المحتوى مباشرة (العناوين، الفقرات، الروابط، إلخ).

If you change the folder structure, make sure to update all relative links (CSS/JS, images, language switch links, etc.).

