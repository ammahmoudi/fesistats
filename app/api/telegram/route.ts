import { NextResponse } from 'next/server';

// Enable caching with 5-minute revalidation (same as YouTube)
export const revalidate = 300; // Cache for 5 minutes (300 seconds)

interface TelegramChatResponse {
  ok: boolean;
  result?: {
    id: number;
    title: string;
    username: string;
    type: string;
    members_count?: number;
    description?: string;
  };
  description?: string;
}

async function getChannelMembersFromPublicPage(username: string, forceRefresh: boolean = false): Promise<number | null> {
  try {
    // Fetch the public channel page
    const cleanUsername = username.replace('@', '');
    const url = `https://t.me/${cleanUsername}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal,
      // If forceRefresh, bypass cache; otherwise use 5-minute cache
      cache: forceRefresh ? 'no-store' : 'default',
      next: forceRefresh ? { revalidate: 0 } : { revalidate: 300 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to fetch Telegram page:', response.status);
      return null;
    }

    const html = await response.text();
    
    // Try to extract member count from the page
    // Look for patterns like "subscribers" or member count in the HTML
    const subscriberMatch = html.match(/(\d+(?:,\d+)*)\s+(?:subscribers|members)/i);
    if (subscriberMatch) {
      const count = subscriberMatch[1].replace(/,/g, '');
      return parseInt(count, 10);
    }

    // Alternative pattern: Look in meta tags
    const metaMatch = html.match(/"subscriberCount":"(\d+)"/i) || 
                      html.match(/data-before="(\d+(?:,\d+)*)\s+(?:subscribers|members)"/i);
    if (metaMatch) {
      const count = metaMatch[1].replace(/,/g, '');
      return parseInt(count, 10);
    }

    console.warn('Could not extract member count from Telegram page');
    return null;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Telegram API timeout - request took too long');
      } else {
        console.error('Error fetching Telegram public page:', error.message);
      }
    }
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME;

    if (!channelUsername) {
      return NextResponse.json(
        { 
          error: 'Telegram channel not configured',
          message: 'Please set TELEGRAM_CHANNEL_USERNAME in your .env.local file'
        },
        { status: 500 }
      );
    }

    console.log(`Fetching Telegram data...${forceRefresh ? ' (forced refresh)' : ''}`);

    // For public channels, scrape the public page
    const membersCount = await getChannelMembersFromPublicPage(channelUsername, forceRefresh);

    if (membersCount === null) {
      return NextResponse.json(
        { 
          error: 'Could not fetch member count',
          message: 'Unable to extract member count from public channel page'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      membersCount: membersCount,
      username: channelUsername.replace('@', ''),
      type: 'channel',
      platform: 'Telegram',
      lastUpdated: new Date().toISOString(),
      source: 'public_page'
    });

  } catch (error) {
    console.error('Error fetching Telegram stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
