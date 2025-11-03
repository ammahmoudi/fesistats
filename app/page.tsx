import StatsCard from "@/components/StatsCard";
import NotificationForm from "@/components/NotificationForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            ItzFesi Stats
          </h1>
          <p className="text-xl text-gray-300">
            Real-time social media statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCard
            platform="YouTube"
            username="@itzfesi"
            url="https://www.youtube.com/@itzfesi"
            icon="🎥"
            color="red"
            metric="Subscribers"
          />
          <StatsCard
            platform="Telegram"
            username="@ItzFesi"
            url="https://t.me/ItzFesi"
            icon="✈️"
            color="blue"
            metric="Members"
          />
          <StatsCard
            platform="Instagram"
            username="@itz.fesi"
            url="https://www.instagram.com/itz.fesi/"
            icon="📷"
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
