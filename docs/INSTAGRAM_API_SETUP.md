# Instagram API Setup Guide

This guide will help you set up Instagram integration for FesiStats to display real-time follower counts.

## Quick Start (Recommended)

For most users, the simplest method is using Instagram's username:

### Step 1: Add Username to Environment

Add this single line to your `.env.local` file:

```env
INSTAGRAM_USERNAME=itz.fesi
```

**That's it!** No API keys, no authentication, no complex setup.

### Step 2: Restart Server

```bash
npm run dev
```

Your Instagram card should now show live follower counts!

## How It Works

We use Instagram's internal API endpoint that their web interface uses:
- **Endpoint**: `https://i.instagram.com/api/v1/users/web_profile_info/?username={username}`
- **Requirements**: None! Works for any public account
- **Authentication**: Special headers mimic Instagram's mobile app
- **Rate Limits**: Use 5-minute caching to stay safe
- **Reliability**: Works as of 2025, but is unofficial

### Pros:
✅ Simple - just add username  
✅ No API tokens or setup  
✅ Works for any public account  
✅ No Business account requirement  
✅ Free with no quotas  

### Cons:
⚠️ Unofficial endpoint (could change)  
⚠️ May require updates if Instagram changes structure  
⚠️ Could be blocked if too many requests (our caching prevents this)  

## Alternative Method: Instagram Graph API (Official)

If you need guaranteed reliability or the simple method doesn't work, use the official Graph API.

### Requirements:
- Instagram Business or Creator account
- Facebook Page connected to Instagram
- Facebook Developer account
- Access token (expires every 60 days)

### When to Use Graph API:
- The simple method gets blocked
- You need guaranteed reliability
- You're building a commercial product
- You need additional metrics beyond follower count

### Setup Steps (Graph API):

<details>
<summary>Click to expand detailed Graph API setup</summary>

#### 1. Convert to Business Account

1. Open Instagram app
2. Settings → Account → Switch to Professional Account
3. Choose Business or Creator
4. Connect to a Facebook Page

#### 2. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. My Apps → Create App
3. Choose "Other" → "Business"
4. Name: "FesiStats" (or your choice)
5. Add Instagram product

#### 3. Get Access Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Select your app
3. Add permissions:
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
4. Generate Access Token
5. Copy the token

#### 4. Get Instagram Account ID

In Graph API Explorer:

```
me/accounts
```

Find your page ID, then:

```
{PAGE_ID}?fields=instagram_business_account
```

Copy the `instagram_business_account.id`

#### 5. Convert to Long-Lived Token

Replace placeholders and visit this URL:

```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}
```

#### 6. Configure Environment

Add to `.env.local`:

```env
INSTAGRAM_ACCESS_TOKEN=EAAxxxxx
INSTAGRAM_ACCOUNT_ID=17841xxxxx
```

</details>

## Fallback Method: Manual Count

If both methods don't work, use a manual count:

```env
INSTAGRAM_FOLLOWER_COUNT=78000
```

Update this number periodically by checking your Instagram profile.

## How Our App Prioritizes Methods

The app tries methods in this order:

1. **Instagram Internal API** (if `INSTAGRAM_USERNAME` is set)
   - Fastest and simplest
   - Works for any public account
   
2. **Instagram Graph API** (if `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_ACCOUNT_ID` are set)
   - Official and reliable
   - Requires Business account
   
3. **Manual Count** (if `INSTAGRAM_FOLLOWER_COUNT` is set)
   - Last resort fallback
   - Requires manual updates

## Testing Your Setup

### Test Simple Method

Visit in your browser (replace username):
```
https://i.instagram.com/api/v1/users/web_profile_info/?username=itz.fesi
```

You should see JSON with `data.user.edge_followed_by.count`

### Test Graph API

Visit (replace with your values):
```
https://graph.instagram.com/{ACCOUNT_ID}?fields=followers_count&access_token={TOKEN}
```

## Troubleshooting

### Simple Method Issues

**"Failed to fetch data"**
- Instagram may be blocking requests
- Try adding residential proxy if self-hosting
- Fallback to Graph API or manual count

**Getting login page**
- Headers may need updating
- Instagram changed their security
- Try Graph API method instead

### Graph API Issues

**"Invalid OAuth token"**
- Token expired (refresh every 60 days)
- Generate new token

**"Unsupported get request"**
- Wrong Account ID
- Not using Instagram Business Account ID

### General Tips

- Our 5-minute caching is very conservative
- Don't make manual requests to Instagram
- Let the server-side API handle it
- Check server logs for detailed errors

## Rate Limits & Best Practices

### Simple Method
- No official limits
- Our caching: 12 requests/hour per user
- Very safe with 5-minute cache

### Graph API
- Official limit: 200 calls/user/hour
- Our caching: 12 calls/hour
- Well within limits

### Best Practices
1. **Don't** bypass the 5-minute cache
2. **Don't** make direct requests from client
3. **Do** use server-side caching
4. **Do** have fallback methods configured

## Security

### Simple Method
- No tokens to secure
- Headers are public information
- Safe to commit username to repo

### Graph API
- **Never** commit access tokens
- Keep `.env.local` in `.gitignore`
- Regenerate if exposed
- Set token expiration reminders

## Caching Strategy

All methods use the same caching:
- **Server-side**: 5 minutes
- **Shared**: All users see same cache
- **Auto-refresh**: Every 5 minutes
- **Manual**: Refresh button available

## API Response Format

All methods return the same format:

```json
{
  "followersCount": 78234,
  "lastUpdated": "2025-11-03T10:30:00.000Z",
  "source": "instagram-api"
}
```

Sources:
- `"instagram-api"` - Simple method
- `"graph-api"` - Official Graph API
- `"manual"` - Manual count

## Updating Instagram When It Changes

Instagram occasionally updates their internal API. If the simple method stops working:

1. Check [Stack Overflow](https://stackoverflow.com/questions/tagged/instagram-api) for new endpoints
2. Update headers in `app/api/instagram/route.ts`
3. Fallback to Graph API or manual count temporarily
4. Submit an issue on GitHub for help

## Next Steps

After setup:
1. ✅ All three platforms have live data
2. ✅ Check dashboard for accurate counts
3. ✅ Monitor logs for any issues
4. ✅ Set Graph API token refresh reminder (if using)
5. ✅ Consider historical data tracking

## Additional Resources

- [Instagram Internal API (Stack Overflow)](https://stackoverflow.com/questions/63668929)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [FesiStats Documentation](./README.md)

---

**Recommended**: Start with the simple username method. Only use Graph API if needed.
