# FesiStats - Social Media Dashboard

A real-time statistics dashboard for ItzFesi showcasing live follower counts across YouTube, Telegram, and Instagram with automated milestone notifications.

## 🎯 Features

### 📊 Real-time Stats Display
- **YouTube** (LIVE): Real-time subscriber counts via YouTube Data API v3
- **Telegram** (LIVE): Real-time member counts from public channel page  
- **Instagram** (LIVE): Real-time follower counts via Instagram internal API
- 🔄 **Auto-Refresh**: Live data updates every 5 minutes automatically
- 🔃 **Manual Refresh**: Click refresh button for instant updates
- ⚡ **Server-Side Caching**: Optimized API usage with configurable cache

### 🤖 Telegram Bot Notifications
- **User Subscription**: Subscribe via /start command
- **Bot Commands**: /start, /stop, /status
- **Persistent Storage**: Upstash Redis for subscriber management
- **Automated Webhooks**: Auto-configuration after deployments

### 🎯 Automated Milestone Notifications
- **Smart Detection**: Automatically detects milestones (1K-10K, 15K-50K, etc.)
- **Multi-Platform**: Works for YouTube, Telegram, and Instagram
- **Duplicate Prevention**: Redis tracks last notified milestone
- **Celebration Messages**: Random positive messages for each milestone

### 🔐 Admin Dashboard
- **Secure Login**: Token-based authentication
- **Broadcast Control**: Send notifications to all subscribers
- **Milestone Management**: Manual checks and monitoring
- **Delivery Reports**: Real-time statistics
- **Subscriber Analytics**: View total counts

### 🎨 Modern UI
- Beautiful gradient design with animations
- LIVE badges for real-time indication
- Loading states and error handling
- Fully responsive design

## 📚 Documentation

All documentation is in the \docs/\ folder:

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

**Version:** 3.0.0 | **Status:** Production Ready ✅
