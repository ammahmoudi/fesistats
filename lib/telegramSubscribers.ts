// Upstash Redis subscriber storage helper (SDK version)
// Provides simple set-based persistence of Telegram chat IDs using @upstash/redis

import { Redis } from '@upstash/redis';

const REDIS_SUBSCRIBERS_KEY = 'telegram:subscribers';
const REDIS_USER_INFO_PREFIX = 'telegram:user:';

// User info interface
export interface TelegramUserInfo {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_bot?: boolean;
  updated_at: number;
}

// Initialize lazily to allow build without env vars locally
let redis: Redis | null = null;
function getClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error('Redis env vars missing: set UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or KV_REST_API_URL/KV_REST_API_TOKEN');
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

export async function addSubscriber(chatId: number): Promise<boolean> {
  const r = await getClient().sadd(REDIS_SUBSCRIBERS_KEY, chatId.toString());
  return r === 1 || r === 0; // 1 added, 0 already existed
}

export async function removeSubscriber(chatId: number): Promise<boolean> {
  const r = await getClient().srem(REDIS_SUBSCRIBERS_KEY, chatId.toString());
  return r === 1 || r === 0; // 1 removed, 0 not present
}

export async function getSubscribers(): Promise<number[]> {
  const members: string[] = await getClient().smembers(REDIS_SUBSCRIBERS_KEY);
  return members
    .map((m: string) => Number(m))
    .filter((n: number) => !Number.isNaN(n));
}

export async function isSubscribed(chatId: number): Promise<boolean> {
  const r = await getClient().sismember(REDIS_SUBSCRIBERS_KEY, chatId.toString());
  return r === 1;
}

export async function getSubscriberCount(): Promise<number> {
  return await getClient().scard(REDIS_SUBSCRIBERS_KEY);
}

// Store user information
export async function setUserInfo(userInfo: Omit<TelegramUserInfo, 'updated_at'>): Promise<void> {
  const key = `${REDIS_USER_INFO_PREFIX}${userInfo.id}`;
  const data: TelegramUserInfo = {
    ...userInfo,
    updated_at: Date.now()
  };
  await getClient().set(key, JSON.stringify(data), { ex: 86400 * 30 }); // 30 days TTL
}

// Get user information
export async function getUserInfo(chatId: number): Promise<TelegramUserInfo | null> {
  const key = `${REDIS_USER_INFO_PREFIX}${chatId}`;
  const data = await getClient().get(key);
  if (!data) return null;
  
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as TelegramUserInfo;
    }
    return data as TelegramUserInfo;
  } catch {
    return null;
  }
}

// Get multiple users' information
export async function getUsersInfo(chatIds: number[]): Promise<Map<number, TelegramUserInfo>> {
  const result = new Map<number, TelegramUserInfo>();
  
  // Fetch all user info in parallel
  const promises = chatIds.map(async (chatId) => {
    const info = await getUserInfo(chatId);
    if (info) {
      result.set(chatId, info);
    }
  });
  
  await Promise.all(promises);
  return result;
}
