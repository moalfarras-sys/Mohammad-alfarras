# Quick Visual Test Checklist ✅

## Desktop View (1920px)

### Hero Section
- [ ] Portrait visible with round frame
- [ ] Handwritten signature "Mohammad Alfarras" below portrait
- [ ] 3 floating icons around portrait (mic, monitor, star)
- [ ] Icons have subtle floating animation
- [ ] Text is two-column layout (text | portrait)
- [ ] All 5 skill pills visible below portrait

### Gallery Section
- [ ] Title: "لمحات من يومي مع التقنية" (AR) / "Moments from My Tech Day" (EN)
- [ ] 4 columns of images
- [ ] Hover: Image scales up slightly
- [ ] Camera icon appears on hover
- [ ] Glass card styling visible

### Skills Section
- [ ] Title: "أين يمكن أن تساعدك مهاراتي؟" (AR) / "Where Can My Skills Help You?" (EN)
- [ ] 4 cards in 2x2 grid
- [ ] Each card has: Icon (top-left), Title, Description, 3 tags
- [ ] Hover: Card lifts up with purple glow
- [ ] Gradient top border appears on hover

### FAQ Section
- [ ] Title: "أسئلة سريعة · FAQ"
- [ ] 5 questions visible
- [ ] Each question has left icon
- [ ] Click to expand/collapse smoothly
- [ ] Answer text fades in when opened

---

## Tablet View (768px)

### Hero Section
- [ ] Text centered above portrait
- [ ] Portrait and signature stacked in center
- [ ] Floating icons still visible (smaller)
- [ ] Skill pills in 2-column grid

### Gallery Section
- [ ] 3 columns of images
- [ ] Proper spacing maintained

### Skills Section
- [ ] 2 columns of cards
- [ ] Cards remain readable

### FAQ Section
- [ ] Full width questions
- [ ] Icons visible on left

---

## Mobile View (375px)

### Hero Section
- [ ] Text fully centered
- [ ] Portrait centered below text
- [ ] Signature visible under portrait
- [ ] Floating icons visible but smaller (36px)
- [ ] Skill pills in single column
- [ ] No large empty spaces above or below

### Gallery Section
- [ ] 2 columns of images
- [ ] Images fit properly
- [ ] Touch: Tap for overlay effect

### Skills Section
- [ ] Single column of cards
- [ ] Cards stack vertically
- [ ] All text readable
- [ ] Tags wrap properly

### FAQ Section
- [ ] Questions full width
- [ ] Text wraps properly
- [ ] Tap to expand/collapse
- [ ] Icons visible

---

## Animation Tests

### Scroll Reveal
- [ ] Hero elements fade in on page load
- [ ] Gallery items fade in when scrolling down
- [ ] Skills cards fade in with stagger effect
- [ ] FAQ items fade in one by one

### Hover Effects (Desktop)
- [ ] Gallery items scale on hover
- [ ] Skills cards lift on hover
- [ ] FAQ items glow on hover
- [ ] Floating icons continue animating

### Performance
- [ ] No lag during scroll
- [ ] Animations smooth (60fps)
- [ ] No console errors
- [ ] Images load properly

---

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] FAQ accordions open/close with Enter
- [ ] Focus states visible
- [ ] Skip to main content works

### Screen Reader
- [ ] Hero has proper aria-label
- [ ] Images have alt text
- [ ] FAQ region properly labeled
- [ ] Buttons have accessible names

### Reduced Motion
- [ ] Open System Preferences > Accessibility > Display > Reduce motion
- [ ] All animations should be disabled
- [ ] Content still visible and functional

---

## RTL/LTR Consistency

### Arabic (index.html)
- [ ] Text aligned right
- [ ] FAQ icons on left (flex-reverse)
- [ ] Skill tags flow right-to-left
- [ ] Floating icons in same positions
- [ ] No layout shift when switching languages

### English (en/index.html)
- [ ] Text aligned left
- [ ] FAQ icons on left (standard)
- [ ] Skill tags flow left-to-right
- [ ] Floating icons in same positions
- [ ] Same visual structure as Arabic

---

## Browser Compatibility

### Chrome/Edge
- [ ] All animations work
- [ ] Backdrop-filter blur works
- [ ] Gradient text works
- [ ] IntersectionObserver works

### Firefox
- [ ] Glass effects render properly
- [ ] Animations smooth
- [ ] No console warnings

### Safari
- [ ] -webkit- prefixes working
- [ ] Backdrop-filter supported
- [ ] Gradient text rendering

### Mobile Safari/Chrome
- [ ] Touch interactions work
- [ ] No horizontal scroll
- [ ] Animations perform well
- [ ] Images load properly

---

## Final Checks

- [ ] No console errors
- [ ] No 404s for fonts/images
- [ ] Pacifico font loads properly
- [ ] All sections visible
- [ ] Footer year displays correctly
- [ ] Language toggle works
- [ ] Theme toggle works
- [ ] Smooth scroll on anchor links

---

## Test URLs

**Arabic**: http://localhost:8000/index.html
**English**: http://localhost:8000/en/index.html

---

## Test in DevTools

1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test these sizes:
   - iPhone SE: 375x667
   - iPad: 768x1024
   - Desktop: 1920x1080
4. Check "Reduce motion" in Rendering tab
5. Check Console for errors

---

**Expected Result**: All checkboxes should be ✅ with no errors or issues.
