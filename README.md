# FesiStats - Social Media Dashboard

A real-time statistics dashboard for ItzFesi showcasing live follower counts across YouTube, Telegram, and Instagram with automated milestone notifications, historical data tracking, and advanced analytics.

## ✨ Features

### 📊 Real-time Stats Display

- **YouTube** (LIVE): Real-time subscriber counts + view counts + video count
- **Telegram** (LIVE): Real-time member counts from public channel  
- **Instagram** (LIVE): Real-time follower counts via web scraping
- 🔄 **Auto-Refresh**: Live data updates every 5 minutes automatically
- 🔃 **Manual Refresh**: Click refresh button for instant updates (with cooldown)
- ⚡ **Server-Side Caching**: 24-hour cache with configurable TTL
- 📈 **Historical Analytics**: 100+ data points per platform retained
- 💾 **Redis Persistence**: All stats persisted to Upstash Redis
- 👥 **Subscriber Management**: Full admin interface for bot subscribers

### 📊 Advanced Statistics Dashboard (`/stats`)

- **Interactive Line Charts**: Beautiful Recharts visualization for trends
- **Multi-Platform Comparison**: View all 3 platforms on one chart
- **Time Range Selection**: 24 hours, 7 days, or 30 days views
- **Growth Metrics**: Real-time growth calculations
- **100+ Data Points**: Comprehensive historical data per platform
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Performance Optimized**: Single consolidated page (removed duplicate modal)
- **Auto-Loading**: Data auto-refreshes every 5 minutes
- **Smooth Animations**: Recharts with 500ms animation duration

### 🤖 Telegram Bot Notifications

- **User Subscription**: Subscribe via /start command
- **Bot Commands**: /start, /stop, /status
- **Persistent Storage**: Upstash Redis for subscriber management
- **User Data Caching**: Names, usernames, and profile photos cached for 30 days
- **Automated Webhooks**: Auto-configuration after deployments
- **Smart Contact System**: Click-to-message integration in admin panel

### 🎯 Automated Milestone Notifications

- **Smart Detection**: Automatically detects milestones (1K-10K, 15K-50K, major milestones)
- **Multi-Platform**: Works for YouTube, Telegram, and Instagram
- **Duplicate Prevention**: Redis tracks last notified milestone per platform
- **Celebration Messages**: Random positive messages for each milestone
- **Multiple Check Methods**: 
  - Client-side checks (2 hours per session)
  - GitHub Actions (every 3 hours)
  - Vercel Cron (daily at midnight)
- **Admin Dashboard**: Manual milestone checks and history tracking

### � Data Management & Storage

- **Redis Integration**: All data persisted to Upstash Redis
- **Configurable Save Frequency**: Default 1 minute (adjustable via `STATS_SAVE_INTERVAL`)
- **90-Day History**: Historical data retained for trend analysis
- **Throttled Writes**: Prevents excessive Redis writes while maintaining data granularity
- **Current Stats TTL**: 24-hour cache for current values
- **Zero Data Loss**: Automatic cleanup of old entries based on retention policy

### 🔐 Admin Dashboard (`/admin`)

- **Secure Token Authentication**: Generate via environment variable
- **Subscriber Management** (`/admin/subscribers`): 
  - View all bot subscribers with profiles
  - Search by name, username, or ID
  - Click to contact users on Telegram
  - Profile photos and user information
  - Cached data for performance
- **Broadcast Control**: Send notifications to all subscribers manually
- **Milestone Management**: View milestone history with timestamps
- **Current Stats**: See live counts with extra info (YouTube views/videos)
- **Subscriber Analytics**: Total subscribers and delivery statistics
- **Check Scheduling**: Manual milestone checks available anytime

### 🎨 Modern UI

- Beautiful gradient background (gray-900 → purple-900 → violet-900)
- LIVE status badges for real-time indication
- Loading states with spinner animations
- Error handling and toast notifications
- Fully responsive design (mobile-first)
- Smooth Recharts animations (500ms)
- Glass morphism effects with backdrop blur
- Platform-specific color coding (Red/YouTube, Blue/Telegram, Pink/Instagram)

## 📚 Documentation

All documentation is in the `docs/` folder:

### Getting Started

- [Environment Variables Guide](./docs/ENV_VARIABLES_GUIDE.md) - Configure all settings
- [Documentation Index](./docs/DOCUMENTATION_INDEX.md) - Navigation guide

### Setup Guides

- [YouTube API Setup](./docs/YOUTUBE_API_SETUP.md)
- [Telegram Setup](./docs/TELEGRAM_SETUP.md)
- [Instagram API Setup](./docs/INSTAGRAM_API_SETUP.md)
- [Webhook Setup](./docs/WEBHOOK_SETUP.md)

### Architecture & Development

- [Stats Flow Explained](./docs/STATS_FLOW_EXPLAINED.md)
- [Fetchers Module Structure](./docs/FETCHERS_MODULE_STRUCTURE.md)
- [Optimization Integration](./docs/OPTIMIZATION_INTEGRATION.md)
- [Stats Calls Quick Reference](./docs/STATS_CALLS_QUICK_REFERENCE.md)

### Admin & Operations

- [Admin Access](./docs/ADMIN_ACCESS.md)
- [Milestone Notifications](./docs/MILESTONE_NOTIFICATIONS.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
\\\ash
git clone https://github.com/ammahmoudi/fesistats.git
cd fesistats
\\\

2. Install dependencies:
\\\ash
npm install
\\\

3. Copy environment template:
\\\ash
cp .env.local.example .env.local
\\\

4. Configure APIs in \.env.local\:
   - YouTube: https://console.cloud.google.com/apis/credentials
   - Telegram: @BotFather on Telegram
   - Instagram: Use your username (no key needed)
   - Redis: https://upstash.com/ (free tier)

5. Generate admin token:
\\\ash
node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"
\\\

6. Run development server:
\\\ash
npm run dev
\\\

7. Open http://localhost:3000

## 🛠️ Development

\\\ash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linting
npm run setup-webhook # Setup Telegram webhook
\\\

## 📋 Configuration

See [ENV_VARIABLES_GUIDE](./docs/ENV_VARIABLES_GUIDE.md) for complete options.

### Quick Examples

**Fresh Data:**
\\\ash
STATS_CACHE_TTL=1800
MILESTONE_CHECK_THROTTLE=300
AUTO_REFRESH_INTERVAL=60
\\\

**Cost Efficient:**
\\\ash
STATS_CACHE_TTL=172800
MILESTONE_CHECK_THROTTLE=14400
AUTO_REFRESH_INTERVAL=600
\\\

## 📁 Project Structure

\\\
fesistats/
├── README.md
├── CHANGELOG.md
├── .env.local.example
├── docs/              # All documentation
├── app/               # Next.js app
│   ├── admin/        # Admin pages
│   ├── api/          # API routes
│   └── page.tsx
├── components/        # React components
├── lib/              # Utilities & config
└── package.json
\\\

## 🔧 Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Upstash Redis
- **APIs**: YouTube, Telegram, Instagram
- **Deployment**: Vercel

## 🐛 Troubleshooting

**Stats not updating?**
- Check .env.local for valid API keys
- Verify Redis connection
- See [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)

**Milestones not notifying?**
- Check Telegram bot token
- Verify ADMIN_BROADCAST_TOKEN
- Check /admin dashboard

**Build errors?**
- Clear .next: \
m -rf .next\
- Reinstall: \
pm install\
- Check TypeScript: \
px tsc --noEmit\

## 📄 License

ISC - Personal project for @ItzFesi

---

**Version:** 3.4.0 | **Status:** Production Ready ✅
