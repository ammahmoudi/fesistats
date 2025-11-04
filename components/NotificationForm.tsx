"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Send } from "lucide-react";
import { FaTelegram } from "react-icons/fa";

export default function NotificationForm() {
  const [botUsername, setBotUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch bot username from API
    fetch('/api/telegram-bot/info')
      .then(res => res.json())
      .then(data => {
        setBotUsername(data.username);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch bot info:', err);
        setLoading(false);
      });
  }, []);

  const handleTelegramConnect = () => {
    if (botUsername) {
      // Open Telegram bot in new window
      window.open(`https://t.me/${botUsername}?start=subscribe`, '_blank');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Bell className="w-8 h-8 text-blue-300" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Get Notified via Telegram
          </CardTitle>
          <CardDescription className="text-gray-300 text-base">
            Receive instant notifications when ItzFesi reaches new milestones!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* How it works */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              How it works:
            </h3>
            <ol className="text-gray-300 text-sm space-y-2 ml-7 list-decimal">
              <li>Click the button below to open our Telegram bot</li>
              <li>Press <span className="text-blue-300 font-semibold">/start</span> to subscribe</li>
              <li>You&apos;ll receive notifications for new milestones!</li>
            </ol>
          </div>

          {/* Connect Button */}
          <Button
            onClick={handleTelegramConnect}
            disabled={loading || !botUsername}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            size="lg"
          >
            <FaTelegram className="w-5 h-5 mr-2" />
            {loading ? "Loading..." : `Connect via Telegram`}
            <Send className="w-4 h-4 ml-2" />
          </Button>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-2xl mb-1">⚡</p>
              <p className="text-gray-300 text-xs">Instant notifications</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-2xl mb-1">🔒</p>
              <p className="text-gray-300 text-xs">Private & secure</p>
            </div>
          </div>

          <p className="text-gray-400 text-xs text-center">
            You can unsubscribe anytime by sending /stop to the bot
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
