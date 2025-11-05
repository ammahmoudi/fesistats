# How Stats Calls & Updates Work in FesiStats

## 🔄 Complete Stats Flow

### Phase 1: Initial Page Load

```
User visits https://itzfesi.ir
    ↓
Page loads → components/StatsCard.tsx renders 3 cards
    ↓
Each StatsCard component mounts
    ↓
useEffect hook runs for each card
    ↓
For YouTube:  fetch('/api/youtube')
For Telegram: fetch('/api/telegram')
For Instagram: fetch('/api/instagram')
    ↓
Each API route is called (3 requests total)
```

### Phase 2: External API Call (YouTube Example)

**File: `app/api/youtube/route.ts`**

```typescript
export async function GET(request: Request) {
  // 1. Get the YouTube API key and channel ID
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  
  // 2. Check if refresh=true is in URL
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  // 3. Fetch from YouTube API
  const url = `https://www.googleapis.com/youtube/v3/channels?...`;
  const response = await fetch(url);
  const data = await response.json();
  
  // 4. Extract stats
  const statistics = data.items[0].statistics;
  const result = {
    subscriberCount: parseInt(statistics.subscriberCount),
    viewCount: parseInt(statistics.viewCount),
    videoCount: parseInt(statistics.videoCount),
    platform: 'YouTube',
    lastUpdated: new Date().toISOString()
  };
  
  // 🆕 NEW: Save to Redis BEFORE returning
  await saveStats('YouTube', result.subscriberCount, {
    views: result.viewCount,
    videos: result.videoCount
  });
  
  // 5. Return to client
  return NextResponse.json(result);
}
```

**What `saveStats()` does:**

```typescript
// lib/statsStorage.ts
export async function saveStats(platform, count, extraInfo) {
  // Step 1: Save current stats to Redis
  await redis.set(
    `stats:current:youtube`,
    JSON.stringify({
      platform: 'YouTube',
      count: 50000,
      views: 1000000,
      videos: 150,
      lastFetched: 1730746800000
    }),
    { ex: 86400 } // TTL: 24 hours
  );
  
  // Step 2: Save to history (sorted set with timestamp)
  const snapshot = {
    platform: 'YouTube',
    count: 50000,
    views: 1000000,
    videos: 150,
    timestamp: 1730746800000
  };
  
  await redis.zadd('stats:history:youtube', {
    score: 1730746800000,  // timestamp = score
    member: JSON.stringify(snapshot)
  });
  
  // Step 3: Clean up old entries (>90 days)
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
  await redis.zremrangebyscore('stats:history:youtube', 0, ninetyDaysAgo);
  
  console.log(`✅ Saved stats for YouTube: 50000`);
}
```

### Phase 3: Response to Client

**File: `components/StatsCard.tsx`**

```typescript
const fetchStats = async (forceRefresh = false) => {
  setLoading(true);
  
  try {
    // Add ?refresh=true if user clicked force refresh
    const url = forceRefresh ? '/api/youtube?refresh=true' : '/api/youtube';
    
    // Call the API
    const response = await fetch(url);
    const data = await response.json();
    
    // Display the data
    setCount(data.subscriberCount);           // 50000
    setExtraInfo({
      views: data.viewCount,                  // 1000000
      videos: data.videoCount                 // 150
    });
    setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString());
    setIsLiveData(true);
    
  } finally {
    setLoading(false);
  }
};
```

**What User Sees:**
```
┌─────────────────────────────┐
│ YouTube                     │
│ @itzfesi                    │
│ 50,000                      │
│ ✅ LIVE                     │
│ 👁️ Views: 1,000,000        │
│ 🎬 Videos: 150             │
│ Updated: 2:30:45 PM        │
│ [🔄 Refresh]               │
└─────────────────────────────┘
```

---

## 🔄 Next User's Request (Within 24 Hours)

### User 2 visits the site

```
User 2 visits https://itzfesi.ir
    ↓
Page loads → StatsCard mounts
    ↓
useEffect calls fetch('/api/youtube')
    ↓
API route checks cache first (NEW)
    ↓
API says: "Cache exists and <24h old"
    ↓
Returns cached data from Redis WITHOUT calling YouTube API
    ↓
No external API call made ✅
    ↓
Response returned to User 2
    ↓
Same stats shown (because cached)
```

**The API now has caching logic built in (via Next.js `export const revalidate`)**

```typescript
// app/api/youtube/route.ts
export const revalidate = 300;  // 5 minute cache in Next.js

export async function GET(request: Request) {
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  const response = await fetch(url, {
    cache: forceRefresh ? 'no-store' : 'default',
    next: forceRefresh ? { revalidate: 0 } : { revalidate: 300 }
  });
  
  // ... fetch and save ...
}
```

---

## 🔍 Redis Storage Structure After Stats Saved

### Current Stats Storage

```redis
GET "stats:current:youtube"
↓
{
  "platform": "YouTube",
  "count": 50000,
  "views": 1000000,
  "videos": 150,
  "lastFetched": 1730746800000
}

GET "stats:current:telegram"
↓
{
  "platform": "Telegram",
  "count": 25000,
  "lastFetched": 1730746800000
}

GET "stats:current:instagram"
↓
{
  "platform": "Instagram",
  "count": 30000,
  "lastFetched": 1730746800000
}
```

### Historical Stats Storage (Sorted Set)

```redis
ZRANGE "stats:history:youtube" 0 -1 WITHSCORES
↓
1. [score: 1730700000000] {platform: "YouTube", count: 49999, timestamp: 1730700000000}
2. [score: 1730703600000] {platform: "YouTube", count: 50000, timestamp: 1730703600000}
3. [score: 1730707200000] {platform: "YouTube", count: 50010, timestamp: 1730707200000}
... (hundreds of entries over 90 days)
```

---

## 🔄 Manual Refresh Flow

### User Clicks "Refresh" Button

```
User clicks [🔄 Refresh] button on YouTube card
    ↓
StatsCard.tsx handleRefresh() runs
    ↓
Checks 30-second cooldown
    ↓
If enough time passed:
  setRefreshing(true)
  Calls fetchStats(true) with forceRefresh=true
    ↓
fetch('/api/youtube?refresh=true')
    ↓
API receives refresh=true parameter
    ↓
Tells fetch to bypass cache: cache: 'no-store'
    ↓
Makes FRESH call to YouTube API (ignoring cache)
    ↓
Gets new data: e.g., 50050 subscribers
    ↓
Calls saveStats('YouTube', 50050) again
    ↓
Redis updated: stats:current:youtube = 50050
    ↓
History also updated: new entry added
    ↓
Returns to user
    ↓
Display shows new number + new timestamp
```

**User Sees:**
```
Count changed: 50000 → 50050
Updated: 2:30:45 PM → 2:31:12 PM
Toast: "YouTube data refreshed ✅"
```

---

## 🎯 Milestone Check Flow

### Every 2 Hours (Client-Side Throttle)

**File: `components/MilestoneChecker.tsx`**

```typescript
useEffect(() => {
  const checkMilestones = async () => {
    // 1. Check localStorage for last check time
    const lastCheck = localStorage.getItem('lastMilestoneCheck');
    const now = Date.now();
    
    // 2. Only run if 2 hours have passed
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (lastCheck && now - parseInt(lastCheck) < TWO_HOURS) {
      return; // Too soon, skip
    }
    
    // 3. Make API call
    const response = await fetch('/api/check-milestones');
    const data = await response.json();
    
    // 4. Update localStorage
    localStorage.setItem('lastMilestoneCheck', now.toString());
    
    console.log('✅ Milestone check completed:', data);
  };
  
  setTimeout(checkMilestones, 5000); // Run after 5 sec page load
}, []);
```

### What `/api/check-milestones` Does

**File: `app/api/check-milestones/route.ts`**

```typescript
export async function GET() {
  console.log('🔍 Checking for milestones and saving stats...');
  
  // 1. Fetch current stats for ALL platforms
  const stats = await fetchPlatformStats();
  //   Returns: [
  //     { platform: 'YouTube', count: 50050, extraInfo: {...} },
  //     { platform: 'Telegram', count: 25000 },
  //     { platform: 'Instagram', count: 30000 }
  //   ]
  
  for (const { platform, count, extraInfo } of stats) {
    // 2. ✨ SAVE stats to Redis immediately
    await saveStats(platform, count, extraInfo);
    
    // 3. Get last notified milestone from Redis
    const lastNotified = await getLastNotifiedMilestone(platform);
    // Returns: 50000 (or null if never notified)
    
    // 4. Check if we crossed a milestone
    const milestone = shouldNotifyMilestone(count, lastNotified);
    // Returns: { value: 50050, formatted: '50K' } or null
    
    if (milestone) {
      console.log(`🎊 New milestone detected: YouTube - 50,050`);
      
      // 5. SAVE milestone to Redis
      await setLastNotifiedMilestone(platform, milestone.value);
      // Saves: milestone:last:youtube = 50050
      // Also: milestone:history:youtube = [{value: 50050, timestamp: ..., notified: true}]
      
      // 6. Send Telegram notification
      const message = `🎉 We hit 50,050 subscribers on YouTube!`;
      await sendTelegramBroadcast(message);
      
      notifications.push({
        platform: 'YouTube',
        milestone: '50,050',
        delivered: 156 // sent to 156 subscribers
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    stats: currentStats,
    notifications: notifications,
    checkedAt: new Date().toISOString()
  });
}
```

---

## 📊 Complete Timeline Example

Let's say you reached a milestone. Here's exactly what happens:

### 10:00 AM - Monday
```
Your YouTube hits 50,000 subscribers
↓
User visits fesistats.vercel.app
↓
StatsCard calls /api/youtube
↓
External API call → YouTube returns 50,000
↓
saveStats() → Redis (current: 50,000, history: [50,000])
↓
Page shows: 50,000 ✅
```

### 10:05 AM - Monday
```
Another user visits
↓
StatsCard calls /api/youtube
↓
Cache is <24h old
↓
Returns cached 50,000 (NO external API call) ✅
↓
Page shows: 50,000
```

### 10:00 AM - Tuesday (Next Day)
```
Cache expired (24h passed)
↓
User visits fesistats.vercel.app
↓
StatsCard calls /api/youtube
↓
External API call → YouTube returns 50,050
↓
saveStats() → Redis updated (current: 50,050, history: [..., 50,050])
↓
Page shows: 50,050 ✅
```

### 12:00 PM - Tuesday (Milestone Check)
```
MilestoneChecker runs (2-hour throttle from 10am check)
↓
Actually 12:00 PM now, so check runs ✅
↓
fetch('/api/check-milestones')
↓
For each platform:
  1. saveStats() → Already at 50,050 in Redis
  2. Get lastNotified from Redis → 50,000
  3. Check: 50,050 > 50,000? YES!
  4. Milestone detected! ✅
  5. setLastNotifiedMilestone(50,050) → Redis
  6. milestone:history saved with timestamp
  7. Send Telegram: "🎉 50K Milestone!"
↓
156 Telegram subscribers notified ✅
```

### 2:00 PM - Tuesday (Next Check)
```
MilestoneChecker runs again (2 hours later)
↓
For each platform:
  1. saveStats() → Get fresh data, save to Redis
  2. Get lastNotified from Redis → 50,050 (was saved at 12pm)
  3. Check: 50,050 > 50,050? NO!
  4. Already notified, skip ✅
↓
No new notifications (already sent at 12pm)
```

---

## 🔄 Three Ways Stats Are Updated

### Method 1: User Visits Homepage
```
Homepage Load
  ↓
  3 API calls (YouTube, Telegram, Instagram)
  ↓
  Each saves to Redis
  ↓
  Only happens if >24h since last fetch
  ↓
  Otherwise served from cache
```

### Method 2: User Clicks Force Refresh
```
User clicks [🔄] button
  ↓
  URL: /api/youtube?refresh=true
  ↓
  Bypasses cache
  ↓
  Fresh external API call
  ↓
  Saves to Redis
  ↓
  30-second cooldown before next refresh
```

### Method 3: Milestone Check Runs
```
Every 2 hours (client-side throttle)
  ↓
  OR GitHub Actions (every 3 hours)
  ↓
  OR Vercel Cron (daily at midnight)
  ↓
  Fetches all 3 platforms
  ↓
  Saves to Redis
  ↓
  Compares against last notified
  ↓
  Sends Telegram if crossed
```

---

## 📈 Stats Flow Diagram

```
┌─────────────────────────────────────────┐
│ User Visits fesistats.vercel.app        │
└────────────────┬────────────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │ Page loads     │
        │ 3 StatsCards   │
        │ render         │
        └───────┬────────┘
                │
        ┌───────┴───────────────────┐
        │                           │
        ↓                           ↓
   ┌─────────────┐         ┌─────────────┐
   │ /api/youtube│         │ /api/telegram
   └──────┬──────┘         └──────┬──────┘
          │                       │
    ┌─────┴─────────────┐   ┌─────┴─────┐
    │                   │   │           │
    ↓ (if no cache)     ↓   ↓           ↓
 External API      saveStats()    More...
    │                   │
    ↓                   ↓
  return             Redis stored
    │                ├─ stats:current:youtube
    ↓                ├─ stats:history:youtube (sorted)
  Display           └─ lastFetched timestamp

┌────────────────────────────────────────┐
│ Next User Visits Within 24 Hours       │
└───────────────┬────────────────────────┘
                │
                ↓
        /api/youtube (cached)
                │
        ┌───────┴─────────┐
        │                 │
        ↓                 ↓
   Check cache        Cache exists?
   is valid?          YES → Return cached
        │              
   NO → Fetch
   External
```

---

## 🎯 Key Points

### Stats are updated in 3 ways:

1. **On Page Load** (most common)
   - User visits → API calls → Redis saves → Display

2. **On Manual Refresh** (user action)
   - Click button → API call (no cache) → Redis saves → Update display

3. **On Milestone Check** (background)
   - Every 2 hours → Fetch all → Redis saves → Check milestones → Send notification

### Each update includes:

- **Current Stats**: Latest count, views, videos
- **Historical Data**: Timestamped snapshot added to sorted set
- **Milestone Check**: Compare against last notified
- **Redis Persistence**: All data saved permanently

### Cache behavior:

- **24-hour TTL** on current stats
- **Force refresh** bypasses cache (manual button)
- **No cache** for historical data (kept forever)
- **30-sec cooldown** between manual refreshes

---

## 🔍 How to Monitor

### See what just happened:
```bash
# Browser console
JSON.parse(localStorage.getItem('milestoneCheckLogs'))
```

### Check Redis storage:
```bash
redis-cli GET "stats:current:youtube"
redis-cli ZRANGE "stats:history:youtube" -3 -1  # Last 3 entries
redis-cli LRANGE "milestone:history:youtube" 0 -1
```

### View in admin:
```
/admin/milestones?token=YOUR_TOKEN
```

Shows complete history of all updates and milestones!
