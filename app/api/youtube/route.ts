import { NextResponse } from 'next/server';
import { saveStats } from '@/lib/statsStorage';

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300; // 5 minutes in seconds

interface YouTubeChannelResponse {
  items: Array<{
    statistics: {
      subscriberCount: string;
      viewCount: string;
      videoCount: string;
    };
  }>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
      return NextResponse.json(
        { 
          error: 'YouTube API credentials not configured',
          message: 'Please set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in your .env.local file'
        },
        { status: 500 }
      );
    }

    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    console.log(`Fetching YouTube data...${forceRefresh ? ' (forced refresh)' : ''}`);
    
    const response = await fetch(url, {
      signal: controller.signal,
      // If forceRefresh, bypass cache; otherwise use 5-minute cache
      cache: forceRefresh ? 'no-store' : 'default',
      next: forceRefresh ? { revalidate: 0 } : { revalidate: 300 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to fetch YouTube data',
          details: errorData
        },
        { status: response.status }
      );
    }

    const data: YouTubeChannelResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    const statistics = data.items[0].statistics;

    const result = {
      subscriberCount: parseInt(statistics.subscriberCount),
      viewCount: parseInt(statistics.viewCount),
      videoCount: parseInt(statistics.videoCount),
      platform: 'YouTube',
      lastUpdated: new Date().toISOString()
    };

    // Save to persistent stats storage
    await saveStats('YouTube', result.subscriberCount, {
      views: result.viewCount,
      videos: result.videoCount
    });

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('YouTube API timeout - request took too long');
        return NextResponse.json(
          { 
            error: 'Request timeout',
            message: 'YouTube API request timed out. Check your internet connection or try again later.'
          },
          { status: 504 }
        );
      }
      console.error('Error fetching YouTube stats:', error.message);
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
