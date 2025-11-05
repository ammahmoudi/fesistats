# Quick Stats Update Reference

## 📊 When Stats Get Called & Updated

### Scenario 1: Fresh User (First Time)
```
User visits fesistats.vercel.app
        ↓
   Page loads
        ↓
StatsCard mounts (3 cards)
        ↓
  useEffect runs
        ↓
fetch('/api/youtube')    [External API Call #1]
fetch('/api/telegram')   [External API Call #2]
fetch('/api/instagram')  [External API Call #3]
        ↓
Each API route:
 1. Calls external service
 2. Gets data (count, views, etc)
 3. Calls saveStats() → Redis
 4. Returns data to client
        ↓
Display shows: 50,000 subscribers ✅
Redis saved:  stats:current:youtube, stats:history:youtube
```

---

### Scenario 2: Another User Within 24 Hours
```
User 2 visits fesistats.vercel.app
        ↓
   Page loads
        ↓
StatsCard mounts (3 cards)
        ↓
  useEffect runs
        ↓
fetch('/api/youtube')
        ↓
API checks: Is cache <24h old?
        ↓
YES → Return cached data ✅
NO external API call! 🎉
        ↓
Display shows: 50,000 (from cache)
```

---

### Scenario 3: User Clicks Force Refresh Button
```
User clicks [🔄 Refresh] on YouTube card
        ↓
handleRefresh() runs
        ↓
Check 30-sec cooldown (prevents spam)
        ↓
fetch('/api/youtube?refresh=true')
        ↓
API sees refresh=true
        ↓
Bypass cache → Direct external call
        ↓
Get new data: 50,050 subscribers
        ↓
saveStats() → Redis updated
        ↓
Display: 50,050 ✅
Toast: "Data refreshed!"
```

---

### Scenario 4: Milestone Check (Every 2 Hours)
```
MilestoneChecker runs
        ↓
fetch('/api/check-milestones')
        ↓
For each platform (YouTube, Telegram, Instagram):
        ↓
  1. Get fresh stats (calls external APIs if needed)
  2. saveStats() → Redis (current + history)
  3. Get lastNotified from Redis
  4. Compare: Did we cross a milestone?
        ↓
  If YES (e.g., 50,000 → 50,050):
    • setLastNotifiedMilestone() → Redis
    • Record in milestone history
    • Send Telegram notification
    • Notify 156 subscribers
        ↓
  If NO:
    • Already notified, skip
        ↓
Check complete ✅
```

---

## 🔄 Three API Call Methods

| Method | Trigger | Frequency | Cache |
|--------|---------|-----------|-------|
| **User Page Load** | Visit site | Every visit | 24h cache |
| **Force Refresh** | Click button | Manual | Bypassed |
| **Milestone Check** | Auto timer | 2h, 3h, daily | Mixed |

---

## 📁 Where Each Part Happens

### 1. **Initial Fetch** (`components/StatsCard.tsx`)
```typescript
useEffect(() => {
  fetchStats();  // Called on mount
}, [platform]);

// Also auto-refresh every 5 minutes
setInterval(() => {
  fetchStats();
}, 5 * 60 * 1000);
```

**Result:** 3 API calls to external services
**Then:** Each saves to Redis

---

### 2. **API Routes Auto-Save** (`app/api/youtube/route.ts`, etc)
```typescript
// Before returning data
await saveStats('YouTube', count, extraInfo);

// saveStats() does:
// 1. Redis SET stats:current:youtube = {...}
// 2. Redis ZADD stats:history:youtube = {...}
// 3. Clean old entries (>90 days)
```

**Result:** Data persisted to Redis
**TTL:** 24 hours for current, forever for history

---

### 3. **Milestone Check** (`components/MilestoneChecker.tsx`)
```typescript
const response = await fetch('/api/check-milestones');
// This calls app/api/check-milestones/route.ts
```

**What it does:**
- Fetches all platform stats (via saveStats)
- Gets last notified from Redis
- Compares values
- Sends notifications if crossed
- Records milestone in history

---

## 💾 Redis Storage After Each Update

### After User 1 Visits
```
stats:current:youtube
├─ count: 50000
├─ views: 1000000
├─ videos: 150
└─ lastFetched: 1730746800000

stats:history:youtube (sorted set)
├─ [score: 1730746800000] → {count: 50000, ...}
```

### After Milestone Check Runs
```
milestone:last:youtube = 50000

milestone:history:youtube (list)
├─ [{value: 50000, timestamp: 1730746800000, notified: true}]
```

### After 90 Days
```
Old entries in stats:history:* deleted automatically
Data >90 days removed
Everything else preserved ✅
```

---

## ⏰ Timeline of a Milestone

**Day 1, 10:00 AM:**
```
External API: 49,999 subscribers
→ saveStats('YouTube', 49999)
→ Redis: stats:current:youtube = 49999
→ Display: 49,999
```

**Day 1, 10:30 AM:**
```
External API: 50,000 subscribers ← MILESTONE!
→ saveStats('YouTube', 50000)
→ Redis: stats:current:youtube = 50000
→ Display: 50,000
```

**Day 1, 12:00 PM (Milestone Check):**
```
MilestoneChecker runs
→ fetch('/api/check-milestones')
→ Get stats → 50,000
→ Get lastNotified → null (first time)
→ MILESTONE DETECTED! 🎉
→ setLastNotifiedMilestone('YouTube', 50000)
→ Redis: milestone:last:youtube = 50000
→ Redis: milestone:history:youtube += [{value: 50000, ...}]
→ Send Telegram: "🎉 We hit 50K!"
→ 156 subscribers notified ✅
```

**Day 1, 2:00 PM (Next Milestone Check):**
```
MilestoneChecker runs
→ Get stats → 50,000
→ Get lastNotified → 50000 (saved at 12pm)
→ Check: 50000 > 50000? NO
→ Already notified, skip
→ No new notification
```

**Day 2, 5:00 PM:**
```
External API: 50,100 subscribers (crossed another milestone)
→ saveStats('YouTube', 50100)
→ Redis: stats:current:youtube = 50100
→ Plus history entry added
```

---

## 🎯 Complete Call Sequence

```
1. User visits site
   ↓
2. StatsCard.useEffect runs
   ↓
3. fetch('/api/youtube')
   ├─ External API call
   ├─ saveStats() → Redis
   └─ Return data
   ↓
4. Display updated
   ↓
5. 5 minutes later: Auto-refresh
   ├─ If cache <24h: Return cached
   ├─ If cache >24h: Fetch again
   └─ saveStats() again if fetched
   ↓
6. User clicks refresh button
   ├─ fetch('/api/youtube?refresh=true')
   ├─ Force bypass cache
   ├─ External API call
   ├─ saveStats() → Redis
   └─ Display updated
   ↓
7. Every 2 hours: Milestone check
   ├─ fetch('/api/check-milestones')
   ├─ For each platform: saveStats() + milestone check
   ├─ If crossed: setLastNotifiedMilestone()
   ├─ Send Telegram notification
   └─ Record in history
   ↓
8. Continue cycle
```

---

## 🔍 How to See What's Happening

### In Browser Console
```javascript
// See recent milestone checks
JSON.parse(localStorage.getItem('milestoneCheckLogs'))

// Output:
[
  { timestamp: "2025-11-05T14:30:00.000Z", success: true, milestonesFound: 0 },
  { timestamp: "2025-11-05T12:30:00.000Z", success: true, milestonesFound: 1 },
]
```

### In Network Tab (DevTools)
```
First visit:
├─ /api/youtube ✓ 200
├─ /api/telegram ✓ 200
└─ /api/instagram ✓ 200

5 minutes later (refresh):
├─ (cached - no new calls if <24h)

After 24 hours:
├─ /api/youtube ✓ 200
├─ /api/telegram ✓ 200
└─ /api/instagram ✓ 200
```

### In Admin Dashboard
```
Visit: /admin/milestones?token=YOUR_TOKEN

See:
├─ Last notified milestone for each platform
├─ Complete milestone history with dates
├─ Notification status (✓ Notified / ◐ Pending)
└─ Recent stats from each platform
```

---

## 📊 Summary Table

| Event | Where | Calls | Cache | Saved |
|-------|-------|-------|-------|-------|
| User visits | Page load | 3 ext | Yes | Redis ✅ |
| Auto-refresh (5m) | StatsCard | 0-3 | Yes | Redis ✅ |
| Manual refresh | Button | 3 ext | No | Redis ✅ |
| Milestone check | Every 2h | 0-3 | Mixed | Redis ✅ |

**Key:** 
- `3 ext` = 3 external API calls
- `0-3` = Only if cache expired
- `Cache: Yes/No` = Respects cache TTL
- `Saved: Redis ✅` = Always persisted

---

## ✅ Everything is Saved

Every stats update goes through:
1. **Call external API** (if needed)
2. **Get data** (count, views, etc)
3. **saveStats()** to Redis
   - Current stats (24h TTL)
   - History entry (forever)
4. **Return to user**

**Result:** ✅ All stats persisted, never lost!
