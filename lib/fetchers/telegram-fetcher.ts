/**
 * Telegram stats fetcher
 * Fetches member count from public Telegram channel page
 */

import { config } from '../config';
import { fetchWithTimeout } from './utils';
import type { FetchedStats } from './youtube-fetcher';

/**
 * Fetch Telegram stats from public channel page
 * Scrapes the public t.me page to extract member count
 * @returns FetchedStats with member count, or null on error
 */
export async function fetchTelegramStats(): Promise<FetchedStats | null> {
  try {
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME;
    if (!channelUsername) {
      console.error('❌ Telegram channel not configured');
      return null;
    }

    const cleanUsername = channelUsername.replace('@', '');
    const url = `https://t.me/${cleanUsername}`;

    console.log('💬 Fetching Telegram stats...');
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
      config.API_TIMEOUT
    );

    if (!response.ok) {
      console.error('❌ Telegram fetch error:', response.status);
      return null;
    }

    const html = await response.text();

    // Try multiple patterns to extract member count
    const subscriberMatch = html.match(/(\d+(?:,\d+)*)\s+(?:subscribers|members)/i);
    if (subscriberMatch) {
      const count = subscriberMatch[1].replace(/,/g, '');
      const result: FetchedStats = {
        platform: 'Telegram',
        count: parseInt(count, 10),
      };
      console.log(`✅ Telegram: ${result.count} members`);
      return result;
    }

    // Alternative pattern: Look in meta tags
    const metaMatch =
      html.match(/"subscriberCount":"(\d+)"/i) ||
      html.match(/data-before="(\d+(?:,\d+)*)\s+(?:subscribers|members)"/i);
    if (metaMatch) {
      const count = metaMatch[1].replace(/,/g, '');
      const result: FetchedStats = {
        platform: 'Telegram',
        count: parseInt(count, 10),
      };
      console.log(`✅ Telegram: ${result.count} members`);
      return result;
    }

    console.warn('⚠️  Could not extract member count from Telegram page');
    return null;
  } catch (error) {
    console.error(
      '❌ Error fetching Telegram stats:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}
