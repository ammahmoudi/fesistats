# Changelog

## Version 2.2.0 - Instagram Live Data Feature

### 🎉 New Features

#### Real-Time Instagram Data Integration
- **Instagram Internal API**: Uses Instagram's own web_profile_info endpoint
- **Simple Setup**: Just add username - no API keys or authentication!
- **Universal**: Works for any public Instagram account (no Business account needed)
- **Server-side API Route**: `/api/instagram` with 5-minute caching
- **Same UX**: Live badge, auto-refresh, manual refresh like YouTube & Telegram
- **Exact Follower Counts**: Shows exact numbers, not rounded

#### Three-Tier Fallback System
1. **Instagram Internal API** (Primary - Simple & Fast)
   - Requires only `INSTAGRAM_USERNAME`
   - Works for any public account
   - No authentication needed

2. **Instagram Graph API** (Secondary - Official)
   - Optional for guaranteed reliability
   - Requires Business account + tokens
   - 60-day token expiration

3. **Manual Count** (Fallback - Always Works)
   - Set `INSTAGRAM_FOLLOWER_COUNT`
   - Update manually when needed

#### Technical Implementation
- Uses Instagram's `i.instagram.com/api/v1/users/web_profile_info/` endpoint
- Special headers mimic Instagram's mobile app
- Multiple fallback methods for reliability
- 5-minute server-side caching (route segment config)
- Graceful error handling between methods
- Same error handling and UX as YouTube & Telegram

### 📝 Files Added/Modified
```
app/api/instagram/route.ts        # Three-tier Instagram API implementation
INSTAGRAM_API_SETUP.md            # Comprehensive setup guide with all methods
.env.local.example                # Added INSTAGRAM_USERNAME (primary method)
README.md                         # Updated with Instagram status
CHANGELOG.md                      # This file
```

### 🔧 Configuration (Priority Order)

**Recommended** (Simplest):
```env
INSTAGRAM_USERNAME=itz.fesi
```

**Optional** (Official API):
```env
INSTAGRAM_ACCESS_TOKEN=EAAxxxxx
INSTAGRAM_ACCOUNT_ID=17841xxxxx
```

**Fallback** (Manual):
```env
INSTAGRAM_FOLLOWER_COUNT=78000
```

### 🎨 Visual Updates
- Instagram card now shows "LIVE" badge
- Auto-refresh every 5 minutes
- Manual refresh with toast notifications
- Loading states and error handling
- Exact follower count display
- Source indicator in API response

### 🚀 Performance
- Primary method: No rate limits (residential IPs)
- Graph API: 200 calls/hour (we use 12/hour)
- 5-minute server caching
- Shared cache across all users
- Minimal bandwidth usage

### 📖 Documentation
- Created comprehensive `INSTAGRAM_API_SETUP.md`
- Documents all three methods with pros/cons
- Troubleshooting guide
- Migration path from Graph API
- Stack Overflow references for future updates

### 🎯 Current Status
- ✅ **YouTube**: Live with YouTube Data API v3
- ✅ **Telegram**: Live with public page scraping
- ✅ **Instagram**: Live with internal API (+ Graph API + manual fallbacks)

### 🔄 Migration Notes
If you were using manual count before:
1. Just add `INSTAGRAM_USERNAME=itz.fesi` to `.env.local`
2. Remove or keep `INSTAGRAM_FOLLOWER_COUNT` as fallback
3. Restart server - that's it!

---

## Version 2.1.0 - Telegram Live Data Feature

### 🎉 New Features

#### Real-Time Telegram Data Integration
- **Public Channel Scraping**: Fetches member counts from public Telegram pages
- **No Bot Required**: Simple setup with just channel username
- **Server-side API Route**: `/api/telegram` with 5-minute caching
- **Same UX as YouTube**: Live badge, auto-refresh, manual refresh
- **Exact Member Counts**: Shows exact numbers, not rounded

#### Simplified Setup
- Removed Bot API requirement (was limited for public channels)
- Only needs `TELEGRAM_CHANNEL_USERNAME` in `.env.local`
- No bot token, no admin access needed
- Works with any public Telegram channel

#### Technical Implementation
- HTML parsing from `t.me/{username}` public page
- Multiple extraction patterns for reliability
- 5-minute server-side caching (route segment config)
- Graceful fallback to mock data on errors
- Same error handling and UX as YouTube

### 📝 Files Modified
```
app/api/telegram/route.ts          # Switched from Bot API to public scraping
components/StatsCard.tsx           # Added Telegram live data support
TELEGRAM_API_SETUP.md              # Complete rewrite for simpler approach
.env.local.example                 # Removed TELEGRAM_BOT_TOKEN requirement
```

### 🔧 Configuration Changes
- **Removed**: `TELEGRAM_BOT_TOKEN` (no longer needed)
- **Required**: `TELEGRAM_CHANNEL_USERNAME=ItzFesi`
- **Channel**: Must be public with username

### 🎨 Visual Updates
- Telegram card now shows "LIVE" badge
- Auto-refresh every 5 minutes
- Manual refresh with toast notifications
- Loading states and error handling
- Exact member count display

### 🚀 Performance
- No rate limits (public page access)
- 5-minute server caching
- Shared cache across all users
- Minimal bandwidth usage

### 📖 Documentation
- Updated `TELEGRAM_API_SETUP.md` with simpler instructions
- Updated `.env.local.example`
- Clearer setup guide (no complex bot setup)

---

## Version 2.0.0 - YouTube Live Data Feature

### 🎉 Major Features Added

#### Real-Time YouTube Data Integration
- Integrated YouTube Data API v3 for live subscriber counts
- Server-side API route (`/api/youtube`) for secure API key handling
- 5-minute caching strategy to optimize API quota usage
- Automatic background refresh every 5 minutes

#### Enhanced StatsCard Component
- **Live/Demo Indicator**: Badge showing data source (LIVE or DEMO)
- **Manual Refresh**: Clickable refresh button with loading animation
- **Exact Count Tooltip**: Hover over numbers to see exact subscriber count
- **Status Information**: Displays last update time
- **Error Handling**: Graceful fallback to demo data with user-friendly messages
- **Loading States**: Skeleton animations for better UX

#### Toast Notification System
- Success notifications on data refresh
- Error notifications with helpful messages
- Integrated Sonner toast library

#### UI/UX Improvements
- Live badge with pulse animation
- Platform-specific gradient colors maintained
- Smooth transitions and hover effects
- Professional loading states
- Responsive design maintained

### 📦 New Dependencies
- `sonner`: Toast notifications
- Shadcn UI components: `toast`, `tooltip`, `sonner`

### 🗂️ Files Added
```
app/api/youtube/route.ts           # YouTube API endpoint
.env.local                          # Environment variables (gitignored)
.env.local.example                  # Template for developers
scripts/get-youtube-channel-id.js   # Helper script
YOUTUBE_API_SETUP.md               # Setup documentation
YOUTUBE_FEATURE.md                 # Feature documentation
QUICK_START.md                     # Quick start guide
```

### 📝 Files Modified
```
components/StatsCard.tsx           # Enhanced with live data features
app/layout.tsx                     # Added Toaster provider
app/page.tsx                       # Added live indicator
README.md                          # Updated with API info
```

### 🔧 Configuration
- YouTube API key required in `.env.local`
- Channel ID: `UCjtHa7VGxtqw41Uv5RhKQAg` (ItzFesi)
- API quota usage: ~288 units/day (well under 10,000 free limit)

### 🎨 Visual Changes
- Added "LIVE" badge (green, animated) for real data
- Added "DEMO" badge (gray) for mock data
- Added refresh button on YouTube card
- Added tooltip for exact subscriber counts
- Added "Updated: [time]" timestamp
- Enhanced header with live status indicator

### 🚀 Performance
- Server-side caching reduces API calls
- Client-side state management for smooth UX
- Optimized re-renders with proper React hooks
- No impact on build size (~2KB added)

### 🔒 Security
- API keys stored in `.env.local` (gitignored)
- Server-side API calls (keys not exposed to client)
- Environment variables loaded securely
- Recommended API key restrictions documented

### 🐛 Bug Fixes & Improvements
- Fixed CSS import issues in layout
- Resolved Tailwind v4 compatibility
- Added proper error boundaries
- Improved TypeScript types

### 📖 Documentation
- Comprehensive setup guide (`YOUTUBE_API_SETUP.md`)
- Quick start guide (`QUICK_START.md`)
- Feature documentation (`YOUTUBE_FEATURE.md`)
- Updated main README
- Inline code comments

### 🎯 What's Next (Future Enhancements)
- Telegram real-time data integration
- Instagram real-time data integration
- Historical data tracking
- Growth charts and analytics
- Milestone celebration animations
- Push notifications for subscribers

---

## Version 1.0.0 - Initial Release

### Features
- Static social media stats display
- YouTube, Telegram, Instagram cards
- Email notification subscription form
- Responsive design
- Modern gradient UI
- Mock data for all platforms

---

**Current Status**: YouTube live data ✅ | Telegram 🔄 | Instagram 🔄
