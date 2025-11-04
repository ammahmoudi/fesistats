// Redis storage for milestone tracking
import { Redis } from '@upstash/redis';

const MILESTONE_KEY_PREFIX = 'milestone:last:';

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
 */
export async function setLastNotifiedMilestone(platform: string, value: number): Promise<void> {
  try {
    await getClient().set(`${MILESTONE_KEY_PREFIX}${platform.toLowerCase()}`, value);
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
