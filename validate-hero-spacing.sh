#!/bin/bash

# Hero Spacing Optimization Validation Script
# Checks that all CSS changes were applied correctly

echo "🔍 Validating Hero Spacing Optimization..."
echo ""

CSS_FILE="assets/css/style.css"
PASS=0
FAIL=0

# Check if CSS file exists
if [ ! -f "$CSS_FILE" ]; then
    echo "❌ ERROR: $CSS_FILE not found!"
    exit 1
fi

echo "📋 Checking Base Hero Styles..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check base hero padding
if grep -q "\.cinematic-hero {" "$CSS_FILE" && \
   grep -A5 "\.cinematic-hero {" "$CSS_FILE" | grep -q "padding: 40px 0 50px;"; then
    echo "✅ Base hero padding optimized (40px/50px)"
    ((PASS++))
else
    echo "❌ Base hero padding not updated"
    ((FAIL++))
fi

# Check grid gap
if grep -q "\.cinematic-hero-grid {" "$CSS_FILE" && \
   grep -A10 "\.cinematic-hero-grid {" "$CSS_FILE" | grep -q "gap: 60px;"; then
    echo "✅ Base grid gap optimized (60px)"
    ((PASS++))
else
    echo "❌ Base grid gap not updated"
    ((FAIL++))
fi

# Check grid padding
if grep -A10 "\.cinematic-hero-grid {" "$CSS_FILE" | grep -q "padding: 0 20px;"; then
    echo "✅ Grid padding added (0 20px)"
    ((PASS++))
else
    echo "❌ Grid padding not added"
    ((FAIL++))
fi

# Check content gap
if grep -q "\.cinematic-hero-content {" "$CSS_FILE" && \
   grep -A5 "\.cinematic-hero-content {" "$CSS_FILE" | grep -q "gap: 16px;"; then
    echo "✅ Content gap optimized (16px)"
    ((PASS++))
else
    echo "❌ Content gap not updated"
    ((FAIL++))
fi

# Check paragraph font size
if grep -q "\.cinematic-hero-paragraph {" "$CSS_FILE" && \
   grep -A5 "\.cinematic-hero-paragraph {" "$CSS_FILE" | grep -q "font-size: 1.05rem;"; then
    echo "✅ Paragraph font size optimized (1.05rem)"
    ((PASS++))
else
    echo "❌ Paragraph font size not updated"
    ((FAIL++))
fi

# Check paragraph line-height
if grep -A6 "\.cinematic-hero-paragraph {" "$CSS_FILE" | grep -q "line-height: 1.7;"; then
    echo "✅ Paragraph line-height optimized (1.7)"
    ((PASS++))
else
    echo "❌ Paragraph line-height not updated"
    ((FAIL++))
fi

# Check visual min-height
if grep -q "\.cinematic-hero-visual {" "$CSS_FILE" && \
   grep -A6 "\.cinematic-hero-visual {" "$CSS_FILE" | grep -q "min-height: auto;"; then
    echo "✅ Visual min-height set to auto"
    ((PASS++))
else
    echo "❌ Visual min-height not updated"
    ((FAIL++))
fi

echo ""
echo "📱 Checking Mobile Responsive Styles..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check mobile hero padding
if grep -q "HERO SECTION - Mobile First" "$CSS_FILE" && \
   grep -A5 "HERO SECTION - Mobile First" "$CSS_FILE" | grep -q "padding: 20px 0 40px;"; then
    echo "✅ Mobile hero padding optimized (20px/40px)"
    ((PASS++))
else
    echo "❌ Mobile hero padding not updated"
    ((FAIL++))
fi

# Check mobile grid gap
if grep -A10 "HERO SECTION - Mobile First" "$CSS_FILE" | grep -q "gap: 24px;"; then
    echo "✅ Mobile grid gap optimized (24px)"
    ((PASS++))
else
    echo "❌ Mobile grid gap not updated"
    ((FAIL++))
fi

# Check mobile grid padding
if grep -A12 "HERO SECTION - Mobile First" "$CSS_FILE" | grep -q "padding: 0 16px;"; then
    echo "✅ Mobile grid padding added (0 16px)"
    ((PASS++))
else
    echo "❌ Mobile grid padding not added"
    ((FAIL++))
fi

# Check mobile content gap
if grep -A15 "HERO SECTION - Mobile First" "$CSS_FILE" | grep -q "gap: 12px;"; then
    echo "✅ Mobile content gap optimized (12px)"
    ((PASS++))
else
    echo "❌ Mobile content gap not updated"
    ((FAIL++))
fi

# Check mobile paragraph font
if grep -A20 "HERO SECTION - Mobile First" "$CSS_FILE" | grep -q "font-size: 1rem;"; then
    echo "✅ Mobile paragraph font size improved (1rem)"
    ((PASS++))
else
    echo "❌ Mobile paragraph font size not updated"
    ((FAIL++))
fi

echo ""
echo "🖥️ Checking Desktop Breakpoints..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check 1024px padding
if grep -A5 "@media (min-width: 1024px)" "$CSS_FILE" | grep -q "padding: 60px 0 70px;"; then
    echo "✅ Desktop (1024px) padding optimized (60px/70px)"
    ((PASS++))
else
    echo "❌ Desktop (1024px) padding not updated"
    ((FAIL++))
fi

# Check 1024px grid gap
if grep -A10 "@media (min-width: 1024px)" "$CSS_FILE" | grep -q "gap: 60px;"; then
    echo "✅ Desktop (1024px) grid gap optimized (60px)"
    ((PASS++))
else
    echo "❌ Desktop (1024px) grid gap not updated"
    ((FAIL++))
fi

# Check 1280px padding
if grep -A5 "@media (min-width: 1280px)" "$CSS_FILE" | grep -q "padding: 70px 0 80px;"; then
    echo "✅ Large desktop (1280px) padding optimized (70px/80px)"
    ((PASS++))
else
    echo "❌ Large desktop (1280px) padding not updated"
    ((FAIL++))
fi

# Check 1280px grid gap
if grep -A10 "@media (min-width: 1280px)" "$CSS_FILE" | grep -q "gap: 70px;"; then
    echo "✅ Large desktop (1280px) grid gap optimized (70px)"
    ((PASS++))
else
    echo "❌ Large desktop (1280px) grid gap not updated"
    ((FAIL++))
fi

echo ""
echo "🎨 Checking Portrait & Pills Spacing..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check portrait container gap
if grep -q "\.hero-portrait-container {" "$CSS_FILE" && \
   grep -A5 "\.hero-portrait-container {" "$CSS_FILE" | grep -q "gap: 12px;"; then
    echo "✅ Portrait container gap optimized (12px)"
    ((PASS++))
else
    echo "❌ Portrait container gap not updated"
    ((FAIL++))
fi

# Check icon row margin-top
if grep -q "\.hero-icon-row {" "$CSS_FILE" && \
   grep -A2 "\.hero-icon-row {" "$CSS_FILE" | grep -q "margin-top: 12px;"; then
    echo "✅ Icon row margin-top optimized (12px)"
    ((PASS++))
else
    echo "❌ Icon row margin-top not updated"
    ((FAIL++))
fi

# Check icon row gap
if grep -A5 "\.hero-icon-row {" "$CSS_FILE" | grep -q "gap: 10px 14px;"; then
    echo "✅ Icon row gap optimized (10px 14px)"
    ((PASS++))
else
    echo "❌ Icon row gap not updated"
    ((FAIL++))
fi

echo ""
echo "📄 Checking Test Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "hero-spacing-test.html" ]; then
    echo "✅ hero-spacing-test.html exists"
    ((PASS++))
else
    echo "❌ hero-spacing-test.html not found"
    ((FAIL++))
fi

if [ -f "HERO_SPACING_OPTIMIZATION.md" ]; then
    echo "✅ HERO_SPACING_OPTIMIZATION.md exists"
    ((PASS++))
else
    echo "❌ HERO_SPACING_OPTIMIZATION.md not found"
    ((FAIL++))
fi

if [ -f "HERO_SPACING_QUICK_REF.md" ]; then
    echo "✅ HERO_SPACING_QUICK_REF.md exists"
    ((PASS++))
else
    echo "❌ HERO_SPACING_QUICK_REF.md not found"
    ((FAIL++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo ""

TOTAL=$((PASS + FAIL))
PERCENTAGE=$(( (PASS * 100) / TOTAL ))

if [ $FAIL -eq 0 ]; then
    echo "🎉 All checks passed! ($PERCENTAGE%)"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Open hero-spacing-test.html in browser"
    echo "   2. Test responsive behavior (360px-1920px)"
    echo "   3. Compare index.html (Arabic) and en/index.html (English)"
    echo "   4. Verify on real devices"
    echo ""
    exit 0
else
    echo "⚠️  Some checks failed. ($PERCENTAGE% passed)"
    echo ""
    echo "Please review the failed items above and ensure all changes were applied correctly."
    echo ""
    exit 1
fi
