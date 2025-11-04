"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw, TrendingUp, Award } from "lucide-react";

interface MilestoneCheck {
  success: boolean;
  checked: number;
  stats?: Array<{ platform: string; count: number; lastNotified: number | null }>;
  notifications: Array<{ platform: string; milestone: string; delivered: number }>;
  message: string;
  checkedAt?: string;
}

export default function MilestonesPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<MilestoneCheck | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    setAdminToken(token);
  }, [router]);

  const handleCheckNow = async () => {
    setChecking(true);
    setResult(null);

    try {
      const res = await fetch('/api/check-milestones');
      const data = await res.json();
      setResult(data);

      if (data.success) {
        if (data.notifications.length > 0) {
          toast.success("Milestones detected!", { 
            description: `${data.notifications.length} notification(s) sent` 
          });
        } else {
          toast.info("No new milestones", { description: data.message });
        }
      } else {
        toast.error("Check failed", { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error("Request failed", { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      });
    } finally {
      setChecking(false);
    }
  };

  if (!adminToken) {
    return null;
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Award className="w-10 h-10 text-pink-300" />
              Milestone Tracker
            </h1>
            <p className="text-gray-300 mt-1">Automated milestone detection and notifications</p>
          </div>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            ← Back to Dashboard
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-300" />
              How It Works
            </CardTitle>
            <CardDescription className="text-gray-300">
              Automatic notifications for rounded subscriber milestones
            </CardDescription>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">📊 Tracked Milestones:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Every 1K from 1K to 10K</li>
                <li>Every 5K from 15K to 50K</li>
                <li>Major: 75K, 100K, 250K, 500K, 1M+</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">⚙️ Automated Checking:</h3>
              <p className="text-sm">
                Vercel Cron runs every <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30">6 hours</Badge> automatically checking YouTube, Telegram, and Instagram.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">🔔 Notifications:</h3>
              <p className="text-sm">
                When a milestone is reached, all Telegram subscribers receive an automatic celebration message.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manual Check Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Manual Check</CardTitle>
            <CardDescription className="text-gray-300">
              Force check for milestones right now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCheckNow}
              disabled={checking}
              className="w-full bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold transition-all duration-300"
            >
              {checking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Check Milestones Now
                </span>
              )}
            </Button>

            {result && (
              <div className="mt-6 p-4 rounded-lg border border-white/20 bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Check Results
                  </h3>
                  {result.checkedAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(result.checkedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                
                {/* Current Stats */}
                {result.stats && result.stats.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-white font-semibold">📊 Current Stats:</p>
                    {result.stats.map((stat, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-medium">{stat.platform}</p>
                          <p className="text-xl text-pink-300 font-bold">
                            {stat.count.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          Last notified: {stat.lastNotified ? stat.lastNotified.toLocaleString() : 'Never'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-300">{result.message}</p>
                
                {result.notifications.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-white font-semibold">🎉 Milestones Detected:</p>
                    {result.notifications.map((notif, i) => (
                      <div key={i} className="bg-green-500/10 rounded-lg p-3 border border-green-500/30 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{notif.platform}</p>
                          <p className="text-sm text-gray-300">Milestone: {notif.milestone}</p>
                        </div>
                        <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                          {notif.delivered} notified
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center mt-4">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-white font-bold">{result.checked}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Platforms Checked</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-pink-300 font-bold">{result.notifications.length}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Notifications Sent</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Check Info */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-300 text-center">
              <strong className="text-white">Next automatic check:</strong> Within 6 hours (Vercel Cron)
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
