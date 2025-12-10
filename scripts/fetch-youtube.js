#!/usr/bin/env node
/*
  scripts/fetch-youtube.js
  Fetch recent videos from a YouTube channel using the YouTube Data API v3
  and write a normalized `data/videos.json` file that matches the site's canonical schema.

  Usage:
    # Using environment variables
    CHANNEL_ID=UCxxxx API_KEY=AIza... node scripts/fetch-youtube.js

    # Or using CLI args
    node scripts/fetch-youtube.js --channelId=UCxxxx --apiKey=AIza... --max=12 --out=data/videos.json

  Notes:
  - Requires Node.js 18+ for built-in fetch. If you run an older Node version,
    install `node-fetch` and enable it in this script (not included by default).
  - This script does one `search` request (up to `maxResults`, default 12) and
    normalizes the `search` results into the canonical site model.
*/

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(a => {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v === undefined ? true : v;
    }
  });
  return out;
}

async function main() {
  const argv = parseArgs();
  const CHANNEL_HANDLE = argv.handle || process.env.CHANNEL_HANDLE || '@moalfarras';
  const CHANNEL_ID = argv.channelId || process.env.CHANNEL_ID || process.env.CHANNEL || 'UCfQKyFnNaW026LVb5TGx87g';
  const API_KEY = argv.apiKey || process.env.API_KEY || process.env.YT_API_KEY || '';
  const MAX_RESULTS = Number(argv.max || argv.maxResults || process.env.MAX_RESULTS || 20) || 20;
  const OUT_FILE = argv.out || process.env.OUT || path.join(process.cwd(), 'data', 'videos.json');

  if (!API_KEY) {
    console.error('ERROR: API_KEY is required. Provide it via env vars or CLI args.');
    console.error('Example: API_KEY=AIza... node scripts/fetch-youtube.js');
    process.exitCode = 2;
    return;
  }

  if (typeof fetch !== 'function') {
    console.error('ERROR: global fetch is not available. Please run this script with Node 18+ or install node-fetch.');
    console.error('You can run: `npm install node-fetch` and add `const fetch = require("node-fetch");` at the top of this file.`');
    process.exitCode = 2;
    return;
  }

  console.log(`Fetching videos from YouTube channel: ${CHANNEL_HANDLE || CHANNEL_ID}...`);
  
  try {
    // Step 1: Get channel ID if using handle
    let channelId = CHANNEL_ID;
    if (!channelId && CHANNEL_HANDLE) {
      const handleClean = CHANNEL_HANDLE.replace('@', '');
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(handleClean)}&key=${encodeURIComponent(API_KEY)}`;
      console.log('Resolving channel handle to channel ID...');
      const channelRes = await fetch(channelUrl);
      if (!channelRes.ok) {
        const body = await channelRes.text();
        console.error('Channel resolution error', channelRes.status, channelRes.statusText, body);
        process.exitCode = 3;
        return;
      }
      const channelData = await channelRes.json();
      if (!channelData.items || !channelData.items.length) {
        console.error('ERROR: Channel not found for handle:', CHANNEL_HANDLE);
        process.exitCode = 3;
        return;
      }
      channelId = channelData.items[0].id;
      console.log('Channel ID:', channelId);
    }

    // Step 2: Get uploads playlist ID
    const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(API_KEY)}`;
    console.log('Fetching uploads playlist ID...');
    const detailsRes = await fetch(channelDetailsUrl);
    if (!detailsRes.ok) {
      const body = await detailsRes.text();
      console.error('Channel details error', detailsRes.status, detailsRes.statusText, body);
      process.exitCode = 3;
      return;
    }
    const detailsData = await detailsRes.json();
    if (!detailsData.items || !detailsData.items.length) {
      console.error('ERROR: Channel details not found');
      process.exitCode = 3;
      return;
    }
    const uploadsPlaylistId = detailsData.items[0].contentDetails.relatedPlaylists.uploads;
    console.log('Uploads Playlist ID:', uploadsPlaylistId);

    // Step 3: Fetch videos from uploads playlist
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=${MAX_RESULTS}&playlistId=${encodeURIComponent(uploadsPlaylistId)}&key=${encodeURIComponent(API_KEY)}`;
    console.log('Fetching videos from playlist...');
    const playlistRes = await fetch(playlistUrl);
    if (!playlistRes.ok) {
      const body = await playlistRes.text();
      console.error('Playlist fetch error', playlistRes.status, playlistRes.statusText, body);
      process.exitCode = 3;
      return;
    }
    const playlistData = await playlistRes.json();
    
    if (!playlistData.items || !playlistData.items.length) {
      console.error('ERROR: No videos found in uploads playlist');
      process.exitCode = 3;
      return;
    }

    // Step 4: Normalize videos to site schema
    const items = playlistData.items.map(it => {
      const sn = it.snippet || {};
      const vid = sn.resourceId && sn.resourceId.videoId ? sn.resourceId.videoId : null;
      if (!vid) return null;
      
      const thumbnails = sn.thumbnails || {};
      const thumb = (thumbnails.high && thumbnails.high.url) || 
                    (thumbnails.medium && thumbnails.medium.url) || 
                    (thumbnails.default && thumbnails.default.url) || 
                    `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      
      return {
        id: vid,
        title_en: sn.title || '',
        title_ar: '', // TODO: Add Arabic translations manually
        description_en: sn.description || '',
        description_ar: '',
        thumbnail: thumb,
        publishedAt: sn.publishedAt || '',
        duration: '', // TODO: Fetch duration via videos.list API if needed
        url: `https://www.youtube.com/watch?v=${vid}`
      };
    }).filter(Boolean);

    // Write output directory if missing
    const outDir = path.dirname(OUT_FILE);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Write pretty JSON
    fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2) + '\n', 'utf8');
    console.log(`✓ Successfully wrote ${items.length} videos from @moalfarras to ${OUT_FILE}`);
    console.log('NOTE: Please add Arabic translations (title_ar, description_ar) and durations manually.');
  } catch (err) {
    console.error('Fetch failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

main();
