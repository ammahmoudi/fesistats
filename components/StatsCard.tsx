"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { FaYoutube, FaTelegram, FaInstagram } from "react-icons/fa";

interface StatsCardProps {
  platform: string;
  username: string;
  url: string;
  icon: "youtube" | "telegram" | "instagram";
  color: "red" | "blue" | "pink";
  metric: string;
}

const iconMap = {
  youtube: FaYoutube,
  telegram: FaTelegram,
  instagram: FaInstagram,
};

export default function StatsCard({
  platform,
  username,
  url,
  icon,
  color,
  metric,
}: StatsCardProps) {
  const [count, setCount] = useState<number | null>(null);
  const [extraInfo, setExtraInfo] = useState<{ views?: number; videos?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const REFRESH_COOLDOWN = 30000; // 30 seconds cooldown

  const Icon = iconMap[icon];

  const fetchStats = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '';
      let dataKey = '';
      
      if (platform === "YouTube") {
        endpoint = '/api/youtube';
        dataKey = 'subscriberCount';
      } else if (platform === "Telegram") {
        endpoint = '/api/telegram';
        dataKey = 'membersCount';
      } else if (platform === "Instagram") {
        endpoint = '/api/instagram';
        dataKey = 'followersCount';
      }
      
      if (endpoint) {
        // Add refresh parameter if force refresh is requested
        const url = forceRefresh ? `${endpoint}?refresh=true` : endpoint;
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`${platform} API Error:`, errorData);
          setError(errorData.message || 'Failed to fetch data');
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setCount(data[dataKey]);
        setIsLiveData(true); // All server data is considered live (either real-time or cached)
        setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString());
        
        // Store YouTube extra info if available
        if (platform === "YouTube" && data.viewCount && data.videoCount) {
          setExtraInfo({
            views: data.viewCount,
            videos: data.videoCount
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [platform]);

  const handleRefresh = async () => {
    // Check cooldown - prevent spam clicking
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      const remainingSeconds = Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000);
      toast.warning('Please wait', {
        description: `You can refresh again in ${remainingSeconds} seconds`,
      });
      return;
    }
    
    setRefreshing(true);
    setLastRefreshTime(now);
    
    // Force refresh: bypass cache and get fresh data from APIs
    await fetchStats(true);
    
    if (isLiveData && !error) {
      toast.success(`${platform} data refreshed`, {
        description: `Updated at ${new Date().toLocaleTimeString()}`,
      });
    } else if (error) {
      toast.error('Failed to refresh data', {
        description: error,
      });
    }
  };

  const colorClasses = {
    red: "from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 border-red-500/50",
    blue: "from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border-blue-500/50",
    pink: "from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 border-pink-500/50",
  };

  const formatNumber = (num: number) => {
    // Show exact number with comma separators
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className={`bg-gradient-to-br ${colorClasses[color]} border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                {platform}
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="text-white/80 font-medium">
                {username}
              </CardDescription>
            </div>
            <div className="text-white">
              <Icon className="w-12 h-12" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-white/30">
                  {metric}
                </Badge>
                
                {/* Live Indicator Badge - Always show as LIVE since server data is cached */}
                <Badge variant="secondary" className="bg-green-500/90 text-white border-green-400 flex items-center gap-1 animate-pulse">
                  <Wifi className="w-3 h-3" />
                  LIVE
                </Badge>
              </div>
              
              {/* Refresh Button */}
              {!loading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRefresh();
                  }}
                  disabled={refreshing}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={refreshing ? "Refreshing..." : "Force refresh data"}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            
            {loading ? (
              <Skeleton className="h-12 w-32 bg-white/20" />
            ) : (
              <>
                <p className="text-4xl font-bold text-white">
                  {count !== null ? formatNumber(count) : "—"}
                </p>
                
                {/* YouTube Extra Info */}
                {platform === "YouTube" && extraInfo && (
                  <div className="space-y-1 pt-2 border-t border-white/20">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/70">👁️ Views:</span>
                      <span className="text-white font-semibold">
                        {formatNumber(extraInfo.views || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/70">🎬 Videos:</span>
                      <span className="text-white font-semibold">
                        {formatNumber(extraInfo.videos || 0)}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Last Updated / Error Message */}
                <div className="min-h-5">
                  {error ? (
                    <p className="text-xs text-red-200 flex items-center gap-1">
                      <WifiOff className="w-3 h-3" />
                      {error} • Please try refreshing
                    </p>
                  ) : lastUpdated ? (
                    <p className="text-xs text-white/60">
                      Updated: {lastUpdated}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
