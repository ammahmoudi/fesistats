// Upstash Redis subscriber storage helper (SDK version)
// Provides simple set-based persistence of Telegram chat IDs using @upstash/redis

import { Redis } from '@upstash/redis';

const REDIS_SUBSCRIBERS_KEY = 'telegram:subscribers';

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

