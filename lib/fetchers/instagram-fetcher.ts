/**
 * Instagram stats fetcher
 * Fetches follower count from Instagram
 * Currently uses manual count (Instagram blocks automated scraping)
 */

import { config } from '../config';
import { fetchWithTimeout } from './utils';
import type { FetchedStats } from './youtube-fetcher';

/**
 * Fetch Instagram stats
 * Currently fetches from our own /api/instagram endpoint
 * @returns FetchedStats with follower count, or null on error
 */
export async function fetchInstagramStats(): Promise<FetchedStats | null> {
  try {
    const username = process.env.INSTAGRAM_USERNAME;
    if (!username) {
      console.error('❌ Instagram username not configured');
      return null;
    }

    // Fetch from our own API endpoint
    // (Instagram blocks automated scraping, so we use manual count)
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

    console.log('📸 Fetching Instagram stats...');
    const response = await fetchWithTimeout(`${baseUrl}/api/instagram`, {}, config.API_TIMEOUT);

    if (!response.ok) {
      console.error('❌ Instagram fetch error:', response.status);
      return null;
    }

    const data = await response.json();
    const result: FetchedStats = {
      platform: 'Instagram',
      count: data.followersCount || 0,
    };

    console.log(`✅ Instagram: ${result.count} followers`);
    return result;
  } catch (error) {
    console.error(
      '❌ Error fetching Instagram stats:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}
