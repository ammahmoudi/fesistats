"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/LanguageContext";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  // Check if already logged in
  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify token by making a test request
      const res = await fetch('/api/telegram-bot/subscribers?token=' + encodeURIComponent(token));
      
      if (res.ok) {
        // Store token in session storage
        sessionStorage.setItem('admin_token', token);
        toast.success(t("loginSuccess"), { description: t("redirectingToDashboard") });
        setTimeout(() => router.push('/admin/dashboard'), 500);
      } else {
        toast.error(t("loginInvalid"), { description: t("loginInvalidDesc") });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("loginError"), { description: t("loginFailedDesc") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center px-4">
      <LanguageToggle />
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-pink-600/20">
              <Lock className="w-8 h-8 text-pink-300" />
            </div>
          </div>
          <CardTitle className="text-3xl text-white font-bold">{t("adminLoginPageTitle")}</CardTitle>
          <CardDescription className="text-gray-300">
            {t("adminLoginPageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-white">{t("adminTokenLabel")}</Label>
              <Input
                id="token"
                type="password"
                placeholder={t("adminTokenPlaceholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                required
              />
              <p className="text-xs text-gray-400">
                {t("adminTokenHint")}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("loginVerifying")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> {t("loginButton")}
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              ← {t("backToHome")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
