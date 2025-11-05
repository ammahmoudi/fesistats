# Telegram Setup Guide

Complete guide for setting up both Telegram stats display and bot notifications for FesiStats.

## 📊 Part 1: Display Live Stats (Simple)

For showing real-time Telegram channel member counts on the homepage.

### Prerequisites
- Public Telegram channel with username (e.g., @ItzFesi)

### Setup

**1. Configure Environment Variable**

Add to `.env.local`:
```env
TELEGRAM_CHANNEL_USERNAME=ItzFesi
```

**2. Restart Server**
```bash
npm run dev
```

**3. Verify**
- Telegram stats card shows "LIVE" badge
- Displays real member count
- Auto-refreshes every 5 minutes

### How It Works
- Fetches data from public Telegram page (`t.me/{username}`)
- Extracts member count from HTML
- No authentication required
- 5-minute server-side caching

---

## 🤖 Part 2: Bot Notifications (Advanced)

For sending milestone notifications to subscribers via Telegram bot.

### Step 1: Create Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start chat** and send `/newbot`
3. **Follow instructions**:
   - Name: "ItzFesi Stats Bot"
   - Username: "ItzFesiStatsBot" (must end in 'bot')
4. **Save the token** BotFather gives you

Example token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### Step 2: Configure Bot Token

Add to `.env.local`:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Step 3: Set Up Redis Storage

Bot subscribers are stored in Upstash Redis (not local files).

**Vercel Auto-Injection:**
If you've added Upstash Redis integration in Vercel, these are auto-injected:
```env
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your_redis_token
```

**Manual Setup:**
Or set them manually in `.env.local` for local development.

### Step 4: Configure Webhook (Production Only)

**Automatic (Recommended):**
After deploying to Vercel, simply visit:
```
https://fesistats.vercel.app/api/setup-webhook
```

This auto-configures the webhook for your domain.

**Manual (Alternative):**
```bash
npm run setup-webhook
```

**GitHub Actions (Automatic):**
The workflow `.github/workflows/setup-webhook.yml` automatically sets webhook after Vercel deployments.

### Step 5: Test Your Bot

1. Search for your bot on Telegram
2. Send `/start` to subscribe
3. You should receive a welcome message!

## 🎮 Bot Commands

Users can interact with your bot:

- `/start` - Subscribe to milestone notifications
- `/stop` - Unsubscribe from notifications  
- `/status` - Check subscription status

## 🔐 Admin Setup

For sending broadcasts and managing notifications.

### 1. Set Admin Token

Add to Vercel environment variables (or `.env.local`):
```env
ADMIN_BROADCAST_TOKEN=your_secure_admin_token
```

Use a strong random string (e.g., generate with: `openssl rand -hex 32`)

### 2. Access Admin Dashboard

1. Visit `https://fesistats.vercel.app/admin`
2. Enter your `ADMIN_BROADCAST_TOKEN`
3. Click "Login"
4. Access dashboard at `/admin/dashboard`

### 3. Admin Features

**Dashboard** (`/admin/dashboard`):
- View subscriber count
- Send broadcast notifications
- Platform selection
- Delivery reports

**Milestones** (`/admin/milestones`):
- View current platform stats
- Manual milestone checks
- Notification history

## 📡 Data Storage

### Subscribers
Stored in Redis Set: `telegram:subscribers`
- Contains chat IDs of subscribed users
- Persistent across deployments
- Efficient operations (SADD, SREM, SMEMBERS)

### Milestones
Stored in Redis keys: `milestone:last:{platform}`
- Tracks last notified milestone per platform
- Prevents duplicate notifications
- Example: `milestone:last:youtube = 10000`

## 🔒 Security

### Production Environment Variables
Set in Vercel dashboard under "Settings" > "Environment Variables":

```env
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_BROADCAST_TOKEN=your_admin_token
TELEGRAM_WEBHOOK_SECRET=optional_webhook_secret
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token
```

### Security Best Practices
- ✅ Never commit tokens to Git
- ✅ Use strong admin tokens (32+ chars)
- ✅ Enable webhook secret for validation
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Rotate tokens periodically

## 🧪 Testing

### Test Bot Locally

1. **Install ngrok**:
```bash
ngrok http 3000
```

2. **Set webhook to ngrok URL**:
```bash
npm run setup-webhook
# Update DOMAIN env var to your ngrok URL
```

3. **Test commands**:
- Send `/start` to your bot
- Check if you're subscribed
- Send test broadcast from admin

### Test Webhook

**Check webhook status**:
```bash
# PowerShell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/getWebhookInfo"

# Bash/Linux
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

**Expected response**:
```json
{
  "ok": true,
  "result": {
    "url": "https://fesistats.vercel.app/api/telegram-bot/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 🚨 Troubleshooting

### Bot Not Responding

**Problem**: Bot doesn't reply to commands

**Solutions**:
1. Verify webhook is set: `/api/setup-webhook`
2. Check `TELEGRAM_BOT_TOKEN` in Vercel env vars
3. View logs in Vercel dashboard
4. Test with `getWebhookInfo` API call

### Subscribers Not Saving

**Problem**: `/start` doesn't save subscription

**Solutions**:
1. Verify Redis credentials (`KV_REST_API_URL` and `KV_REST_API_TOKEN`)
2. Check Vercel logs for errors
3. Test Redis connection in admin dashboard
4. Verify Upstash Redis is active

### Webhook Issues

**Remove webhook** (for local testing with polling):
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

### Stats Not Updating

**Problem**: Channel member count not showing

**Solutions**:
1. Verify `TELEGRAM_CHANNEL_USERNAME` is correct (without @)
2. Ensure channel is public
3. Test: `https://t.me/ItzFesi` should be accessible
4. Check browser console for errors

## 📚 API Endpoints

### Public Endpoints
- `GET /api/telegram` - Get channel stats (live data)
- `POST /api/telegram-bot/webhook` - Bot webhook handler
- `GET /api/telegram-bot/info` - Get bot username

### Protected Endpoints (Admin Only)
- `POST /api/telegram-bot/notify` - Send broadcast
  - Header: `x-admin-token: YOUR_ADMIN_BROADCAST_TOKEN`
- `GET /api/telegram-bot/subscribers` - View subscriber count
  - Query: `?token=YOUR_ADMIN_BROADCAST_TOKEN`

## 🎯 Quick Reference

### Environment Variables Summary
```env
# Stats Display (Public Channel)
TELEGRAM_CHANNEL_USERNAME=ItzFesi

# Bot Notifications
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Redis Storage (Upstash)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your_redis_token

# Admin Access
ADMIN_BROADCAST_TOKEN=your_secure_admin_token

# Optional Security
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
```

### Common Commands
```bash
# Setup webhook
npm run setup-webhook

# Check webhook status
Invoke-RestMethod -Uri "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/getWebhookInfo"

# Local development
npm run dev

# Deploy to Vercel
git push
```

## 🔗 Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Admin Access Guide](./ADMIN_ACCESS.md)
- [Webhook Setup Guide](./WEBHOOK_SETUP.md)
- [Milestone Notifications](./MILESTONE_NOTIFICATIONS.md)

## ✅ Checklist

### Stats Display Setup
- [ ] Add `TELEGRAM_CHANNEL_USERNAME` to `.env.local`
- [ ] Restart development server
- [ ] Verify "LIVE" badge appears
- [ ] Test auto-refresh

### Bot Notifications Setup
- [ ] Create bot with @BotFather
- [ ] Add `TELEGRAM_BOT_TOKEN` to `.env.local`
- [ ] Configure Upstash Redis
- [ ] Set webhook (production)
- [ ] Test `/start` command
- [ ] Set `ADMIN_BROADCAST_TOKEN`
- [ ] Login to admin dashboard
- [ ] Send test broadcast

### Production Deployment
- [ ] Set all env vars in Vercel
- [ ] Deploy to Vercel
- [ ] Visit `/api/setup-webhook`
- [ ] Test bot commands
- [ ] Verify admin access
- [ ] Test milestone notifications
