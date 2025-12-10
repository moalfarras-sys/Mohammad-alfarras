# Vercel Deployment Guide

## ✅ Production Ready

This website is optimized for **Vercel** deployment with:
- All paths are relative
- Clean URL structure
- Security headers configured
- Cache optimization
- Custom 404 page
- Multi-language support (AR/EN)

## 📁 Project Structure

```
/
├── index.html              # Arabic homepage (root)
├── blog.html              # Arabic blog
├── cv.html                # Arabic CV
├── youtube.html           # Arabic YouTube
├── contact.html           # Arabic contact
├── privacy.html           # Arabic privacy
├── 404.html              # Custom 404 page
├── en/                   # English pages
│   ├── index.html
│   ├── blog.html
│   ├── cv.html
│   ├── youtube.html
│   ├── contact.html
│   └── privacy.html
├── assets/               # Static assets
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   └── youtube-local.js
│   ├── img/             # Images
│   └── data/
│       └── videos.json   # YouTube video data
└── data/
    └── dynamic-content.json
```

## 🚀 Deploy to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Vercel deployment ready"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repo: `moalfarras-sys/Mohammad-alfarras`
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Other (static site)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** Leave empty
   - **Output Directory:** `./` (leave as default)
   - Click "Deploy"

4. **Add Custom Domain:**
   - Go to Project Settings → Domains
   - Add domain: `moalfarras.space`
   - Add domain: `www.moalfarras.space` (will auto-redirect)
   - Configure DNS with provided records:
     ```
     A     @    76.76.21.21
     CNAME www  cname.vercel-dns.com
     ```

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd /workspaces/Mohammad-alfarras
vercel

# Deploy to production
vercel --prod
```

## ⚙️ Configuration Details

### vercel.json Features

✅ **Clean URLs:** `/about` instead of `/about.html`
✅ **Security Headers:** X-Frame-Options, CSP, etc.
✅ **Cache Optimization:**
   - Assets: 1 year immutable cache
   - HTML: No cache, must revalidate
✅ **Redirects:** `/index.html` → `/`
✅ **Rewrites:** `/en` → `/en/index.html`

### .vercelignore

Excludes from deployment:
- Documentation markdown files
- Backup files (*.backup)
- Scripts and shell files
- Netlify configuration
- Git and IDE files

## 🧪 Test Deployment

After deployment, test these URLs:

### Arabic Pages
- https://moalfarras.space/
- https://moalfarras.space/blog
- https://moalfarras.space/cv
- https://moalfarras.space/youtube
- https://moalfarras.space/contact

### English Pages
- https://moalfarras.space/en
- https://moalfarras.space/en/blog
- https://moalfarras.space/en/cv
- https://moalfarras.space/en/youtube
- https://moalfarras.space/en/contact

### Features to Test
✅ Language switcher (AR ↔ EN)
✅ Theme toggle (Light/Dark)
✅ Navigation links
✅ YouTube video loading
✅ Image loading
✅ Contact form
✅ 404 page (test with /invalid-page)

## 📊 Expected Performance

- **First Load:** < 1s
- **Lighthouse Score:** 90+
- **Core Web Vitals:** All green
- **Global CDN:** Sub-100ms latency

## 🔒 Security Headers

Automatically applied via `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 🌐 DNS Configuration

For **moalfarras.space** domain:

### Registrar DNS Settings
```
Type   Name   Value
----   ----   -----
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

**Note:** DNS propagation may take 1-24 hours.

## ♻️ Continuous Deployment

Once connected to GitHub:
- Every push to `main` → Auto-deploys to production
- Preview deployments for PRs
- Instant rollbacks available
- Zero-downtime deployments

## 🐛 Troubleshooting

### Issue: Pages show 404
**Solution:** Check that all paths are relative (no leading `/`)

### Issue: Assets not loading in /en/ pages
**Solution:** Verify paths use `../assets/` in English pages

### Issue: Custom domain not working
**Solution:** 
1. Verify DNS records in your domain registrar
2. Wait 24h for propagation
3. Check Vercel domain status

### Issue: Videos not loading
**Solution:** Check browser console for CORS or path errors

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Status:** https://www.vercel-status.com/
- **Community:** https://github.com/vercel/vercel/discussions

---

**Deployment Status:** ✅ Ready
**Estimated Time:** 5 minutes
**Cost:** Free (Hobby plan)
