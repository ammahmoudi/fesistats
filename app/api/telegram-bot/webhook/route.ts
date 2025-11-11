import { NextResponse } from 'next/server';
import { addSubscriber, removeSubscriber, isSubscribed, getSubscriberCount, setUserInfo } from '@/lib/telegramSubscribers';

// Send message via Telegram API
async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}

// Send photo with caption via Telegram API
async function sendTelegramPhoto(chatId: number, photoUrl: string, caption: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' })
  });
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Bot not configured' }, { status: 500 });
    }

    const body = await request.json();
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const text: string = body.message.text || '';
    const firstName = body.message.from?.first_name || 'there';
    const lastName = body.message.from?.last_name;
    const username = body.message.from?.username;
    const isBot = body.message.from?.is_bot || false;
    
    console.log(`Telegram update from ${chatId}: ${text}`);

    // Store user information for later retrieval
    try {
      await setUserInfo({
        id: chatId,
        first_name: firstName,
        last_name: lastName,
        username: username,
        is_bot: isBot
      });
    } catch (error) {
      console.error('Failed to store user info:', error);
      // Continue anyway
    }

    if (text.startsWith('/start')) {
      const already = await isSubscribed(chatId);
      if (!already) {
        await addSubscriber(chatId);
        const total = await getSubscriberCount();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itzfesi.ir';
        const bannerUrl = `${appUrl}/main_banner.webp`;
        const caption =
          `🎉 <b>Welcome, ${firstName}!</b>\n\n` +
          `You've subscribed to <b>ItzFesi Stats</b> notifications.\n` +
          `Subscribers now: <b>${total}</b>\n\n` +
          `You'll get milestone + announcement updates.\n` +
          `Send /stop to unsubscribe.`;
        
        await sendTelegramPhoto(chatId, bannerUrl, caption);
      } else {
        await sendTelegramMessage(chatId,
          `👋 Hi ${firstName}, you're already subscribed.\nSend /stop to unsubscribe.`
        );
      }
    } else if (text.startsWith('/stop')) {
      const already = await isSubscribed(chatId);
      if (already) {
        await removeSubscriber(chatId);
        const total = await getSubscriberCount();
        await sendTelegramMessage(chatId,
          `👋 You've been unsubscribed. Current subscribers: <b>${total}</b>\nSend /start to rejoin anytime.`
        );
      } else {
        await sendTelegramMessage(chatId, `You are not subscribed. Send /start to subscribe.`);
      }
    } else if (text.startsWith('/status')) {
      const subscribed = await isSubscribed(chatId);
      const total = await getSubscriberCount();
      await sendTelegramMessage(chatId,
        `📊 <b>Status</b>\nSubscription: ${subscribed ? '✅ Subscribed' : '❌ Not subscribed'}\nTotal subscribers: ${total}\n\n${subscribed ? 'Send /stop to unsubscribe' : 'Send /start to subscribe'}`
      );
    } else {
      await sendTelegramMessage(chatId,
        `👋 Hi ${firstName}!\nCommands:\n/start - Subscribe\n/stop - Unsubscribe\n/status - Subscription status`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
