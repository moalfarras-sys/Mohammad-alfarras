#!/bin/bash

echo "🔍 Verifying Vercel deployment readiness..."
echo ""

# Check vercel.json
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json exists"
else
    echo "❌ vercel.json missing"
    exit 1
fi

# Check .vercelignore
if [ -f ".vercelignore" ]; then
    echo "✅ .vercelignore exists"
else
    echo "❌ .vercelignore missing"
    exit 1
fi

# Check main HTML files
echo ""
echo "📄 Checking HTML files..."
for file in index.html blog.html cv.html youtube.html contact.html privacy.html 404.html; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file missing"
    fi
done

# Check English pages
echo ""
echo "📄 Checking English pages..."
for file in en/index.html en/blog.html en/cv.html en/youtube.html en/contact.html en/privacy.html; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file missing"
    fi
done

# Check assets
echo ""
echo "📦 Checking assets..."
if [ -f "assets/css/style.css" ]; then
    echo "   ✅ CSS file"
else
    echo "   ❌ CSS file missing"
fi

if [ -f "assets/js/main.js" ]; then
    echo "   ✅ main.js"
else
    echo "   ❌ main.js missing"
fi

if [ -f "assets/js/youtube-local.js" ]; then
    echo "   ✅ youtube-local.js"
else
    echo "   ❌ youtube-local.js missing"
fi

# Check data files
echo ""
echo "📊 Checking data files..."
if [ -f "assets/data/videos.json" ]; then
    echo "   ✅ videos.json"
else
    echo "   ❌ videos.json missing"
fi

if [ -f "data/dynamic-content.json" ]; then
    echo "   ✅ dynamic-content.json"
else
    echo "   ❌ dynamic-content.json missing"
fi

# Check for absolute paths in HTML
echo ""
echo "🔗 Checking for absolute paths..."
ABSOLUTE_PATHS=$(grep -r 'href="/' --include="*.html" . 2>/dev/null | grep -v "https://" | wc -l)
if [ "$ABSOLUTE_PATHS" -eq 0 ]; then
    echo "   ✅ No absolute paths found in HTML"
else
    echo "   ⚠️  Found $ABSOLUTE_PATHS absolute path(s) in HTML files"
    grep -r 'href="/' --include="*.html" . 2>/dev/null | grep -v "https://" | head -5
fi

# Check for backup/old files
echo ""
echo "🧹 Checking for unwanted files..."
if [ -f "assets/css/style.css.backup" ]; then
    echo "   ⚠️  Found backup CSS file"
else
    echo "   ✅ No backup CSS file"
fi

if [ -f "en/contact-old.html" ]; then
    echo "   ⚠️  Found old contact page"
else
    echo "   ✅ No old contact page"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERCEL DEPLOYMENT READY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "   1. Review vercel.json configuration"
echo "   2. Test locally: npx serve . -l 8080"
echo "   3. Deploy: vercel --prod"
echo "   4. Or push to GitHub and import to Vercel"
echo ""
echo "📖 See VERCEL_DEPLOYMENT.md for detailed instructions"
