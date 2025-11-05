/**
 * Stats Fetcher Module Index
 * Central export point for all stats fetching functions
 * 
 * Architecture:
 * - youtube-fetcher.ts     → Fetch YouTube subscriber count
 * - telegram-fetcher.ts    → Fetch Telegram member count
 * - instagram-fetcher.ts   → Fetch Instagram follower count
 * - utils.ts               → Shared utilities (timeout handling)
 */

export { fetchYouTubeStats } from './youtube-fetcher';
export { fetchTelegramStats } from './telegram-fetcher';
export { fetchInstagramStats } from './instagram-fetcher';
export { fetchWithTimeout } from './utils';

// Re-export types
export type { FetchedStats } from './youtube-fetcher';

import { saveStats } from '../statsStorage';
import { fetchYouTubeStats } from './youtube-fetcher';
import { fetchTelegramStats } from './telegram-fetcher';
import { fetchInstagramStats } from './instagram-fetcher';

/**
 * Fetch all stats and save them to Redis
 * Runs all three platforms in parallel
 * 
 * @returns Array of successfully fetched and saved stats
 */
export async function fetchAndSaveAllStats() {
  console.log('📊 Fetching all platform stats...');

  const results = await Promise.allSettled([
    fetchYouTubeStats(), 
    fetchTelegramStats(),
    fetchInstagramStats()
  ]);

  const successfulStats = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const stats = result.value;
      try {
        // Save to Redis immediately
        await saveStats(stats.platform, stats.count, stats.extraInfo);
        console.log(`✅ Saved ${stats.platform}: ${stats.count}`);
        successfulStats.push(stats);
      } catch (error) {
        console.error(`❌ Failed to save ${stats.platform}:`, error);
      }
    }
  }

  return successfulStats;
}
