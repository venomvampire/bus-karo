import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"; // <-- Import the Script component
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bus Karo | Compare & Book Buses in India",
  description: "Find the cheapest bus tickets across redBus, AbhiBus, Paytm, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The Google AdSense Global Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" // Replace with your real Publisher ID later
          crossOrigin="anonymous"
          strategy="afterInteractive" // Ensures it doesn't block your site from loading
        />
      </head>
      <body className={inter.className}>
        {/* ... your existing navbar ... */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}