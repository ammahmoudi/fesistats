"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Rocket, AlertCircle, CheckCircle2, Loader2, Users, LogOut, BarChart3, Upload } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/LanguageContext";

interface ApiResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  message: string;
  error?: string;
}

const PLATFORMS = ["YouTube", "Telegram", "Instagram"];

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [platform, setPlatform] = useState("YouTube");
  const [milestone, setMilestone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [useTemplate, setUseTemplate] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    setAdminToken(token);
    
    // Fetch subscriber count
    fetch(`/api/telegram-bot/subscribers?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => setSubscriberCount(data.count || 0))
      .catch(console.error);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    toast.success(t('loginSuccess'));
    router.push('/admin');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Image uploaded!", { description: `File: ${file.name}` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    
    setSending(true);
    setResult(null);

    if (!message.trim()) {
      toast.error(t('error'), { description: t('subscribeError') });
      setSending(false);
      return;
    }

    if (useTemplate && !milestone.trim()) {
      toast.error(t('error'), { description: t('subscribeError') });
      setSending(false);
      return;
    }

    try {
      const payload: any = { 
        platform,
        message
      };

      if (useTemplate) {
        payload.milestone = milestone;
        payload.template = true;
      } else {
        payload.template = false;
        if (imageUrl.trim()) {
          payload.imageUrl = imageUrl;
        }
      }

      const res = await fetch('/api/telegram-bot/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setResult(data);

      if (!res.ok || !data.success) {
        toast.error(t('broadcastFailed'), { description: data.error || data.message || t('subscribeError') });
      } else {
        if (data.total === 0) {
          toast.warning(t('noSubscribers'), { description: t('noSubscribersDesc') });
        } else {
          toast.success(t('broadcastSent'), { description: `${data.successful}/${data.total} ${t('delivered')}` });
          // Refresh subscriber count
          const countRes = await fetch(`/api/telegram-bot/subscribers?token=${encodeURIComponent(adminToken)}`);
          const countData = await countRes.json();
          setSubscriberCount(countData.count || 0);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t('requestFailed'), { description: err instanceof Error ? err.message : t('subscribeError') });
    } finally {
      setSending(false);
    }
  };

  if (!adminToken) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <LanguageToggle />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-2 md:gap-3">
              <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-pink-300" />
              {t('adminDashboard')}
            </h1>
            <p className="text-gray-300 text-sm md:text-base mt-1">{t('manageBroadcasts')}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
            <Button
              onClick={() => router.push('/admin/milestones')}
              variant="outline"
              className="flex-1 md:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
            >
              <span className="hidden sm:inline">{t('milestoneButton')}</span>
              <span className="sm:hidden">🏆</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 md:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              {t('logout')}
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

        {/* Stats Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-pink-600/20">
                  <Users className="w-6 h-6 text-pink-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('totalSubscribers')}</p>
                  <p className="text-3xl font-bold text-white">
                    {subscriberCount !== null ? subscriberCount : '...'}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-600/20 text-green-300 border-green-500/30">{t('live')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Broadcast Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="w-8 h-8 text-pink-300" />
              <CardTitle className="text-3xl text-white font-bold">{t('broadcastNotification')}</CardTitle>
            </div>
            <CardDescription className="text-gray-300">
              {t('sendToSubscribers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Toggle */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1">
                  <p className="text-white font-medium">{t('useTemplate')}</p>
                  <p className="text-xs text-gray-400">{t('useTemplateDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseTemplate(!useTemplate)}
                  title={useTemplate ? t('useTemplateDesc') : t('customMessage')}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                    useTemplate ? 'bg-pink-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      isRTL
                        ? useTemplate ? '-translate-x-7' : '-translate-x-0.5'
                        : useTemplate ? 'translate-x-7' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {useTemplate ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                          platform === p 
                            ? 'bg-pink-600 text-white border-pink-500' 
                            : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="milestone" className="text-white">{t('milestoneLabel')}</Label>
                    <Input
                      id="milestone"
                      placeholder={t('milestonePlaceholder')}
                      value={milestone}
                      onChange={(e) => setMilestone(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">{t('customMessage')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('customMessagePlaceholder')}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-white">{t('imageUrlLabel')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder={t('imageUrlPlaceholder')}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 flex-1"
                      />
                      <label htmlFor="imageUpload" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          onClick={() => document.getElementById('imageUpload')?.click()}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </label>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        title="Upload image file"
                        aria-label="Upload image file"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{t('imageUrlTip')}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="bg-pink-600/20 border-pink-500/30 text-pink-300 hover:bg-pink-600/30"
                        onClick={() => setImageUrl('/main_banner.webp')}
                      >
                        📸 Use Main Banner
                      </Button>
                    </div>
                    {imageFile && (
                      <p className="text-xs text-green-400">✓ File uploaded: {imageFile.name}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="customMessage" className="text-white">{t('customMessage')}</Label>
                    <Textarea
                      id="customMessage"
                      placeholder={t('customMessagePlaceholder')}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl2" className="text-white">{t('imageUrlLabel')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageUrl2"
                        type="url"
                        placeholder={t('imageUrlPlaceholder')}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 flex-1"
                      />
                      <label htmlFor="imageUpload2" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          onClick={() => document.getElementById('imageUpload2')?.click()}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </label>
                      <input
                        id="imageUpload2"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        title="Upload image file"
                        aria-label="Upload image file"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{t('imageUrlTip')}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="bg-pink-600/20 border-pink-500/30 text-pink-300 hover:bg-pink-600/30"
                        onClick={() => setImageUrl('/main_banner.webp')}
                      >
                        📸 Use Main Banner
                      </Button>
                    </div>
                    {imageFile && (
                      <p className="text-xs text-green-400">✓ File uploaded: {imageFile.name}</p>
                    )}
                  </div>
                </>
              )}

              {useTemplate && (
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{t('platform')}: <Badge className="bg-pink-600 text-white border-pink-500">{platform}</Badge></span>
                  <span>{message.length}/500</span>
                </div>
              )}

              {!useTemplate && (
                <div className="text-xs text-gray-400 text-right">
                  {message.length}/500
                </div>
              )}

              <Button
                type="submit"
                disabled={sending || message.length > 500}
                className="w-full bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 disabled:opacity-50"
              >
                {sending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('sending')}...</span>
                ) : (
                  <span className="flex items-center gap-2"><Send className="w-4 h-4" /> {t('sendButton')}</span>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-8 p-4 rounded-lg border border-white/20 bg-white/5 space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  {result.success ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                  {t('deliveryReport')}
                </h3>
                <p className="text-sm text-gray-300">{result.message}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-white font-bold">{result.total}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('totalSubs')}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-green-300 font-bold">{result.successful}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('delivered')}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-yellow-300 font-bold">{result.total - result.successful}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('pendingFailed')}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-pink-300 font-bold">{platform}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('platform')}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
