"use client";

import { useEffect } from 'react';
import { config } from '@/lib/config';

/**
 * Client-side milestone checker that triggers checks when users visit the site.
 * This works on Vercel Hobby plan (where cron is limited to once/day).
 * 
 * Throttled to check based on config.MILESTONE_CHECK_THROTTLE to avoid excessive API calls.
 */
export default function MilestoneChecker() {
  useEffect(() => {
    const checkMilestones = async () => {
      // Get last check time from localStorage
      const lastCheck = localStorage.getItem('lastMilestoneCheck');
      const now = Date.now();
      
      // Throttle based on config
      if (lastCheck && now - parseInt(lastCheck) < config.MILESTONE_CHECK_THROTTLE) {
        // Too soon, skip check
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏸️  Milestone check skipped (next check in ${config.getDisplayValue('MILESTONE_CHECK_THROTTLE', 'minutes')} min)`);
        }
        return;
      }
      
      try {
        // Silent background check
        const response = await fetch('/api/check-milestones');
        if (response.ok) {
          const data = await response.json();
          // Update last check time
          localStorage.setItem('lastMilestoneCheck', now.toString());
          
          // Log for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Milestone check completed:', data);
          }
          
          // Also store check timestamp in a readable format for debugging
          const checkLog = {
            timestamp: new Date().toISOString(),
            success: data.success,
            milestonesFound: data.notifications?.length || 0,
            platformsChecked: data.stats?.length || 0,
          };
          
          // Keep last 5 checks in localStorage for debugging
          try {
            const logs = JSON.parse(localStorage.getItem('milestoneCheckLogs') || '[]');
            logs.unshift(checkLog);
            localStorage.setItem('milestoneCheckLogs', JSON.stringify(logs.slice(0, config.MILESTONE_CHECK_LOG_MAX)));
          } catch (e) {
            // Ignore storage errors
          }
        } else {
          console.error('❌ Milestone check failed:', response.status, response.statusText);
        }
      } catch (error) {
        // Silent fail - don't disrupt user experience
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Milestone check error:', error);
        }
      }
    };
    
    // Run check after configured delay to not block initial page load
    const timer = setTimeout(checkMilestones, config.MILESTONE_CHECK_DELAY);
    
    return () => clearTimeout(timer);
  }, []);
  
  // This component doesn't render anything
  return null;
}
