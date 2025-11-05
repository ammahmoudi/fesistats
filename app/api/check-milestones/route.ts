import { NextResponse } from 'next/server';
import { getSubscribers } from '@/lib/telegramSubscribers';
import { detectMilestone, generateMilestoneMessage, shouldNotifyMilestone, findLastPassedMilestone } from '@/lib/milestones';
import { getLastNotifiedMilestone, setLastNotifiedMilestone } from '@/lib/milestoneStorage';
import { fetchAndSaveAllStats, type FetchedStats } from '@/lib/fetchers';

async function sendTelegramBroadcast(message: string): Promise<{ total: number; successful: number; failed: number }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('Bot token missing');
  
  const subscribers = await getSubscribers();
  if (!subscribers.length) {
    return { total: 0, successful: 0, failed: 0 };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const results = await Promise.allSettled(
    subscribers.map(chatId =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  return { total: subscribers.length, successful, failed: subscribers.length - successful };
}

async function fetchPlatformStats(): Promise<FetchedStats[]> {
  // Use unified stats fetcher - handles fetching AND saving to Redis
  return await fetchAndSaveAllStats();
}

/**
 * Check all platforms for new milestones and send notifications
 * GET /api/check-milestones
 * 
 * Cache for 5 minutes to prevent excessive checks
 */
export const revalidate = 300; // 5 minutes cache

export async function GET() {
  try {
    console.log('🔍 Checking for milestones and saving stats...');
    
    const stats = await fetchPlatformStats();
    const notifications: Array<{ platform: string; milestone: string; delivered: number }> = [];
    const currentStats: Array<{ 
      platform: string; 
      count: number; 
      lastNotified: number | null;
      extraInfo?: { views?: number; videos?: number };
    }> = [];

    for (const { platform, count, extraInfo } of stats) {
      // Stats are already saved by fetchAndSaveAllStats()
      let lastNotified = await getLastNotifiedMilestone(platform);
      
      // Initialize milestone tracking for first time if count is already past milestones
      if (lastNotified === null) {
        const lastPassed = findLastPassedMilestone(count);
        if (lastPassed) {
          console.log(`📝 Initializing ${platform} milestone tracking: ${lastPassed} (current: ${count})`);
          await setLastNotifiedMilestone(platform, lastPassed);
          lastNotified = lastPassed;
        }
      }
      
      // Store current stats
      currentStats.push({
        platform,
        count,
        lastNotified,
        extraInfo
      });

      // Check for milestone
      const milestone = shouldNotifyMilestone(count, lastNotified);

      if (milestone) {
        milestone.platform = platform;
        const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itzfesi.ir';
        const message = 
          `🎉 <b>Milestone Reached!</b>\n\n` +
          `📱 Platform: <b>${platform}</b>\n` +
          `🎯 Milestone: <b>${milestone.formatted}</b>\n\n` +
          `${generateMilestoneMessage(milestone)}\n\n` +
          `Thank you for being part of this journey! 🙏\n\n` +
          `🔗 Dashboard: ${dashboardUrl}`;

        console.log(`🎊 New milestone detected: ${platform} - ${milestone.formatted}`);
        
        const result = await sendTelegramBroadcast(message);
        
        if (result.successful > 0) {
          // Save milestone to storage (this now includes history)
          await setLastNotifiedMilestone(platform, milestone.value);
          notifications.push({
            platform,
            milestone: milestone.formatted,
            delivered: result.successful
          });
          console.log(`✅ Milestone saved and notified ${result.successful}/${result.total} subscribers`);
        }
      } else {
        console.log(`ℹ️  ${platform}: ${count} (no new milestone, last: ${lastNotified || 'none'})`);
      }
    }

    return NextResponse.json({
      success: true,
      checked: stats.length,
      stats: currentStats,
      notifications,
      message: notifications.length > 0 
        ? `${notifications.length} milestone notification(s) sent`
        : 'No new milestones detected',
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Milestone check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check milestones',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
