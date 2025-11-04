# Telegram Bot Setup Guide

This guide will help you set up a Telegram bot for sending milestone notifications to subscribers.

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the instructions:
   - Choose a name for your bot (e.g., "ItzFesi Stats Bot")
   - Choose a username (must end in 'bot', e.g., "ItzFesiStatsBot")
4. BotFather will give you a **token** - save this!

Example token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

## Step 2: Configure Environment Variables

Add your bot token to `.env.local`:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

## Step 3: Set Up Webhook (Production Only)

Once deployed to production (Vercel, etc.), set up the webhook:

1. Replace `YOUR_DOMAIN` with your actual domain
2. Run this command (or use Postman/curl):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_DOMAIN/api/telegram-bot/webhook"}'
```

Example:
```bash
curl -X POST "https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://fesistats.vercel.app/api/telegram-bot/webhook"}'
```

## Step 4: Test Your Bot

1. Search for your bot on Telegram (use the username you created)
2. Send `/start` to subscribe
3. You should receive a welcome message!

## Available Commands

Users can interact with your bot using these commands:

- `/start` - Subscribe to milestone notifications
- `/stop` - Unsubscribe from notifications
- `/status` - Check subscription status

## How Users Subscribe

### Option 1: Direct Link (Recommended)
Users click the "Connect via Telegram" button on your website, which opens:
```
https://t.me/YourBotUsername?start=subscribe
```

### Option 2: Manual
1. Search for your bot on Telegram
2. Send `/start`

## Sending Notifications

To send a notification to all subscribers, make a POST request to:

```
POST /api/telegram-bot/notify
Content-Type: application/json

{
  "platform": "YouTube",
  "milestone": "1,000 Subscribers",
  "message": "ItzFesi just hit 1,000 subscribers! 🎉"
}
```

Example using curl:
```bash
curl -X POST "https://your-domain.com/api/telegram-bot/notify" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "YouTube",
    "milestone": "1,000 Subscribers",
    "message": "ItzFesi just hit 1,000 subscribers! 🎉"
  }'
```

## Data Storage

Subscriber data is stored in `data/telegram-subscribers.json`

**For Production:** Consider migrating to a database (PostgreSQL, MongoDB, etc.) for better reliability and scalability.

## Troubleshooting

### Bot not responding?
1. Check if webhook is set correctly:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

2. Check logs in Vercel/your hosting platform

### Remove webhook (for local testing):
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

## Security Notes

- ✅ Never commit your bot token to Git
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use environment variables in production
- ✅ Validate webhook requests in production (check secret token)

## Local Development

For local development, you'll need to use **polling** instead of webhooks, or use a tunneling service like ngrok:

```bash
ngrok http 3000
# Then set webhook to: https://your-ngrok-url.ngrok.io/api/telegram-bot/webhook
```

## Need Help?

- Telegram Bot API Docs: https://core.telegram.org/bots/api
- BotFather Commands: https://core.telegram.org/bots#6-botfather
