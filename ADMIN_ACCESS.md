# Admin Access Guide

## 🔐 Admin Pages

### 1. **Admin Login**
**URL:** `https://fesistats.vercel.app/admin`

- Enter your `ADMIN_BROADCAST_TOKEN` to login
- Token is stored in browser session (cleared on logout/close)
- Redirects to dashboard on successful login

### 2. **Admin Dashboard**
**URL:** `https://fesistats.vercel.app/admin/dashboard`

- **Protected:** Requires login via `/admin`
- **Features:**
  - View total subscriber count
  - Send broadcast notifications
  - Platform selection (YouTube/Telegram/Instagram)
  - Delivery reports
  - Logout button

### 3. **Public Homepage**
**URL:** `https://fesistats.vercel.app/`

- Public stats dashboard
- Shows live subscriber counts
- "Connect via Telegram" button for users

## 🔑 How to Access Admin

1. Visit: `https://fesistats.vercel.app/admin`
2. Enter your `ADMIN_BROADCAST_TOKEN` (from Vercel env vars)
3. Click "Login"
4. You'll be redirected to the dashboard

## 📊 Admin Dashboard Features

### **Subscriber Stats**
- Real-time subscriber count
- Updates after each broadcast

### **Broadcast Form**
- Select platform (YouTube/Telegram/Instagram)
- Enter milestone (e.g., "10,000 Subscribers")
- Write custom message (max 500 chars)
- Send to all subscribers instantly

### **Delivery Reports**
- Total subscribers reached
- Successful deliveries
- Failed attempts
- Platform summary

## 🛡️ Security

- ✅ Admin token required for API access
- ✅ Session-based authentication (not stored in cookies)
- ✅ Token validated on each API call
- ✅ Auto-logout on browser close
- ✅ No admin features exposed to public

## 🔧 API Endpoints

### Protected Endpoints (Require Admin Token)

1. **POST `/api/telegram-bot/notify`**
   - Header: `x-admin-token: YOUR_ADMIN_BROADCAST_TOKEN`
   - Body: `{ platform, milestone, message }`

2. **GET `/api/telegram-bot/subscribers?token=TOKEN`**
   - Query param: `token=YOUR_ADMIN_BROADCAST_TOKEN`
   - Returns: `{ count: number }`
   - Optional: `&ids=true` to include chat IDs

### Public Endpoints

1. **GET `/api/setup-webhook`**
   - Auto-configures Telegram webhook
   - Returns webhook status

2. **POST `/api/telegram-bot/webhook`**
   - Telegram bot webhook (secured with optional secret)
   - Handles /start, /stop, /status commands

3. **GET `/api/telegram-bot/info`**
   - Returns bot username for connect button

## 🚀 Quick Actions

### Login to Admin
```
Visit: https://fesistats.vercel.app/admin
```

### Send Test Broadcast
1. Login at `/admin`
2. Fill form:
   - Platform: YouTube
   - Milestone: "Test Notification"
   - Message: "Testing broadcast system"
3. Click "Send Broadcast"

### Check Subscriber Count
- Login to dashboard
- Number shows at top of page
- Updates in real-time

### Logout
- Click "Logout" button in top-right
- Session cleared immediately

## 📱 User Flow (For Reference)

1. User visits homepage
2. Clicks "Connect via Telegram"
3. Opens bot, sends `/start`
4. Webhook saves their chat ID to Redis
5. Admin sends broadcast → User receives notification

## 🔐 Environment Variables Needed

```env
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_BROADCAST_TOKEN=your_admin_token
TELEGRAM_WEBHOOK_SECRET=optional_secret
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token
```

## ⚠️ Important Notes

- Admin token is **sensitive** - don't share it
- Session expires when browser closes
- Webhook must be set before subscribers can join
- Broadcasts are instant (no queue yet)
- Failed deliveries happen if users blocked the bot
