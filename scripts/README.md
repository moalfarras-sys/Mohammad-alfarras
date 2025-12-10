# YouTube Video Fetcher

This script fetches videos from your official YouTube channel **@moalfarras** using the YouTube Data API v3 and generates a `videos.json` file for your website.

## 🔒 Security - Channel Locked to @moalfarras

The script is **hardcoded to fetch ONLY from @moalfarras**. This ensures:
- No random or suggested videos are included
- Only your official channel content is displayed
- Consistent branding and content quality

## 📋 Prerequisites

1. **Node.js 18+** (for built-in `fetch` support)
2. **YouTube Data API v3 Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project (or use existing)
   - Enable "YouTube Data API v3"
   - Create credentials → API Key
   - Copy your API key

## 🚀 Usage

### Option 1: Environment Variables (Recommended)

```bash
API_KEY=AIza_YOUR_API_KEY_HERE node scripts/fetch-youtube.js
```

### Option 2: Command Line Arguments

```bash
node scripts/fetch-youtube.js --apiKey=AIza_YOUR_API_KEY_HERE --max=20
```

### Option 3: With Channel ID (Optional)

If you want to specify the channel ID directly instead of using the handle:

```bash
API_KEY=AIza_YOUR_KEY CHANNEL_ID=UC_YOUR_CHANNEL_ID node scripts/fetch-youtube.js
```

## 📦 What It Does

1. **Resolves Channel Handle** → Converts `@moalfarras` to Channel ID
2. **Fetches Uploads Playlist** → Gets the playlist ID containing all uploads
3. **Retrieves Videos** → Fetches up to 20 most recent videos from the playlist
4. **Normalizes Data** → Converts API response to your site's schema
5. **Saves JSON** → Writes to `data/videos.json`

## 📄 Output Format

The script generates a JSON file with this structure:

```json
[
  {
    "id": "VIDEO_ID_HERE",
    "title_en": "Video Title from YouTube",
    "title_ar": "",
    "description_en": "Video description from YouTube",
    "description_ar": "",
    "thumbnail": "https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg",
    "publishedAt": "2024-12-01T12:00:00Z",
    "duration": "",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
]
```

## ✏️ Post-Processing Required

After running the script, you should manually:

1. **Add Arabic translations** for `title_ar` and `description_ar`
2. **Add video durations** (format: "MM:SS" or "HH:MM:SS")
3. Review and edit titles/descriptions for better display on your site

## 🌐 Frontend Integration

Your website automatically loads videos in this order:

1. **Static Fallback** → Loads `data/videos.json` first
2. **API Fetch (Optional)** → If `YT_API_CONFIG` is set in `assets/js/youtube-config.js`
3. **Merge & Display** → Combines both sources, preferring local translations

### To Enable Live API Fetching

Edit `assets/js/youtube-config.js`:

```javascript
window.YT_API_CONFIG = {
  CHANNEL_HANDLE: "@moalfarras",
  API_KEY: "AIza_YOUR_API_KEY_HERE",
  MAX_RESULTS: 20
};
```

⚠️ **Never commit your API key to Git!** Keep it local only.

## 🔄 Regular Updates

Run this script periodically to keep your video library up to date:

```bash
# Weekly update
API_KEY=YOUR_KEY node scripts/fetch-youtube.js

# Then manually add Arabic translations
```

## 🐛 Troubleshooting

### "Channel not found for handle"
- Verify your channel handle is exactly `@moalfarras`
- Check that your channel is public

### "Playlist fetch error"
- Verify your API key is valid
- Check API quota limits (10,000 units/day default)
- Make sure YouTube Data API v3 is enabled in your project

### "No videos found"
- Verify your channel has public videos
- Check that videos are not private or unlisted

### "global fetch is not available"
- Upgrade to Node.js 18 or higher
- Or install: `npm install node-fetch`

## 📊 API Quota Usage

Each script run uses approximately:
- 1 unit for channel resolution
- 1 unit for playlist ID fetch  
- 1 unit for playlist items fetch
- **Total: ~3 units per run**

With the default quota of 10,000 units/day, you can run this script ~3,000 times daily.

## 🎯 Best Practices

1. ✅ Run script when you upload new videos
2. ✅ Keep Arabic translations in sync
3. ✅ Commit the updated `videos.json` to your repo
4. ✅ Never commit API keys
5. ✅ Use environment variables for sensitive data
6. ✅ Review generated content before deployment

## 📝 Example Workflow

```bash
# 1. Fetch latest videos from @moalfarras
API_KEY=YOUR_KEY node scripts/fetch-youtube.js

# 2. Open data/videos.json and add Arabic translations
# 3. Add video durations manually
# 4. Test on your site
# 5. Commit the updated videos.json

git add data/videos.json
git commit -m "Update YouTube videos"
git push
```

---

**Channel:** [@moalfarras](https://youtube.com/@moalfarras)  
**Script Version:** 2.0 (Playlist-based fetch)  
**Last Updated:** December 2024
