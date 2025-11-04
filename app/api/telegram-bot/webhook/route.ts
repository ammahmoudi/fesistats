import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File to store subscribers (in production, use a database)
const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data', 'telegram-subscribers.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read subscribers from file
function getSubscribers(): Set<number> {
  try {
    ensureDataDirectory();
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      return new Set(JSON.parse(data));
    }
  } catch (error) {
    console.error('Error reading subscribers:', error);
  }
  return new Set();
}

// Save subscribers to file
function saveSubscribers(subscribers: Set<number>) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([...subscribers], null, 2));
  } catch (error) {
    console.error('Error saving subscribers:', error);
  }
}

// Send message via Telegram API
async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle incoming messages
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text || '';
      const firstName = body.message.from.first_name || 'there';

      console.log(`Received message from ${chatId}: ${text}`);

      // Handle /start command
      if (text.startsWith('/start')) {
        const subscribers = getSubscribers();
        
        if (!subscribers.has(chatId)) {
          subscribers.add(chatId);
          saveSubscribers(subscribers);
          
          await sendTelegramMessage(
            chatId,
            `🎉 <b>Welcome, ${firstName}!</b>\n\n` +
            `You've successfully subscribed to <b>ItzFesi Stats</b> notifications!\n\n` +
            `You'll receive updates when:\n` +
            `📊 New milestones are reached\n` +
            `🎯 Subscriber/follower goals are achieved\n` +
            `⭐ Special announcements are made\n\n` +
            `Send /stop to unsubscribe anytime.`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `👋 Welcome back, ${firstName}!\n\n` +
            `You're already subscribed to notifications.\n\n` +
            `Send /stop to unsubscribe.`
          );
        }
      }
      // Handle /stop command
      else if (text.startsWith('/stop')) {
        const subscribers = getSubscribers();
        
        if (subscribers.has(chatId)) {
          subscribers.delete(chatId);
          saveSubscribers(subscribers);
          
          await sendTelegramMessage(
            chatId,
            `👋 You've been unsubscribed from notifications.\n\n` +
            `We're sad to see you go! Send /start anytime to resubscribe.`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `You're not currently subscribed. Send /start to subscribe!`
          );
        }
      }
      // Handle /status command
      else if (text.startsWith('/status')) {
        const subscribers = getSubscribers();
        const isSubscribed = subscribers.has(chatId);
        
        await sendTelegramMessage(
          chatId,
          `📊 <b>Subscription Status</b>\n\n` +
          `Status: ${isSubscribed ? '✅ Subscribed' : '❌ Not subscribed'}\n` +
          `Total subscribers: ${subscribers.size}\n\n` +
          `${isSubscribed ? 'Send /stop to unsubscribe' : 'Send /start to subscribe'}`
        );
      }
      // Handle other messages
      else {
        await sendTelegramMessage(
          chatId,
          `👋 Hi ${firstName}!\n\n` +
          `Available commands:\n` +
          `/start - Subscribe to notifications\n` +
          `/stop - Unsubscribe from notifications\n` +
          `/status - Check subscription status`
        );
      }
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
