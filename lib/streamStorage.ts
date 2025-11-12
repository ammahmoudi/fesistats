// Redis storage for YouTube stream/video tracking
import { Redis } from '@upstash/redis';

const STREAMS_SORTED_SET = 'streams:youtube:all'; // Single sorted set for all streams
const STREAM_CACHE_KEY = 'stream:cache:last_fetch';
const STREAM_CACHE_TTL = 60 * 60; // 1 hour cache
const STREAM_RETENTION_DAYS = 90;

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

export interface StreamRecord {
  videoId: string;
  title: string;
  startTime: number; // Unix timestamp
  endTime?: number; // Unix timestamp (optional, for completed streams)
  isLive: boolean;
  viewCount?: number;
  scheduledStartTime?: number; // For upcoming streams
}

/**
 * Save or update a stream record in the sorted set
 * Score is the start time for automatic chronological ordering
 */
export async function saveStreamRecord(stream: StreamRecord): Promise<void> {
  try {
    const client = getClient();
    
    // Use startTime as score for sorting
    await client.zadd(STREAMS_SORTED_SET, {
      score: stream.startTime,
      member: JSON.stringify(stream)
    });
    
    console.log(`✅ Stream saved to sorted set: ${stream.title} (${stream.videoId})`);
  } catch (error) {
    console.error('Error saving stream record:', error);
  }
}

/**
 * Get all stream records within a time range using sorted set range query
 * Much more efficient than scanning individual keys
 */
export async function getStreamsInRange(startTime: number, endTime: number): Promise<StreamRecord[]> {
  try {
    const client = getClient();
    
    // Get all streams with startTime in range (using ZRANGE with BYSCORE)
    const results = await client.zrange(STREAMS_SORTED_SET, startTime, endTime, {
      byScore: true
    });
    
    if (!results || results.length === 0) {
      return [];
    }
    
    const streams: StreamRecord[] = [];
    
    for (const data of results) {
      try {
        const stream = typeof data === 'string' ? JSON.parse(data) : data as StreamRecord;
        
        // Additional filter: check if stream overlaps with time range
        // (not just starts in range, but also ends in range or is ongoing)
        const streamEnd = stream.endTime || Date.now();
        
        if ((stream.startTime >= startTime && stream.startTime <= endTime) || 
            (streamEnd >= startTime && streamEnd <= endTime) ||
            (stream.startTime <= startTime && streamEnd >= endTime)) {
          streams.push(stream);
        }
      } catch (e) {
        console.warn(`Failed to parse stream data:`, e);
      }
    }
    
    return streams;
  } catch (error) {
    console.error('Error getting streams in range:', error);
    return [];
  }
}

/**
 * Get all recent streams (last 30 days)
 */
export async function getRecentStreams(days: number = 30): Promise<StreamRecord[]> {
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);
  return getStreamsInRange(startTime, endTime);
}

/**
 * Check if we should fetch fresh stream data from API
 * Returns false if data was fetched recently (within cache TTL)
 */
export async function shouldFetchStreams(): Promise<boolean> {
  try {
    const client = getClient();
    const lastFetch = await client.get<number>(STREAM_CACHE_KEY);
    
    if (!lastFetch) return true;
    
    const timeSinceLastFetch = Date.now() - lastFetch;
    const shouldFetch = timeSinceLastFetch > (STREAM_CACHE_TTL * 1000);
    
    if (!shouldFetch) {
      console.log(`⏭️  Skipping stream fetch (cached ${Math.floor(timeSinceLastFetch / 1000 / 60)} min ago)`);
    }
    
    return shouldFetch;
  } catch (error) {
    console.error('Error checking stream fetch status:', error);
    return true; // Fetch on error to be safe
  }
}

/**
 * Mark that streams were just fetched
 */
export async function markStreamsFetched(): Promise<void> {
  try {
    const client = getClient();
    await client.set(STREAM_CACHE_KEY, Date.now(), {
      ex: STREAM_CACHE_TTL
    });
  } catch (error) {
    console.error('Error marking streams fetched:', error);
  }
}

/**
 * Update stream end time (when stream finishes)
 * Removes old entry and adds updated one
 */
export async function updateStreamEndTime(videoId: string, endTime: number): Promise<void> {
  try {
    const client = getClient();
    
    // Get all streams and find the one to update
    const allStreams = await client.zrange(STREAMS_SORTED_SET, 0, -1);
    
    for (const data of allStreams) {
      try {
        const stream = typeof data === 'string' ? JSON.parse(data) : data as StreamRecord;
        
        if (stream.videoId === videoId) {
          // Remove old entry
          await client.zrem(STREAMS_SORTED_SET, JSON.stringify(stream));
          
          // Add updated entry
          stream.endTime = endTime;
          stream.isLive = false;
          
          await client.zadd(STREAMS_SORTED_SET, {
            score: stream.startTime,
            member: JSON.stringify(stream)
          });
          
          console.log(`✅ Stream end time updated: ${videoId}`);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse stream during update:', e);
      }
    }
  } catch (error) {
    console.error('Error updating stream end time:', error);
  }
}

/**
 * Clean up old streams (older than retention period)
 * Call this periodically to keep sorted set size manageable
 */
export async function cleanupOldStreams(): Promise<void> {
  try {
    const client = getClient();
    const cutoffTime = Date.now() - (STREAM_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    
    // Remove all streams older than cutoff
    const removed = await client.zremrangebyscore(STREAMS_SORTED_SET, 0, cutoffTime);
    
    if (removed && removed > 0) {
      console.log(`🗑️  Cleaned up ${removed} old stream records`);
    }
  } catch (error) {
    console.error('Error cleaning up old streams:', error);
  }
}
