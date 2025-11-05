// Stats storage and history tracking with Redis
import { Redis } from '@upstash/redis';
import { config } from './config';
import { shouldNotifyMilestone, generateMilestoneMessage, formatMilestone } from './milestones';
import { getLastNotifiedMilestone, setLastNotifiedMilestone } from './milestoneStorage';

interface StatSnapshot {
  platform: string;
  count: number;
  views?: number; // YouTube only
  videos?: number; // YouTube only
  timestamp: number;
}

interface CachedStats {
  platform: string;
  count: number;
  views?: number;
  videos?: number;
  lastFetched: number;
  source: 'live' | 'cache';
}

const STATS_PREFIX = 'stats:current:';
const STATS_HISTORY_PREFIX = 'stats:history:';
const STATS_LAST_FETCHED = 'stats:lastFetched:';

let redis: Redis | null = null;

function getClient(): Redis {
  if (!redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error('Redis env vars missing for stats storage');
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

/**
 * Save current stats snapshot for a platform
 * Stores both current count and historical data
 * Automatically checks for milestone achievement and sends notifications
 */
export async function saveStats(
  platform: string,
  count: number,
  extraInfo?: { views?: number; videos?: number }
): Promise<void> {
  try {
    const client = getClient();
    const platformKey = platform.toLowerCase();
    const now = Date.now();

    // Save current stats (with TTL from config)
    await client.set(
      `${STATS_PREFIX}${platformKey}`,
      JSON.stringify({
        platform,
        count,
        views: extraInfo?.views,
        videos: extraInfo?.videos,
        lastFetched: now,
      }),
      { ex: Math.round(config.STATS_CACHE_TTL / 1000) } // Convert to seconds
    );

    // Save to history (keep forever for historical analysis)
    const historyKey = `${STATS_HISTORY_PREFIX}${platformKey}`;
    const snapshot: StatSnapshot = {
      platform,
      count,
      views: extraInfo?.views,
      videos: extraInfo?.videos,
      timestamp: now,
    };

    // Add to sorted set with timestamp as score for easy range queries
    await client.zadd(historyKey, {
      score: now,
      member: JSON.stringify(snapshot),
    });

    // Clean up old history entries based on config retention period
    const retentionCutoff = now - config.STATS_HISTORY_RETENTION;
    await client.zremrangebyscore(historyKey, 0, retentionCutoff);

    console.log(`✅ Saved stats for ${platform}: ${count}`);

    // Automatically check for milestone achievement
    await checkAndNotifyMilestone(platform, count);
  } catch (error) {
    console.error(`Error saving stats for ${platform}:`, error);
  }
}

/**
 * Check if a milestone was reached and send notifications
 * Called automatically whenever stats are saved
 */
async function checkAndNotifyMilestone(
  platform: string,
  count: number
): Promise<void> {
  try {
    // Get last notified milestone for this platform
    const lastNotified = await getLastNotifiedMilestone(platform);

    // Check if we should notify about a milestone
    const milestone = shouldNotifyMilestone(count, lastNotified);

    if (milestone) {
      console.log(`🎉 Milestone detected for ${platform}: ${formatMilestone(milestone.value)}`);

      // Update milestone with platform info
      milestone.platform = platform;

      // Generate celebration message
      const celebrationMessage = generateMilestoneMessage(milestone);
      const formattedMilestone = milestone.formatted;

      // Prepare notification message
      const message =
        `🎉 <b>Milestone Reached!</b>\n\n` +
        `📱 Platform: <b>${platform}</b>\n` +
        `🎯 Milestone: <b>${formattedMilestone}</b>\n\n` +
        `${celebrationMessage}\n\n` +
        `Thank you for being part of this journey! 🙏\n\n` +
        `🔗 Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://fesistats.vercel.app'}`;

      // Send notification to all subscribers
      const notificationResult = await sendTelegramNotification(message);

      if (notificationResult.success) {
        console.log(
          `✅ Milestone notification sent: ${notificationResult.delivered}/${notificationResult.total} subscribers`
        );

        // Save the milestone to prevent duplicate notifications
        await setLastNotifiedMilestone(platform, milestone.value);
      } else {
        console.error(`❌ Failed to send milestone notification for ${platform}`);
      }
    }
  } catch (error) {
    console.error(`Error checking milestone for ${platform}:`, error);
    // Don't throw - milestone checking shouldn't break stats saving
  }
}

/**
 * Send a notification message to all Telegram subscribers
 */
async function sendTelegramNotification(message: string): Promise<{
  success: boolean;
  total: number;
  delivered: number;
  failed: number;
}> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured');
      return { success: false, total: 0, delivered: 0, failed: 0 };
    }

    // Get all subscribers
    const subscribersResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/telegram-bot/subscribers`
    );

    if (!subscribersResponse.ok) {
      console.error('❌ Failed to fetch subscribers');
      return { success: false, total: 0, delivered: 0, failed: 0 };
    }

    const { subscribers } = await subscribersResponse.json();

    if (!subscribers || subscribers.length === 0) {
      console.log('ℹ️ No subscribers to notify');
      return { success: true, total: 0, delivered: 0, failed: 0 };
    }

    // Send to all subscribers
    const results = await Promise.allSettled(
      subscribers.map((chatId: string) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        })
      )
    );

    const delivered = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: delivered > 0,
      total: subscribers.length,
      delivered,
      failed,
    };
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return { success: false, total: 0, delivered: 0, failed: 0 };
  }
}

/**
 * Get current cached stats for a platform
 */
export async function getCurrentStats(platform: string): Promise<CachedStats | null> {
  try {
    const client = getClient();
    const platformKey = platform.toLowerCase();
    const statsJson = await client.get<string>(`${STATS_PREFIX}${platformKey}`);

    if (statsJson) {
      const stats = JSON.parse(statsJson);
      return {
        ...stats,
        source: 'cache',
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting stats for ${platform}:`, error);
    return null;
  }
}

/**
 * Get all current stats for all platforms
 */
export async function getAllCurrentStats(): Promise<CachedStats[]> {
  try {
    const client = getClient();
    const keys = await client.keys(`${STATS_PREFIX}*`);
    const stats: CachedStats[] = [];

    for (const key of keys) {
      const statsJson = await client.get<string>(key);
      if (statsJson) {
        const data = JSON.parse(statsJson);
        stats.push({
          ...data,
          source: 'cache',
        });
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting all stats:', error);
    return [];
  }
}

/**
 * Get stats history for a platform within a time range
 * @param platform Platform name (YouTube, Telegram, Instagram)
 * @param startTime Start time in milliseconds (default: 24 hours ago)
 * @param endTime End time in milliseconds (default: now)
 */
export async function getStatsHistory(
  platform: string,
  startTime?: number,
  endTime?: number
): Promise<StatSnapshot[]> {
  try {
    const client = getClient();
    const platformKey = platform.toLowerCase();
    const historyKey = `${STATS_HISTORY_PREFIX}${platformKey}`;

    // Default to last 24 hours
    const now = Date.now();
    const start = startTime || now - 24 * 60 * 60 * 1000;
    const end = endTime || now;

    const historyData = await client.zrange(historyKey, start, end, { byScore: true });

    const history: StatSnapshot[] = historyData
      .map((item: any) => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      })
      .filter((item: any) => item !== null);

    return history;
  } catch (error) {
    console.error(`Error getting stats history for ${platform}:`, error);
    return [];
  }
}

/**
 * Get stats for a specific time range (useful for charts)
 * Returns data points organized by hour/day depending on range
 */
export async function getStatsTimeSeries(
  platform: string,
  timeRange: 'day' | 'week' | 'month' = 'day'
): Promise<{ timestamp: number; count: number; time: string }[]> {
  try {
    let startTime = Date.now();

    if (timeRange === 'day') {
      startTime -= 24 * 60 * 60 * 1000;
    } else if (timeRange === 'week') {
      startTime -= 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === 'month') {
      startTime -= 30 * 24 * 60 * 60 * 1000;
    }

    const history = await getStatsHistory(platform, startTime, Date.now());

    if (history.length === 0) return [];

    // Group by hour
    const grouped: Record<number, number[]> = {};

    for (const snapshot of history) {
      const hour = Math.floor(snapshot.timestamp / (60 * 60 * 1000));
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(snapshot.count);
    }

    // Create time series with average for each hour
    const timeSeries = Object.entries(grouped)
      .map(([hourKey, counts]) => {
        const hour = parseInt(hourKey);
        const timestamp = hour * 60 * 60 * 1000;
        const avgCount = Math.round(
          counts.reduce((a, b) => a + b, 0) / counts.length
        );

        return {
          timestamp,
          count: avgCount,
          time: new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return timeSeries;
  } catch (error) {
    console.error(`Error getting time series for ${platform}:`, error);
    return [];
  }
}

/**
 * Check if we need to refresh stats (based on age)
 * Returns true if stats are older than cache TTL
 */
export async function shouldRefreshStats(
  platform: string,
  refreshInterval: number = config.STATS_CACHE_TTL // Default from config
): Promise<boolean> {
  try {
    const stats = await getCurrentStats(platform);
    if (!stats) return true; // No cached stats, refresh needed

    const age = Date.now() - stats.lastFetched;
    return age > refreshInterval;
  } catch (error) {
    console.error(`Error checking if refresh needed for ${platform}:`, error);
    return true; // On error, allow refresh
  }
}

/**
 * Get stats with automatic refresh if needed
 * This is the main function to use for getting stats
 */
export async function getStatsWithAutoRefresh(
  platform: string,
  fetcher: () => Promise<{
    count: number;
    views?: number;
    videos?: number;
  }>,
  refreshInterval: number = 5 * 60 * 1000 // Default 5 minutes
): Promise<CachedStats | null> {
  try {
    const shouldRefresh = await shouldRefreshStats(platform, refreshInterval);

    if (shouldRefresh) {
      // Fetch fresh data
      const freshData = await fetcher();
      // Save to storage
      await saveStats(platform, freshData.count, {
        views: freshData.views,
        videos: freshData.videos,
      });
    }

    // Return current stats (either fresh or cached)
    return await getCurrentStats(platform);
  } catch (error) {
    console.error(`Error in getStatsWithAutoRefresh for ${platform}:`, error);
    // Fall back to cached stats if fetch fails
    return await getCurrentStats(platform);
  }
}

/**
 * Clear old stats history (useful for cleanup)
 */
export async function cleanupOldStatsHistory(maxAgeDays: number = 90): Promise<void> {
  try {
    const client = getClient();
    const keys = await client.keys(`${STATS_HISTORY_PREFIX}*`);

    const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    for (const key of keys) {
      await client.zremrangebyscore(key, 0, cutoffTime);
    }

    console.log(`✅ Cleaned up stats history older than ${maxAgeDays} days`);
  } catch (error) {
    console.error('Error cleaning up stats history:', error);
  }
}
