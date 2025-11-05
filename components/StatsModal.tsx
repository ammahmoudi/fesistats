"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { X, RefreshCw, Loader2, Calendar, ArrowUpRight } from "lucide-react";

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

const COLORS: Record<string, string> = {
  YouTube: "#EF4444",
  Telegram: "#06B6D4",
  Instagram: "#EC4899",
};

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stats?history=true&range=${timeRange}`);

      if (!res.ok) throw new Error("Failed to fetch stats");

      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = () => {
    if (stats.length === 0 || !stats[0]?.history?.length) return [];

    return stats[0].history.map((item, index) => {
      const dataPoint: Record<string, any> = {
        time: item.time,
      };

      stats.forEach((stat) => {
        if (stat.history[index]) {
          dataPoint[stat.platform] = stat.history[index].count;
        }
      });

      return dataPoint;
    });
  };

  const chartData = buildChartData();

  const getGrowth = (platform: string) => {
    const stat = stats.find((s) => s.platform === platform);
    if (!stat || !stat.history || stat.history.length < 2) return 0;
    return stat.history[stat.history.length - 1].count - stat.history[0].count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Statistics Dashboard</DialogTitle>
          <DialogDescription className="text-gray-300">Real-time growth trends and platform comparison</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Time Range Selector */}
          <div className="flex gap-2 flex-wrap">
            {(["day", "week", "month"] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`transition-all ${
                  timeRange === range
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white border-0"
                    : "border-2 border-gray-600 text-gray-300 hover:border-purple-500 bg-transparent"
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {range === "day" ? "24 Hours" : range === "week" ? "7 Days" : "30 Days"}
              </Button>
            ))}
            <Button
              onClick={fetchStats}
              disabled={loading}
              variant="ghost"
              className="ml-auto text-gray-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Current Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const bgColor = COLORS[stat.platform];
              return (
                <div
                  key={stat.platform}
                  className="rounded-lg p-4 border-2 bg-opacity-10"
                  style={{
                    backgroundColor: bgColor + "20",
                    borderColor: bgColor + "50",
                  }}
                >
                  <p className="text-gray-300 text-sm uppercase tracking-wide mb-1">{stat.platform}</p>
                  <h3 className="text-3xl font-bold text-white">{stat.count.toLocaleString()}</h3>
                  {stat.history.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                      <ArrowUpRight className="w-4 h-4" />
                      +{getGrowth(stat.platform).toLocaleString()}
                    </div>
                  )}
                  {stat.views !== undefined && (
                    <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-white/10">
                      <p>👁️ Views: {stat.views.toLocaleString()}</p>
                      {stat.videos !== undefined && <p>🎬 Videos: {stat.videos}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chart */}
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="bg-gray-800/40 rounded-lg p-4 border border-purple-500/20 backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-white mb-4">Platform Comparison Chart</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                  <XAxis dataKey="time" stroke="#999" tick={{ fill: "#999", fontSize: 12 }} />
                  <YAxis stroke="#999" tick={{ fill: "#999", fontSize: 12 }} />
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
                  <Legend wrapperStyle={{ color: "#999", paddingTop: "10px" }} iconType="circle" />
                  {["YouTube", "Telegram", "Instagram"].map((platform) => (
                    <Bar
                      key={platform}
                      dataKey={platform}
                      fill={COLORS[platform]}
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={500}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <p>No data available yet</p>
            </div>
          )}

          {lastUpdated && <p className="text-xs text-gray-500 text-center">Last updated: {lastUpdated}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
