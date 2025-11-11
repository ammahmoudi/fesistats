"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Search, RefreshCw, ArrowLeft, Loader2, UserCircle2, MessageCircle } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/LanguageContext";

interface Subscriber {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_bot?: boolean;
}

export default function SubscribersPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    setAdminToken(token);
    fetchSubscribers(token);
  }, [router]);

  const fetchSubscribers = async (token: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/telegram-bot/subscribers/details?token=${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }

      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.subscribers || []);
        if (isRefresh) {
          const cachedCount = data.cached || 0;
          const fetchedCount = data.fetched || 0;
          toast.success(t('success'), { 
            description: `${data.count} total • ${cachedCount} cached • ${fetchedCount} fetched from API` 
          });
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error(t('error'), { description: t('failedToLoad') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (adminToken) {
      fetchSubscribers(adminToken, true);
    }
  };

  // Filter subscribers based on search term
  const filteredSubscribers = useMemo(() => {
    if (!searchTerm.trim()) {
      return subscribers;
    }

    const term = searchTerm.toLowerCase();
    return subscribers.filter(sub => {
      const fullName = `${sub.first_name} ${sub.last_name || ''}`.toLowerCase();
      const username = sub.username?.toLowerCase() || '';
      const id = sub.id.toString();
      
      return fullName.includes(term) || username.includes(term) || id.includes(term);
    });
  }, [subscribers, searchTerm]);

  if (!adminToken) {
    return null;
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <LanguageToggle />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-2 md:gap-3">
              <Users className="w-8 h-8 md:w-10 md:h-10 text-pink-300" />
              {t('subscribersManagement')}
            </h1>
            <p className="text-gray-300 text-sm md:text-base mt-1">{t('subscribersManagementDesc')}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="outline"
              className="flex-1 md:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              {t('backToDashboard')}
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-pink-600/20">
                  <Users className="w-6 h-6 text-pink-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('totalBotSubscribers')}</p>
                  <p className="text-3xl font-bold text-white">
                    {loading ? '...' : subscribers.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('updateProfileTip')}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">{t('refreshSubscribers')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t('searchByName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-400"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                {filteredSubscribers.length} {t('noResults').toLowerCase()} {searchTerm ? `"${searchTerm}"` : ''}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Subscribers List */}
        {loading ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-pink-300 animate-spin" />
                <p className="text-white text-lg">{t('loadingSubscribers')}</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredSubscribers.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <Users className="w-16 h-16 text-gray-500" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {searchTerm ? t('noResults') : t('noSubscribersYet')}
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm ? t('tryDifferentSearch') : t('noSubscribersMessage')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubscribers.map((subscriber) => {
              // Create Telegram deep link
              const telegramLink = subscriber.username 
                ? `https://t.me/${subscriber.username}`
                : `tg://user?id=${subscriber.id}`;
              
              return (
                <Card
                  key={subscriber.id}
                  className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer group relative"
                  onClick={() => window.open(telegramLink, '_blank')}
                  title={`Click to contact ${subscriber.first_name}${subscriber.username ? ` (@${subscriber.username})` : ''} on Telegram`}
                >
                  <CardContent className="p-6">
                    {/* Click to message indicator */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageCircle className="w-5 h-5 text-pink-300" />
                    </div>
                    
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {subscriber.photo_url ? (
                          <img
                            src={subscriber.photo_url}
                            alt={subscriber.first_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-pink-500/30"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) {
                                (fallback as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-16 h-16 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center ${
                            subscriber.photo_url ? 'hidden' : 'flex'
                          }`}
                        >
                          <UserCircle2 className="w-10 h-10 text-white" />
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">
                          {subscriber.first_name} {subscriber.last_name || ''}
                        </h3>
                        
                        {subscriber.username && (
                          <p className="text-sm text-pink-300 truncate">
                            @{subscriber.username}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {t('subscriberId')}: <span className="font-mono">{subscriber.id}</span>
                        </p>
                        
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {subscriber.is_bot && (
                            <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30 text-xs">
                              {t('botUser')}
                            </Badge>
                          )}
                          <Badge className="bg-green-600/20 text-green-300 border-green-500/30 text-xs">
                            {t('joinedVia')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredSubscribers.length > 0 && (
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              {t('viewingSubscribers').replace('{count}', filteredSubscribers.length.toString())}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
