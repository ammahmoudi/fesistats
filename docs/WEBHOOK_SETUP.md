# Automatic Telegram Webhook Setup

This project includes automatic webhook configuration after deployments.

## How It Works

### Option 1: API Endpoint (Recommended)
After any deployment, simply visit:
```
https://itzfesi.ir/api/setup-webhook
```

This will:
- Auto-detect the domain
- Configure the Telegram webhook
- Return status information

### Option 2: GitHub Actions (Automatic)
The `.github/workflows/setup-webhook.yml` workflow automatically calls the setup endpoint after successful Vercel deployments.

**Setup:**
1. GitHub Actions is already configured
2. It triggers on Vercel deployment success
3. Automatically calls `/api/setup-webhook`

### Option 3: Manual Script (Local)
For local development or manual setup:
```bash
npm run setup-webhook
```

## When Webhook Gets Set

✅ **Automatically:**
- After every successful Vercel production deployment (via GitHub Actions)

✅ **Manually when needed:**
- First deployment
- Domain changes
- Webhook secret changes

## Verify Webhook Status

Check if webhook is configured:
```bash
# PowerShell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/getWebhookInfo"

# Or visit in browser
https://itzfesi.ir/api/setup-webhook
```

## Troubleshooting

If webhook isn't working:
1. Visit `https://itzfesi.ir/api/setup-webhook`
2. Check the response for errors
3. Verify `TELEGRAM_BOT_TOKEN` is set in Vercel env vars
4. Send `/start` to your bot to test
