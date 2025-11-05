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
import { Send, Rocket, AlertCircle, CheckCircle2, Loader2, Users, LogOut, BarChart3 } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";

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
  const router = useRouter();

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
    toast.success("Logged out");
    router.push('/admin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    
    setSending(true);
    setResult(null);

    if (!milestone.trim() || !message.trim()) {
      toast.error("Missing fields", { description: "Please fill milestone and message." });
      setSending(false);
      return;
    }

    try {
      const res = await fetch('/api/telegram-bot/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({ platform, milestone, message })
      });

      const data = await res.json();
      setResult(data);

      if (!res.ok || !data.success) {
        toast.error("Broadcast failed", { description: data.error || data.message || 'Unknown error' });
      } else {
        if (data.total === 0) {
          toast.warning("No subscribers", { description: "No users subscribed yet." });
        } else {
          toast.success("Broadcast sent", { description: `${data.successful}/${data.total} delivered` });
          // Refresh subscriber count
          const countRes = await fetch(`/api/telegram-bot/subscribers?token=${encodeURIComponent(adminToken)}`);
          const countData = await countRes.json();
          setSubscriberCount(countData.count || 0);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Request failed", { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSending(false);
    }
  };

  if (!adminToken) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <LanguageToggle />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-pink-300" />
              Admin Dashboard
            </h1>
            <p className="text-gray-300 mt-1">Manage broadcasts and monitor subscribers</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/admin/milestones')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              🏆 Milestones
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
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
                  <p className="text-sm text-gray-400">Total Subscribers</p>
                  <p className="text-3xl font-bold text-white">
                    {subscriberCount !== null ? subscriberCount : '...'}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-600/20 text-green-300 border-green-500/30">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Broadcast Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="w-8 h-8 text-pink-300" />
              <CardTitle className="text-3xl text-white font-bold">Broadcast Notification</CardTitle>
            </div>
            <CardDescription className="text-gray-300">
              Send a milestone update to all Telegram subscribers
            </CardDescription>
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="milestone" className="text-white">Milestone</Label>
                <Input
                  id="milestone"
                  placeholder="e.g. 10,000 Subscribers"
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-white">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write a short celebratory message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Platform: <Badge className="bg-pink-600 text-white border-pink-500">{platform}</Badge></span>
                <span>{message.length}/500</span>
              </div>

              <Button
                type="submit"
                disabled={sending || message.length > 500}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 disabled:opacity-50"
              >
                {sending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
                ) : (
                  <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Broadcast</span>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-8 p-4 rounded-lg border border-white/20 bg-white/5 space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  {result.success ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                  Delivery Report
                </h3>
                <p className="text-sm text-gray-300">{result.message}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-white font-bold">{result.total}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Subs</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-green-300 font-bold">{result.successful}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Delivered</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-yellow-300 font-bold">{result.total - result.successful}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pending/Failed</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-lg text-pink-300 font-bold">{platform}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Platform</p>
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
