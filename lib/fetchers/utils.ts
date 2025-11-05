/**
 * Shared utilities for stats fetching
 */

import { config } from '../config';

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = config.API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
