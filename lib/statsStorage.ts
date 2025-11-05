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
const STATS_LAST_SAVED = 'stats:lastSaved:'; // Track when last save occurred

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
 * 
 * NOTE: Historical saves are throttled to config.STATS_SAVE_INTERVAL to prevent
 * excessive Redis writes when the count hasn't changed significantly
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

    // Check if we should save to history (throttled)
    const lastSaveKey = `${STATS_LAST_SAVED}${platformKey}`;
    const lastSaveTime = await client.get<string>(lastSaveKey);
    const timeSinceLastSave = lastSaveTime ? now - parseInt(lastSaveTime) : Infinity;

    if (timeSinceLastSave >= config.STATS_SAVE_INTERVAL) {
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

      // Update last save time
      await client.set(lastSaveKey, now.toString(), { ex: Math.round(config.STATS_SAVE_INTERVAL / 1000) });

      console.log(`✅ Saved stats for ${platform}: ${count} (throttled save every ${config.getDisplayValue('STATS_SAVE_INTERVAL', 'minutes')} min)`);
    } else {
      const nextSaveIn = Math.round((config.STATS_SAVE_INTERVAL - timeSinceLastSave) / 1000);
      console.log(`⏸️  ${platform}: ${count} (skipped history save, next in ${nextSaveIn}s)`);
    }

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
        // Handle both string and object responses from Redis
        const data = typeof statsJson === 'string' ? JSON.parse(statsJson) : statsJson;
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

    console.log(`[getStatsHistory] ${platform}: Fetching range ${start} to ${end}`);

    // Fetch all data from the sorted set
    let historyData: any[] = [];
    
    try {
      // Try to get by score range first
      historyData = await client.zrange(historyKey, start, end, { byScore: true });
      console.log(`[getStatsHistory] ${platform}: zrange returned ${historyData.length} entries`);
    } catch (scoreError) {
      // If score-based range fails, get all and filter manually
      console.log(`[getStatsHistory] Score range query failed for ${platform}, fetching all data...`);
      const allData = await client.zrange(historyKey, 0, -1);
      console.log(`[getStatsHistory] Got ${allData.length} total entries, filtering...`);
      
      historyData = allData.filter((item: any) => {
        try {
          // Handle both string and object returns from Redis
          const snapshot = typeof item === 'string' ? JSON.parse(item) : item;
          const inRange = snapshot.timestamp >= start && snapshot.timestamp <= end;
          return inRange;
        } catch (e) {
          console.log(`[getStatsHistory] Failed to parse: ${item}`);
          return false;
        }
      });
      console.log(`[getStatsHistory] After filter: ${historyData.length} entries`);
    }

    console.log(`[getStatsHistory] ${platform}: Processing ${historyData.length} entries`);

    const history: StatSnapshot[] = historyData
      .map((item: any, index: number) => {
        try {
          // Log the first item to see what we're dealing with
          if (index === 0) {
            console.log(`[getStatsHistory] First item: type=${typeof item}, value=${typeof item === 'object' ? JSON.stringify(item) : item}`);
          }
          
          // Handle both string and object returns from Redis
          // Redis client might return objects instead of strings
          const parsed = typeof item === 'string' ? JSON.parse(item) : item;
          return parsed as StatSnapshot;
        } catch (e) {
          if (index === 0) {
            console.log(`[getStatsHistory] Parse error on first item: ${e}, item type: ${typeof item}`);
          }
          return null;
        }
      })
      .filter((item: any): item is StatSnapshot => item !== null);

    console.log(`[getStatsHistory] ${platform}: Returning ${history.length} valid entries`);
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

    console.log(`[getStatsTimeSeries] ${platform} (${timeRange}): Got ${history.length} history entries`);

    if (history.length === 0) {
      console.warn(`[getStatsTimeSeries] No history data for ${platform} in range ${timeRange}`);
      return [];
    }

    // Group by hour
    const grouped: Record<number, number[]> = {};

    for (const snapshot of history) {
      const hour = Math.floor(snapshot.timestamp / (60 * 60 * 1000));
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(snapshot.count);
    }

    console.log(`[getStatsTimeSeries] ${platform}: Grouped into ${Object.keys(grouped).length} hours`);

    // Create time series with average for each hour
    const timeSeries = Object.entries(grouped)
      .map(([hourKey, counts]) => {
        const hour = parseInt(hourKey);
        const timestamp = hour * 60 * 60 * 1000;
        const date = new Date(timestamp);
        const avgCount = Math.round(
          counts.reduce((a, b) => a + b, 0) / counts.length
        );

        // Format time more reliably
        let timeStr = '';
        if (timeRange === 'day') {
          // For day view: show HH:MM format
          timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          });
        } else if (timeRange === 'week') {
          // For week view: show day name and time
          timeStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } else {
          // For month view: show date only
          timeStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        return {
          timestamp,
          count: avgCount,
          time: timeStr,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log(`[getStatsTimeSeries] ${platform}: Returning ${timeSeries.length} data points`);
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
