"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

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
    red: "from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 border-red-500/50",
    blue: "from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border-blue-500/50",
    pink: "from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 border-pink-500/50",
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className={`bg-gradient-to-br ${colorClasses[color]} border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}>
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
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-white/30">
              {metric}
            </Badge>
            {loading ? (
              <Skeleton className="h-12 w-32 bg-white/20" />
            ) : (
              <p className="text-4xl font-bold text-white">
                {count !== null ? formatNumber(count) : "—"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
