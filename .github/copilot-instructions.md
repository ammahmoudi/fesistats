# Copilot Instructions for FesiStats

## Project Overview

FesiStats is a Next.js 16 social media statistics dashboard showcasing real-time follower counts for ItzFesi across YouTube, Telegram, and Instagram. The app uses the App Router architecture with TypeScript and Tailwind CSS 4.

## Architecture & Patterns

### Component Structure
- **`app/page.tsx`**: Main dashboard with stats grid and notification form
- **`components/StatsCard.tsx`**: Reusable social media stat cards with platform-specific theming
- **`components/NotificationForm.tsx`**: Subscription form with loading states and success feedback

### Key Design Patterns
1. **Color-coded Platform Cards**: Each social platform has predefined gradient themes (red/YouTube, blue/Telegram, pink/Instagram) defined in `StatsCard.tsx`
2. **Mock Data Pattern**: Currently uses simulated API calls with `setTimeout` delays - replace these with real API endpoints when backend is ready
3. **Responsive Grid Layout**: Uses CSS Grid (`grid-cols-1 md:grid-cols-3`) for adaptive card layouts

### State Management
- Pure React hooks (`useState`, `useEffect`) for component-level state
- No external state management library - keep it simple for current scale
- Loading states handled per-component (see `StatsCard` and `NotificationForm`)

## Development Workflow

### Essential Commands
```bash
npm run dev     # Development server (http://localhost:3000)
npm run build   # Production build
npm run lint    # ESLint checking
```

### Styling Conventions
- **Gradient Backgrounds**: Main theme uses `bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900`
- **Glass Effects**: Forms use `bg-white/10 backdrop-blur-md` for glassmorphism
- **Hover Animations**: Cards use `transform hover:scale-105` with `transition-all duration-300`
- **Number Formatting**: Use `Intl.NumberFormat` with compact notation for large numbers

## Code Conventions

### TypeScript Patterns
- Strict interface definitions for props (see `StatsCardProps`)
- Explicit typing for state variables and API responses
- Use `React.FormEvent` and `React.ChangeEvent` for event handlers

### Component Best Practices
- All interactive components are client components (`"use client"`)
- Static components (layout.tsx) remain server components
- Form validation uses HTML5 attributes (`required`, `type="email"`)

### API Integration Points
- **Stats Fetching**: Replace mock data in `StatsCard.tsx` `useEffect` with real social media APIs
- **Notification Service**: Replace console.log in `NotificationForm.tsx` with backend endpoint
- Mock delays simulate real network latency for testing

## Future Development Notes

### Planned Features (from README)
- Real API integration for live stats
- Backend service for notification management  
- Historical data charts
- Milestone celebration animations

### Performance Considerations
- Consider React.memo for StatsCard if rendering many platforms
- Implement proper error boundaries for API failures
- Add skeleton loading states instead of basic pulse animations

## Project-Specific Context

This is a fan project for content creator "ItzFesi" - maintain the personal branding and purple/pink gradient theme throughout. The three platforms (YouTube, Telegram, Instagram) are hardcoded but the architecture supports easy expansion to additional platforms.