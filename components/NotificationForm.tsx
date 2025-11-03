"use client";

import { useState } from "react";

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
    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-white mb-2 text-center">
        Get Notified
      </h2>
      <p className="text-gray-300 text-center mb-6">
        Subscribe to receive notifications when ItzFesi reaches new milestones!
      </p>

      {submitted ? (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 text-center">
          <p className="text-green-300 text-lg font-semibold">
            ✓ Thank you for subscribing!
          </p>
          <p className="text-green-200 text-sm mt-2">
            You&apos;ll be notified about new records and milestones.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-white mb-2 font-medium">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-white mb-2 font-medium">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Subscribing..." : "Subscribe for Notifications"}
          </button>
        </form>
      )}

      <p className="text-gray-400 text-xs text-center mt-4">
        We respect your privacy. Unsubscribe anytime.
      </p>
    </div>
  );
}
