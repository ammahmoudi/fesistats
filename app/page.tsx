"use client";

import StatsCard from "@/components/StatsCard";
import NotificationForm from "@/components/NotificationForm";
import MilestoneChecker from "@/components/MilestoneChecker";
import LanguageToggle from "@/components/LanguageToggle";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";

export default function Home() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Language Toggle */}
      <LanguageToggle />
      
      {/* Silent milestone checker (runs in background) */}
      <MilestoneChecker />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                {t('title')}
              </h1>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/50 animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                {t('live')}
              </Badge>
            </div>
            <Link href="/stats">
              <div className="px-6 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition cursor-pointer">
                {t('viewFullDashboard')}
              </div>
            </Link>
          </div>
          <p className="text-xl text-gray-300">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/stats" className="cursor-pointer group">
            <StatsCard
              platform="YouTube"
              username="@itzfesi"
              url="https://www.youtube.com/@itzfesi"
              icon="youtube"
              color="red"
              metric="Subscribers"
            />
            <p className="text-xs text-center text-gray-400 mt-2 group-hover:text-cyan-400 transition">{t('clickToViewStats')}</p>
          </Link>
          
          <Link href="/stats" className="cursor-pointer group">
            <StatsCard
              platform="Telegram"
              username="@ItzFesi"
              url="https://t.me/ItzFesi"
              icon="telegram"
              color="blue"
              metric="Members"
            />
            <p className="text-xs text-center text-gray-400 mt-2 group-hover:text-cyan-400 transition">{t('clickToViewStats')}</p>
          </Link>
          
          <Link href="/stats" className="cursor-pointer group">
            <StatsCard
              platform="Instagram"
              username="@itz.fesi"
              url="https://www.instagram.com/itz.fesi/"
              icon="instagram"
              color="pink"
              metric="Followers"
            />
            <p className="text-xs text-center text-gray-400 mt-2 group-hover:text-cyan-400 transition">{t('clickToViewStats')}</p>
          </Link>
        </div>

        {/* Notification Subscription */}
        <NotificationForm />

        {/* Footer */}
        <footer className="text-center text-gray-400 mt-12">
          <p>{t('stayUpdated')}</p>
        </footer>
      </div>
    </main>
  );
}
