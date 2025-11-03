"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2 } from "lucide-react";

export default function NotificationForm() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Notification subscription:", formData);
    setSubmitted(true);
    setLoading(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ email: "", phone: "" });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-500/20 p-3 rounded-full">
              <Bell className="w-8 h-8 text-purple-300" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Get Notified
          </CardTitle>
          <CardDescription className="text-gray-300 text-base">
            Subscribe to receive notifications when ItzFesi reaches new milestones!
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-6 text-center space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-300" />
              </div>
              <p className="text-green-300 text-lg font-semibold">
                Thank you for subscribing!
              </p>
              <p className="text-green-200 text-sm">
                You&apos;ll be notified about new records and milestones.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="phone" className="text-white font-medium">
                    Phone Number
                  </Label>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    Optional
                  </Badge>
                </div>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                size="lg"
              >
                {loading ? "Subscribing..." : "Subscribe for Notifications"}
              </Button>
            </form>
          )}

          <p className="text-gray-400 text-xs text-center mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
