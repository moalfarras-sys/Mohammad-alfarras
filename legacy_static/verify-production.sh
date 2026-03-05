#!/bin/bash
# Production Verification Script
# Checks if all required files are present and paths are correct

echo "🔍 Verifying production-ready structure..."
echo ""

errors=0

# Check main HTML files
echo "📄 Checking HTML files..."
files=("index.html" "blog.html" "cv.html" "youtube.html" "contact.html" "privacy.html" "404.html")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file MISSING"
    ((errors++))
  fi
done

# Check English pages
echo ""
echo "📄 Checking English pages..."
en_files=("en/index.html" "en/blog.html" "en/cv.html" "en/youtube.html" "en/contact.html" "en/privacy.html")
for file in "${en_files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file MISSING"
    ((errors++))
  fi
done

# Check assets
echo ""
echo "📦 Checking assets..."
if [ -f "assets/css/style.css" ]; then
  echo "   ✅ CSS file"
else
  echo "   ❌ CSS file MISSING"
  ((errors++))
fi

if [ -f "assets/js/main.js" ]; then
  echo "   ✅ main.js"
else
  echo "   ❌ main.js MISSING"
  ((errors++))
fi

if [ -f "assets/js/youtube-local.js" ]; then
  echo "   ✅ youtube-local.js"
else
  echo "   ❌ youtube-local.js MISSING"
  ((errors++))
fi

if [ -d "assets/img" ]; then
  img_count=$(find assets/img -type f | wc -l)
  echo "   ✅ Images folder ($img_count files)"
else
  echo "   ❌ Images folder MISSING"
  ((errors++))
fi

# Check data files
echo ""
echo "📊 Checking data files..."
if [ -f "assets/data/videos.json" ]; then
  echo "   ✅ videos.json"
else
  echo "   ❌ videos.json MISSING"
  ((errors++))
fi

if [ -f "data/dynamic-content.json" ]; then
  echo "   ✅ dynamic-content.json"
else
  echo "   ❌ dynamic-content.json MISSING"
  ((errors++))
fi

# Check SEO files
echo ""
echo "🔍 Checking SEO files..."
seo_files=("sitemap.xml" "robots.txt" "manifest.webmanifest")
for file in "${seo_files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file MISSING"
    ((errors++))
  fi
done

# Check for absolute paths in JS
echo ""
echo "🔗 Checking for absolute paths in JavaScript..."
if grep -r "fetch('[/]" assets/js/*.js 2>/dev/null; then
  echo "   ⚠️  Found absolute paths in JS files!"
  ((errors++))
else
  echo "   ✅ No absolute paths found"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED!"
  echo "🚀 Website is ready for deployment"
else
  echo "❌ Found $errors error(s)"
  echo "⚠️  Please fix the issues before deploying"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "   1. Run './cleanup-production.sh' (optional)"
echo "   2. Test locally: npx serve . -l 8080"
echo "   3. Deploy to Netlify (recommended)"
echo "   4. Configure DNS for moalfarras.space"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
