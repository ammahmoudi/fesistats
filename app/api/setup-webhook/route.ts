import { NextResponse } from 'next/server';

/**
 * API endpoint to set up Telegram webhook
 * 
 * This can be called:
 * 1. Manually via browser/curl after deployment
 * 2. By GitHub Actions on successful deploy
 * 3. By Vercel Deploy Hook
 * 
 * GET /api/setup-webhook
 */
export async function GET(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    if (!botToken) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Get the host from the request to auto-detect domain
    const url = new URL(request.url);
    const domain = `${url.protocol}//${url.host}`;
    
    // Build webhook URL
    let webhookUrl = `${domain}/api/telegram-bot/webhook`;
    if (webhookSecret) {
      webhookUrl += `?secret=${encodeURIComponent(webhookSecret)}`;
    }

    console.log(`Setting webhook to: ${webhookUrl}`);

    // Set webhook
    const setResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      }
    );

    const setResult = await setResponse.json();
    
    if (!setResult.ok) {
      console.error('Failed to set webhook:', setResult);
      return NextResponse.json(
        { error: 'Failed to set webhook', details: setResult },
        { status: 500 }
      );
    }

    // Get webhook info to verify
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    const infoResult = await infoResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Webhook configured successfully',
      webhook: {
        url: webhookUrl.replace(/secret=[^&]+/, 'secret=***'),
        status: infoResult.ok ? infoResult.result : null
      }
    });

  } catch (error) {
    console.error('Setup webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
