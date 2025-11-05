import { NextResponse } from 'next/server';
import { saveStats } from '@/lib/statsStorage';

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300; // 5 minutes in seconds

/**
 * Fetch follower count using Instagram's internal API endpoint
 * This uses an undocumented but working endpoint that Instagram's web interface uses
 * 
 * Endpoint: https://i.instagram.com/api/v1/users/web_profile_info/?username={username}
 * Requires specific headers to bypass security checks
 */
async function getFollowersFromInstagram(username: string, forceRefresh: boolean = false): Promise<number | null> {
  try {
    const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    
    // Instagram requires specific headers to allow access
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Instagram 76.0.0.15.395 Android (24/7.0; 640dpi; 1440x2560; samsung; SM-G930F; herolte; samsungexynos8890; en_US; 138226743)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'X-IG-App-ID': '936619743392459',
      },
      signal: controller.signal,
      // If forceRefresh, bypass cache; otherwise use 5-minute cache
      cache: forceRefresh ? 'no-store' : 'default',
      next: forceRefresh ? { revalidate: 0 } : { revalidate: 300 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Instagram API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Extract follower count from response
    const followerCount = data?.data?.user?.edge_followed_by?.count;
    
    if (followerCount !== undefined) {
      console.log(`Instagram @${username}: ${followerCount.toLocaleString()} followers`);
      return followerCount;
    }

    console.error('No follower count in Instagram response');
    return null;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Instagram API timeout - request took too long');
      } else {
        console.error('Error fetching Instagram data:', error.message);
      }
    }
    return null;
  }
}

/**
 * Fetch follower count using Instagram Graph API (Official method)
 * Requires Instagram Business/Creator account and Facebook App
 */
async function getFollowersFromGraphAPI(accessToken: string, instagramAccountId: string, forceRefresh: boolean = false): Promise<number | null> {
  try {
    const url = `https://graph.instagram.com/${instagramAccountId}?fields=followers_count,username&access_token=${accessToken}`;
    
    const response = await fetch(url, {
      // If forceRefresh, bypass cache; otherwise use 5-minute cache
      cache: forceRefresh ? 'no-store' : 'default',
      next: forceRefresh ? { revalidate: 0 } : { revalidate: 300 },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Instagram Graph API error:', errorData);
      return null;
    }

    const data = await response.json();
    
    if (data.followers_count !== undefined) {
      console.log(`Instagram @${data.username}: ${data.followers_count.toLocaleString()} followers (Graph API)`);
      return data.followers_count;
    }

    return null;
  } catch (error) {
    console.error('Error fetching Instagram Graph API data:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const username = process.env.INSTAGRAM_USERNAME;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

    // Priority 1: Try Instagram internal API (simple, works for any public account)
    if (username) {
      console.log(`Fetching Instagram data for @${username} via internal API...${forceRefresh ? ' (forced refresh)' : ''}`);
      const followersCount = await getFollowersFromInstagram(username, forceRefresh);
      
      if (followersCount !== null) {
        // Save to persistent stats storage
        await saveStats('Instagram', followersCount);
        
        return NextResponse.json({
          followersCount,
          lastUpdated: new Date().toISOString(),
          source: 'instagram-api',
        });
      }
      
      console.warn('Instagram internal API failed, trying Graph API...');
    }

    // Priority 2: Try Graph API if configured (official but requires setup)
    if (accessToken && accountId) {
      console.log(`Trying Instagram Graph API...`);
      const followersCount = await getFollowersFromGraphAPI(accessToken, accountId, forceRefresh);
      
      if (followersCount !== null) {
        // Save to persistent stats storage
        await saveStats('Instagram', followersCount);
        
        return NextResponse.json({
          followersCount,
          lastUpdated: new Date().toISOString(),
          source: 'graph-api',
        });
      }
      
      console.warn('Instagram Graph API failed.');
    }

    // No methods available or all failed
    return NextResponse.json(
      { 
        error: 'Instagram data unavailable',
        message: 'Unable to fetch Instagram data. Please check your configuration or try again later.'
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Instagram API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Instagram data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


