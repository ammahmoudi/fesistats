#!/usr/bin/env node

/**
 * Helper script to fetch YouTube Channel ID from channel handle
 * Usage: node scripts/get-youtube-channel-id.js @itzfesi
 */

const https = require('https');

const channelHandle = process.argv[2] || '@itzfesi';
const url = `https://www.youtube.com/${channelHandle}`;

console.log(`\nFetching channel ID for: ${channelHandle}`);
console.log(`URL: ${url}\n`);

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // Try to extract channel ID from the page HTML
    const channelIdMatch = data.match(/"channelId":"([^"]+)"/);
    const externalIdMatch = data.match(/"externalId":"([^"]+)"/);
    
    if (channelIdMatch) {
      console.log('✅ Channel ID found!');
      console.log(`Channel ID: ${channelIdMatch[1]}`);
      console.log(`\nAdd this to your .env.local file:`);
      console.log(`YOUTUBE_CHANNEL_ID=${channelIdMatch[1]}`);
    } else if (externalIdMatch) {
      console.log('✅ Channel ID found!');
      console.log(`Channel ID: ${externalIdMatch[1]}`);
      console.log(`\nAdd this to your .env.local file:`);
      console.log(`YOUTUBE_CHANNEL_ID=${externalIdMatch[1]}`);
    } else {
      console.log('❌ Could not automatically extract channel ID.');
      console.log('\nPlease try one of these methods:');
      console.log('1. Visit https://www.youtube.com/@itzfesi');
      console.log('2. Right-click > View Page Source');
      console.log('3. Search for "channelId" or "externalId"');
      console.log('\nOr use: https://commentpicker.com/youtube-channel-id.php');
    }
  });
}).on('error', (err) => {
  console.error('❌ Error fetching channel data:', err.message);
});
