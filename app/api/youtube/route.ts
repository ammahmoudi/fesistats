import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching for real-time data

interface YouTubeChannelResponse {
  items: Array<{
    statistics: {
      subscriberCount: string;
      viewCount: string;
      videoCount: string;
    };
  }>;
}

export async function GET() {
  try {
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
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

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

    return NextResponse.json({
      subscriberCount: parseInt(statistics.subscriberCount),
      viewCount: parseInt(statistics.viewCount),
      videoCount: parseInt(statistics.videoCount),
      platform: 'YouTube',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching YouTube stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
