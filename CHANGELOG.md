# Changelog

## Version 3.2.0 - Real-Time Milestone Detection

### ⚡ Instant Milestone Notifications
- **Automatic Milestone Checking**: Milestones now detected immediately when stats are updated
- **No More Delays**: Removed dependency on user visits and throttle timers for milestone detection
- **Integrated with Stats Saving**: `saveStats()` function now automatically checks for milestones
- **Real-Time Notifications**: Telegram notifications sent instantly when milestone crossed
- **Smart Duplicate Prevention**: Redis-based tracking prevents duplicate notifications
- **Works Everywhere**: Milestone checking triggered by:
  - Manual refresh button
  - User opening website
  - API route calls
  - Background jobs
  - ANY stats update

### 🎯 Technical Improvements
- **Architecture Change**: Milestone checking integrated into `lib/statsStorage.ts`
- **New Function**: `checkAndNotifyMilestone()` runs automatically after `saveStats()`
- **Immediate Detection**: No waiting for MilestoneChecker component throttle
- **Better User Experience**: Fans get notified in real-time when milestones are reached
- **Comprehensive Logging**: Enhanced console logs for milestone detection tracking

### 📖 Documentation
- **Updated MILESTONE_CHECKING_EXPLAINED.md**: Reflects new instant detection system
- **Before/After Comparison**: Clear examples showing improvement in detection speed
- **Real-World Examples**: Timeline demonstrations of instant notifications

---

## Version 3.1.0 - Multi-Language Support

### 🌍 Internationalization Features
- **Multi-Language Support**: Full i18n implementation with TypeScript context
- **Supported Languages**: 
  - English (en)
  - Farsi/Persian (fa)
  - More languages easily extensible
- **Language Toggle**: Component to switch between languages
- **Persistent Selection**: Selected language saved to browser localStorage
- **Context API Integration**: Global language state management via React Context
- **Translation System**: Centralized translations in `lib/translations.ts`
- **All UI Components**: Dashboard, forms, stats cards, and admin panel translated
- **Documentation**: Multi-language support for all user-facing text

### 🧩 Implementation Details
- **LanguageContext**: React Context for global language state
- **LanguageToggle Component**: UI component for language switching
- **Translations Object**: Organized translation strings by section
- **Dynamic Content**: All hardcoded strings converted to translation keys
- **Type Safety**: Full TypeScript support for translation keys

---

## Version 3.0.1 - Documentation Organization & Configuration Centralization

### 📚 Documentation Updates
- **Organized Documentation**: Moved all docs to `docs/` folder for cleaner root
- **Created Documentation Index**: New `DOCUMENTATION_INDEX.md` for easy navigation
- **Updated README**: Simplified with links to docs folder
- **Environment Template**: Updated `.env.local.example` with all configuration variables

### ⚙️ Configuration Improvements
- **Centralized Config**: All settings now configurable via environment variables
- **Configuration Variables**: 
  - Timing settings (cache TTL, refresh intervals, throttles)
  - API settings (timeouts, retry logic)
  - Behavior settings (UI refresh, milestone checks)
- **Development vs Production**: Easy config profiles for different environments
- **Documentation**: Complete guide in `ENV_VARIABLES_GUIDE.md`

### 🧹 Code Cleanup
- Removed redundant documentation files
- Organized docs folder structure
- Improved project organization

---

## Version 3.0.0 - Admin Panel, Automated Milestones & Redis Migration

### 🚀 Major Features

#### Admin Dashboard System
- **Admin Authentication**: Secure login with `ADMIN_BROADCAST_TOKEN`
- **Admin Dashboard** (`/admin/dashboard`): 
  - View total subscriber count
  - Send broadcast notifications
  - Platform selection (YouTube/Telegram/Instagram)
  - Real-time delivery reports
- **Milestone Management** (`/admin/milestones`):
  - View current platform stats
  - Manual milestone check button
  - Notification delivery stats
- **Session-based Auth**: Token stored in `sessionStorage`, cleared on logout

#### Automated Milestone Notifications
- **Smart Detection**: Milestones at 1K-10K (every 1K), 15K-50K (every 5K), major milestones to 10M
- **Vercel Cron Job**: Automatic checks every 6 hours
- **Duplicate Prevention**: Redis tracks last notified milestone per platform
- **Celebration Messages**: Random positive messages for each milestone
- **Manual Trigger**: Admin can trigger checks via dashboard or API endpoint
- **Multi-Platform**: Works for YouTube, Telegram, and Instagram

#### Webhook Automation
- **Auto-Setup Endpoint**: `/api/setup-webhook` auto-detects domain and configures webhook
- **GitHub Actions**: Automatic webhook configuration after Vercel deployments
- **Local Script**: `npm run setup-webhook` for manual setup with dotenv loading
- **Multiple Triggers**: API endpoint, GitHub Actions, or npm command

#### Redis Migration (Upstash)
- **Persistent Storage**: Migrated from file-based to Upstash Redis for serverless compatibility
- **SDK Integration**: Using `@upstash/redis` v1.35.6 for type-safe operations
- **Subscriber Management**: Redis Sets for deduplication and efficient operations
- **Milestone Tracking**: Separate keys per platform (`milestone:last:{platform}`)
- **Environment Variables**: Supports both `KV_REST_API_*` and `UPSTASH_REDIS_REST_*`

#### Telegram Bot Enhancements
- **Command System**: `/start`, `/stop`, `/status` commands
- **Redis Integration**: Subscribers stored in `telegram:subscribers` Set
- **Protected Endpoints**: Admin token required for broadcasts and subscriber access
- **Webhook Security**: Optional `TELEGRAM_WEBHOOK_SECRET` validation
- **Broadcast Metrics**: Returns detailed delivery stats (total, success, failed)

### 📝 Files Added
```
app/admin/page.tsx                    # Admin login page
app/admin/dashboard/page.tsx          # Admin control panel
app/admin/milestones/page.tsx         # Milestone management UI
app/api/check-milestones/route.ts     # Automated milestone checker
app/api/setup-webhook/route.ts        # Webhook auto-configuration
app/api/telegram-bot/subscribers/route.ts  # Subscriber diagnostic endpoint
lib/telegramSubscribers.ts            # Redis subscriber abstraction
lib/milestones.ts                     # Milestone detection logic
lib/milestoneStorage.ts               # Milestone Redis storage
scripts/setup-webhook.ts              # Local webhook setup script
.github/workflows/setup-webhook.yml   # Post-deployment automation
ADMIN_ACCESS.md                       # Admin documentation
WEBHOOK_SETUP.md                      # Webhook setup guide
MILESTONE_NOTIFICATIONS.md            # Milestone system docs
```

### 📝 Files Modified
```
app/api/telegram-bot/webhook/route.ts # Refactored to use Redis
app/api/telegram-bot/notify/route.ts  # Added admin auth, Redis integration
app/notify/page.tsx                   # Redirects to /admin
vercel.json                           # Added crons configuration
package.json                          # Added @upstash/redis, dotenv, tsx
.env.local.example                    # Added Redis and admin variables
```

### 🔧 New Environment Variables
```env
# Redis (Upstash)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your_redis_token

# Admin Authentication
ADMIN_BROADCAST_TOKEN=your_secure_admin_token

# Optional Security
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
```

### 🎨 Technical Improvements
- **Redis Sets**: Native deduplication for subscribers
- **Lazy Client Init**: Redis client initialized on-demand
- **Server-side Caching**: 5-minute cache for platform stats
- **Type Safety**: Full TypeScript types across all new features
- **Error Boundaries**: Graceful error handling with fallbacks
- **Protected Routes**: Session validation for admin pages

### 🔒 Security Enhancements
- Admin endpoints require `x-admin-token` header or query param
- Session-based admin authentication (not stored in cookies)
- Optional webhook secret validation
- Redis credentials never exposed to client
- Environment variables properly secured

### 🚀 Performance Optimizations
- Redis operations (SADD, SREM, SMEMBERS, SISMEMBER, SCARD)
- Shared server-side cache for all users
- Efficient milestone detection algorithm
- Minimal API calls with intelligent caching

### 📊 API Endpoints Added
- `GET /api/check-milestones` - Automated milestone checker (cron)
- `GET /api/setup-webhook` - Auto-configure Telegram webhook
- `GET /api/telegram-bot/subscribers` - Admin-only subscriber stats
- `POST /api/telegram-bot/notify` - Protected broadcast endpoint

### 🎯 Admin Access Flow
1. Visit `/admin` with admin token
2. Token validated via test API call
3. Stored in `sessionStorage`
4. Redirects to `/admin/dashboard`
5. Access to broadcast and milestone pages

### ⚙️ Cron Configuration
```json
{
  "crons": [{
    "path": "/api/check-milestones",
    "schedule": "0 */6 * * *"
  }]
}
```
**Note**: Requires Vercel Pro plan. Free tier users can use external cron services.

### 🐛 Bug Fixes
- Fixed `vercel.json` secret references causing deployment errors
- Fixed `app/notify/page.tsx` corruption during editing
- Added dotenv loading for local script execution
- Resolved Redis client initialization issues

### 📖 Documentation Updates
- Comprehensive admin access guide
- Webhook automation documentation
- Milestone system explanation
- Updated environment variable examples
- Added setup instructions for all new features

### 🎉 Current Feature Status
- ✅ **YouTube**: Live data with YouTube Data API v3
- ✅ **Telegram**: Live stats + Bot notifications
- ✅ **Instagram**: Live data with internal API
- ✅ **Admin Panel**: Full control dashboard
- ✅ **Automated Milestones**: 6-hour checks
- ✅ **Webhook Automation**: Post-deployment setup
- ✅ **Redis Storage**: Production-ready persistence

---

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
