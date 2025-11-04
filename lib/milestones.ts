// Milestone detection and notification helpers

export interface Milestone {
  value: number;
  formatted: string; // "1K", "10K", "100K", "1M"
  platform: string;
}

/**
 * Determine if a count represents a notable milestone
 * Milestones: 1K, 2K, 3K, 4K, 5K, 10K, 15K, 20K, 25K, 50K, 75K, 100K, 250K, 500K, 1M, etc.
 */
export function detectMilestone(count: number): Milestone | null {
  if (count < 1000) return null;

  const milestones = [
    // Every 1K from 1K to 10K
    1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
    // Every 5K from 15K to 50K
    15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
    // Major milestones
    75000, 100000, 150000, 200000, 250000, 500000, 750000,
    1000000, 1500000, 2000000, 2500000, 5000000, 10000000
  ];

  if (milestones.includes(count)) {
    return {
      value: count,
      formatted: formatMilestone(count),
      platform: ''
    };
  }

  return null;
}

/**
 * Format count as readable milestone (1K, 10K, 1M)
 */
export function formatMilestone(count: number): string {
  if (count >= 1000000) {
    const millions = count / 1000000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (count >= 1000) {
    const thousands = count / 1000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Generate celebration message for milestone
 */
export function generateMilestoneMessage(milestone: Milestone): string {
  const messages = [
    `🎉 We just hit ${milestone.formatted} ${milestone.platform} subscribers/followers!`,
    `🚀 Amazing milestone reached: ${milestone.formatted} on ${milestone.platform}!`,
    `🎯 Incredible! We've reached ${milestone.formatted} ${milestone.platform} subscribers!`,
    `⭐ Celebration time! ${milestone.formatted} ${milestone.platform} milestone achieved!`,
    `🔥 Huge milestone alert: ${milestone.formatted} on ${milestone.platform}!`
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Check if we should notify for this milestone (haven't notified before)
 */
export function shouldNotifyMilestone(
  currentCount: number,
  lastNotifiedCount: number | null
): Milestone | null {
  const milestone = detectMilestone(currentCount);
  
  if (!milestone) return null;
  
  // First notification or crossed a new milestone
  if (lastNotifiedCount === null || milestone.value > lastNotifiedCount) {
    return milestone;
  }
  
  return null;
}
