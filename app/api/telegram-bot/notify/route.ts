import { NextResponse } from 'next/server';
import { getSubscribers } from '@/lib/telegramSubscribers';

async function sendTo(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('Bot token missing');
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
  
  // Check if the response was successful
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Telegram API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
  }
  
  // Also validate the JSON response from Telegram API
  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Telegram API returned error: ${result.description || 'Unknown error'}`);
  }
  
  return response;
}

async function sendPhoto(chatId: number, photoUrl: string, caption: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('Bot token missing');
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  
  // If it's a data URL (base64), we need to handle it differently
  if (photoUrl.startsWith('data:')) {
    // For base64, Telegram doesn't accept data URLs directly
    // We need to send it as FormData with binary data
    const matches = photoUrl.match(/data:([^;]+);base64,(.+)/);
    if (matches) {
      const [, mimeType, base64Data] = matches;
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create FormData with the binary image
      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      formData.append('photo', new Blob([buffer], { type: mimeType }), 'banner.png');
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Telegram API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
      }
      
      // Also validate the JSON response from Telegram API
      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API returned error: ${result.description || 'Unknown error'}`);
      }
      
      return response;
    }
  }
  
  // For regular URLs, send as JSON
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' })
  });
  
  // Check if the response was successful
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Telegram API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
  }
  
  // Validate the JSON response from Telegram API
  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Telegram API returned error: ${result.description || 'Unknown error'}`);
  }
  
  return response;
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
  
  console.log(`📸 Broadcasting photo to ${ids.length} subscribers. Photo URL: ${photoUrl.substring(0, 50)}...`);
  
  const results = await Promise.allSettled(ids.map(id => sendPhoto(id, photoUrl, caption)));
  const failures: Array<{ id: number; error: string }> = [];
  
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const errorMsg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`❌ Failed to send photo to ${ids[i]}: ${errorMsg}`);
      failures.push({ id: ids[i], error: errorMsg });
    } else {
      console.log(`✅ Photo sent to ${ids[i]}`);
    }
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

    console.log(`📨 Broadcast request received - Platform: ${platform}, Template: ${template}, Has Image: ${!!imageUrl}`);

    // Get the base URL for image resolution - prioritize custom domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itzfesi.ir';

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

      console.log(`📝 Sending template message for milestone: ${milestone}`);
      result = await broadcastMessage(formattedMessage);
    } else {
      // Custom message mode
      if (imageUrl) {
        // Get absolute URL for image
        const absoluteImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : baseUrl + imageUrl;

        console.log(`📸 Sending custom photo message`);
        result = await broadcastPhoto(absoluteImageUrl, message);
      } else {
        console.log(`💬 Sending custom text message`);
        result = await broadcastMessage(message);
      }
    }

    console.log(`✅ Broadcast completed - Success: ${result.successful}/${result.total}, Failed: ${result.failed}`);
    
    if (result.failures && result.failures.length > 0) {
      console.error(`⚠️  Failed deliveries:`, result.failures.slice(0, 5)); // Log first 5 failures
    }

    return NextResponse.json({ success: true, ...result, message: 'Broadcast attempted' });
  } catch (error) {
    console.error('Notification broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send notifications', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
