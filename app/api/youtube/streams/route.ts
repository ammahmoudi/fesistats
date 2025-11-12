import { NextResponse } from 'next/server';
import { fetchYouTubeStreams } from '@/lib/fetchers/youtube-streams';
import { getStreamsInRange, getRecentStreams } from '@/lib/streamStorage';

/**
 * GET /api/youtube/streams
 * Fetches YouTube stream data
 * Query params:
 *  - range: 'day' | 'week' | 'month' (default: 'week')
 *  - refresh: 'true' to force fetch fresh data from API (bypasses 1-hour cache)
 * 
 * OPTIMIZED: Uses 1-hour cache to minimize YouTube API calls
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'week') as 'day' | 'week' | 'month';
    const refresh = searchParams.get('refresh') === 'true';

    // Fetch fresh data from YouTube API only if:
    // 1. Explicitly requested via refresh=true
    // 2. Cache is stale (handled inside fetchYouTubeStreams)
    if (refresh) {
      console.log('🔄 Force fetching fresh stream data from YouTube API...');
      await fetchYouTubeStreams(true);
    } else {
      // Try to fetch, but will skip if cache is fresh
      await fetchYouTubeStreams(false);
    }

    // Calculate time range
    const now = Date.now();
    const ranges = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - ranges[range];

    // Get streams from storage
    const streams = await getStreamsInRange(startTime, now);

    return NextResponse.json({
      success: true,
      streams,
      count: streams.length,
      range,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch streams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
