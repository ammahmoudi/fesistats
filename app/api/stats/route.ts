import { NextResponse } from 'next/server';
import { getAllCurrentStats, getStatsTimeSeries } from '@/lib/statsStorage';

/**
 * GET /api/stats
 * Returns all current cached stats for all platforms
 * Much faster than fetching individual API endpoints
 * Cache: 2 minutes
 */
export const revalidate = 120; // Cache for 2 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const timeRange = (searchParams.get('range') as 'day' | 'week' | 'month') || 'day';

    // Get all current stats from cache
    const stats = await getAllCurrentStats();

    if (includeHistory) {
      // Include time series data for charts
      const enrichedStats = await Promise.all(
        stats.map(async (stat) => {
          const timeSeries = await getStatsTimeSeries(stat.platform, timeRange);
          return {
            ...stat,
            history: timeSeries,
          };
        })
      );

      return NextResponse.json({
        success: true,
        stats: enrichedStats,
        timeRange,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
