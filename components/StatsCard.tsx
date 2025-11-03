"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    // Simulate fetching stats - in a real app, you'd call an API
    const fetchStats = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock data - replace with real API calls
      const mockCounts: Record<string, number> = {
        YouTube: 125000,
        Telegram: 45000,
        Instagram: 78000,
      };
      
      setCount(mockCounts[platform] || 0);
      setLoading(false);
    };

    fetchStats();
  }, [platform]);

  const colorClasses = {
    red: "from-red-500 to-red-700 hover:from-red-600 hover:to-red-800",
    blue: "from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800",
    pink: "from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800",
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg p-6 transition-all duration-300 transform hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{platform}</h2>
          <p className="text-white/80 text-sm">{username}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
      
      <div className="mt-4">
        <p className="text-white/80 text-sm uppercase tracking-wider mb-2">
          {metric}
        </p>
        {loading ? (
          <div className="h-12 flex items-center">
            <div className="animate-pulse bg-white/20 h-8 w-32 rounded"></div>
          </div>
        ) : (
          <p className="text-4xl font-bold text-white">
            {count !== null ? formatNumber(count) : "—"}
          </p>
        )}
      </div>
    </a>
  );
}
