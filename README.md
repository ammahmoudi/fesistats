# Fesi Stats

A modern, responsive web application that displays real-time social media statistics for **ItzFesi** across YouTube, Telegram, and Instagram.

![Fesi Stats](https://github.com/user-attachments/assets/33d76764-d883-46ef-8327-ee0c9b36f656)

## Features

- 📊 **Real-time Stats Display**: 
  - ✅ **YouTube** (LIVE): Real-time subscriber counts via YouTube Data API v3
  - ✅ **Telegram** (LIVE): Real-time member counts from public channel page
  - 🔄 **Instagram**: Coming soon
  
- 🔄 **Auto-Refresh**: Live data updates every 5 minutes automatically
- 🔃 **Manual Refresh**: Click refresh button for instant updates
- ⚡ **Server-Side Caching**: Optimized API usage with 5-minute cache shared across all users

- 🔔 **Notification Subscription**: Users can subscribe with email and phone number to get notified when ItzFesi reaches new milestones

- 🎨 **Modern UI**: 
  - Beautiful gradient design with smooth animations
  - LIVE/DEMO badges for data source indication
  - Loading states and error handling
  - Toast notifications for user feedback

- 📱 **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices

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

3. Set up APIs (for real-time data):
   - **YouTube**: Follow [YouTube API Setup Guide](./YOUTUBE_API_SETUP.md) to get API key
   - **Telegram**: Follow [Telegram API Setup Guide](./TELEGRAM_API_SETUP.md) - just add channel username, no bot needed!

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

## Project Structure

```
fesistats/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Home page
├── components/
│   ├── StatsCard.tsx    # Social media stats card component
│   └── NotificationForm.tsx  # Notification subscription form
├── public/              # Static assets
└── package.json         # Project dependencies
```

## Features in Detail

### Stats Cards

Each platform has its own color-coded card:
- **YouTube** (Red): ✅ Real-time subscriber count via YouTube Data API v3
- **Telegram** (Blue): ✅ Real-time member count from public channel page
- **Instagram** (Pink): 🔄 Coming soon (follower count)

Cards feature:
- **LIVE/DEMO Badges**: Indicates data source
- **Auto-Refresh**: Updates every 5 minutes automatically
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
  
- **Instagram**: ⏳ Coming soon (requires Instagram Graph API)

### Notification Form

Users can subscribe to receive notifications about milestone achievements by providing:
- Email address (required)
- Phone number (optional)

The form provides visual feedback on successful subscription.

## Future Enhancements

- [x] Real API integration for YouTube (live stats)
- [x] Real API integration for Telegram (live stats for groups)
- [ ] Real API integration for Instagram
- [ ] Backend service for notification management
- [ ] Historical data charts and graphs
- [ ] Milestone tracking and celebration animations
- [ ] Multi-language support
- [ ] Admin dashboard for analytics

## License

ISC

## Author

Created for ItzFesi's community