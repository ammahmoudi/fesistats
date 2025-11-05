import { NextResponse } from 'next/server';
import { fetchYouTubeStats } from '@/lib/fetchers';
import { saveStats } from '@/lib/statsStorage';

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300; // 5 minutes in seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log(`Fetching YouTube data...${forceRefresh ? ' (forced refresh)' : ''}`);

    // Use unified fetcher
    const stats = await fetchYouTubeStats();

    if (!stats) {
      return NextResponse.json(
        {
          error: 'Failed to fetch YouTube data',
          message: 'Could not retrieve subscriber count from YouTube API'
        },
        { status: 500 }
      );
    }

    // Save to persistent stats storage
    await saveStats(stats.platform, stats.count, stats.extraInfo);

    return NextResponse.json({
      subscriberCount: stats.count,
      viewCount: stats.extraInfo?.views || 0,
      videoCount: stats.extraInfo?.videos || 0,
      platform: 'YouTube',
      lastUpdated: new Date().toISOString()
    });
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
