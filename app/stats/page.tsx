"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, RefreshCw, Loader2, Activity, ArrowUpRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

type TimeRange = "day" | "week" | "month";

const PLATFORMS = ["YouTube", "Telegram", "Instagram"];
const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "24 Hours", value: "day" },
  { label: "7 Days", value: "week" },
  { label: "30 Days", value: "month" },
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

export default function StatsPage() {
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

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
    
    // Use YouTube's history as the base (they should all have same timestamps)
    return stats[0].history.map((item, index) => {
      const dataPoint: Record<string, any> = {
        time: item.time,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-block mb-4">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-purple-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Activity className="w-10 h-10 text-cyan-400" />
                Statistics Dashboard
              </h1>
              <p className="text-gray-300 mt-2">Real-time growth trends and historical data</p>
            </div>
            <Button
              onClick={fetchStats}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-400">Last updated: {lastUpdated}</p>
          )}
        </div>

        {/* Current Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card
              key={stat.platform}
              className={`bg-gradient-to-br ${COLOR_CLASSES[stat.platform]} border-2 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm`}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-300 text-sm font-medium uppercase tracking-wider">{stat.platform}</p>
                    <h3 className="text-4xl font-bold text-white mt-2">
                      {stat.count.toLocaleString()}
                    </h3>
                    {stat.history.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                        <ArrowUpRight className="w-4 h-4" />
                        +{getGrowth(stat.platform).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} style={{ backgroundColor: COLORS[stat.platform] + "20" }}>
                    <TrendingUp
                      className="w-6 h-6"
                      style={{ color: COLORS[stat.platform] }}
                    />
                  </div>
                </div>
                {stat.views !== undefined && (
                  <div className="text-xs text-gray-400 pt-3 border-t border-white/10">
                    <p>👁️ Views: {stat.views.toLocaleString()}</p>
                    {stat.videos !== undefined && <p>🎬 Videos: {stat.videos}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
              {range.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : chartData.length > 0 ? (
          <Card className="bg-gray-800/40 border-purple-500/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Platform Comparison</CardTitle>
              <CardDescription>
                Compare all platforms side by side for the last {
                  timeRange === "day" ? "24 hours" : timeRange === "week" ? "7 days" : "30 days"
                }
              </CardDescription>
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
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    cursor={{ fill: "#333" }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend 
                    wrapperStyle={{ color: "#999", paddingTop: "20px" }}
                  />
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
        ) : (
          <Card className="bg-gray-800/40 border-purple-500/30 backdrop-blur-md">
            <CardContent className="pt-12">
              <div className="h-96 flex items-center justify-center text-gray-400 flex-col gap-2">
                <Activity className="w-12 h-12 text-gray-600" />
                <p>No data available yet. Please try again in a few moments.</p>
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
                    {stat.platform} Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">Current Count</p>
                      <p className="text-3xl font-bold text-white">{stat.count.toLocaleString()}</p>
                    </div>
                    {stat.history.length > 0 && (
                      <>
                        <div>
                          <p className="text-gray-400 text-sm">Data Points</p>
                          <p className="text-lg font-semibold text-cyan-400">{stat.history.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Total Growth</p>
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
