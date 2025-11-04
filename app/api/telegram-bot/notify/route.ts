import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data', 'telegram-subscribers.json');

// Read subscribers from file
function getSubscribers(): number[] {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading subscribers:', error);
  }
  return [];
}

// Send message to all subscribers
async function broadcastMessage(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const subscribers = getSubscribers();
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const results = await Promise.allSettled(
    subscribers.map(chatId =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return { total: subscribers.length, successful, failed };
}

export async function POST(request: Request) {
  try {
    const { message, platform, milestone } = await request.json();

    if (!message || !platform || !milestone) {
      return NextResponse.json(
        { error: 'Missing required fields: message, platform, milestone' },
        { status: 400 }
      );
    }

    // Format the notification message
    const formattedMessage = 
      `🎉 <b>New Milestone Reached!</b>\n\n` +
      `📱 Platform: <b>${platform}</b>\n` +
      `🎯 Milestone: <b>${milestone}</b>\n\n` +
      `${message}\n\n` +
      `Check it out: https://fesistats.vercel.app`;

    const result = await broadcastMessage(formattedMessage);

    return NextResponse.json({
      success: true,
      ...result,
      message: 'Notifications sent successfully'
    });

  } catch (error) {
    console.error('Notification broadcast error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send notifications',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
