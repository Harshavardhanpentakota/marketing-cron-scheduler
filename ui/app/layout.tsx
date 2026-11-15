import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "AutoAlert | Marketing Cron Scheduler",
  description: "Schedule one-time and recurring marketing alerts via WhatsApp and Email.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-zinc-800 selection:text-white">
        <div className="relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-5 text-center text-xs text-zinc-500 font-mono">
            AutoAlert • Fast & Resilient Marketing Notification Scheduler
          </footer>
        </div>
      </body>
    </html>
  );
}
