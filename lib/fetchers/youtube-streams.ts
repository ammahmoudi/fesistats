/**
 * YouTube Live Stream & Video Tracker
 * Fetches live streams and recent videos from YouTube API
 */

import { fetchWithTimeout } from './utils';
import { saveStreamRecord, shouldFetchStreams, markStreamsFetched, cleanupOldStreams, type StreamRecord } from '../streamStorage';
import { config } from '../config';

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    liveBroadcastContent: string; // 'live', 'upcoming', 'none'
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
    actualEndTime?: string;
    scheduledStartTime?: string;
  };
  statistics?: {
    viewCount: string;
  };
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
  }>;
}

interface YouTubeVideosResponse {
  items: YouTubeVideo[];
}

/**
 * Fetch recent videos and live streams from YouTube channel
 * OPTIMIZED: Uses cache to avoid excessive API calls
 * Only fetches if cache is stale (>1 hour old)
 */
export async function fetchYouTubeStreams(force: boolean = false): Promise<StreamRecord[]> {
  try {
    // Check cache first unless forced
    if (!force) {
      const shouldFetch = await shouldFetchStreams();
      if (!shouldFetch) {
        console.log('📺 Using cached stream data');
        return []; // Return empty, data is already in storage
      }
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
      console.error('❌ YouTube API credentials not configured');
      return [];
    }

    // Step 1: Search for recent videos (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=id&channelId=${channelId}&maxResults=50&order=date&type=video` +
      `&publishedAfter=${thirtyDaysAgo.toISOString()}&key=${apiKey}`;
    
    console.log('🎥 Fetching YouTube videos/streams...');
    
    // Add delay before API call to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const searchResponse = await fetchWithTimeout(searchUrl, {}, config.API_TIMEOUT);

    if (!searchResponse.ok) {
      console.error('❌ YouTube Search API error:', searchResponse.status);
      return [];
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      console.log('ℹ️  No recent videos found');
      return [];
    }

    // Step 2: Get details for these videos
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,liveStreamingDetails,statistics&id=${videoIds}&key=${apiKey}`;
    
    // Add delay before second API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const videosResponse = await fetchWithTimeout(videosUrl, {}, config.API_TIMEOUT);

    if (!videosResponse.ok) {
      console.error('❌ YouTube Videos API error:', videosResponse.status);
      return [];
    }

    const videosData: YouTubeVideosResponse = await videosResponse.json();
    const streams: StreamRecord[] = [];

    for (const video of videosData.items) {
      const isLiveOrUpcoming = video.snippet.liveBroadcastContent === 'live' || 
                               video.snippet.liveBroadcastContent === 'upcoming';
      
      // Only process live streams or videos that were live streams
      if (isLiveOrUpcoming || video.liveStreamingDetails) {
        const streamRecord: StreamRecord = {
          videoId: video.id,
          title: video.snippet.title,
          startTime: video.liveStreamingDetails?.actualStartTime 
            ? new Date(video.liveStreamingDetails.actualStartTime).getTime()
            : new Date(video.snippet.publishedAt).getTime(),
          endTime: video.liveStreamingDetails?.actualEndTime
            ? new Date(video.liveStreamingDetails.actualEndTime).getTime()
            : undefined,
          isLive: video.snippet.liveBroadcastContent === 'live',
          viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : undefined,
          scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime
            ? new Date(video.liveStreamingDetails.scheduledStartTime).getTime()
            : undefined,
        };

        streams.push(streamRecord);
        
        // Save to Redis
        await saveStreamRecord(streamRecord);
      }
    }

    // Mark that we just fetched streams
    await markStreamsFetched();
    
    // Cleanup old streams (older than 90 days)
    await cleanupOldStreams();
    
    console.log(`✅ Found ${streams.length} streams/live videos`);
    return streams;
  } catch (error) {
    console.error(
      '❌ Error fetching YouTube streams:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return [];
  }
}

/**
 * Update end times for currently live streams
 */
export async function checkAndUpdateLiveStreams(): Promise<void> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) return;

    // Check for live streams
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=id&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
    
    const response = await fetchWithTimeout(searchUrl, {}, config.API_TIMEOUT);
    
    if (response.ok) {
      const data: YouTubeSearchResponse = await response.json();
      if (data.items && data.items.length > 0) {
        console.log(`ℹ️  ${data.items.length} live stream(s) currently active`);
      }
    }
  } catch (error) {
    console.error('Error checking live streams:', error);
  }
}
