import { NextResponse } from 'next/server';
import { getAllLastMilestones, getMilestoneHistory } from '@/lib/milestoneStorage';
import { getStatsHistory, getStatsTimeSeries } from '@/lib/statsStorage';

/**
 * GET /api/admin/history
 * Returns milestone and stats history (requires admin token)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type'); // 'milestones' or 'stats'
    const platform = searchParams.get('platform');
    const timeRange = (searchParams.get('range') as 'day' | 'week' | 'month') || 'day';

    // Verify admin token
    const adminToken = process.env.ADMIN_BROADCAST_TOKEN;
    if (!adminToken || token !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (type === 'milestones') {
      console.log(`📋 Fetching milestone history for all platforms...`);
      const allMilestones = await getAllLastMilestones();
      console.log(`📊 All milestones:`, allMilestones);
      
      const history: Record<string, any[]> = {};

      for (const [plat, value] of Object.entries(allMilestones)) {
        console.log(`  🔍 Fetching history for ${plat}...`);
        const platformHistory = await getMilestoneHistory(plat, 50);
        console.log(`  ✅ Got ${platformHistory.length} records for ${plat}`);
        history[plat] = platformHistory;
      }

      console.log(`✅ Returning milestone history with ${Object.keys(history).length} platforms`);
      return NextResponse.json({
        success: true,
        type: 'milestones',
        lastNotified: allMilestones,
        history,
        timestamp: new Date().toISOString(),
      });
    }

    if (type === 'stats' && platform) {
      const history = await getStatsHistory(platform);
      const timeSeries = await getStatsTimeSeries(platform, timeRange);

      return NextResponse.json({
        success: true,
        type: 'stats',
        platform,
        timeRange,
        history,
        timeSeries,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        error: 'Invalid request',
        message: 'Specify type (milestones/stats) and platform if needed',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting admin history:', error);
    return NextResponse.json(
      {
        error: 'Failed to get history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
