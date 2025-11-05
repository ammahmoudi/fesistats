# YouTube API Setup Guide

This guide will help you set up real-time YouTube subscriber data for the FesiStats dashboard.

## Step 1: Get YouTube Channel ID

### Method 1: Using the Helper Script
```bash
node scripts/get-youtube-channel-id.js @itzfesi
```

### Method 2: Manual Method
1. Visit https://www.youtube.com/@itzfesi
2. Right-click on the page and select "View Page Source" (Ctrl+U)
3. Search for `"channelId"` or `"externalId"` in the source code
4. Copy the ID value (it looks like: `UCxxxxxxxxxxxxxxxxxxxxx`)

### Method 3: Online Tool
Use this tool: https://commentpicker.com/youtube-channel-id.php
- Enter the channel URL: `https://www.youtube.com/@itzfesi`
- Click "Find" to get the Channel ID

## Step 2: Create YouTube Data API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name it "FesiStats" or similar
   - Click "Create"

3. **Enable YouTube Data API v3**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "YouTube Data API v3"
   - Click on it and click "Enable"

4. **Create API Credentials**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key that appears

5. **Secure Your API Key (Optional but Recommended)**
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Click "Save"

## Step 3: Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Add your credentials:

```env
# YouTube Data API v3 Key (from Step 2)
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# YouTube Channel ID (from Step 1)
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Restart the Development Server

```bash
npm run dev
```

The YouTube subscriber count should now display real-time data!

## API Quota & Limits

- **Free Quota**: 10,000 units per day
- **Channel Statistics Request**: 1 unit per request
- **Current Caching**: 5 minutes (configured in the API route)

With 5-minute caching, you'll use approximately 288 units per day (one request every 5 minutes), well within the free quota.

### How Caching Works

The app uses **server-side caching** to optimize API usage:

- **First user** within a 5-minute window: Triggers a YouTube API call
- **All other users** within that 5-minute window: Get cached data (no API call)
- **After 5 minutes**: Next user triggers a fresh API call with new cached data

**Example:** Even with 1,000 visitors per hour, you'll only make ~12 API calls per hour (288 per day), using less than 3% of the free quota!

## Troubleshooting

### Error: "YouTube API credentials not configured"
- Make sure `.env.local` exists in the project root
- Verify both `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` are set
- Restart the dev server after adding environment variables

### Error: "Failed to fetch YouTube data"
- Check that the API key is valid
- Verify the YouTube Data API v3 is enabled in Google Cloud Console
- Check the browser console for detailed error messages

### Error: "Channel not found"
- Verify the channel ID is correct
- Make sure it's the channel ID, not the channel handle

### Subscriber count shows mock data (125K)
- This is the fallback value when the API fails
- Check the browser console for error messages
- Verify your API credentials

## Next Steps

To add real data for Telegram and Instagram, you'll need to:
- **Telegram**: Use the Telegram Bot API or third-party services
- **Instagram**: Use Instagram Graph API (requires Facebook Developer account)

## Security Notes

⚠️ **Important**: 
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Never share your API keys publicly
- Restrict API keys to only the necessary APIs
- Consider using application restrictions for production
