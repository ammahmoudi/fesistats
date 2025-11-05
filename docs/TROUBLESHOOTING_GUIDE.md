# Quick Troubleshooting & Testing Guide

## 🧪 Testing the New System

### Test 1: Verify Stats Are Being Saved

**Step 1:** Open DevTools Console on homepage
```javascript
// Check last check timestamp
localStorage.getItem('lastMilestoneCheck');

// Check recent check logs
JSON.parse(localStorage.getItem('milestoneCheckLogs') || '[]');
```

**Expected Output:**
```javascript
// Should show multiple check records with timestamps
[
  {
    timestamp: "2025-11-05T14:30:00.000Z",
    success: true,
    milestonesFound: 0,
    platformsChecked: 3
  }
]
```

### Test 2: Check Cached Stats in Redis

**Via Admin API:**
```bash
# Get all current stats from cache
curl "https://your-app.vercel.app/api/stats"

# Get stats with history
curl "https://your-app.vercel.app/api/stats?history=true&range=day"
```

**Expected Response:**
```json
{
  "success": true,
  "stats": [
    {
      "platform": "YouTube",
      "count": 50000,
      "views": 1000000,
      "videos": 150,
      "lastFetched": 1730746800000,
      "source": "cache"
    }
  ]
}
```

### Test 3: View Milestone History

**Via Admin Dashboard:**
1. Go to `/admin` and login
2. Navigate to "Milestones"
3. Scroll down to "Milestone History" section
4. Should see all recorded milestones with dates

**Or via API:**
```bash
curl "https://your-app.vercel.app/api/admin/history?token=YOUR_ADMIN_TOKEN&type=milestones"
```

### Test 4: Force Trigger Milestone Check

**Manual Check:**
1. Go to `/admin/milestones?token=YOUR_ADMIN_TOKEN`
2. Click "Check Milestones Now" button
3. Wait for check to complete
4. Check should fetch latest stats and compare

**Programmatic:**
```bash
curl -X GET "https://your-app.vercel.app/api/check-milestones"
```

---

## 🔧 Common Issues & Fixes

### Issue: "Redis env vars missing"

**Problem:** Stats not being saved, getting error messages

**Solution:**
```env
# Add to .env.local
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token-here
```

**Verify:**
```bash
# Test Redis connection
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-redis.upstash.io/get/stats:current:youtube
```

### Issue: Milestones not showing in history

**Problem:** Admin page shows "No milestones recorded yet"

**Possible Causes:**
1. No milestones have been reached yet
2. Redis key not being written
3. Admin token incorrect

**Fix:**
```bash
# Check if any milestone data exists
redis-cli KEYS "milestone:*"

# Manually verify a milestone was saved
redis-cli GET "milestone:last:youtube"

# Check milestone history
redis-cli LRANGE "milestone:history:youtube" 0 10
```

### Issue: Stats not updating

**Problem:** Stats card shows old data even after refresh

**Solution:**
1. Check if `refresh=true` is being passed:
   ```javascript
   // StatsCard should append ?refresh=true on manual refresh
   fetch('/api/youtube?refresh=true')
   ```

2. Check cache expiration (default 5 min):
   ```javascript
   // In StatsCard.tsx
   const REFRESH_COOLDOWN = 30000; // 30 seconds minimum between refreshes
   ```

3. Manual cache clear:
   ```javascript
   // Browser console
   localStorage.removeItem('lastMilestoneCheck');
   localStorage.removeItem('milestoneCheckLogs');
   ```

### Issue: API calls still happening too frequently

**Problem:** External APIs being hit on every page load

**Solution:**
1. Verify stats storage is working:
   ```bash
   # Check if current stats exist
   redis-cli GET "stats:current:youtube"
   ```

2. Check fetch logic in `StatsCard.tsx`:
   ```typescript
   // Should use cached endpoint first
   fetch('/api/youtube') // Not /api/stats?refresh=true
   ```

3. Verify caching headers on API routes:
   ```typescript
   // Each route should have:
   export const revalidate = 300; // 5 minutes
   ```

---

## 📊 Monitoring Stats Collection

### Check What's Being Stored

**YouTube Stats:**
```bash
redis-cli GET "stats:current:youtube"
# Output: {"platform":"YouTube","count":50000,"views":1000000,"videos":150,"lastFetched":...}
```

**Telegram Stats:**
```bash
redis-cli GET "stats:current:telegram"
# Output: {"platform":"Telegram","count":25000,"lastFetched":...}
```

**Instagram Stats:**
```bash
redis-cli GET "stats:current:instagram"
# Output: {"platform":"Instagram","count":30000,"lastFetched":...}
```

### Check Historical Data

```bash
# Get latest 10 entries from YouTube history
redis-cli ZRANGE "stats:history:youtube" -10 -1 WITHSCORES

# Count total history entries
redis-cli ZCARD "stats:history:youtube"

# Get entries from specific time range (timestamps in ms)
redis-cli ZRANGEBYSCORE "stats:history:youtube" 1730700000000 1730750000000
```

### Check Milestone Records

```bash
# Get current milestone value for each platform
redis-cli MGET "milestone:last:youtube" "milestone:last:telegram" "milestone:last:instagram"

# Get all milestone history for YouTube
redis-cli LRANGE "milestone:history:youtube" 0 -1

# Get milestones from last 30 days
redis-cli LRANGE "milestone:history:youtube" 0 50
```

---

## 🔍 Debug Mode

### Enable Detailed Logging

**In `components/MilestoneChecker.tsx`:**
```typescript
// Already logs when NODE_ENV === 'development'
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Milestone check completed:', data);
}
```

**In Browser:**
```javascript
// Check last 5 checks
console.table(JSON.parse(localStorage.getItem('milestoneCheckLogs') || '[]'));

// Check storage usage
console.log('Storage logs:', localStorage.getItem('milestoneCheckLogs')?.length || 0, 'bytes');
```

### View API Response Details

**In StatsCard:**
```javascript
// Open DevTools and check Network tab
// Look for:
// - /api/youtube, /api/telegram, /api/instagram
// - Should show lastUpdated timestamp
```

---

## 🚀 Optimization Tips

### Reduce API Calls Further

**Current Throttle (2 hours):** Edit `MilestoneChecker.tsx`
```typescript
const TWO_HOURS = 2 * 60 * 60 * 1000;
// Change to:
const THREE_HOURS = 3 * 60 * 60 * 1000; // Reduce checks
```

**Current Cache TTL (24 hours):** Edit `statsStorage.ts`
```typescript
{ ex: 86400 } // 24 hour TTL
// Change to:
{ ex: 172800 } // 48 hour TTL
```

### Monitor Redis Usage

**Check stats storage size:**
```bash
# Total keys
redis-cli DBSIZE

# Memory usage
redis-cli INFO memory

# Keys by pattern
redis-cli KEYS "stats:*" | wc -l
redis-cli KEYS "milestone:*" | wc -l
```

---

## 📝 Data Verification Checklist

- [ ] Redis credentials in `.env.local`
- [ ] Stats being saved on API calls
- [ ] Milestone history showing in admin
- [ ] At least one milestone in history
- [ ] Manual refresh working (30-sec cooldown)
- [ ] No external API calls on second page load
- [ ] Admin dashboard showing stats
- [ ] No errors in deployment logs

---

## 🧹 Manual Cleanup

### Clear All Stats History (⚠️ WARNING: DESTRUCTIVE)

```bash
# Clear stats history (keeps current, removes history)
redis-cli DEL "stats:history:youtube" "stats:history:telegram" "stats:history:instagram"

# Clear milestone history (keeps current, removes history)
redis-cli DEL "milestone:history:youtube" "milestone:history:telegram" "milestone:history:instagram"

# Clear everything stats-related
redis-cli FLUSHDB ASYNC  # Clears entire database!
```

### Restore After Accidental Clear

```bash
# Check if you have logs
redis-cli KEYS "*"

# If empty, no automatic recovery - rely on next API calls
# Stats will be re-collected when:
# - User visits page (within 24h cache)
# - Manual refresh is triggered
# - Milestone check runs
```

---

## 📞 Support Information

If issues persist:

1. **Check Redis Connection:**
   ```bash
   curl -v https://your-redis.upstash.io/ping -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Check Deployment Logs:**
   - Vercel Dashboard → Logs
   - Look for "Error saving stats" or Redis errors

3. **Manual Verification:**
   ```bash
   # Test each API individually
   curl https://your-app.vercel.app/api/youtube
   curl https://your-app.vercel.app/api/telegram
   curl https://your-app.vercel.app/api/instagram
   
   # All should return data with lastUpdated
   ```

4. **Check Admin Dashboard:**
   - Go to `/admin/milestones?token=YOUR_TOKEN`
   - Click "Refresh" button
   - Check browser console for errors

---

## Success Indicators ✅

Your implementation is working correctly when you see:

✅ Stats card loads within 1-2 seconds
✅ Manual refresh shows new timestamp
✅ Second page load shows "LIVE" badge (cached data)
✅ Admin milestone page shows history with dates
✅ No more than 3 external API calls per 24-hour period per platform
✅ Milestone notifications still send reliably
✅ Force refresh bypasses cache and fetches fresh data
✅ Zero "Redis env vars missing" errors

---

Done! Your stats caching and milestone tracking system is ready to use! 🎉
