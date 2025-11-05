"use client";

import { useEffect } from 'react';

/**
 * Client-side milestone checker that triggers checks when users visit the site.
 * This works on Vercel Hobby plan (where cron is limited to once/day).
 * 
 * Throttled to check at most every 2 hours to avoid excessive API calls.
 */
export default function MilestoneChecker() {
  useEffect(() => {
    const checkMilestones = async () => {
      // Get last check time from localStorage
      const lastCheck = localStorage.getItem('lastMilestoneCheck');
      const now = Date.now();
      
      // Throttle: Only check every 2 hours (7200000 ms)
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      
      if (lastCheck && now - parseInt(lastCheck) < TWO_HOURS) {
        // Too soon, skip check
        if (process.env.NODE_ENV === 'development') {
          console.log('⏸️  Milestone check skipped (too soon)');
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
            localStorage.setItem('milestoneCheckLogs', JSON.stringify(logs.slice(0, 5)));
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
    
    // Run check after 5 seconds to not block initial page load
    const timer = setTimeout(checkMilestones, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // This component doesn't render anything
  return null;
}
