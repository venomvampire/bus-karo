import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bus Karo | Compare & Book Buses in India",
  description: "Find the cheapest bus tickets across redBus, AbhiBus, Paytm, and more. Track live prices and PNR status.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="p-4 bg-blue-600 text-white shadow-md flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-wider">Bus Karo 🚌</h1>
          <div className="space-x-4">
            <Link href="/track" className="hover:underline text-white font-medium">
  Track PNR
</Link>
            <Link href="/login" className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition">
  Login
</Link>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}