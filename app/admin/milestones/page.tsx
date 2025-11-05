"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw, TrendingUp, Award, History } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/LanguageContext";

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
  const { t } = useLanguage();

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
      console.log(`🔍 Fetching milestone history with token...`);
      console.log(`📍 Token (first 20 chars): ${token.substring(0, 20)}...`);
      
      const url = `/api/admin/history?token=${encodeURIComponent(token)}&type=milestones`;
      console.log(`🌐 Fetching from: ${url}`);
      
      const res = await fetch(url);
      
      console.log(`📨 Response status: ${res.status}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log(`📊 History API response:`, data);
        console.log(`📊 History object:`, data.history);
        console.log(`📊 History keys:`, data.history ? Object.keys(data.history) : 'none');
        
        if (data.history && typeof data.history === 'object') {
          console.log(`✅ Setting history with ${Object.keys(data.history).length} platforms`);
          setMilestonesHistory(data.history);
        } else {
          console.warn(`⚠️  No history data in response, setting empty`);
          setMilestonesHistory({});
        }
      } else {
        console.error(`❌ Failed to fetch history: ${res.status}`);
        const errorData = await res.json();
        console.error(`Error details:`, errorData);
        setMilestonesHistory({});
      }
    } catch (err) {
      console.error('Error fetching milestone history:', err);
      setMilestonesHistory({});
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
      <LanguageToggle />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-2 md:gap-3">
              <Award className="w-8 h-8 md:w-10 md:h-10 text-pink-300" />
              {t('milestoneTracker')}
            </h1>
            <p className="text-gray-300 text-sm md:text-base mt-1">{t('automatedMilestoneDetection')}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="outline"
              className="flex-1 md:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
            >
              {t('backToDashboard')}
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex-1 md:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
            >
              {t('backToHome')}
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-300" />
              {t('howItWorksMillestones')}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {t('automaticNotifications')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">{t('trackedMilestonesTitle')}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('everyOneK')}</li>
                <li>{t('everyFiveK')}</li>
                <li>{t('majorMilestones')}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">{t('automatedCheckingMethods')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 shrink-0">{t('clientSideLabel')}</Badge>
                  <span>{t('clientSideCheckText')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 shrink-0">{t('githubActionsLabel')}</Badge>
                  <span>{t('githubActionsCheckText')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30 shrink-0">{t('vercelCronLabel')}</Badge>
                  <span>{t('vercelCronCheckText')}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 pl-2 border-l-2 border-white/20">
                  {t('reliabilityNote')}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">{t('notificationsLabelMilestone')}</h3>
              <p className="text-sm">
                {t('notificationsTextMilestone')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manual Check Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{t('manualCheckCard')}</CardTitle>
            <CardDescription className="text-gray-300">
              {t('forceCheckText')}
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
                  <Loader2 className="w-4 h-4 animate-spin" /> {t('checking')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> {t('checkMilestonesNow')}
                </span>
              )}
            </Button>

            {result && (
              <div className="mt-6 p-4 rounded-lg border border-white/20 bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    {t('checkResultsTitle')}
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
                    <p className="text-sm text-white font-semibold">{t('currentStatsSection')}</p>
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
                              <span className="text-gray-400">👁️ {t('views')}:</span>
                              <span className="text-gray-300 font-medium">
                                {stat.extraInfo.views?.toLocaleString() || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">🎬 {t('videos')}:</span>
                              <span className="text-gray-300 font-medium">
                                {stat.extraInfo.videos?.toLocaleString() || 'N/A'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          Last notified: {stat.lastNotified ? new Date(stat.lastNotified).toLocaleString() : t('never')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-300">{result.message}</p>
                
                {result.notifications.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-white font-semibold">{t('milestonesDetectedSection')}</p>
                    {result.notifications.map((notif, i) => (
                      <div key={i} className="bg-green-500/10 rounded-lg p-3 border border-green-500/30 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{notif.platform}</p>
                          <p className="text-sm text-gray-300">{t('milestoneLabelSmall')} {notif.milestone}</p>
                        </div>
                        <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                          {notif.delivered} {t('notified')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center mt-4">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-white font-bold">{result.checked}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('platformsCheckedLabel')}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-pink-300 font-bold">{result.notifications.length}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('notificationsSentLabel')}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check Schedule Details */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-xl text-white">⏰ {t('checkScheduleTitle')}</CardTitle>
            <CardDescription className="text-gray-300">
              {t('checkScheduleDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium">{t('clientSidePollingTitle')}</p>
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">{t('clientSidePollingStatus')}</Badge>
              </div>
              <p className="text-xs text-gray-300">{t('clientSidePollingDesc')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('clientSidePollingFeatures')}</p>
            </div>

            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium">{t('githubActionsPollingTitle')}</p>
                <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">{t('githubActionsFrequency')}</Badge>
              </div>
              <p className="text-xs text-gray-300">{t('githubActionsPollingDesc')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('githubActionsPollingFeatures')}</p>
            </div>

            <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium">{t('vercelCronPollingTitle')}</p>
                <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30">{t('vercelCronFrequency')}</Badge>
              </div>
              <p className="text-xs text-gray-300">{t('vercelCronPollingDesc')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('vercelCronPollingFeatures')}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-3">
              <p className="text-xs text-gray-400 text-center">
                {t('proTip')}
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
                  <CardTitle className="text-2xl text-white">{t('milestoneHistoryTitle')}</CardTitle>
                  <CardDescription className="text-gray-300">{t('allMilestonesReached')}</CardDescription>
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
                Object.entries(milestonesHistory).map(([platform, records]: [string, any]) => {
                  // Ensure records is an array
                  const recordsArray = Array.isArray(records) ? records : [];
                  console.log(`📋 Rendering platform ${platform} with ${recordsArray.length} records`);
                  
                  return (
                  <div key={platform} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white font-semibold mb-3 capitalize flex items-center justify-between">
                      {platform}
                      <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                        {recordsArray.length} milestone{recordsArray.length !== 1 ? 's' : ''}
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {recordsArray.length > 0 ? (
                        recordsArray.map((record: any, idx: number) => (
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
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">No records for this platform</p>
                      )}
                    </div>
                  </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-8">
                  {loadingHistory ? t('loading') : t('noMilestonesRecorded')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Persistence Info */}
        <Card className="bg-green-500/10 border-green-500/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">{t('dataPersistenceTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="text-green-300 text-sm space-y-2">
            <p>{t('statsAutoSaved')}</p>
            <p>{t('milestonesRecorded')}</p>
            <p>{t('historicalDataKept')}</p>
            <p>{t('cachedStats')}</p>
            <p>{t('forceRefreshAvailable')}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
