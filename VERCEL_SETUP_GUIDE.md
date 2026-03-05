# Vercel Deployment Setup Guide

## 📋 Complete Step-by-Step Guide to Deploy on Vercel

This guide will walk you through connecting your GitHub repository to Vercel and deploying your website.

---

## ✅ Pre-Deployment Checklist

Before deploying to Vercel, ensure:

- [x] ✅ `vercel.json` exists and is properly configured
- [x] ✅ `.vercelignore` file is present
- [x] ✅ All HTML pages are present (Arabic and English)
- [x] ✅ Static assets (CSS, JS, images) are in place
- [x] ✅ No absolute paths in HTML (all paths are relative)
- [x] ✅ Site tested locally and working
- [x] ✅ Repository is pushed to GitHub
- [x] ✅ `.env.example` is documented (actual `.env` is ignored)

You can verify readiness by running:
```bash
bash verify-vercel.sh
```

---

## 🚀 Part 1: Deploy to Vercel (First Time Setup)

### Step 1: Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Complete the account setup

### Step 2: Import Your GitHub Repository

1. Once logged in, click **"Add New..." → "Project"**
2. You'll see the "Import Git Repository" page
3. Find `moalfarras-sys/Mohammad-alfarras` in the list
   - If you don't see it, click **"Adjust GitHub App Permissions"** to grant access
4. Click **"Import"** next to your repository

### Step 3: Configure Your Project

On the configuration screen:

**Framework Preset:**
- Select: **"Other"** (this is a static HTML site)

**Root Directory:**
- Leave as: `./` (default - use root)

**Build Command:**
- Leave **empty** (no build process needed for static site)

**Output Directory:**
- Leave as: `./` (default - serve from root)

**Install Command:**
- Leave **empty** (no dependencies to install)

**Environment Variables:**
- **Skip this section** - not needed for this static site
- (YouTube API key is only for local video fetching, not deployment)

Then click **"Deploy"**!

### Step 4: Wait for Deployment

- Vercel will deploy your site (usually takes 20-60 seconds)
- You'll see a progress screen with deployment logs
- Once complete, you'll get a success message with your deployment URL

**Your site will be live at:**
```
https://mohammad-alfarras-<random-id>.vercel.app
```

---

## 🌐 Part 2: Add Custom Domain (Optional)

If you want to use your own domain (e.g., `moalfarras.space`):

### Step 1: Add Domain in Vercel

1. Go to your project dashboard
2. Click **"Settings"** tab
3. Click **"Domains"** in the left sidebar
4. Click **"Add"** button
5. Enter your domain: `moalfarras.space`
6. Click **"Add"**

### Step 2: Add www Subdomain (Optional)

1. Click **"Add"** again
2. Enter: `www.moalfarras.space`
3. Click **"Add"**
4. Vercel will automatically redirect `www` to root domain

### Step 3: Configure DNS Records

Vercel will show you the DNS records to add. Go to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

**For Root Domain (moalfarras.space):**

Add an **A Record:**
```
Type: A
Name: @ (or leave empty)
Value: 76.76.21.21
TTL: Automatic or 3600
```

**For www Subdomain:**

Add a **CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Automatic or 3600
```

### Step 4: Wait for DNS Propagation

- DNS changes can take 1-48 hours to propagate worldwide
- Usually takes 15 minutes to 2 hours
- Check status in Vercel dashboard under Domains
- You'll see a ✓ checkmark when domain is verified

### Step 5: Enable HTTPS (Automatic)

Vercel automatically provides free SSL certificates via Let's Encrypt:
- Certificate is issued once domain verification is complete
- HTTPS is enforced automatically
- Auto-renewal happens before expiration

---

## 🔄 Part 3: Continuous Deployment

Once connected, every push to your GitHub repository will automatically deploy:

### How It Works

1. You push code to GitHub: `git push origin main`
2. Vercel detects the push via webhook
3. Vercel automatically deploys the new version
4. Deployment takes 20-60 seconds
5. Your site is updated with zero downtime

### Branch Deployments

- **main branch** → Production deployment (your live site)
- **Other branches** → Preview deployments (unique URLs for testing)

### Pull Request Previews

When you create a pull request:
- Vercel creates a preview deployment automatically
- Unique URL provided for testing changes
- Preview updates on every new commit to the PR
- Perfect for reviewing changes before merging

---

## 🧪 Part 4: Post-Deployment Verification

After deployment, test these critical features:

### Arabic Pages (Root Domain)
- [ ] Homepage: `https://your-domain.vercel.app/`
- [ ] Blog: `https://your-domain.vercel.app/blog`
- [ ] CV: `https://your-domain.vercel.app/cv`
- [ ] YouTube: `https://your-domain.vercel.app/youtube`
- [ ] Contact: `https://your-domain.vercel.app/contact`
- [ ] Privacy: `https://your-domain.vercel.app/privacy`

### English Pages
- [ ] Homepage: `https://your-domain.vercel.app/en`
- [ ] Blog: `https://your-domain.vercel.app/en/blog`
- [ ] CV: `https://your-domain.vercel.app/en/cv`
- [ ] YouTube: `https://your-domain.vercel.app/en/youtube`
- [ ] Contact: `https://your-domain.vercel.app/en/contact`
- [ ] Privacy: `https://your-domain.vercel.app/en/privacy`

### Features to Test
- [ ] Language switcher (AR ↔ EN) works on all pages
- [ ] Theme toggle (Light/Dark) works correctly
- [ ] All navigation links work
- [ ] Images load properly
- [ ] YouTube videos display correctly
- [ ] Contact form is functional
- [ ] 404 page shows for invalid URLs
- [ ] Mobile responsive design works
- [ ] All assets (CSS/JS) load without errors

### Performance Check
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Reload page
- [ ] Check for 404 errors (red items)
- [ ] Verify CSS and JS files load
- [ ] Check page load time (should be < 2 seconds)

---

## 🛠️ Part 5: Environment Variables (If Needed Later)

Currently, this site doesn't need environment variables in Vercel because:
- It's a static site with no backend
- YouTube API key is only used locally for video fetching
- All configuration is in `vercel.json`

**If you need environment variables later:**

1. Go to your Vercel project
2. Click **"Settings"** → **"Environment Variables"**
3. Add variable name and value
4. Select environment: Production, Preview, or Development
5. Click **"Save"**
6. Redeploy for changes to take effect

---

## 📊 Part 6: Monitoring and Analytics

### Vercel Analytics (Optional)

Vercel offers free analytics:
1. Go to your project dashboard
2. Click **"Analytics"** tab
3. Click **"Enable Analytics"**
4. View real-time visitor data, page views, performance metrics

### Deployment Logs

Check deployment status and logs:
1. Go to **"Deployments"** tab
2. Click on any deployment
3. View build logs, function logs, and deployment details
4. Use this for troubleshooting if something goes wrong

---

## 🔧 Part 7: Common Issues and Solutions

### Issue: Site shows 404 for all pages

**Cause:** Vercel can't find index.html  
**Solution:**
1. Verify `vercel.json` is in repository root
2. Check that output directory is `./` (root)
3. Redeploy from Vercel dashboard

### Issue: CSS/JS files not loading

**Cause:** Incorrect paths in HTML  
**Solution:**
1. Verify all paths are relative (no leading `/`)
2. English pages should use `../assets/` for assets
3. Check browser console for exact path errors
4. Fix paths and push to GitHub

### Issue: English pages show 404

**Cause:** Rewrites not working  
**Solution:**
1. Verify `vercel.json` has rewrites configuration
2. Check that `en/` folder exists with HTML files
3. Redeploy if needed

### Issue: Custom domain shows "Invalid Configuration"

**Cause:** DNS records not configured correctly  
**Solution:**
1. Double-check DNS records in your domain registrar
2. Wait 24-48 hours for full DNS propagation
3. Use [whatsmydns.net](https://www.whatsmydns.net/) to check propagation
4. Contact Vercel support if still not working after 48h

### Issue: Deployment failed with error

**Cause:** Various (check logs)  
**Solution:**
1. Go to **Deployments** → Click failed deployment
2. Read error logs for specific issue
3. Fix the issue in your code
4. Push to GitHub to trigger new deployment

### Issue: Old version still showing after deployment

**Cause:** Browser cache  
**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or open in incognito/private mode
3. Check deployment status in Vercel dashboard
4. Clear browser cache if needed

---

## 📞 Part 8: Getting Help

### Vercel Resources
- **Documentation:** https://vercel.com/docs
- **Status Page:** https://www.vercel-status.com/
- **Community Forum:** https://github.com/vercel/vercel/discussions
- **Support:** help@vercel.com (for Pro/Enterprise)

### Quick Commands for Troubleshooting

**Test site locally:**
```bash
python -m http.server 8080
# Then visit http://localhost:8080
```

**Verify deployment readiness:**
```bash
bash verify-vercel.sh
```

**Check git status:**
```bash
git status
git log --oneline -5
```

**Deploy via CLI (alternative method):**
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🎯 Quick Reference

### Deployment Checklist

**Before Every Deployment:**
1. [ ] Test locally: `python -m http.server 8080`
2. [ ] Run verification: `bash verify-vercel.sh`
3. [ ] Commit changes: `git add . && git commit -m "message"`
4. [ ] Push to GitHub: `git push origin main`
5. [ ] Wait for Vercel auto-deployment (check dashboard)
6. [ ] Test live site after deployment

**After Major Changes:**
1. [ ] Test all pages (Arabic + English)
2. [ ] Test all features (theme, language switcher, etc.)
3. [ ] Check mobile responsiveness
4. [ ] Verify performance (load time < 2s)
5. [ ] Check browser console for errors

---

## ✨ Best Practices

1. ✅ **Test locally before pushing** - Save time and avoid broken deployments
2. ✅ **Use meaningful commit messages** - Helps track changes in deployment history
3. ✅ **Check Vercel dashboard after push** - Ensure deployment succeeded
4. ✅ **Keep .env.example updated** - But never commit actual .env file
5. ✅ **Use preview deployments** - Test changes in a branch before merging to main
6. ✅ **Monitor deployment logs** - Catch issues early
7. ✅ **Keep dependencies minimal** - Faster deployments and better security
8. ✅ **Use semantic versioning** - For tracking releases (if applicable)

---

## 🎉 Success!

Your website should now be live on Vercel! 

**Next Steps:**
1. Share your deployment URL with the world
2. Set up custom domain (if not done already)
3. Enable Vercel Analytics to track visitors
4. Continue building and improving your site
5. Enjoy automatic deployments on every push!

**Your deployment URL:**
```
https://mohammad-alfarras-<random-id>.vercel.app
```

Or with custom domain:
```
https://moalfarras.space
```

---

**Guide Version:** 1.0  
**Last Updated:** December 2024  
**Deployment Platform:** Vercel  
**Site Type:** Static HTML/CSS/JS
