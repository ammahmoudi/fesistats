# Fesi Stats

A modern, responsive web application that displays real-time social media statistics for **ItzFesi** across YouTube, Telegram, and Instagram.

![Fesi Stats](https://github.com/user-attachments/assets/33d76764-d883-46ef-8327-ee0c9b36f656)

## Features

- 📊 **Real-time Stats Display**: Shows subscriber/follower counts for:
  - YouTube: [@itzfesi](https://www.youtube.com/@itzfesi)
  - Telegram: [@ItzFesi](https://t.me/ItzFesi)
  - Instagram: [@itz.fesi](https://www.instagram.com/itz.fesi/)

- 🔔 **Notification Subscription**: Users can subscribe with email and phone number to get notified when ItzFesi reaches new milestones

- 🎨 **Modern UI**: Beautiful gradient design with smooth animations and hover effects

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

3. Set up YouTube API (for real-time data):
   - Copy `.env.local.example` to `.env.local`
   - Follow the [YouTube API Setup Guide](./YOUTUBE_API_SETUP.md)
   - Add your YouTube API key and channel ID to `.env.local`

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
- **YouTube** (Red): Displays real-time subscriber count via YouTube Data API v3
- **Telegram** (Blue): Displays member count (currently mock data)
- **Instagram** (Pink): Displays follower count (currently mock data)

Cards are clickable and link directly to the respective social media profiles.

### API Integration

- **YouTube**: ✅ Real-time data via YouTube Data API v3
  - Automatic caching (5 minutes) to optimize API quota usage
  - Fallback to cached data on API errors
  - See [YouTube API Setup Guide](./YOUTUBE_API_SETUP.md) for configuration
- **Telegram**: ⏳ Coming soon (requires Telegram Bot API)
- **Instagram**: ⏳ Coming soon (requires Instagram Graph API)

### Notification Form

Users can subscribe to receive notifications about milestone achievements by providing:
- Email address (required)
- Phone number (optional)

The form provides visual feedback on successful subscription.

## Future Enhancements

- [x] Real API integration for YouTube (live stats)
- [ ] Real API integration for Telegram and Instagram
- [ ] Backend service for notification management
- [ ] Historical data charts and graphs
- [ ] Milestone tracking and celebration animations
- [ ] Multi-language support
- [ ] Admin dashboard for analytics

## License

ISC

## Author

Created for ItzFesi's community