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

    // Debug: Log all potential member/subscriber mentions
    console.log('🔍 DEBUG: Searching for member count in Telegram page...');
    
    // Find ALL numbers followed by "members" or "subscribers"
    const allNumbersRegex = /(\d[\d\s,]*\d|\d)\s*(?:subscribers?|members?)/gi;
    const allNumberMatches = [...html.matchAll(allNumbersRegex)];
    
    if (allNumberMatches.length > 0) {
      console.log(`🔍 DEBUG: Found ${allNumberMatches.length} potential matches:`);
      allNumberMatches.forEach((match, index) => {
        const cleanedNumber = match[1].replace(/[\s,]/g, '');
        console.log(`  ${index + 1}. "${match[0]}" → cleaned: ${cleanedNumber} (${parseInt(cleanedNumber, 10)})`);
      });
    } else {
      console.log('🔍 DEBUG: No number+members/subscribers patterns found');
    }

    // Try multiple patterns to extract member count
    // Pattern 1: Look for exact member count with space separator (e.g., "1 120 members")
    let subscriberMatch = html.match(/(\d+(?:\s\d+)+)\s+(?:subscribers|members)/i);
    if (subscriberMatch) {
      const rawMatch = subscriberMatch[1];
      const count = rawMatch.replace(/\s/g, ''); // Remove spaces
      console.log(`🔍 DEBUG: Pattern 1 matched - Raw: "${rawMatch}", Cleaned: "${count}"`);
      const result: FetchedStats = {
        platform: 'Telegram',
        count: parseInt(count, 10),
      };
      console.log(`✅ Telegram: ${result.count} members (space-separated)`);
      return result;
    }

    // Pattern 2: Look for comma-separated numbers (e.g., "1,120 members")
    subscriberMatch = html.match(/(\d+(?:,\d+)+)\s+(?:subscribers|members)/i);
    if (subscriberMatch) {
      const rawMatch = subscriberMatch[1];
      const count = rawMatch.replace(/,/g, '');
      console.log(`🔍 DEBUG: Pattern 2 matched - Raw: "${rawMatch}", Cleaned: "${count}"`);
      const result: FetchedStats = {
        platform: 'Telegram',
        count: parseInt(count, 10),
      };
      console.log(`✅ Telegram: ${result.count} members (comma-separated)`);
      return result;
    }

    // Pattern 3: Plain number - BUT prioritize larger numbers if multiple matches exist
    const plainMatches = html.match(/(\d+)\s+(?:subscribers|members)/gi);
    if (plainMatches && plainMatches.length > 0) {
      // Extract all numbers and find the largest one (most likely the total count)
      const numbers = plainMatches.map(m => {
        const num = m.match(/(\d+)/);
        return num ? parseInt(num[1], 10) : 0;
      }).filter(n => n > 0);
      
      if (numbers.length > 0) {
        const maxCount = Math.max(...numbers);
        console.log(`🔍 DEBUG: Pattern 3 - Found ${numbers.length} plain numbers: [${numbers.join(', ')}], using max: ${maxCount}`);
        const result: FetchedStats = {
          platform: 'Telegram',
          count: maxCount,
        };
        console.log(`✅ Telegram: ${result.count} members (plain - max of ${numbers.length} matches)`);
        return result;
      }
    }

    // Alternative pattern: Look in meta tags
    const metaMatch =
      html.match(/"subscriberCount":"(\d+)"/i) ||
      html.match(/data-before="(\d+(?:[\s,]\d+)*)\s+(?:subscribers|members)"/i);
    if (metaMatch) {
      const count = metaMatch[1].replace(/[\s,]/g, ''); // Remove spaces and commas
      const result: FetchedStats = {
        platform: 'Telegram',
        count: parseInt(count, 10),
      };
      console.log(`✅ Telegram: ${result.count} members (meta)`);
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
