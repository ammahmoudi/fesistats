"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotifyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center px-4">
      <div className="text-center text-white">
        <p className="text-xl">Redirecting to admin login...</p>
      </div>
    </main>
  );
}
