# Contact Page Guide

## Overview
The contact pages have been completely rebuilt with professional design, 10 real social media links, smart form templates, and unified SVG icons matching the indigo/teal glass theme.

## Contact Cards - Complete List

All 10 cards use clean SVG icons and match the glassmorphism design:

### 1. WhatsApp
- **Link**: https://wa.me/4917623419358
- **Icon**: Feather chat icon (message bubble)
- **AR Description**: "تواصل مباشر وسريع"
- **EN Description**: "Direct fast communication"

### 2. Email
- **Link**: mailto:Mohammad.alfarras@gmail.com
- **Icon**: Feather mail icon (envelope)
- **AR Description**: "راسلني لأي تفاصيل أو تعاون"
- **EN Description**: "Send me any details or collaboration proposal"

### 3. LinkedIn
- **Link**: https://de.linkedin.com/in/mohammad-alfarras-525531262
- **Icon**: Feather linkedin icon (user profile)
- **AR Description**: "ملفي المهني وخبراتي في مجال اللوجستيات"
- **EN Description**: "My professional logistics profile & experience"

### 4. GitHub
- **Link**: https://github.com/moalfarras-sys
- **Icon**: Feather github icon (octopus)
- **AR Description**: "مشاريعي البرمجية والمواقع التي أعمل عليها"
- **EN Description**: "My projects and development work"

### 5. Facebook
- **Link**: https://www.facebook.com/share/14TQSSocNQG/?mibextid=wwXIfr
- **Icon**: Feather facebook icon (f logo)
- **AR Description**: "مجتمعي الشخصي ومنشورات متنوعة"
- **EN Description**: "Personal updates & community posts"

### 6. YouTube
- **Link**: https://www.youtube.com/@Moalfarras
- **Icon**: Feather youtube icon (play icon)
- **AR Description**: "أكثر من 159 فيديو من الشغل والحياة في ألمانيا"
- **EN Description**: "159+ videos about life, work and logistics in Germany"

### 7. Instagram ✨ NEW
- **Link**: https://www.instagram.com/moalfarras?igsh=MTlhcWJhNTh4MzBvOQ==&utm_source=qr
- **Icon**: Feather camera icon (camera + circle)
- **AR Description**: "تابع محتواي اليومي وصوري وأفكاري الجديدة"
- **EN Description**: "Daily posts, visuals and personal updates"

### 8. Telegram ✨ NEW
- **Link**: https://t.me/MoalFarras (opens Telegram or redirects to web)
- **Icon**: Feather phone icon (telephone receiver)
- **AR Description**: "تواصل سريع عبر تليغرام – أسهل وأسرع"
- **EN Description**: "Fast messaging and direct communication"

## Real Contact Links

All links are now active in both Arabic and English versions - 10 platforms total:

### Communication & Messaging
- **WhatsApp**: https://wa.me/4917623419358
- **Email**: Mohammad.alfarras@gmail.com
- **Telegram**: https://t.me/MoalFarras

### Professional Platforms
- **LinkedIn**: https://de.linkedin.com/in/mohammad-alfarras-525531262
- **GitHub**: https://github.com/moalfarras-sys

### Social & Content
- **Instagram**: https://www.instagram.com/moalfarras?igsh=MTlhcWJhNTh4MzBvOQ==&utm_source=qr
- **Facebook**: https://www.facebook.com/share/14TQSSocNQG/?mibextid=wwXIfr
- **YouTube**: https://www.youtube.com/@Moalfarras

## How to Add More Links

### Step 1: Add to HTML
Open `contact.html` or `en/contact.html` and add a new card in the `.contact-methods-grid`:

```html
<a href="YOUR_LINK_HERE" target="_blank" rel="noopener noreferrer" class="contact-method-card glass">
  <div class="contact-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Add your SVG icon path here -->
      <path d="..."></path>
    </svg>
  </div>
  <h3>Platform Name</h3>
  <p>Short description</p>
</a>
```

### Step 2: Get SVG Icons
Use clean SVG icons from:
- **Feather Icons**: https://feathericons.com/
- **Heroicons**: https://heroicons.com/
- **Lucide**: https://lucide.dev/

Copy the SVG `<path>` elements and paste inside the `<svg>` tag.

## Form Templates System

### How It Works
When a user selects a topic from the dropdown, the message textarea automatically fills with a professional template.

### Current Templates

#### Arabic (`assets/js/main.js` - lines ~495-504)
```javascript
ar: {
  product: 'مرحباً محمد، عندي منتج/خدمة جديدة...',
  logistics: 'مرحباً محمد، عندي استفسار بخصوص اللوجستيات...',
  website: 'مرحباً محمد، أفكر أعمل موقع بسيط...',
  content: 'مرحباً محمد، أتابع محتواك...',
  consultation: 'مرحباً محمد، أحتاج استشارة...',
  other: ''
}
```

#### English (`assets/js/main.js` - lines ~506-514)
```javascript
en: {
  product: "Hi Mohammad, I'm launching a new product...",
  logistics: "Hi Mohammad, I have a question regarding logistics...",
  website: "Hi Mohammad, I'd like to create a simple website...",
  content: "Hi Mohammad, I follow your content...",
  consultation: "Hi Mohammad, I need consultation about...",
  other: ''
}
```

### How to Edit Templates

**Location**: `/assets/js/main.js` starting at line ~490

**To add a new template:**

1. Add option to HTML form in both `contact.html` and `en/contact.html`:
```html
<option value="newkey">New Topic Name</option>
```

2. Add template text in JavaScript:
```javascript
ar: {
  // ... existing templates ...
  newkey: 'مرحباً محمد، [your Arabic text]...'
}

en: {
  // ... existing templates ...
  newkey: 'Hi Mohammad, [your English text]...'
}
```

**To modify existing template:**
Just edit the text inside the quotes. Keep the `\n` for line breaks.

## Hero Section Text

### Arabic (`contact.html` - line ~43)
```html
<h1 class="hero-title">خلينا نشتغل سوا
  <span class="hero-gradient-text">رح نخلق شيء واقعي</span>
</h1>
<p class="hero-lead">سواء كنت صاحب مشروع، شركة، أو حتى شخص عنده فكرة صغيرة...</p>
```

### English (`en/contact.html` - line ~46)
```html
<h1 class="hero-title">Let's build something real together
  <span class="hero-gradient-text">One message at a time</span>
</h1>
<p class="hero-lead">Whether you're a company, project owner, or creator...</p>
```

## Styling Customization

### Contact Cards (CSS - lines ~1030-1090)

**Card hover lift:**
```css
.contact-method-card:hover {
  transform: translateY(-4px); /* Change -4px for more/less lift */
}
```

**Icon size:**
```css
.contact-icon {
  width: 56px;  /* Change both to resize icon circle */
  height: 56px;
}

.contact-icon svg {
  width: 28px;  /* Change both to resize icon itself */
  height: 28px;
}
```

**Icon colors:**
```css
.contact-icon {
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.15),  /* Indigo - adjust alpha */
    rgba(20, 184, 166, 0.15)   /* Teal - adjust alpha */
  );
}
```

### Form Layout (CSS - lines ~1095-1130)

**Form spacing:**
```css
.contact-form {
  gap: 18px;  /* Space between form fields */
}

.form-row {
  gap: 14px;  /* Space between fields in same row */
}
```

**Field minimum width:**
```css
.form-row {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  /* Change 200px to adjust when fields stack vertically */
}
```

## Page Structure

### Files
- **Arabic**: `/contact.html`
- **English**: `/en/contact.html`
- **CSS**: `/assets/css/style.css` (lines 1000-1140)
- **JavaScript**: `/assets/js/main.js` (lines 490-565)

### Sections
1. **Hero** - Logo, title, description, chips
2. **Contact Methods Grid** - 6 social/professional links with SVG icons
3. **Contact Form** - Name, email, method, topic selector, message
4. **Testimonials** - 3 example feedback cards

## Tips

### Adding a Platform Link
1. Find SVG icon code
2. Copy HTML structure of existing card
3. Replace href, icon SVG, title, and description
4. Test hover animation

### Changing Template Text
1. Open `assets/js/main.js`
2. Find templates object (~line 490)
3. Edit text in quotes
4. Keep `\n` for line breaks
5. Refresh page to test

### Updating Hero Message
1. Open `contact.html` or `en/contact.html`
2. Find `<h1 class="hero-title">`
3. Edit text between tags
4. Update `.hero-lead` paragraph below it

## Responsive Design

- **Desktop**: Contact cards show 3 per row
- **Tablet**: Cards show 2 per row
- **Mobile**: Cards stack vertically (1 per row)
- **Form**: Fields stack on screens < 600px

All responsive behavior is automatic via CSS Grid `auto-fit`.

## Maintenance

**To update your contact info:**
1. Change href in HTML cards
2. Update email in form action attribute
3. Update WhatsApp number in link

**To add more form topics:**
1. Add `<option>` in both HTML files
2. Add template in both `ar` and `en` objects in JavaScript
3. Test topic selection → auto-fill behavior

**To change icon colors:**
1. Edit `.contact-icon` background in CSS
2. Edit `.contact-icon svg` color property
3. Match your theme colors (indigo/teal)
