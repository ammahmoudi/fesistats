"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface StatsCardProps {
  platform: string;
  username: string;
  url: string;
  icon: string;
  color: "red" | "blue" | "pink";
  metric: string;
}

export default function StatsCard({
  platform,
  username,
  url,
  icon,
  color,
  metric,
}: StatsCardProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (platform === "YouTube") {
        // Fetch real YouTube data from API route
        // Server handles caching (5 min), so multiple users get cached data
        const response = await fetch('/api/youtube');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('YouTube API Error:', errorData);
          setError(errorData.message || 'Failed to fetch data');
          // Fall back to mock data on error
          setCount(125000);
          setIsLiveData(false);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setCount(data.subscriberCount);
        setIsLiveData(true);
        setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString());
      } else if (platform === "Telegram") {
        // Fetch real Telegram data from API route
        const response = await fetch('/api/telegram');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Telegram API Error:', errorData);
          setError(errorData.message || 'Failed to fetch data');
          // Fall back to mock data on error
          setCount(45000);
          setIsLiveData(false);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setCount(data.membersCount);
        setIsLiveData(true);
        setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString());
      } else {
        // Mock data for Instagram - replace with real API call later
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockCounts: Record<string, number> = {
          Instagram: 78000,
        };
        setCount(mockCounts[platform] || 0);
        setIsLiveData(false);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Network error');
      // Fall back to mock data on error
      const fallbackCounts: Record<string, number> = {
        YouTube: 125000,
        Telegram: 45000,
        Instagram: 78000,
      };
      setCount(fallbackCounts[platform] || 0);
      setIsLiveData(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 minutes for live data
    const interval = setInterval(() => {
      if ((platform === "YouTube" || platform === "Telegram") && isLiveData) {
        fetchStats();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [platform]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    
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
        {/* Live Indicator Badge */}
        <div className="absolute top-3 right-3 z-10">
          {isLiveData ? (
            <Badge variant="secondary" className="bg-green-500/90 text-white border-green-400 flex items-center gap-1 animate-pulse">
              <Wifi className="w-3 h-3" />
              LIVE
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              DEMO
            </Badge>
          )}
        </div>

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
            <div className="text-4xl">{icon}</div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-white/30">
                {metric}
              </Badge>
              
              {/* Refresh Button */}
              {(platform === "YouTube" || platform === "Telegram") && !loading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRefresh();
                  }}
                  disabled={refreshing}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20"
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
                
                {/* Last Updated / Error Message */}
                <div className="min-h-[20px]">
                  {error ? (
                    <p className="text-xs text-red-200 flex items-center gap-1">
                      <WifiOff className="w-3 h-3" />
                      {error} • Using demo data
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
