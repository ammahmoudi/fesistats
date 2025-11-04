"use client";

import StatsCard from "@/components/StatsCard";
import NotificationForm from "@/components/NotificationForm";
import MilestoneChecker from "@/components/MilestoneChecker";
import LanguageToggle from "@/components/LanguageToggle";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Language Toggle */}
      <LanguageToggle />
      
      {/* Silent milestone checker (runs in background) */}
      <MilestoneChecker />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              {t('title')}
            </h1>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/50 animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <p className="text-xl text-gray-300">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCard
            platform="YouTube"
            username="@itzfesi"
            url="https://www.youtube.com/@itzfesi"
            icon="youtube"
            color="red"
            metric="Subscribers"
          />
          <StatsCard
            platform="Telegram"
            username="@ItzFesi"
            url="https://t.me/ItzFesi"
            icon="telegram"
            color="blue"
            metric="Members"
          />
          <StatsCard
            platform="Instagram"
            username="@itz.fesi"
            url="https://www.instagram.com/itz.fesi/"
            icon="instagram"
            color="pink"
            metric="Followers"
          />
        </div>

        {/* Notification Subscription */}
        <NotificationForm />

        {/* Footer */}
        <footer className="text-center text-gray-400 mt-12">
          <p>Stay updated with ItzFesi&apos;s latest milestones</p>
        </footer>
      </div>
    </main>
  );
}
