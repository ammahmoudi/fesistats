import { NextResponse } from 'next/server';
import { fetchTelegramStats } from '@/lib/fetchers';
import { saveStats } from '@/lib/statsStorage';

// Enable caching with 5-minute revalidation
export const revalidate = 300; // Cache for 5 minutes (300 seconds)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log(`Fetching Telegram data...${forceRefresh ? ' (forced refresh)' : ''}`);

    // Use unified fetcher
    const stats = await fetchTelegramStats();

    if (!stats) {
      return NextResponse.json(
        {
          error: 'Could not fetch member count',
          message: 'Unable to extract member count from public channel page'
        },
        { status: 500 }
      );
    }

    // Save to persistent stats storage
    await saveStats(stats.platform, stats.count, stats.extraInfo);

    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME || '';

    return NextResponse.json({
      membersCount: stats.count,
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
