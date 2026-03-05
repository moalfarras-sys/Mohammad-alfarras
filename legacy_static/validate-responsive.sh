#!/bin/bash

# Responsive Design Validation Script
# Tests all pages and responsive features

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     RESPONSIVE DESIGN VALIDATION - MOALFARRAS.SPACE           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Check function
check_item() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((FAILED++))
    fi
}

echo "📋 Checking Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check main CSS file
if [ -f "assets/css/style.css" ]; then
    LINES=$(wc -l < assets/css/style.css)
    if [ "$LINES" -gt 7000 ]; then
        check_item 0 "Main CSS file exists ($LINES lines)"
    else
        check_item 1 "Main CSS file has insufficient lines ($LINES)"
    fi
else
    check_item 1 "Main CSS file missing"
fi

# Check responsive guide
[ -f "RESPONSIVE_DESIGN_GUIDE.md" ] && check_item 0 "Responsive guide exists" || check_item 1 "Responsive guide missing"

# Check implementation summary
[ -f "RESPONSIVE_IMPLEMENTATION_SUMMARY.md" ] && check_item 0 "Implementation summary exists" || check_item 1 "Implementation summary missing"

# Check test page
[ -f "responsive-test.html" ] && check_item 0 "Test page exists" || check_item 1 "Test page missing"

echo ""
echo "📄 Checking HTML Pages..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Arabic pages
for page in index.html cv.html blog.html youtube.html contact.html; do
    [ -f "$page" ] && check_item 0 "Arabic: $page" || check_item 1 "Arabic: $page missing"
done

# English pages
for page in index.html cv.html blog.html youtube.html contact.html; do
    [ -f "en/$page" ] && check_item 0 "English: en/$page" || check_item 1 "English: en/$page missing"
done

echo ""
echo "🎨 Checking CSS Structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for responsive sections in CSS
RESPONSIVE_SECTION=$(grep -c "MOBILE-FIRST RESPONSIVE DESIGN SYSTEM" assets/css/style.css)
check_item $((1 - RESPONSIVE_SECTION)) "Mobile-first responsive section added"

# Check for breakpoints
BREAKPOINT_480=$(grep -c "min-width: 480px" assets/css/style.css)
check_item $((BREAKPOINT_480 > 0 ? 0 : 1)) "480px breakpoint exists ($BREAKPOINT_480 instances)"

BREAKPOINT_768=$(grep -c "min-width: 768px" assets/css/style.css)
check_item $((BREAKPOINT_768 > 0 ? 0 : 1)) "768px breakpoint exists ($BREAKPOINT_768 instances)"

BREAKPOINT_1024=$(grep -c "min-width: 1024px" assets/css/style.css)
check_item $((BREAKPOINT_1024 > 0 ? 0 : 1)) "1024px breakpoint exists ($BREAKPOINT_1024 instances)"

BREAKPOINT_1280=$(grep -c "min-width: 1280px" assets/css/style.css)
check_item $((BREAKPOINT_1280 > 0 ? 0 : 1)) "1280px breakpoint exists ($BREAKPOINT_1280 instances)"

echo ""
echo "📱 Checking Mobile-Specific Styles..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for overflow-x hidden
OVERFLOW_HIDDEN=$(grep -c "overflow-x: hidden" assets/css/style.css)
check_item $((OVERFLOW_HIDDEN > 0 ? 0 : 1)) "Horizontal scroll prevention ($OVERFLOW_HIDDEN instances)"

# Check for responsive images
RESPONSIVE_IMG=$(grep -c "max-width: 100%" assets/css/style.css)
check_item $((RESPONSIVE_IMG > 0 ? 0 : 1)) "Responsive image styles ($RESPONSIVE_IMG instances)"

# Check for CV responsive styles
CV_RESPONSIVE=$(grep -c "CV PAGE RESPONSIVE" assets/css/style.css)
check_item $((CV_RESPONSIVE > 0 ? 0 : 1)) "CV page responsive styles"

# Check for YouTube responsive styles
YOUTUBE_RESPONSIVE=$(grep -c "YOUTUBE PAGE RESPONSIVE" assets/css/style.css)
check_item $((YOUTUBE_RESPONSIVE > 0 ? 0 : 1)) "YouTube page responsive styles"

# Check for Contact responsive styles
CONTACT_RESPONSIVE=$(grep -c "CONTACT PAGE RESPONSIVE" assets/css/style.css)
check_item $((CONTACT_RESPONSIVE > 0 ? 0 : 1)) "Contact page responsive styles"

echo ""
echo "🌐 Checking RTL Support..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check RTL styles
RTL_STYLES=$(grep -c 'html\[dir="rtl"\]' assets/css/style.css)
check_item $((RTL_STYLES > 0 ? 0 : 1)) "RTL responsive styles ($RTL_STYLES instances)"

# Check for RTL responsive section
RTL_RESPONSIVE=$(grep -c "RTL SUPPORT FOR RESPONSIVE" assets/css/style.css)
check_item $((RTL_RESPONSIVE > 0 ? 0 : 1)) "RTL responsive section added"

echo ""
echo "🔍 Checking Asset Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check images
[ -f "assets/img/portrait.jpg" ] && check_item 0 "Portrait image exists" || check_item 1 "Portrait image missing"
[ -f "assets/img/logo-unboxing.png" ] && check_item 0 "Logo image exists" || check_item 1 "Logo image missing"

# Check JavaScript
[ -f "assets/js/main.js" ] && check_item 0 "Main JavaScript exists" || check_item 1 "Main JavaScript missing"
[ -f "assets/js/youtube-local.js" ] && check_item 0 "YouTube JavaScript exists" || check_item 1 "YouTube JavaScript missing"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL CHECKS PASSED - RESPONSIVE DESIGN READY FOR DEPLOY!   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Test responsive design: open responsive-test.html"
    echo "   2. Review guide: RESPONSIVE_DESIGN_GUIDE.md"
    echo "   3. Deploy to production"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  SOME CHECKS FAILED - PLEASE REVIEW BEFORE DEPLOYING      ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
