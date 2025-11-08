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
      console.warn('⚠️  Instagram username not configured - skipping Instagram stats');
      return null;
    }

    // Fetch from our own API endpoint
    // (Instagram blocks automated scraping, so we use our internal API)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    console.log('📸 Fetching Instagram stats for:', username);
    const response = await fetchWithTimeout(`${baseUrl}/api/instagram`, {}, config.API_TIMEOUT);

    if (!response.ok) {
      console.error('❌ Instagram fetch error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Instagram API error response:', data.error, data.message);
      return null;
    }
    
    if (data.followersCount === undefined || data.followersCount === null) {
      console.error('❌ Instagram response missing followersCount:', data);
      return null;
    }

    const result: FetchedStats = {
      platform: 'Instagram',
      count: data.followersCount,
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
