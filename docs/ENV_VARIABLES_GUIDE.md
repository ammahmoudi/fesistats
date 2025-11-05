# Environment Variables Guide

## Overview

FesiStats uses environment variables to centralize all configuration values. This allows you to adjust behavior without modifying code.

## 📋 Configuration Variables

All timing values are in the unit specified below. The system converts them to milliseconds internally.

### Cache & History Settings

#### `STATS_CACHE_TTL` (seconds)
- **Default:** `86400` (24 hours)
- **Description:** How long to keep current stats in memory before fetching fresh data from external APIs
- **Why change it:** 
  - Lower (e.g., `3600` = 1 hour) → More frequent API calls, fresher data, higher costs
  - Higher (e.g., `172800` = 2 days) → Fewer API calls, slightly stale data, lower costs
- **Example:** `STATS_CACHE_TTL=3600`

#### `STATS_HISTORY_RETENTION` (days)
- **Default:** `90` (3 months)
- **Description:** How long to keep historical stats for trend analysis
- **Why change it:**
  - Lower (e.g., `30`) → Less storage used
  - Higher (e.g., `180`) → More data for trend analysis
- **Example:** `STATS_HISTORY_RETENTION=180`

### Milestone Check Settings

#### `MILESTONE_CHECK_THROTTLE` (seconds)
- **Default:** `7200` (2 hours)
- **Description:** Minimum time between milestone checks to avoid excessive API calls
- **Why change it:**
  - Lower (e.g., `1800` = 30 min) → Faster milestone detection, more API calls
  - Higher (e.g., `14400` = 4 hours) → Fewer API calls, slower milestone detection
- **Recommendation:** Keep at 2+ hours to avoid hitting API rate limits
- **Example:** `MILESTONE_CHECK_THROTTLE=1800`

#### `MILESTONE_HISTORY_RETENTION` (days)
- **Default:** `30`
- **Description:** How long to keep milestone history records
- **Why change it:**
  - Lower (e.g., `7`) → Lightweight history
  - Higher (e.g., `90`) → Long-term milestone tracking
- **Example:** `MILESTONE_HISTORY_RETENTION=90`

### UI Refresh Settings

#### `AUTO_REFRESH_INTERVAL` (seconds)
- **Default:** `300` (5 minutes)
- **Description:** How often the UI updates to show new stats (when user stays on page)
- **Why change it:**
  - Lower (e.g., `60` = 1 min) → Live-feeling updates, more frequent renders
  - Higher (e.g., `600` = 10 min) → Less frequent updates, better performance
- **Example:** `AUTO_REFRESH_INTERVAL=60`

#### `MANUAL_REFRESH_COOLDOWN` (seconds)
- **Default:** `30`
- **Description:** How long users must wait between manual refresh button clicks
- **Why change it:**
  - Lower (e.g., `10`) → Users can refresh more frequently
  - Higher (e.g., `60`) → Prevents refresh spamming
- **Example:** `MANUAL_REFRESH_COOLDOWN=15`

#### `MILESTONE_CHECK_DELAY` (seconds)
- **Default:** `5`
- **Description:** Delay before first milestone check runs on page load
- **Why change it:**
  - Lower (e.g., `1`) → Check runs immediately
  - Higher (e.g., `10`) → More time for page to fully render first
- **Example:** `MILESTONE_CHECK_DELAY=1`

### API & Data Settings

#### `API_TIMEOUT` (seconds)
- **Default:** `30`
- **Description:** How long to wait for external API responses before timing out
- **Why change it:**
  - Lower (e.g., `15`) → Fail faster, better UX if APIs are slow
  - Higher (e.g., `60`) → Give slow APIs more time
- **Example:** `API_TIMEOUT=60`

#### `MILESTONE_CHECK_LOG_MAX` (count)
- **Default:** `5`
- **Description:** Maximum number of milestone check logs to keep in browser storage
- **Why change it:**
  - Lower (e.g., `3`) → Use less browser storage
  - Higher (e.g., `10`) → Keep more debugging history
- **Example:** `MILESTONE_CHECK_LOG_MAX=10`

---

## 🔑 Required API Keys & Credentials

### YouTube Data API

#### `YOUTUBE_API_KEY`
- **Required:** Yes
- **Where to get:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Instructions:**
  1. Create/select a project
  2. Enable "YouTube Data API v3"
  3. Create an API Key
  4. Copy the key
- **Example:** `YOUTUBE_API_KEY=AIzaSyBZ317gzv7fKi2NR0AoZwwQ7_GuC3-15Nk`

#### `YOUTUBE_CHANNEL_ID`
- **Required:** Yes
- **Where to get:** YouTube channel URL like `https://www.youtube.com/@itzfesi`
- **Find it:** View page source and search for `"channelId"`
- **Example:** `YOUTUBE_CHANNEL_ID=UCjtHa7VGxtqw41Uv5RhKQAg`

### Telegram

#### `TELEGRAM_CHANNEL_USERNAME`
- **Required:** Yes
- **Value:** Your Telegram channel username (without the `@`)
- **Example:** `TELEGRAM_CHANNEL_USERNAME=ItzFesi`

#### `TELEGRAM_BOT_TOKEN`
- **Required:** Yes (only if using bot features)
- **Where to get:** BotFather on Telegram
- **Example:** `TELEGRAM_BOT_TOKEN=8496002805:AAGPNaXUssddAuVNzCOoJ87_mRNeAjR7lDk`

### Instagram

#### `INSTAGRAM_USERNAME`
- **Required:** Yes
- **Value:** Your Instagram username (without the `@`)
- **Example:** `INSTAGRAM_USERNAME=itz.fesi`

### Redis (Upstash)

#### `KV_REST_API_URL`
- **Required:** Yes
- **Description:** Upstash Redis REST endpoint URL
- **Where to get:** [Upstash Console](https://console.upstash.com)
- **Example:** `KV_REST_API_URL=https://concrete-macaw-19561.upstash.io`

#### `KV_REST_API_TOKEN`
- **Required:** Yes
- **Description:** Upstash Redis REST API token
- **Where to get:** [Upstash Console](https://console.upstash.com)
- **Example:** `KV_REST_API_TOKEN=AUxpAAIncDI3ZjNjMGM2ZmYwMzM0ZGUxODlhNDFjMWI5YzUxODBlYXAyMTk1NjE`

#### `KV_URL` (Optional)
- **Required:** No
- **Description:** Full Upstash Redis connection string (if using Node.js Redis client)
- **Example:** `KV_URL=rediss://default:password@host:6379`

---

## 📊 Configuration Examples

### Conservative (Reduce API Calls)
```bash
STATS_CACHE_TTL=172800              # Keep stats for 2 days
MILESTONE_CHECK_THROTTLE=14400      # Check every 4 hours
AUTO_REFRESH_INTERVAL=600           # UI refresh every 10 minutes
MANUAL_REFRESH_COOLDOWN=60          # User wait 1 minute between refreshes
```

### Aggressive (Fresh Data)
```bash
STATS_CACHE_TTL=1800                # Keep stats for 30 minutes
MILESTONE_CHECK_THROTTLE=1800       # Check every 30 minutes
AUTO_REFRESH_INTERVAL=60            # UI refresh every minute
MANUAL_REFRESH_COOLDOWN=10          # User wait 10 seconds between refreshes
```

### Balanced (Default)
```bash
STATS_CACHE_TTL=86400               # 24 hours
MILESTONE_CHECK_THROTTLE=7200       # 2 hours
AUTO_REFRESH_INTERVAL=300           # 5 minutes
MANUAL_REFRESH_COOLDOWN=30          # 30 seconds
```

### Development
```bash
STATS_CACHE_TTL=600                 # 10 minutes (easy testing)
MILESTONE_CHECK_THROTTLE=300        # 5 minutes (fast iteration)
AUTO_REFRESH_INTERVAL=30            # 30 seconds (live feedback)
MANUAL_REFRESH_COOLDOWN=5           # 5 seconds (easy testing)
```

---

## 🔧 How Configuration Works

### At Runtime
When the app starts, all environment variables are read into `lib/config.ts`:

```typescript
// lib/config.ts reads:
export const config = {
  STATS_CACHE_TTL: parseInt(process.env.STATS_CACHE_TTL || '86400') * 1000,
  // ... converts seconds to milliseconds
};
```

### Usage in Code
Components and utilities import config:

```typescript
import { config } from '@/lib/config';

// Use it
const interval = config.AUTO_REFRESH_INTERVAL; // Already in milliseconds
setInterval(fetchStats, interval);
```

### Display Values
Config provides helper to convert back to human-readable:

```typescript
config.getDisplayValue('AUTO_REFRESH_INTERVAL', 'minutes') // Returns: 5
```

---

## 📝 Best Practices

### 1. Keep Defaults for New Deployments
```bash
# Only override what you need to change
STATS_CACHE_TTL=3600  # Override just this
# Leave others to defaults
```

### 2. Document Custom Changes
```bash
# Comment why you changed something
# OVERRIDE: Using 30min cache instead of 24h because:
# - Need fresher data for real-time dashboard
# - API rate limit allows it (100 calls/day)
STATS_CACHE_TTL=1800
```

### 3. Monitor Impact
Before deploying config changes:
1. Test locally with new values
2. Check expected API call count
3. Monitor Redis storage usage
4. Verify notification frequency

### 4. Production Checklist
- [ ] All API keys are valid and current
- [ ] Redis credentials work (test with `/api/stats`)
- [ ] Cache TTL matches your API limits
- [ ] Milestone throttle prevents spam
- [ ] Manual refresh cooldown prevents abuse

---

## 🐛 Debugging

### Check Current Config
In browser console:
```javascript
// If you need to see what's configured
// Check lib/config.ts output in server logs during startup
```

### View Applied Settings
Server logs on startup show:
```
📋 FesiStats Configuration Loaded: {
  'Cache TTL': '24 hours',
  'History Retention': '90 days',
  'Milestone Check Throttle': '2 hours',
  'Auto Refresh': '5 minutes',
  'Manual Refresh Cooldown': '30 seconds',
}
```

### Test API Calls
Check how many API calls happen:
1. Open DevTools Network tab
2. Visit homepage
3. Count external API calls (youtube.googleapis.com, t.me, etc.)
4. Wait 5 minutes and refresh
5. Should see ZERO new external API calls if cache is fresh

---

## 🚀 Performance Tuning

### Reduce API Calls
```bash
STATS_CACHE_TTL=604800              # 7 days
MILESTONE_CHECK_THROTTLE=43200      # 12 hours
```
**Result:** ~1-2 API calls per day max

### Increase API Calls (Fresher Data)
```bash
STATS_CACHE_TTL=300                 # 5 minutes
MILESTONE_CHECK_THROTTLE=600        # 10 minutes
```
**Result:** ~288-1000 API calls per day

### Balance Storage Usage
```bash
STATS_HISTORY_RETENTION=60          # 2 months history
MILESTONE_HISTORY_RETENTION=60      # 2 months milestones
```
**Result:** ~100-200KB Redis storage

---

## 📞 Common Questions

**Q: Why is stats cache so long (24 hours)?**
A: Most creators update infrequently. 24h avoids hitting API rate limits while still showing fresh data every day.

**Q: How do I check milestone more frequently?**
A: Lower `MILESTONE_CHECK_THROTTLE` to 300 (5 minutes), but watch your API rate limits.

**Q: What happens if I set cache to 0?**
A: Every page visit hits external APIs. You'll hit rate limits within hours.

**Q: Can I adjust these after deployment?**
A: Yes! Update `.env.local` and redeploy. Next deployment will use new values.

**Q: What's the optimal refresh interval?**
A: Default 5 minutes is optimal for most use cases. Only lower if you need live updates.
