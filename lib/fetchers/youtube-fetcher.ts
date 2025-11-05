/**
 * YouTube stats fetcher
 * Fetches subscriber count, view count, and video count from YouTube API
 */

import { config } from '../config';
import { fetchWithTimeout } from './utils';

export interface FetchedStats {
  platform: string;
  count: number;
  extraInfo?: {
    views?: number;
    videos?: number;
  };
}

interface YouTubeChannelResponse {
  items: Array<{
    statistics: {
      subscriberCount: string;
      viewCount: string;
      videoCount: string;
    };
  }>;
}

/**
 * Fetch YouTube stats directly from API
 * @returns FetchedStats with subscriber count, views, and videos, or null on error
 */
export async function fetchYouTubeStats(): Promise<FetchedStats | null> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
      console.error('❌ YouTube API credentials not configured');
      return null;
    }

    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    
    console.log('🎥 Fetching YouTube stats...');
    const response = await fetchWithTimeout(url, {}, config.API_TIMEOUT);

    if (!response.ok) {
      console.error('❌ YouTube API error:', response.status);
      return null;
    }

    const data: YouTubeChannelResponse = await response.json();
    if (!data.items || data.items.length === 0) {
      console.error('❌ YouTube channel not found');
      return null;
    }

    const stats = data.items[0].statistics;
    const result: FetchedStats = {
      platform: 'YouTube',
      count: parseInt(stats.subscriberCount),
      extraInfo: {
        views: parseInt(stats.viewCount),
        videos: parseInt(stats.videoCount),
      },
    };

    console.log(`✅ YouTube: ${result.count} subscribers`);
    return result;
  } catch (error) {
    console.error(
      '❌ Error fetching YouTube stats:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}
