"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, ReferenceArea, ReferenceLine } from "recharts";
import { TrendingUp, Calendar, RefreshCw, Loader2, Activity, ArrowUpRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

interface StatData {
  platform: string;
  count: number;
  views?: number;
  videos?: number;
  history: Array<{
    timestamp: number;
    count: number;
    time: string;
  }>;
}

interface MilestoneRecord {
  platform: string;
  value: number;
  timestamp: number;
  notified: boolean;
}

interface StreamRecord {
  videoId: string;
  title: string;
  startTime: number;
  endTime?: number;
  isLive: boolean;
  viewCount?: number;
}

type TimeRange = "day" | "week" | "month";

const PLATFORMS = ["YouTube", "Telegram", "Instagram"];
const PLATFORM_KEYS: Record<string, string> = {
  "YouTube": "youtube",
  "Telegram": "telegram",
  "Instagram": "instagram",
};
const TIME_RANGES: { label: string; shortLabel: string; value: TimeRange }[] = [
  { label: "hours24", shortLabel: "hours24Short", value: "day" },
  { label: "days7", shortLabel: "days7Short", value: "week" },
  { label: "days30", shortLabel: "days30Short", value: "month" },
];

const COLORS: Record<string, string> = {
  YouTube: "#EF4444",
  Telegram: "#06B6D4",
  Instagram: "#EC4899",
};

const COLOR_CLASSES: Record<string, string> = {
  YouTube: "from-red-600/20 to-red-900/20 border-red-500/30",
  Telegram: "from-cyan-600/20 to-cyan-900/20 border-cyan-500/30",
  Instagram: "from-pink-600/20 to-pink-900/20 border-pink-500/30",
};

// Custom tooltip for milestones and streams
const CustomTooltip = ({ active, payload, label, milestoneMarkers, streamMarkers }: any) => {
  if (!active || !payload) return null;

  // Check if this data point has a milestone
  const milestoneAtPoint = milestoneMarkers?.find((m: any) => m.time === label);
  
  // Check if this data point is within a stream
  // Use timestamp comparison for accuracy since we now have interpolated points
  const currentTimestamp = payload[0]?.payload?.timestamp;
  const streamAtPoint = streamMarkers?.find((s: any) => {
    if (s.endTimestamp && currentTimestamp) {
      // For completed streams, check if timestamp is between start and end
      return currentTimestamp >= s.startTimestamp && currentTimestamp <= s.endTimestamp;
    } else if (s.startTimestamp && currentTimestamp) {
      // For ongoing streams, check if timestamp matches start (within 5 minutes)
      return Math.abs(currentTimestamp - s.startTimestamp) < 5 * 60 * 1000;
    }
    return false;
  });

  return (
    <div
      style={{
        backgroundColor: "#1f2937",
        border: "1px solid #4b5563",
        borderRadius: "8px",
        padding: "12px",
        color: "#fff",
        maxWidth: "320px",
      }}
    >
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ color: entry.color }} className="flex items-center gap-2">
          <span>{entry.name}:</span>
          <span className="font-bold">{entry.value.toLocaleString()}</span>
        </div>
      ))}
      
      {/* Show stream info if hovering over a stream period */}
      {streamAtPoint && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{streamAtPoint.isLive ? '🔴' : '📺'}</span>
            <span className="font-bold text-red-400">
              {streamAtPoint.isLive ? 'LIVE Stream' : 'Stream'}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <div className="text-gray-300 font-medium truncate" title={streamAtPoint.title}>
              {streamAtPoint.title.length > 40 
                ? streamAtPoint.title.substring(0, 40) + '...' 
                : streamAtPoint.title}
            </div>
            <div className="text-gray-400">
              ⏱️ Duration: <span className="text-white">{streamAtPoint.duration}</span>
            </div>
            <div className="text-gray-400">
              👥 Subscribers: <span className="text-white">
                {streamAtPoint.startCount.toLocaleString()} → {streamAtPoint.endCount.toLocaleString()}
              </span>
            </div>
            <div className={`font-semibold ${streamAtPoint.subscriberChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {streamAtPoint.subscriberChange >= 0 ? '↗️' : '↘️'} {streamAtPoint.subscriberChange >= 0 ? '+' : ''}{streamAtPoint.subscriberChange.toLocaleString()} subscribers
            </div>
          </div>
        </div>
      )}
      
      {milestoneAtPoint && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="flex items-center gap-2 text-pink-300">
            <span className="text-xl">🏆</span>
            <span className="font-bold">
              {milestoneAtPoint.platform} Milestone: {milestoneAtPoint.value.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [milestones, setMilestones] = useState<Record<string, MilestoneRecord[]>>({});
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [streams, setStreams] = useState<StreamRecord[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchStats();
    fetchMilestones();
    fetchStreams();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStats();
      fetchMilestones();
      fetchStreams();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMilestones = async () => {
    try {
      setLoadingMilestones(true);
      // Try to get admin token from sessionStorage
      const adminToken = sessionStorage.getItem('admin_token');
      if (!adminToken) {
        console.warn('⚠️ No admin token - milestone markers will not be shown on chart');
        console.log('💡 Visit /admin page and login to enable milestone markers');
        return;
      }

      const res = await fetch(`/api/admin/history?token=${encodeURIComponent(adminToken)}&type=milestones`);
      
      if (!res.ok) {
        console.error('❌ Failed to fetch milestones:', res.status);
        return;
      }
      
      const data = await res.json();
      if (data.success && data.history) {
        setMilestones(data.history);
        console.log('✅ Milestones loaded:', Object.keys(data.history).length, 'platforms');
      }
    } catch (error) {
      console.error("❌ Error fetching milestones:", error);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const fetchStreams = async () => {
    try {
      setLoadingStreams(true);
      const res = await fetch(`/api/youtube/streams?range=${timeRange}&refresh=false`);
      
      if (!res.ok) {
        console.error('Failed to fetch streams:', res.status);
        return;
      }
      
      const data = await res.json();
      if (data.success && data.streams) {
        setStreams(data.streams);
        console.log(`✅ Loaded ${data.streams.length} stream(s)`);
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoadingStreams(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stats?history=true&range=${timeRange}`);
      
      if (!res.ok) throw new Error("Failed to fetch stats");
      
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
      } else {
        toast.error("Failed to load statistics");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error loading statistics");
    } finally {
      setLoading(false);
    }
  };

  // Build chart data from all platforms
  const buildChartData = () => {
    if (stats.length === 0 || !stats[0]?.history?.length) return [];
    
    // Helper function to format time in browser's timezone
    const formatTime = (timestamp: number, timeRange: string) => {
      const date = new Date(timestamp);
      
      if (timeRange === 'day') {
        // For day view: show HH:MM format
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        });
      } else if (timeRange === 'week') {
        // For week view: show day name and time
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } else {
        // For month view: show date and time
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    };
    
    // Use YouTube's history as the base (they should all have same timestamps)
    return stats[0].history.map((item, index) => {
      const formattedTime = formatTime(item.timestamp, timeRange);
      
      const dataPoint: Record<string, any> = {
        time: formattedTime, // Format on client side
        timestamp: item.timestamp, // Keep the actual timestamp for milestone matching
      };
      
      // Add count from each platform at this time index
      stats.forEach(stat => {
        if (stat.history[index]) {
          dataPoint[stat.platform] = stat.history[index].count;
        }
      });
      
      return dataPoint;
    });
  };

  const chartData = buildChartData();
  
  // Get growth for each platform
  const getGrowth = (platform: string) => {
    const stat = stats.find(s => s.platform === platform);
    if (!stat || !stat.history || stat.history.length < 2) return 0;
    return stat.history[stat.history.length - 1].count - stat.history[0].count;
  };

  // Find milestone markers within the current time range
  const getMilestoneMarkers = () => {
    if (!chartData.length || Object.keys(milestones).length === 0 || !stats.length) return [];
    
    const markers: Array<{
      platform: string;
      value: number;
      time: string;
      timestamp: number;
      yValue: number; // The actual Y coordinate from chart data
    }> = [];

    // For each platform's milestones
    Object.entries(milestones).forEach(([platform, records]) => {
      records.forEach((milestone) => {
        // Find where this milestone value actually appears in the chart
        // Look for the first point where the count reaches or exceeds the milestone
        let foundPoint: any = null;
        
        for (let i = 0; i < chartData.length; i++) {
          const point = chartData[i];
          const platformValue = point[milestone.platform];
          const prevValue = i > 0 ? chartData[i - 1][milestone.platform] : 0;
          
          if (platformValue !== undefined && prevValue !== undefined) {
            // Check if we crossed the milestone between these two points
            if (prevValue < milestone.value && platformValue >= milestone.value) {
              foundPoint = point;
              break;
            }
          }
        }
        
        // If no crossing found, look for closest match (within 2% tolerance)
        if (!foundPoint) {
          let bestMatch: any = null;
          let smallestDiff = Infinity;
          
          for (const point of chartData) {
            const platformValue = point[milestone.platform];
            if (platformValue !== undefined) {
              const diff = Math.abs(platformValue - milestone.value);
              const percentDiff = (diff / milestone.value) * 100;
              
              if (percentDiff < 2 && diff < smallestDiff) {
                smallestDiff = diff;
                bestMatch = point;
              }
            }
          }
          
          if (bestMatch) {
            foundPoint = bestMatch;
          }
        }

        if (foundPoint) {
          const yValue = foundPoint[milestone.platform];
          markers.push({
            platform: milestone.platform,
            value: milestone.value,
            time: foundPoint.time,
            timestamp: foundPoint.timestamp,
            yValue: yValue,
          });
        }
      });
    });

    console.log(`🏆 Total milestone markers: ${markers.length}`);
    if (markers.length > 0) {
      console.log(`📍 Sample marker:`, markers[0]);
    }
    return markers;
  };

  const milestoneMarkers = getMilestoneMarkers();
  console.log(`\n🎯 MILESTONE MARKERS READY: ${milestoneMarkers.length} marker(s)`);

  // Get stream markers for the chart
  const getStreamMarkers = () => {
    if (!chartData.length || !streams.length || !stats.length) return [];
    
    const markers: Array<{
      startTime: string;
      endTime?: string;
      startTimestamp: number;
      endTimestamp?: number;
      title: string;
      isLive: boolean;
      duration: string;
      subscriberChange: number;
      startCount: number;
      endCount: number;
    }> = [];

    const chartStartTime = stats[0]?.history[0]?.timestamp || 0;
    const chartEndTime = stats[0]?.history[stats[0].history.length - 1]?.timestamp || Date.now();

    streams.forEach((stream, idx) => {
      // Check if stream overlaps with chart time range
      const streamEnd = stream.endTime || Date.now();
      const overlaps = (stream.startTime >= chartStartTime && stream.startTime <= chartEndTime) ||
                       (streamEnd >= chartStartTime && streamEnd <= chartEndTime);
      
      if (!overlaps) return;
      
      // Create interpolated points for stream start and end times
      // This allows exact stream timing without being limited to hourly data points
      
      // Helper function to interpolate data between two chart points
      const interpolatePoint = (timestamp: number, time: string) => {
        // Find surrounding points
        let beforePoint = chartData[0];
        let afterPoint = chartData[chartData.length - 1];
        
        for (let i = 0; i < chartData.length - 1; i++) {
          if (chartData[i].timestamp <= timestamp && chartData[i + 1].timestamp >= timestamp) {
            beforePoint = chartData[i];
            afterPoint = chartData[i + 1];
            break;
          }
        }
        
        // If exact match, return that point
        if (beforePoint.timestamp === timestamp) return { ...beforePoint, time };
        if (afterPoint.timestamp === timestamp) return { ...afterPoint, time };
        
        // Interpolate between points
        const range = afterPoint.timestamp - beforePoint.timestamp;
        const position = timestamp - beforePoint.timestamp;
        const ratio = range > 0 ? position / range : 0.5;
        
        return {
          time,
          timestamp,
          YouTube: Math.round((beforePoint.YouTube || 0) * (1 - ratio) + (afterPoint.YouTube || 0) * ratio),
          Telegram: Math.round((beforePoint.Telegram || 0) * (1 - ratio) + (afterPoint.Telegram || 0) * ratio),
          Instagram: Math.round((beforePoint.Instagram || 0) * (1 - ratio) + (afterPoint.Instagram || 0) * ratio),
        };
      };
      
      // Format time for stream points - must match chart's formatTime logic
      const formatStreamTime = (timestamp: number) => {
        const date = new Date(timestamp);
        
        if (timeRange === 'day') {
          // For day view: show HH:MM format (matches buildChartData)
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          });
        } else if (timeRange === 'week') {
          // For week view: show day name and time
          return date.toLocaleDateString('en-US', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } else {
          // For month view: show date and time
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      };
      
      // Create start and end points
      const startTime = formatStreamTime(stream.startTime);
      const startPoint = interpolatePoint(stream.startTime, startTime);
      
      let endPoint;
      let endTime;
      if (stream.endTime) {
        endTime = formatStreamTime(stream.endTime);
        endPoint = interpolatePoint(stream.endTime, endTime);
      }
      
      // Calculate subscriber change during stream (YouTube platform)
      const startYouTube = startPoint.YouTube || 0;
      const endYouTube = endPoint?.YouTube || startYouTube;
      const subscriberChange = endYouTube - startYouTube;
      
      // Calculate duration
      const durationMs = stream.endTime ? (stream.endTime - stream.startTime) : (Date.now() - stream.startTime);
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      const marker = {
        startTime: startTime,
        endTime: endTime,
        startTimestamp: stream.startTime,
        endTimestamp: stream.endTime,
        title: stream.title,
        isLive: stream.isLive,
        duration: durationStr,
        subscriberChange,
        startCount: startYouTube,
        endCount: endYouTube,
      };
      
      markers.push(marker);
      
      // Add interpolated points to chart data for Recharts to use
      if (!chartData.find(p => p.time === startTime)) {
        chartData.push(startPoint);
      }
      if (endPoint && endTime && !chartData.find(p => p.time === endTime)) {
        chartData.push(endPoint);
      }
    });

    // Sort chartData by timestamp after adding stream points
    chartData.sort((a, b) => a.timestamp - b.timestamp);
    
    return markers;
  };

  const streamMarkers = getStreamMarkers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-12 px-4 sm:px-6 lg:px-8">
      <LanguageToggle />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-block mb-4">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-purple-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToHome')}
            </Button>
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Activity className="w-10 h-10 text-cyan-400" />
                {t('statisticsTitle')}
              </h1>
              <p className="text-gray-300 mt-2">{t('realTimeGrowth')}</p>
            </div>
            <Button
              onClick={() => {
                fetchStats();
                fetchMilestones();
                fetchStreams();
              }}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t('refresh')}
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-400">{t('lastUpdated')} {lastUpdated}</p>
          )}
        </div>

        {/* Time Range Selection */}
        <div className="mb-8 flex gap-3 flex-wrap">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`transition-all ${
                timeRange === range.value
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                  : "border-2 border-gray-600 text-gray-300 hover:border-purple-500 bg-transparent"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t(range.label as any)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : chartData.length > 0 ? (
          <>
            <Card className="bg-gray-800/40 border-purple-500/30 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">{t('platformComparison')}</CardTitle>
                    <CardDescription>
                      {t('comparePlatformsText')} {t(
                        timeRange === "day" ? "hours24Short" : timeRange === "week" ? "days7Short" : "days30Short"
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {streamMarkers.length > 0 && (
                      <Badge className="bg-red-600/20 text-red-300 border-red-500/30">
                        📺 {streamMarkers.length} {streamMarkers.length === 1 ? 'Stream' : 'Streams'}
                      </Badge>
                    )}
                    {milestoneMarkers.length > 0 && (
                      <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30">
                        🏆 {milestoneMarkers.length} {milestoneMarkers.length === 1 ? 'Milestone' : 'Milestones'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#999"
                    tick={{ fill: "#999", fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#999"
                    tick={{ fill: "#999", fontSize: 12 }}
                  />
                  <Tooltip
                    content={<CustomTooltip milestoneMarkers={milestoneMarkers} streamMarkers={streamMarkers} />}
                    cursor={{ fill: "#333" }}
                  />
                  <Legend 
                    wrapperStyle={{ color: "#999", paddingTop: "20px" }}
                  />
                  
                  {/* Stream markers - shaded regions for completed, vertical lines for ongoing */}
                  {streamMarkers.map((stream, idx) => {
                    return stream.endTime ? (
                      // Completed stream - show shaded area (using interpolated exact times)
                      <ReferenceArea
                        key={`stream-${idx}`}
                        x1={stream.startTime}
                        x2={stream.endTime}
                        fill="#EF4444"
                        fillOpacity={0.15}
                        stroke="#EF4444"
                        strokeOpacity={0.5}
                        label={{
                          value: stream.isLive ? '🔴 LIVE' : '📺',
                          position: 'insideTopLeft',
                          fill: '#EF4444',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    ) : (
                      // Ongoing stream without end time - show vertical line
                      <ReferenceLine
                        key={`stream-line-${idx}`}
                        x={stream.startTime}
                        stroke="#EF4444"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        label={{
                          value: '🔴 LIVE',
                          position: 'top',
                          fill: '#EF4444',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    );
                  })}
                  
                  {/* Milestone markers - BEFORE lines so they're visible */}
                  {milestoneMarkers.map((marker, idx) => {
                    // Find the actual chart point that matches this milestone's timestamp
                    const chartPoint = chartData.find(p => p.timestamp === marker.timestamp);
                    if (!chartPoint) return null;
                    
                    return (
                      <ReferenceDot
                        key={`milestone-${idx}`}
                        x={chartPoint.time}
                        y={marker.yValue}
                        r={8}
                        fill={COLORS[marker.platform]}
                        stroke="#fff"
                        strokeWidth={2}
                        label={{
                          value: `${marker.value.toLocaleString()}`,
                          position: 'top',
                          fill: COLORS[marker.platform],
                          fontSize: 11,
                          fontWeight: 'bold',
                          offset: 10,
                        }}
                      />
                    );
                  })}
                  
                  {PLATFORMS.map((platform) => (
                    <Line
                      key={platform}
                      type="monotone"
                      dataKey={platform}
                      stroke={COLORS[platform]}
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={500}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Milestone Legend */}
          {(milestoneMarkers.length > 0 || streamMarkers.length > 0) && (
            <Card className="bg-pink-500/10 border-pink-500/30 backdrop-blur-md mt-6">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {milestoneMarkers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500 border-2 border-white"></div>
                      <span className="text-sm text-gray-300">Milestone markers show when a platform first reached a follower milestone</span>
                    </div>
                  )}
                  {streamMarkers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-3 bg-red-500/20 border border-red-500"></div>
                      <span className="text-sm text-gray-300">Shaded regions show YouTube live stream periods</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
        ) : (
          <Card className="bg-gray-800/40 border-purple-500/30 backdrop-blur-md">
            <CardContent className="pt-12">
              <div className="h-96 flex items-center justify-center text-gray-400 flex-col gap-2">
                <Activity className="w-12 h-12 text-gray-600" />
                <p>{t('noDataAvailable')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Summary Cards */}
        {stats.length > 0 && chartData.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={`info-${stat.platform}`} className={`bg-gradient-to-br ${COLOR_CLASSES[stat.platform]} border-2 backdrop-blur-sm transition-all hover:scale-105`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[stat.platform] }} />
                    {t(PLATFORM_KEYS[stat.platform] as any)} {t('summary')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">{t('currentCount')}</p>
                      <p className="text-3xl font-bold text-white">{stat.count.toLocaleString()}</p>
                    </div>
                    {stat.history.length > 0 && (
                      <>
                        <div>
                          <p className="text-gray-400 text-sm">{t('dataPoints')}</p>
                          <p className="text-lg font-semibold text-cyan-400">{stat.history.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">{t('totalGrowth')}</p>
                          <p className="text-lg font-semibold text-green-400 flex items-center gap-1">
                            <ArrowUpRight className="w-4 h-4" />
                            +{(stat.history[stat.history.length - 1].count - stat.history[0].count).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
