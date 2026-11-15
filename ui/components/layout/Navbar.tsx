"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BellRing, ListFilter, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchHealth } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<{ status: string; scheduler_running: boolean; mock_dispatch: boolean } | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: "disconnected", scheduler_running: false, mock_dispatch: true }));
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Branding */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-100 group-hover:border-zinc-500 transition-colors">
              <BellRing className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-zinc-100">
                AutoAlert
              </span>
              <span className="block text-[10px] text-zinc-400 font-mono">
                cron & static scheduler
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 pl-4 border-l border-zinc-800">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === "/"
                  ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/logs"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname.startsWith("/logs")
                  ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Execution Logs
            </Link>
          </nav>
        </div>

        {/* Right Status */}
        <div className="flex items-center space-x-3">
          {health?.status === "healthy" ? (
            <Badge variant="success" className="text-[11px] py-1">
              <CheckCircle2 className="h-3 w-3" />
              Scheduler Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] py-1 text-zinc-400 border-zinc-800">
              <Activity className="h-3 w-3 animate-pulse text-zinc-500" />
              Service Connecting...
            </Badge>
          )}

          {health?.mock_dispatch && (
            <Badge variant="warning" className="text-[10px] hidden sm:inline-flex" title="Dispatches are safely simulated. Configure credentials in service/.env for live delivery.">
              Mock Dispatch
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
