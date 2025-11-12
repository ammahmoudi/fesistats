import { NextResponse } from 'next/server';
import { fetchYouTubeStreams } from '@/lib/fetchers/youtube-streams';

/**
 * GET /api/youtube/update-streams
 * Cron job endpoint to fetch and update YouTube stream data
 * Should be called periodically via Vercel Cron
 * 
 * OPTIMIZED: Respects 1-hour cache, won't fetch if recently updated
 * Set refresh=true query param to force update
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Verify cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('🔄 Running stream update cron job...');
    
    // This will respect cache unless forced
    const streams = await fetchYouTubeStreams(forceRefresh);

    return NextResponse.json({
      success: true,
      updated: streams.length,
      streams: streams.map(s => ({
        title: s.title,
        isLive: s.isLive,
        startTime: new Date(s.startTime).toISOString(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in stream update cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update streams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
