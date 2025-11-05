import { NextResponse } from 'next/server';
import { getSubscribers } from '@/lib/telegramSubscribers';

async function sendTo(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('Bot token missing');
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}

async function sendPhoto(chatId: number, photoUrl: string, caption: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('Bot token missing');
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' })
  });
}

async function broadcastMessage(message: string) {
  const ids = await getSubscribers();
  if (!ids.length) {
    return { total: 0, successful: 0, failed: 0, failures: [] as any[] };
  }
  const results = await Promise.allSettled(ids.map(id => sendTo(id, message)));
  const failures: Array<{ id: number; error: string }> = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') failures.push({ id: ids[i], error: r.reason instanceof Error ? r.reason.message : String(r.reason) });
  });
  return { total: ids.length, successful: ids.length - failures.length, failed: failures.length, failures };
}

async function broadcastPhoto(photoUrl: string, caption: string) {
  const ids = await getSubscribers();
  if (!ids.length) {
    return { total: 0, successful: 0, failed: 0, failures: [] as any[] };
  }
  const results = await Promise.allSettled(ids.map(id => sendPhoto(id, photoUrl, caption)));
  const failures: Array<{ id: number; error: string }> = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') failures.push({ id: ids[i], error: r.reason instanceof Error ? r.reason.message : String(r.reason) });
  });
  return { total: ids.length, successful: ids.length - failures.length, failed: failures.length, failures };
}

export async function POST(request: Request) {
  try {
    const adminToken = process.env.ADMIN_BROADCAST_TOKEN;
    if (!adminToken) {
      return NextResponse.json({ error: 'ADMIN_BROADCAST_TOKEN not set' }, { status: 500 });
    }
    const provided = request.headers.get('x-admin-token');
    if (provided !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, platform, milestone, template, imageUrl } = await request.json();
    if (!message || !platform) {
      return NextResponse.json({ error: 'Missing required fields: message, platform' }, { status: 400 });
    }

    // Get the base URL for image resolution
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://fesistats.vercel.app';

    let result;

    if (template) {
      // Use template format
      if (!milestone) {
        return NextResponse.json({ error: 'Milestone required when using template' }, { status: 400 });
      }

      const formattedMessage =
        `🎉 <b>New Milestone Reached!</b>\n\n` +
        `📱 Platform: <b>${platform}</b>\n` +
        `🎯 Milestone: <b>${milestone}</b>\n\n` +
        `${message}\n\n` +
        `🔗 Dashboard: ${baseUrl}`;

      result = await broadcastMessage(formattedMessage);
    } else {
      // Custom message mode
      if (imageUrl) {
        // Get absolute URL for image
        const absoluteImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : baseUrl + imageUrl;

        result = await broadcastPhoto(absoluteImageUrl, message);
      } else {
        result = await broadcastMessage(message);
      }
    }

    return NextResponse.json({ success: true, ...result, message: 'Broadcast attempted' });
  } catch (error) {
    console.error('Notification broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send notifications', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
