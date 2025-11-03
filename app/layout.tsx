import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fesi Stats - ItzFesi Social Media Statistics",
  description: "Real-time statistics for ItzFesi's YouTube, Telegram, and Instagram channels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
