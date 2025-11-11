// Redis storage for milestone tracking
import { Redis } from '@upstash/redis';
import { config } from './config';

const MILESTONE_KEY_PREFIX = 'milestone:last:';
const MILESTONE_HISTORY_PREFIX = 'milestone:history:';

let redis: Redis | null = null;
function getClient(): Redis {
  if (!redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error('Redis env vars missing');
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

interface MilestoneRecord {
  platform: string;
  value: number;
  timestamp: number;
  notified: boolean;
}

/**
 * Get the last notified milestone value for a platform
 */
export async function getLastNotifiedMilestone(platform: string): Promise<number | null> {
  try {
    const value = await getClient().get<number>(`${MILESTONE_KEY_PREFIX}${platform.toLowerCase()}`);
    return value;
  } catch (error) {
    console.error('Error getting last milestone:', error);
    return null;
  }
}

/**
 * Set the last notified milestone value for a platform
 * Also saves to milestone history for record keeping
 */
export async function setLastNotifiedMilestone(platform: string, value: number): Promise<void> {
  try {
    const client = getClient();
    const platformKey = platform.toLowerCase();
    
    // Save to current milestone with TTL from config
    await client.set(`${MILESTONE_KEY_PREFIX}${platformKey}`, value, { 
      ex: Math.round(config.MILESTONE_HISTORY_RETENTION / 1000) 
    }); // From config
    
    // Save to milestone history
    const record: MilestoneRecord = {
      platform,
      value,
      timestamp: Date.now(),
      notified: true,
    };
    
    await client.lpush(
      `${MILESTONE_HISTORY_PREFIX}${platformKey}`,
      JSON.stringify(record)
    );
    
    console.log(`✅ Milestone saved for ${platform}: ${value}`);
  } catch (error) {
    console.error('Error setting last milestone:', error);
  }
}

/**
 * Get all last notified milestones
 */
export async function getAllLastMilestones(): Promise<Record<string, number>> {
  try {
    const keys = await getClient().keys(`${MILESTONE_KEY_PREFIX}*`);
    const result: Record<string, number> = {};
    
    for (const key of keys) {
      const platform = key.replace(MILESTONE_KEY_PREFIX, '');
      const value = await getClient().get<number>(key);
      if (value !== null) {
        result[platform] = value;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error getting all milestones:', error);
    return {};
  }
}

/**
 * Get milestone history for a platform
 */
export async function getMilestoneHistory(platform: string, limit: number = 50): Promise<MilestoneRecord[]> {
  try {
    const platformKey = platform.toLowerCase();
    const historyKey = `${MILESTONE_HISTORY_PREFIX}${platformKey}`;
    
    console.log(`📋 Fetching milestone history for ${platform} from key: ${historyKey}`);
    
    const records = await getClient().lrange<string>(historyKey, 0, limit - 1);
    
    console.log(`✅ Got ${records.length} raw records for ${platform}`);
    
    const parsed = records
      .map((item: any) => {
        try {
          // Check if item is already an object (Redis auto-parsed it)
          if (typeof item === 'object' && item !== null) {
            console.log(`  ✓ Already parsed: ${JSON.stringify(item)}`);
            return item as MilestoneRecord;
          }
          // Otherwise parse the string
          const parsed = JSON.parse(item);
          console.log(`  ✓ Parsed: ${JSON.stringify(parsed)}`);
          return parsed;
        } catch (e) {
          console.warn(`  ✗ Failed to parse: ${typeof item === 'object' ? JSON.stringify(item) : item}`);
          return null;
        }
      })
      .filter((item: any): item is MilestoneRecord => item !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`📊 Returning ${parsed.length} milestone records for ${platform}`);
    return parsed;
  } catch (error) {
    console.error(`Error getting milestone history for ${platform}:`, error);
    return [];
  }
}

/**
 * Verify and fix milestones if needed (recovery function)
 * Use this if you suspect milestones weren't saved properly
 */
export async function recordMilestoneIfMissing(
  platform: string,
  previousCount: number,
  currentCount: number
): Promise<void> {
  try {
    const lastNotified = await getLastNotifiedMilestone(platform);
    
    // If we crossed a milestone boundary since last record
    if (!lastNotified || currentCount > lastNotified) {
      // This should be caught by normal flow, but just in case
      console.log(`⚠️  Milestone recovery check for ${platform}: last=${lastNotified}, current=${currentCount}`);
      
      if (currentCount > (lastNotified || 0)) {
        await setLastNotifiedMilestone(platform, currentCount);
      }
    }
  } catch (error) {
    console.error(`Error in milestone recovery for ${platform}:`, error);
  }
}
