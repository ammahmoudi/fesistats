# Fesi Stats

A modern, responsive web application that displays real-time social media statistics for **ItzFesi** across YouTube, Telegram, and Instagram.

![Fesi Stats](https://github.com/user-attachments/assets/33d76764-d883-46ef-8327-ee0c9b36f656)

## Features

### 📊 Real-time Stats Display
- ✅ **YouTube** (LIVE): Real-time subscriber counts via YouTube Data API v3
- ✅ **Telegram** (LIVE): Real-time member counts from public channel page
- ✅ **Instagram** (LIVE): Real-time follower counts via Instagram internal API
- 🔄 **Auto-Refresh**: Live data updates every 5 minutes automatically
- 🔃 **Manual Refresh**: Click refresh button for instant updates
- ⚡ **Server-Side Caching**: Optimized API usage with 5-minute cache shared across all users

### 🤖 Telegram Bot Notifications
- **User Subscription**: Users can subscribe via Telegram bot to receive milestone notifications
- **Bot Commands**: `/start` to subscribe, `/stop` to unsubscribe, `/status` to check subscription
- **Persistent Storage**: Upstash Redis for reliable subscriber management
- **Automated Webhooks**: Auto-configuration after deployments

### 🎯 Automated Milestone Notifications
- **Smart Detection**: Automatically detects milestones (1K-10K every 1K, 15K-50K every 5K, major milestones to 10M)
- **Vercel Cron**: Checks every 6 hours for new milestones
- **Multi-Platform**: Works for YouTube, Telegram, and Instagram
- **Duplicate Prevention**: Redis tracks last notified milestone to avoid repeats
- **Celebration Messages**: Random positive messages for each milestone

### 🔐 Admin Dashboard
- **Secure Login**: Token-based authentication with session management
- **Broadcast Control**: Send notifications to all subscribers with custom messages
- **Platform Selection**: Choose YouTube, Telegram, or Instagram for broadcasts
- **Milestone Management**: Manual milestone checks and monitoring
- **Delivery Reports**: Real-time stats on notification delivery (success/failed)
- **Subscriber Analytics**: View total subscriber count

### 🎨 Modern UI
- Beautiful gradient design with smooth animations
- LIVE badges for real-time data indication
- Loading states and error handling
- Toast notifications for user feedback
- Professional admin dashboard with protected routes

### 📱 Fully Responsive
Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ammahmoudi/fesistats.git
cd fesistats
```

2. Install dependencies:
```bash
npm install
```

3. Set up APIs and services:
   - **YouTube**: Follow [YouTube API Setup Guide](./YOUTUBE_API_SETUP.md) to get API key
   - **Telegram**: Follow [Telegram Setup Guide](./TELEGRAM_SETUP.md) - stats + bot notifications
   - **Instagram**: Follow [Instagram API Setup Guide](./INSTAGRAM_API_SETUP.md) - just add username!
   - **Redis**: Set up [Upstash Redis](https://upstash.com/) for subscriber storage (free tier available)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run setup-webhook` - Configure Telegram webhook (production)

## Project Structure

```
fesistats/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes (stats, bot, webhooks, milestones)
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Home page with stats
├── components/
│   ├── StatsCard.tsx           # Social media stats card component
│   └── NotificationForm.tsx    # Notification subscription form
├── lib/
│   ├── telegramSubscribers.ts  # Redis subscriber management
│   ├── milestones.ts           # Milestone detection logic
│   ├── milestoneStorage.ts     # Milestone Redis storage
│   └── utils.ts                # Utility functions
├── scripts/
│   └── setup-webhook.ts        # Webhook configuration script
├── .github/workflows/          # CI/CD automation
└── package.json                # Project dependencies
```

## Features in Detail

### Stats Cards

Each platform has its own color-coded card:
- **YouTube** (Red): ✅ Real-time subscriber count via YouTube Data API v3
- **Telegram** (Blue): ✅ Real-time member count from public channel page
- **Instagram** (Pink): ⚙️ Manual follower count (updated periodically)

Cards feature:
- **LIVE/DEMO Badges**: Indicates data source
- **Auto-Refresh**: Updates every 5 minutes automatically (live data)
- **Manual Refresh**: Click refresh button for instant updates
- **Loading States**: Skeleton animations during data fetch
- **Error Handling**: Graceful fallback with user-friendly messages
- **Clickable Links**: Direct links to social media profiles

### API Integration

- **YouTube**: ✅ Real-time data via YouTube Data API v3
  - Server-side caching (5 minutes) to optimize API quota
  - ~288 API calls/day (well under 10,000 free quota)
  - Exact subscriber counts, not rounded
  - See [YouTube API Setup Guide](./YOUTUBE_API_SETUP.md)
  
- **Telegram**: ✅ Real-time data via public page scraping
  - No bot setup required for public channels
  - No rate limits or API quotas
  - Simple one-line configuration
  - Exact member counts, not rounded
  - See [Telegram API Setup Guide](./TELEGRAM_API_SETUP.md)
  
- **Instagram**: ✅ Real-time data via Instagram internal API
  - Works with any public Instagram account
  - No API keys or authentication needed
  - Just add username to `.env.local`
  - Fallback to Graph API or manual count available
  - Exact follower counts, not rounded
  - See [Instagram API Setup Guide](./INSTAGRAM_API_SETUP.md)

### Telegram Bot Notifications

Users subscribe via Telegram bot to receive automated milestone notifications:

**How It Works:**
1. User clicks "Connect via Telegram" button on homepage
2. Opens Telegram bot chat
3. Sends `/start` command to subscribe
4. Receives welcome message confirmation
5. Gets notifications when ItzFesi reaches new milestones

**Automated System:**
- Vercel Cron checks for milestones every 6 hours
- Detects when platforms reach rounded thresholds (1K, 2K, 5K, etc.)
- Sends celebration messages to all subscribers
- Tracks last milestone to prevent duplicates

### Admin Dashboard

Protected admin area for managing the notification system:

**Access:** `https://fesistats.vercel.app/admin`

**Features:**
- Send broadcast notifications to all subscribers
- View subscriber count and statistics
- Manual milestone checks
- Delivery reports (success/failed)
- Platform-specific broadcasts (YouTube/Telegram/Instagram)

See [Admin Access Guide](./ADMIN_ACCESS.md) for detailed instructions.

## Future Enhancements

- [x] Real API integration for YouTube (live stats)
- [x] Real API integration for Telegram (live stats)
- [x] Real API integration for Instagram (live stats)
- [x] Telegram bot notification system
- [x] Admin dashboard for broadcasts
- [x] Automated milestone notifications
- [x] Redis persistent storage
- [ ] Historical data charts and graphs
- [ ] Email notifications alongside Telegram
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Custom milestone thresholds per platform

## License

ISC

## Author

Created for ItzFesi's community