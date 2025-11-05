"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw, TrendingUp, Award, History } from "lucide-react";

interface MilestoneCheck {
  success: boolean;
  checked: number;
  stats?: Array<{ 
    platform: string; 
    count: number; 
    lastNotified: number | null;
    extraInfo?: { views?: number; videos?: number };
  }>;
  notifications: Array<{ platform: string; milestone: string; delivered: number }>;
  message: string;
  checkedAt?: string;
}

interface MilestoneRecord {
  platform: string;
  value: number;
  timestamp: number;
  notified: boolean;
}

export default function MilestonesPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<MilestoneCheck | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [milestonesHistory, setMilestonesHistory] = useState<Record<string, MilestoneRecord[]>>({});
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    setAdminToken(token);
    fetchMilestoneHistory(token);
  }, [router]);

  const fetchMilestoneHistory = async (token: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/admin/history?token=${token}&type=milestones`);
      
      if (res.ok) {
        const data = await res.json();
        setMilestonesHistory(data.history || {});
      }
    } catch (err) {
      console.error('Error fetching milestone history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

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
          // Refresh history after successful notification
          if (adminToken) {
            await fetchMilestoneHistory(adminToken);
          }
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
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
              <h3 className="text-white font-semibold mb-2">⚙️ Automated Checking Methods:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 shrink-0">Client-Side</Badge>
                  <span>Homepage checks every <strong className="text-white">2 hours</strong> when users visit</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 shrink-0">GitHub Actions</Badge>
                  <span>Automated workflow runs every <strong className="text-white">3 hours</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30 shrink-0">Vercel Cron</Badge>
                  <span>Scheduled check runs <strong className="text-white">once daily</strong> (Hobby plan)</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 pl-2 border-l-2 border-white/20">
                  Multiple methods ensure reliable milestone detection even with free tier limitations
                </p>
              </div>
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
                        
                        {/* YouTube Extra Info */}
                        {stat.platform === 'YouTube' && stat.extraInfo && (
                          <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">👁️ Total Views:</span>
                              <span className="text-gray-300 font-medium">
                                {stat.extraInfo.views?.toLocaleString() || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">🎬 Videos:</span>
                              <span className="text-gray-300 font-medium">
                                {stat.extraInfo.videos?.toLocaleString() || 'N/A'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          Last notified: {stat.lastNotified ? new Date(stat.lastNotified).toLocaleString() : 'Never'}
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

        {/* Check Schedule Details */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-xl text-white">⏰ Check Schedule</CardTitle>
            <CardDescription className="text-gray-300">
              Multiple automated methods for reliability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium">🌐 Client-Side Polling</p>
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">Active</Badge>
              </div>
              <p className="text-xs text-gray-300">Checks every 2 hours when users visit homepage</p>
              <p className="text-xs text-gray-400 mt-1">✓ Works on all Vercel plans • No configuration needed</p>
            </div>

            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium">⚡ GitHub Actions</p>
                <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">Every 3 hours</Badge>
              </div>
              <p className="text-xs text-gray-300">Automated workflow using GitHub's free tier</p>
              <p className="text-xs text-gray-400 mt-1">✓ Most reliable method • Runs 8 times per day</p>
            </div>

            <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium">⏰ Vercel Cron</p>
                <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30">Daily</Badge>
              </div>
              <p className="text-xs text-gray-300">Scheduled at midnight (00:00 UTC)</p>
              <p className="text-xs text-gray-400 mt-1">✓ Backup method • Hobby plan limitation</p>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-3">
              <p className="text-xs text-gray-400 text-center">
                💡 <strong className="text-white">Pro Tip:</strong> The system uses whichever method triggers first, ensuring milestones are caught quickly
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Milestone History */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-purple-300" />
                <div>
                  <CardTitle className="text-2xl text-white">Milestone History</CardTitle>
                  <CardDescription className="text-gray-300">All milestones reached</CardDescription>
                </div>
              </div>
              <Button
                onClick={() => adminToken && fetchMilestoneHistory(adminToken)}
                disabled={loadingHistory}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(milestonesHistory).length > 0 ? (
                Object.entries(milestonesHistory).map(([platform, records]) => (
                  <div key={platform} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white font-semibold mb-3 capitalize flex items-center justify-between">
                      {platform}
                      <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                        {records.length} milestone{records.length !== 1 ? 's' : ''}
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {records.map((record, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={record.notified ? 'bg-green-600/20 text-green-300 border-green-500/30' : 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30'}>
                              {record.notified ? '✓' : '◐'}
                            </Badge>
                            <div>
                              <p className="text-white font-semibold">{formatNumber(record.value)}</p>
                              <p className="text-xs text-gray-400">{formatDate(record.timestamp)}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/10 text-gray-300">
                            {record.notified ? 'Notified' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  {loadingHistory ? 'Loading...' : 'No milestones recorded yet'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Persistence Info */}
        <Card className="bg-green-500/10 border-green-500/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">✅ Data Persistence Enabled</CardTitle>
          </CardHeader>
          <CardContent className="text-green-300 text-sm space-y-2">
            <p>✓ All stats are now automatically saved to Redis storage</p>
            <p>✓ Milestone achievements are recorded in persistent storage</p>
            <p>✓ Historical data is kept for 90 days for analysis</p>
            <p>✓ Stats are fetched from cache when possible (minimal API calls)</p>
            <p>✓ Force refresh still available for real-time updates</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
