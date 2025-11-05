# Automated Milestone Notifications

## 🎯 How It Works

The system automatically detects and notifies subscribers when reaching follower/subscriber milestones across all platforms (YouTube, Telegram, Instagram).

## 📊 Milestone Thresholds

### Every 1K (1,000 to 10,000)
- 1K, 2K, 3K, 4K, 5K, 6K, 7K, 8K, 9K, 10K

### Every 5K (15,000 to 50,000)
- 15K, 20K, 25K, 30K, 35K, 40K, 45K, 50K

### Major Milestones
- 75K, 100K, 150K, 200K, 250K, 500K, 750K
- 1M, 1.5M, 2M, 2.5M, 5M, 10M

## ⚙️ How Milestone Checking Works

### Multiple Methods Available

The system supports multiple ways to check for milestones, suitable for different Vercel plans:

#### 1. **Client-Side Polling** (Default - Works on All Plans)
- **How it works**: When users visit the homepage, a background component checks for milestones
- **Throttling**: Checks at most every 2 hours per browser (using localStorage)
- **Pros**: Free, automatic, no external dependencies, works on Hobby plan
- **Cons**: Requires site traffic to trigger checks
- **Implementation**: `<MilestoneChecker />` component in `app/page.tsx`

#### 2. **Vercel Cron** (Hobby: Once/day, Pro: Frequent)
- **Hobby Plan**: Once per day at midnight UTC (`0 0 * * *`)
- **Pro Plan**: Can run frequently (e.g., every 3 hours)
- **Configuration**: Set in `vercel.json` crons array
- **Pros**: Guaranteed execution, reliable timing
- **Cons**: Hobby plan limited to once/day (not ideal for frequent checks)

#### 3. **GitHub Actions** (Backup Option)
- **How it works**: Scheduled workflow calls `/api/check-milestones` every 3 hours
- **File**: `.github/workflows/milestone-check.yml`
- **Pros**: Free, reliable, independent of Vercel plan
- **Cons**: Requires GitHub Actions to be enabled
- **To enable**: Workflow is already committed, runs automatically

#### 4. **External Cron Services** (Advanced)
- **Services**: cron-job.org, UptimeRobot, EasyCron, etc.
- **Setup**: Point service to `https://fesistats.vercel.app/api/check-milestones`
- **Pros**: Most reliable, customizable schedule, uptime monitoring
- **Cons**: Requires external service setup

### Recommended Setup by Vercel Plan

**Hobby Plan (Free):**
- ✅ Client-side polling (enabled by default)
- ✅ GitHub Actions (enabled by default - every 3 hours)
- ✅ Vercel Cron (once/day backup)
- Optional: External cron service for guaranteed frequent checks

**Pro Plan:**
- ✅ Vercel Cron (adjust frequency in `vercel.json` to `0 */3 * * *` for every 3 hours)
- ✅ Client-side polling (backup)
- Optional: Disable GitHub Actions workflow if not needed

## 📊 How Stats Are Updated

### Real-Time Fetching (No Database Storage)

The system **does NOT store** historical stats in a database. Instead:

1. **API Routes Fetch Live Data**:
   - `/api/youtube` → Calls YouTube Data API v3
   - `/api/telegram` → Scrapes public Telegram page
   - `/api/instagram` → Calls Instagram internal API

2. **Server-Side Caching** (5 minutes):
   - Each API route has `export const revalidate = 300` (5 min cache)
   - All users share the same cached data
   - Reduces API calls and improves performance

3. **Milestone Check Flow**:
   ```
   User visits site/Cron triggers
   → /api/check-milestones called
   → Fetches /api/youtube, /api/telegram, /api/instagram
   → Gets current counts (from cache if < 5 min old)
   → Compares with last notified milestone (Redis)
   → Sends notification if new milestone reached
   → Updates last notified in Redis
   ```

4. **Only Milestones Are Stored**:
   - Redis stores: `milestone:last:{platform}` = last notified count
   - Example: `milestone:last:youtube = 10000`
   - This prevents duplicate notifications for same milestone

### Why This Design?

- ✅ **Simple**: No complex database schema
- ✅ **Always Fresh**: Stats are current (max 5 min old)
- ✅ **Cost-Effective**: No database hosting needed
- ✅ **Serverless-Friendly**: Stateless API routes
- ❌ **No History**: Can't view historical trends (future enhancement)

## ⚙️ Automated Checking

### Vercel Cron Job
Runs every **6 hours** automatically:
- 12:00 AM UTC
- 6:00 AM UTC
- 12:00 PM UTC
- 6:00 PM UTC

### Manual Check
Visit: `https://fesistats.vercel.app/api/check-milestones`

Or use admin dashboard at `/admin/milestones`

Returns:
```json
{
  "success": true,
  "checked": 3,
  "notifications": [
    {
      "platform": "YouTube",
      "milestone": "10K",
      "delivered": 15
    }
  ],
  "message": "1 milestone notification(s) sent"
}
```

## � Admin UI

### Milestone Management Page
**URL:** `https://fesistats.vercel.app/admin/milestones`

**Features:**
- **Current Stats**: View real-time follower/subscriber counts for all platforms
- **Manual Check**: "Check Milestones Now" button to trigger immediate milestone detection
- **Check Results**: View latest check results including:
  - Platforms checked
  - Milestones detected
  - Notifications sent
  - Delivery statistics
- **System Info**: Explanation of automated schedule and detection thresholds

**Access:** Requires admin login via `/admin` with `ADMIN_BROADCAST_TOKEN`

### How to Use Admin UI

1. **Login**: Visit `/admin` and enter your admin token
2. **Navigate**: Click "🏆 Milestones" button in dashboard header
3. **View Stats**: See current platform counts at top of page
4. **Manual Check**: Click "Check Milestones Now" to trigger immediate check
5. **View Results**: See check results, notifications sent, and delivery stats

## �🔔 Notification Flow

1. **Cron triggers** `/api/check-milestones` every 6 hours
2. **Fetches current counts** from YouTube, Telegram, Instagram APIs
3. **Compares** with last notified milestone (stored in Redis)
4. **If new milestone reached:**
   - Generates celebration message
   - Sends to all Telegram subscribers
   - Updates Redis with new milestone
   - Logs result
5. **If no milestone:** Logs current status and continues

## 💾 Storage

Milestones tracked in Redis:
```
milestone:last:youtube → 10000
milestone:last:telegram → 5000
milestone:last:instagram → 3000
```

Prevents duplicate notifications for the same milestone.

## 📱 Notification Format

```
🎉 Milestone Reached!

📱 Platform: YouTube
🎯 Milestone: 10K

🚀 Amazing milestone reached: 10K on YouTube!

Thank you for being part of this journey! 🙏

🔗 Dashboard: https://fesistats.vercel.app
```

## 🧪 Testing

### Test Milestone Detection
```bash
# Check current status (won't send notifications)
curl https://fesistats.vercel.app/api/check-milestones
```

### Force Check
Manually trigger by visiting the endpoint - useful after:
- Initial setup
- Platform count updates
- Testing notification system

### Verify Last Milestones
Check Redis keys:
```
milestone:last:youtube
milestone:last:telegram
milestone:last:instagram
```

## 🔧 Configuration

### Client-Side Polling Settings

Edit `components/MilestoneChecker.tsx`:

```typescript
// Change check frequency (default: 2 hours)
const TWO_HOURS = 2 * 60 * 60 * 1000; // milliseconds

// Change initial delay (default: 5 seconds)
const timer = setTimeout(checkMilestones, 5000);
```

### Vercel Cron Settings

Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/check-milestones",
    "schedule": "0 0 * * *"  // Once daily (Hobby plan)
    // Pro plan can use: "0 */3 * * *" for every 3 hours
  }]
}
```

**Cron Schedule Options:**
- `0 0 * * *` - Once daily at midnight UTC (Hobby plan)
- `0 */3 * * *` - Every 3 hours (Pro plan)
- `0 */6 * * *` - Every 6 hours (Pro plan)
- `0 */12 * * *` - Every 12 hours (Pro plan)

### GitHub Actions Settings

Edit `.github/workflows/milestone-check.yml`:

```yaml
on:
  schedule:
    - cron: '0 */3 * * *'  # Every 3 hours
```

**To disable**: Comment out the schedule or delete the workflow file.

### External Cron Service Setup

**Example with cron-job.org:**

1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. Create new cron job:
   - **URL**: `https://fesistats.vercel.app/api/check-milestones`
   - **Schedule**: Every 2-3 hours
   - **Method**: GET
   - **Timeout**: 30 seconds
3. Enable email notifications for failures (optional)

**Other Services:**
- **UptimeRobot**: Set up as HTTP monitor with 2-hour interval
- **EasyCron**: Free tier allows frequent checks
- **Zapier/Make**: Schedule HTTP requests

### Add Custom Milestones
Edit `lib/milestones.ts`:
```typescript
const milestones = [
  1000, 2000, // Add your custom values
  // ...
];
```

## 🚨 Troubleshooting

### No Checks Happening (Hobby Plan)
**Problem**: Milestones not being checked frequently

**Solutions**:
1. ✅ **Verify client-side polling**: Check browser console (dev mode) for "Milestone check completed"
2. ✅ **Check GitHub Actions**: Visit repo → Actions tab → See if workflow is running
3. ✅ **Enable external cron**: Set up cron-job.org for guaranteed checks
4. ✅ **Test manually**: Visit `/api/check-milestones` or use admin dashboard

### No Notifications Sent
1. Check subscriber count: `/api/telegram-bot/subscribers?token=ADMIN_TOKEN`
2. Verify platform APIs returning data
3. Check Vercel cron logs in dashboard
4. Manually trigger: `GET /api/check-milestones`

### Duplicate Notifications
- Redis key should prevent this
- Check if key is being set correctly
- Verify count isn't fluctuating around milestone

### Stats Not Updating
**Problem**: Platform counts seem outdated

**Solutions**:
1. Stats are cached for 5 minutes - wait and refresh
2. Check if API routes are working: `/api/youtube`, `/api/telegram`, `/api/instagram`
3. Verify API keys in Vercel environment variables
4. Check Vercel function logs for errors

### Client-Side Checks Too Frequent
**Problem**: Milestone checks happening too often (dev mode)

**Solutions**:
1. Clear localStorage in browser: `localStorage.removeItem('lastMilestoneCheck')`
2. Increase throttle time in `MilestoneChecker.tsx`
3. Production mode has proper throttling (2 hours)

### Cron Not Running
- Requires Vercel Pro plan for cron jobs
- Alternative: Use external cron service (cron-job.org) to call endpoint
- Or use GitHub Actions scheduled workflow

## 📈 Monitoring

View cron execution logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs"
4. Filter by `/api/check-milestones`

## 🎨 Customization

### Change Message Style
Edit `lib/milestones.ts` → `generateMilestoneMessage()`

### Different Thresholds Per Platform
Modify detection logic in `detectMilestone()` to accept platform parameter

### Add Email Notifications
Extend `/api/check-milestones` to send emails alongside Telegram

## ⚡ Quick Actions

**Check now:** Visit `https://fesistats.vercel.app/api/check-milestones`

**Reset milestone:** Delete Redis key `milestone:last:<platform>`

**View status:** Check response from endpoint
