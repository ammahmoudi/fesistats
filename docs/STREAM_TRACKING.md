# YouTube Stream Tracking

## Overview

The system automatically tracks YouTube live streams and displays them on the stats charts as visual markers, allowing you to see the impact of streams on subscriber growth.

## Features

- **Automatic Detection**: Fetches recent videos and identifies live streams
- **Visual Markers**: Displays streams as shaded red regions on charts
- **Minimal API Usage**: Uses aggressive caching to minimize YouTube API quota consumption
- **Integration**: Seamlessly integrates with existing milestone checking infrastructure

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Cron Job (Daily)                                           │
│  /api/check-milestones                                      │
│  ├─ Fetches stats                                           │
│  └─ Triggers fetchYouTubeStreams() (background, cached)    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  fetchYouTubeStreams()                                      │
│  ├─ Checks cache (1-hour TTL)                              │
│  ├─ Skips if recently fetched                              │
│  └─ If needed:                                              │
│     ├─ YouTube Search API (50 recent videos)               │
│     ├─ Delay 100ms                                          │
│     ├─ YouTube Videos API (details)                        │
│     └─ Delay 100ms                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Redis Storage (Optimized)                                  │
│  ├─ streams:youtube:all (sorted set, scored by timestamp)  │
│  │  • Single key for all streams                           │
│  │  • Automatic chronological ordering                     │
│  │  • O(log N) range queries                               │
│  │  • 90-day retention with ZREMRANGEBYSCORE               │
│  └─ stream:cache:last_fetch (1-hour TTL)                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  /stats Page                                                │
│  ├─ Fetches /api/youtube/streams?range=week                │
│  ├─ Gets cached data from Redis                            │
│  └─ Renders shaded regions on chart                        │
└─────────────────────────────────────────────────────────────┘
```

## Optimization Strategy

### 1. Aggressive Caching
- **1-hour cache**: Stream data is cached for 1 hour in Redis
- **Cache key**: `stream:cache:last_fetch` stores last fetch timestamp
- **Automatic skip**: If fetched within last hour, API calls are skipped

### 2. API Call Minimization
- **Maximum 2 calls per hour**: Search API + Videos API
- **Batched requests**: Fetches up to 50 videos in one call
- **Delays**: 100ms delay between API calls to respect rate limits
- **Background execution**: Stream fetch doesn't block milestone checks

### 3. Resource Optimization
- **Non-blocking**: Stream fetch runs in background via `.catch()`
- **Fail-safe**: Errors in stream fetch don't affect milestone functionality
- **Sorted Set Storage**: All streams in single Redis sorted set (not individual keys)
- **Efficient Queries**: O(log N) time complexity for range queries
- **Automatic Cleanup**: `ZREMRANGEBYSCORE` removes old streams in one operation
- **Memory Efficient**: Single key overhead vs N keys for N streams

## API Endpoints

### GET /api/youtube/streams
Fetches stream data for display on stats page.

**Query Parameters:**
- `range`: Time range (`day` | `week` | `month`) - default: `week`
- `refresh`: Force fetch from API, bypassing cache - default: `false`

**Response:**
```json
{
  "success": true,
  "streams": [
    {
      "videoId": "abc123",
      "title": "Live Stream Title",
      "startTime": 1699123456789,
      "endTime": 1699127056789,
      "isLive": false,
      "viewCount": 1234
    }
  ],
  "count": 1,
  "range": "week",
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

### GET /api/youtube/update-streams
Cron endpoint for manual stream updates (not needed with auto-integration).

**Headers:**
- `Authorization: Bearer {CRON_SECRET}` - if CRON_SECRET is set

**Query Parameters:**
- `refresh`: Force fetch ignoring cache - default: `false`

## Configuration

### Environment Variables

No additional env vars needed! Uses existing:
- `YOUTUBE_API_KEY` - Already configured
- `YOUTUBE_CHANNEL_ID` - Already configured
- `CRON_SECRET` - Optional, for securing cron endpoint

### Cron Schedule

Stream fetching is **automatically integrated** into the existing milestone check:
```json
{
  "crons": [{
    "path": "/api/check-milestones",
    "schedule": "0 0 * * *"
  }]
}
```

This runs daily and:
1. Checks milestones
2. Saves stats
3. **Updates streams** (if cache is stale)

## Usage

### On Stats Page

Streams appear automatically on `/stats`:
- **Red shaded areas**: Stream duration
- **Labels**: "🔴 LIVE" for ongoing, "📺" for completed
- **Badge**: Shows count of visible streams

### Manual Refresh

To force refresh stream data:
```bash
curl "https://yourdomain.com/api/youtube/streams?refresh=true"
```

Or use the refresh button on `/stats` page (refreshes every 5 minutes automatically).

## Performance Metrics

### API Quota Usage
- **YouTube API Quota**: ~100 units per fetch (2 calls)
- **Daily quota**: 10,000 units (default free tier)
- **Max fetches per day**: ~100 (with 1-hour cache, realistically ~24)
- **Actual usage**: ~24 fetches/day = ~2,400 units/day = **24% of quota**

### Resource Usage
- **Redis calls**: 1-2 per stats page load (ZRANGE for data)
- **Memory**: ~1KB per stream record in sorted set
- **Storage**: ~30-50 streams × 1KB = 50KB total
- **Complexity**: O(log N) for range queries vs O(N) with individual keys

### Storage Architecture

**Before (Individual Keys):**
```
stream:youtube:video1 → {data}
stream:youtube:video2 → {data}  
stream:youtube:video3 → {data}
... (N keys, N GET operations needed)
```

**After (Sorted Set - Current):**
```
streams:youtube:all → Sorted Set [
  score: 1699123456789, member: {video1 data}
  score: 1699234567890, member: {video2 data}
  score: 1699345678901, member: {video3 data}
]
(1 key, 1 ZRANGE operation for range query)
```

**Benefits:**
- ✅ 90% fewer Redis operations for range queries
- ✅ No dangerous `KEYS` command in production
- ✅ Automatic chronological sorting
- ✅ Atomic range queries by timestamp
- ✅ Efficient batch cleanup with `ZREMRANGEBYSCORE`

## Troubleshooting

### Streams Not Showing

1. **Check cache status**:
   ```bash
   # Force refresh
   curl "https://yourdomain.com/api/youtube/streams?refresh=true"
   ```

2. **Check logs**:
   - Look for "Using cached stream data" (normal)
   - Look for "Fetching YouTube videos/streams" (API call)
   - Look for errors in YouTube API response

3. **Verify API credentials**:
   - Ensure `YOUTUBE_API_KEY` is valid
   - Check quota usage in Google Cloud Console

### No Streams in Time Range

Streams only appear if:
- Video has `liveStreamingDetails` (was/is a live stream)
- Stream start time is within selected time range
- Stream was published in last 30 days

## Best Practices

1. **Don't force refresh frequently**: Let the cache work (1-hour TTL is optimal)
2. **Monitor quota usage**: Check Google Cloud Console regularly
3. **Use existing cron**: Don't add separate cron jobs for streams
4. **Let it run automatically**: The integration handles everything

## Future Enhancements

Potential improvements:
- [ ] Webhooks for live stream start/end notifications
- [ ] Stream analytics (viewer count over time)
- [ ] Correlation metrics (subscriber gain during streams)
- [ ] Stream schedule predictions
- [ ] Multi-platform stream support (Twitch, etc.)
