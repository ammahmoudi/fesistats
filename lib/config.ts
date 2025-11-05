/**
 * Configuration file for FesiStats
 * All timing and behavior values are centralized here
 * Configured via environment variables with sensible defaults
 */

type ConfigType = {
  STATS_CACHE_TTL: number;
  STATS_HISTORY_RETENTION: number;
  MILESTONE_CHECK_THROTTLE: number;
  MILESTONE_HISTORY_RETENTION: number;
  AUTO_REFRESH_INTERVAL: number;
  MANUAL_REFRESH_COOLDOWN: number;
  MILESTONE_CHECK_DELAY: number;
  API_TIMEOUT: number;
  MILESTONE_CHECK_LOG_MAX: number;
  getDisplayValue: (key: keyof Omit<ConfigType, 'getDisplayValue'>, unit: 'seconds' | 'minutes' | 'hours' | 'days') => number | string;
};

export const config: ConfigType = {
  // Cache & Refresh Settings (milliseconds)
  STATS_CACHE_TTL: parseInt(process.env.STATS_CACHE_TTL || '86400') * 1000, // 24 hours default
  STATS_HISTORY_RETENTION: parseInt(process.env.STATS_HISTORY_RETENTION || '90') * 24 * 60 * 60 * 1000, // 90 days
  
  // Milestone Check Settings (milliseconds)
  MILESTONE_CHECK_THROTTLE: parseInt(process.env.MILESTONE_CHECK_THROTTLE || '7200') * 1000, // 2 hours default
  MILESTONE_HISTORY_RETENTION: parseInt(process.env.MILESTONE_HISTORY_RETENTION || '30') * 24 * 60 * 60 * 1000, // 30 days
  
  // UI Refresh Settings (milliseconds)
  AUTO_REFRESH_INTERVAL: parseInt(process.env.AUTO_REFRESH_INTERVAL || '300') * 1000, // 5 minutes default
  MANUAL_REFRESH_COOLDOWN: parseInt(process.env.MANUAL_REFRESH_COOLDOWN || '30') * 1000, // 30 seconds default
  MILESTONE_CHECK_DELAY: parseInt(process.env.MILESTONE_CHECK_DELAY || '5') * 1000, // 5 seconds default
  
  // API Timeouts (milliseconds)
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30') * 1000, // 30 seconds default
  
  // Data Management
  MILESTONE_CHECK_LOG_MAX: parseInt(process.env.MILESTONE_CHECK_LOG_MAX || '5'), // Keep last 5 checks
  
  // Helper methods for human-readable values
  getDisplayValue: (key: keyof Omit<ConfigType, 'getDisplayValue'>, unit: 'seconds' | 'minutes' | 'hours' | 'days'): number | string => {
    const value = config[key];
    if (typeof value !== 'number') return 'N/A';
    
    switch (unit) {
      case 'seconds':
        return Math.round(value / 1000);
      case 'minutes':
        return Math.round(value / 1000 / 60);
      case 'hours':
        return Math.round(value / 1000 / 60 / 60);
      case 'days':
        return Math.round(value / 1000 / 60 / 60 / 24);
      default:
        return value;
    }
  },
} as const;

// Log current configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('📋 FesiStats Configuration Loaded:', {
    'Cache TTL': `${config.getDisplayValue('STATS_CACHE_TTL', 'hours')} hours`,
    'History Retention': `${config.getDisplayValue('STATS_HISTORY_RETENTION', 'days')} days`,
    'Milestone Check Throttle': `${config.getDisplayValue('MILESTONE_CHECK_THROTTLE', 'hours')} hours`,
    'Auto Refresh': `${config.getDisplayValue('AUTO_REFRESH_INTERVAL', 'minutes')} minutes`,
    'Manual Refresh Cooldown': `${config.getDisplayValue('MANUAL_REFRESH_COOLDOWN', 'seconds')} seconds`,
  });
}
