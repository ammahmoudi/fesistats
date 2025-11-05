# Stats Fetchers Module Structure

## New Organized Module Layout

After splitting `statsFetcher.ts`, the stats fetching logic is now organized in a dedicated module:

```
lib/fetchers/
├─ index.ts                 (Central export & orchestration)
├─ youtube-fetcher.ts       (YouTube-specific fetching)
├─ telegram-fetcher.ts      (Telegram-specific fetching)
├─ instagram-fetcher.ts     (Instagram-specific fetching)
└─ utils.ts                 (Shared utilities)
```

---

## File Breakdown

### 📦 `lib/fetchers/index.ts` (Main Export)
```typescript
// Re-exports all fetchers
export { fetchYouTubeStats } from './youtube-fetcher';
export { fetchTelegramStats } from './telegram-fetcher';
export { fetchInstagramStats } from './instagram-fetcher';
export { fetchWithTimeout } from './utils';
export type { FetchedStats } from './youtube-fetcher';

// Orchestrator function
export async function fetchAndSaveAllStats()
```

**Used by:**
- `/api/check-milestones` → Calls `fetchAndSaveAllStats()`
- All individual routes → Import specific fetchers

---

### 🎥 `lib/fetchers/youtube-fetcher.ts` (~70 lines)
**Responsibility:** Fetch YouTube subscriber count, views, and video count

**Exports:**
```typescript
export interface FetchedStats {
  platform: string;
  count: number;
  extraInfo?: { views?: number; videos?: number };
}

export async function fetchYouTubeStats(): Promise<FetchedStats | null>
```

**Used by:**
- `/api/youtube/route.ts` → Individual API endpoint
- `/api/check-milestones/route.ts` → Milestone checking
- Tests

---

### 💬 `lib/fetchers/telegram-fetcher.ts` (~60 lines)
**Responsibility:** Fetch Telegram member count from public channel page

**Exports:**
```typescript
export async function fetchTelegramStats(): Promise<FetchedStats | null>
```

**Features:**
- Scrapes public t.me page
- Multiple regex patterns for robustness
- Handles user-agent headers

**Used by:**
- `/api/telegram/route.ts` → Individual API endpoint
- `/api/check-milestones/route.ts` → Milestone checking

---

### 📸 `lib/fetchers/instagram-fetcher.ts` (~50 lines)
**Responsibility:** Fetch Instagram follower count

**Exports:**
```typescript
export async function fetchInstagramStats(): Promise<FetchedStats | null>
```

**Implementation:**
- Currently calls internal `/api/instagram` endpoint
- Instagram blocks automated scraping
- Manual count or API integration possible

**Used by:**
- `/api/instagram/route.ts` → Individual API endpoint
- (Not called by milestone checker to avoid recursion)

---

### ⚙️ `lib/fetchers/utils.ts` (~15 lines)
**Responsibility:** Shared utilities for all fetchers

**Exports:**
```typescript
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs?: number // Uses config.API_TIMEOUT
): Promise<Response>
```

**Used by:**
- All three fetchers (YouTube, Telegram, Instagram)
- Handles AbortController + timeout logic

---

## Usage Examples

### Individual Fetchers
```typescript
// In /api/youtube/route.ts
import { fetchYouTubeStats } from '@/lib/fetchers';

const stats = await fetchYouTubeStats();
if (stats) {
  await saveStats(stats.platform, stats.count, stats.extraInfo);
}
```

### Orchestrator Function
```typescript
// In /api/check-milestones/route.ts
import { fetchAndSaveAllStats } from '@/lib/fetchers';

const stats = await fetchAndSaveAllStats();
// Returns: [{ platform: 'YouTube', count: 50000, ... }, { platform: 'Telegram', count: 5000, ... }]
```

### Import Everything
```typescript
import * as fetchers from '@/lib/fetchers';

const yt = await fetchers.fetchYouTubeStats();
const tg = await fetchers.fetchTelegramStats();
const ig = await fetchers.fetchInstagramStats();
```

---

## Benefits of This Structure

### ✅ Clear Separation of Concerns
- Each file has ONE platform
- Easy to find logic: "Need YouTube? Check `youtube-fetcher.ts`"
- No mixing of concerns

### ✅ Easier Maintenance
- Bug in Telegram scraping? Edit `telegram-fetcher.ts` only
- Performance issue with timeout? Fix `utils.ts` once
- Changes propagate automatically

### ✅ Better Scalability
- Add new platform? Create `tiktok-fetcher.ts`
- Follows same pattern
- No modification needed to existing files

### ✅ Testable
```typescript
// Can test each fetcher independently
import { fetchYouTubeStats } from '@/lib/fetchers/youtube-fetcher';

it('should return YouTube stats', async () => {
  const stats = await fetchYouTubeStats();
  expect(stats?.platform).toBe('YouTube');
});
```

### ✅ Type-Safe
```typescript
// Types are explicit and shared
import type { FetchedStats } from '@/lib/fetchers';

function procesStats(stats: FetchedStats[]) { ... }
```

---

## Data Flow

### User Visits Homepage
```
Page Load
  ↓
3 Card mounts (StatsCard component)
  ├─ fetch('/api/youtube')
  │   └─ Uses fetchYouTubeStats() from youtube-fetcher.ts
  ├─ fetch('/api/telegram')
  │   └─ Uses fetchTelegramStats() from telegram-fetcher.ts
  └─ fetch('/api/instagram')
      └─ Uses fetchInstagramStats() from instagram-fetcher.ts
```

### Milestone Check Every 2 Hours
```
MilestoneChecker runs
  ↓
fetch('/api/check-milestones')
  ↓
Uses fetchAndSaveAllStats() from index.ts
  ├─ Calls fetchYouTubeStats() in parallel
  ├─ Calls fetchTelegramStats() in parallel
  └─ Saves both to Redis
  ↓
Compare with lastNotified → Send notifications
```

---

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | ~40 | Exports + orchestrator |
| `youtube-fetcher.ts` | ~70 | YouTube logic |
| `telegram-fetcher.ts` | ~60 | Telegram logic |
| `instagram-fetcher.ts` | ~50 | Instagram logic |
| `utils.ts` | ~15 | Shared utilities |
| **Total** | **~235** | Clean, organized |

---

## Import Paths

### From Other Routes/Files

```typescript
// Import specific fetcher
import { fetchYouTubeStats } from '@/lib/fetchers';

// Import orchestrator
import { fetchAndSaveAllStats } from '@/lib/fetchers';

// Import types
import type { FetchedStats } from '@/lib/fetchers';

// Import utility
import { fetchWithTimeout } from '@/lib/fetchers';
```

All imports go through `lib/fetchers/index.ts` (the entry point).

---

## Adding a New Platform

When you want to support TikTok (for example):

### 1. Create `lib/fetchers/tiktok-fetcher.ts`
```typescript
import { config } from '../config';
import { fetchWithTimeout } from './utils';
import type { FetchedStats } from './youtube-fetcher';

export async function fetchTikTokStats(): Promise<FetchedStats | null> {
  try {
    const username = process.env.TIKTOK_USERNAME;
    // ... fetch TikTok data
    return { platform: 'TikTok', count: followers };
  } catch (error) {
    console.error('Error fetching TikTok stats:', error);
    return null;
  }
}
```

### 2. Update `lib/fetchers/index.ts`
```typescript
export { fetchTikTokStats } from './tiktok-fetcher';

export async function fetchAndSaveAllStats() {
  const results = await Promise.allSettled([
    fetchYouTubeStats(),
    fetchTelegramStats(),
    fetchTikTokStats(),  // ← Add this
  ]);
  // ... rest of code
}
```

### 3. Create `/api/tiktok/route.ts`
```typescript
import { fetchTikTokStats } from '@/lib/fetchers';

export async function GET() {
  const stats = await fetchTikTokStats();
  // ... handle and return
}
```

**Done!** No changes needed anywhere else. 🎉

---

## Configuration

All fetchers use environment variables through `config.ts`:

```
config.API_TIMEOUT          (seconds) → Used by fetchWithTimeout()
config.STATS_CACHE_TTL      (seconds) → Used by saveStats()
config.MILESTONE_CHECK_THROTTLE (seconds)
```

Example:
```typescript
const response = await fetchWithTimeout(url, {}, config.API_TIMEOUT);
```

---

## Summary

The split module structure provides:

✅ **Organization** - Each platform in its own file  
✅ **Maintainability** - Easy to find and fix code  
✅ **Scalability** - Add new platforms without complexity  
✅ **Testability** - Each fetcher can be tested independently  
✅ **Reusability** - Use same fetchers from multiple places  
✅ **Clean Code** - No duplication, clear dependencies  

This follows professional software architecture patterns! 🚀
