#!/bin/bash
# Production Cleanup Script
# Removes development/documentation files before deployment

echo "🧹 Cleaning up for production deployment..."

# Remove documentation files
echo "📄 Removing documentation files..."
rm -f BACKGROUND_UPDATES.md
rm -f BLOG_PAGE_GUIDE.md
rm -f BLOG_QUICK_REFERENCE.md
rm -f BLOG_REDESIGN_SUMMARY.md
rm -f CHANGELOG.md
rm -f CONTACT_LINKS_MAP.md
rm -f CONTACT_PAGE_GUIDE.md
rm -f DYNAMIC_CONTENT_GUIDE.md
rm -f FIXES_SUMMARY.md
rm -f GLASS_PHOTO_SYSTEM.md
rm -f HERO_CUSTOMIZATION_GUIDE.md
rm -f IMAGE_MAPPING_SUMMARY.md
rm -f IMAGE_QUICK_REFERENCE.md
rm -f IMAGE_STANDARDIZATION_FINAL.md
rm -f NAVBAR_GLASS_REDESIGN.md
rm -f NAVBAR_VERIFICATION.md
rm -f ORBIT_ICONS_FIX.md
rm -f PERFORMANCE_METRICS.md
rm -f PHASE2_FINAL_POLISHING.md
rm -f YOUTUBE_SOURCE_RESET.md
rm -f YOUTUBE_STATIC_GUIDE.md

# Remove unused HTML files
echo "🗑️  Removing unused pages..."
rm -f en/contact-old.html
rm -f reviews.html

# Remove scripts folder (optional - uncomment if not needed)
# echo "📦 Removing scripts folder..."
# rm -rf scripts/

# Remove development files
echo "🔧 Removing development files..."
rm -f .env.example

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Production files remaining:"
echo "   - index.html + all main pages"
echo "   - en/ folder with English pages"
echo "   - assets/ folder (CSS, JS, images)"
echo "   - data/ folder (JSON data)"
echo "   - SEO files (sitemap, robots.txt, etc.)"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Kept files:"
echo "   - README.md (for GitHub)"
echo "   - DEPLOYMENT.md (deployment guide)"
echo "   - scripts/ folder (you can remove manually if not needed)"
