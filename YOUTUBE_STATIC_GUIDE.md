# YouTube Static Video System - User Guide

## 🎯 Overview

Your YouTube section now uses a **100% static, API-free system**. No YouTube Data API key needed!

- **Source:** `/assets/data/videos.json`
- **Loader:** `/assets/js/youtube-local.js`
- **Pages:** `youtube.html` (AR) + `en/youtube.html` (EN)

---

## 📁 Video Data Location

```
/assets/data/videos.json
```

This JSON file contains all your videos. Maximum 10 videos recommended.

---

## 📝 How to Update Videos

### Step 1: Open the JSON File

Open `/assets/data/videos.json` in your editor.

### Step 2: Get Video Information

Visit your channel: https://www.youtube.com/@moalfarras

For each video you want to add:

1. **Video ID** - Found in URL after `watch?v=`
   - Example: `https://www.youtube.com/watch?v=ABC123xyz`
   - ID = `ABC123xyz`

2. **Thumbnail** - Auto-generated URL:
   ```
   https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg
   ```

3. **Duration** - Format: `MM:SS` or `HH:MM:SS`
   - Examples: `8:32`, `15:20`, `1:05:30`

4. **Titles** - Write both Arabic and English
5. **Descriptions** - Keep short (1-2 lines max)

### Step 3: Edit the JSON

Follow this structure for each video:

```json
{
  "id": "YOUR_VIDEO_ID",
  "title_ar": "العنوان العربي للفيديو",
  "title_en": "English Video Title",
  "description_ar": "وصف عربي قصير (سطر أو سطرين فقط).",
  "description_en": "Short English description (one or two lines only).",
  "thumbnail": "https://i.ytimg.com/vi/YOUR_VIDEO_ID/hqdefault.jpg",
  "url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  "duration": "12:45"
}
```

### Step 4: Video Order Matters!

- **First video (index 0)** = Featured video (big card at top)
- **Remaining videos** = Grid layout below

Put your best/newest video first!

---

## ✅ JSON Validation Checklist

Before saving, verify:

- [ ] Valid JSON syntax (no trailing commas)
- [ ] All video IDs are from your @moalfarras channel
- [ ] All URLs use `https://www.youtube.com/watch?v=VIDEO_ID` format
- [ ] All thumbnails use `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`
- [ ] Durations are in `MM:SS` or `HH:MM:SS` format
- [ ] Both Arabic and English titles/descriptions provided
- [ ] Maximum 10 videos (recommended for performance)

---

## 🔧 How It Works

### Loading Process:

```
1. Page loads → youtube-local.js executes
2. Fetch /assets/data/videos.json
3. Parse JSON array
4. First video → Featured card (large thumbnail, description)
5. Rest of videos → Grid layout (thumbnails + titles)
6. Click any video → Modal player opens with YouTube embed
```

### Language Support:

- **Arabic pages** (`youtube.html`): Display `title_ar` and `description_ar`
- **English pages** (`en/youtube.html`): Display `title_en` and `description_en`

---

## 🎨 Layout

### Featured Card (First Video):
- Large 2-column layout
- Thumbnail on left/right (RTL/LTR)
- Title + Description
- Play button overlay
- "Watch on YouTube" CTA button

### Grid Cards (Remaining Videos):
- 3-column responsive grid (→ 2 cols → 1 col on mobile)
- Small thumbnail
- Title only
- Duration badge
- Hover zoom effect
- Click to open modal player

---

## 🚀 Adding a New Video

1. Upload video to your YouTube channel
2. Copy the video ID from the URL
3. Open `/assets/data/videos.json`
4. Add new entry at the **top** of the array (to make it featured)
5. Or add it anywhere in the array
6. Save file
7. Refresh your website

**Example:**

```json
[
  {
    "id": "NEW_VIDEO_ID",
    "title_ar": "عنوان الفيديو الجديد",
    "title_en": "New Video Title",
    "description_ar": "وصف قصير للفيديو الجديد.",
    "description_en": "Short description of the new video.",
    "thumbnail": "https://i.ytimg.com/vi/NEW_VIDEO_ID/hqdefault.jpg",
    "url": "https://www.youtube.com/watch?v=NEW_VIDEO_ID",
    "duration": "10:30"
  },
  // ... existing videos below
]
```

---

## 🗑️ Removing a Video

1. Open `/assets/data/videos.json`
2. Find the video entry you want to remove
3. Delete the entire `{ ... }` object
4. Make sure to remove any trailing comma if it's the last item
5. Save file

---

## 📊 Current Video List

Your JSON currently contains **10 videos**:

1. **wXnHC9JlBj8** - Quick Review: A Practical Device
2. **ZRPDkXiXEpw** - Quick Comparison
3. **H0nwbSawHF0** - Practical Tips
4. **WpA8SwfA8h8** - Remote Work Tools
5. **L_jWHffIx5E** - Camera Gear
6. **oHg5SJYRHA0** - Mechanical Keyboards
7. **lXMskKTw3Bc** - Audio Setup
8. **xcJtL7QggTI** - Dual Monitor Setup
9. **FTQbiNvZqaY** - USB-C Hubs
10. **Sagg08DrO5U** - Cable Management

⚠️ **IMPORTANT:** Replace these with your actual video IDs from @moalfarras channel!

---

## 🐛 Troubleshooting

### Videos Not Showing?

1. Check browser console (F12) for errors
2. Verify JSON syntax: https://jsonlint.com/
3. Check file path: `/assets/data/videos.json`
4. Clear browser cache (Ctrl+Shift+R)

### Wrong Language Showing?

- Arabic page should show `title_ar` and `description_ar`
- English page should show `title_en` and `description_en`
- Check HTML `lang` and `dir` attributes

### Modal Player Not Working?

- Check that video IDs are correct
- Verify YouTube URLs are valid
- Check browser console for JavaScript errors

### Thumbnail Not Loading?

- Verify thumbnail URL format: `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`
- Check that video ID is correct
- Ensure video is public on YouTube

---

## 🔒 Security & Privacy

✅ **Advantages of Static System:**

- No API key needed
- No API quota limits
- No external API calls
- Faster page load
- Complete control over displayed videos
- No auto-suggestions from YouTube
- Works offline (once cached)

---

## 📈 Performance Tips

1. **Limit to 10 videos** - More videos = longer load time
2. **Optimize titles** - Keep titles concise (40-60 characters)
3. **Short descriptions** - 1-2 lines maximum
4. **Use lazy loading** - Already implemented in loader
5. **Cache the JSON** - Already set to `cache: 'no-cache'` for updates

---

## 🎯 Quick Reference

| What | Where |
|------|-------|
| **Video Data** | `/assets/data/videos.json` |
| **JavaScript Loader** | `/assets/js/youtube-local.js` |
| **Arabic Page** | `/youtube.html` |
| **English Page** | `/en/youtube.html` |
| **Styling** | `/assets/css/style.css` (YouTube section) |
| **Channel** | https://www.youtube.com/@moalfarras |

---

## 💡 Pro Tips

1. **Featured Video Strategy**: Put your best/newest video first in the JSON array
2. **Update Regularly**: Keep your video list fresh (weekly/monthly)
3. **Test Both Languages**: Check both AR and EN pages after updates
4. **Backup JSON**: Keep a backup copy before major changes
5. **Use Descriptive Titles**: Make titles clear and engaging

---

## 🔄 Migration Complete

✅ **What Was Removed:**
- YouTube Data API v3 dependency
- API key requirement
- `youtube-config.js` file
- API fetch code in `main.js`
- Channel ID resolution
- Playlist fetching

✅ **What Was Added:**
- Static JSON data file
- Simple fetch-based loader
- No external dependencies
- 100% local control

---

**Last Updated:** December 10, 2024  
**System Version:** Static v1.0  
**Channel:** [@moalfarras](https://youtube.com/@moalfarras)
