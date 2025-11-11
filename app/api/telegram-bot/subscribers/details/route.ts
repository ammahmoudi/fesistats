import { NextResponse } from 'next/server';
import { getSubscribers, getUsersInfo, TelegramUserInfo } from '@/lib/telegramSubscribers';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_bot?: boolean;
}

interface TelegramChatResponse {
  ok: boolean;
  result?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo?: {
      small_file_id: string;
      small_file_unique_id: string;
      big_file_id: string;
      big_file_unique_id: string;
    };
    type: string;
    is_bot?: boolean;
  };
  description?: string;
}

interface TelegramFileResponse {
  ok: boolean;
  result?: {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
  };
  description?: string;
}

async function getTelegramUserInfo(chatId: number, botToken: string): Promise<TelegramUser | null> {
  try {
    // Get chat information using getChat with timeout
    const chatUrl = `https://api.telegram.org/bot${botToken}/getChat`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const chatResponse = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!chatResponse.ok) {
      console.error(`Failed to get chat info for ${chatId}: ${chatResponse.status}`);
      return null;
    }

    const chatData: TelegramChatResponse = await chatResponse.json();
    
    // Log the full response for debugging
    console.log(`Chat data for ${chatId}:`, JSON.stringify(chatData));
    
    if (!chatData.ok || !chatData.result) {
      console.error(`Telegram API error for chat ${chatId}:`, chatData.description);
      return null;
    }

    const chat = chatData.result;
    let photoUrl: string | undefined;

    // Try to get profile photos using getUserProfilePhotos (skip if it times out)
    try {
      const photosController = new AbortController();
      const photosTimeoutId = setTimeout(() => photosController.abort(), 3000); // 3 second timeout
      
      const photosUrl = `https://api.telegram.org/bot${botToken}/getUserProfilePhotos`;
      const photosResponse = await fetch(photosUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: chatId,
          limit: 1 
        }),
        signal: photosController.signal
      });

      clearTimeout(photosTimeoutId);

      if (photosResponse.ok) {
        const photosData: any = await photosResponse.json();
        
        if (photosData.ok && photosData.result?.photos?.length > 0) {
          // Get the first photo (most recent)
          const photo = photosData.result.photos[0];
          // Get the largest size (last element in sizes array)
          const largestPhoto = photo[photo.length - 1];
          
          if (largestPhoto?.file_id) {
            // Get file path with timeout
            const fileController = new AbortController();
            const fileTimeoutId = setTimeout(() => fileController.abort(), 3000); // 3 second timeout
            
            const fileUrl = `https://api.telegram.org/bot${botToken}/getFile`;
            const fileResponse = await fetch(fileUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ file_id: largestPhoto.file_id }),
              signal: fileController.signal
            });

            clearTimeout(fileTimeoutId);

            if (fileResponse.ok) {
              const fileData: TelegramFileResponse = await fileResponse.json();
              if (fileData.ok && fileData.result?.file_path) {
                photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
              }
            }
          }
        }
      }
    } catch (photoError) {
      // Silently skip photo on timeout - not critical
      console.log(`Skipped photo for ${chatId} (timeout or error)`);
    }

    return {
      id: chat.id,
      first_name: chat.first_name,
      last_name: chat.last_name,
      username: chat.username,
      photo_url: photoUrl,
      is_bot: chat.is_bot || false
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`Timeout fetching user info for ${chatId}`);
    } else {
      console.error(`Error fetching user info for ${chatId}:`, error);
    }
    return null;
  }
}

export async function GET(request: Request) {
  // Verify admin token
  const adminToken = process.env.ADMIN_BROADCAST_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'Admin token not set' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const providedToken = searchParams.get('token');
  
  if (providedToken !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });
  }

  try {
    // Get all subscriber IDs
    const subscriberIds = await getSubscribers();
    
    if (subscriberIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        count: 0, 
        subscribers: [] 
      });
    }

    // First, try to get cached user info from Redis
    const cachedUserInfo = await getUsersInfo(subscriberIds);
    console.log(`Found ${cachedUserInfo.size} cached user info entries out of ${subscriberIds.length} total`);

    // Separate cached and uncached users
    const subscribers: TelegramUser[] = [];
    const uncachedIds: number[] = [];
    
    for (const chatId of subscriberIds) {
      const cached = cachedUserInfo.get(chatId);
      
      if (cached) {
        // Use cached info
        subscribers.push({
          id: cached.id,
          first_name: cached.first_name,
          last_name: cached.last_name,
          username: cached.username,
          photo_url: cached.photo_url,
          is_bot: cached.is_bot
        });
      } else {
        uncachedIds.push(chatId);
      }
    }

    // For uncached users, try to fetch from Telegram API in parallel with rate limiting
    if (uncachedIds.length > 0) {
      console.log(`Fetching ${uncachedIds.length} users from Telegram API...`);
      
      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize);
        
        // Fetch batch in parallel
        const batchPromises = batch.map(async (chatId) => {
          try {
            const userInfo = await getTelegramUserInfo(chatId, botToken);
            return userInfo || {
              id: chatId,
              first_name: 'User',
              last_name: `#${chatId}`,
              username: undefined,
              photo_url: undefined,
              is_bot: false
            };
          } catch (error) {
            console.error(`Failed to fetch user ${chatId}:`, error);
            return {
              id: chatId,
              first_name: 'User',
              last_name: `#${chatId}`,
              username: undefined,
              photo_url: undefined,
              is_bot: false
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        subscribers.push(...batchResults);
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < uncachedIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers: subscribers,
      cached: cachedUserInfo.size,
      fetched: uncachedIds.length
    });
  } catch (error) {
    console.error('Error fetching subscriber details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscriber details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
