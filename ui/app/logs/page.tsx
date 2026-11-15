"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  RefreshCw, 
  Play, 
  ListFilter, 
  Layers, 
  Clock, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogTable } from "@/components/logs/LogTable";
import { Alert as AlertType, AlertLog } from "@/lib/types";
import { fetchLogs, fetchAlert, triggerAlertNow } from "@/lib/api";
import { formatCronDescription, formatDate } from "@/lib/utils";

function LogsContent() {
  const searchParams = useSearchParams();
  const alertId = searchParams.get("alert_id") || undefined;

  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AlertType | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedLogs = await fetchLogs(alertId);
      setLogs(fetchedLogs);

      if (alertId) {
        const alertData = await fetchAlert(alertId);
        setCurrentAlert(alertData);
      } else {
        setCurrentAlert(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load execution logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [alertId]);

  const handleTriggerNow = async () => {
    if (!alertId) return;
    setTriggering(true);
    try {
      await triggerAlertNow(alertId);
      // Wait briefly for execution and reload
      setTimeout(() => {
        loadData();
      }, 600);
    } catch (err: any) {
      setError(`Trigger failed: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const successCount = logs.filter((l) => l.status === "SUCCESS").length;
  const failedCount = logs.filter((l) => l.status === "FAILED").length;
  const partialCount = logs.filter((l) => l.status === "PARTIAL").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="h-8 border-zinc-800 hover:border-zinc-700">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-sky-400" />
              {currentAlert ? `Execution History: ${currentAlert.subject}` : "Global Execution Logs"}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {currentAlert
                ? `Showing triggered execution records for client ${currentAlert.client_name} (${currentAlert.business_name})`
                : "Real-time log stream across all marketing alerts and background cron executions"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {alertId && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTriggerNow}
              disabled={triggering}
              className="border-zinc-800 hover:border-zinc-700 text-xs text-emerald-400"
            >
              <Play className="h-3 w-3 mr-1" />
              {triggering ? "Dispatching..." : "Run Now (Test)"}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="border-zinc-800 hover:border-zinc-700 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>

          {alertId && (
            <Link href="/logs">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-400 hover:text-zinc-200">
                Show All Logs
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Alert Context Header Card (if filtered by alert) */}
      {currentAlert && (
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                Target Alert Configuration
              </span>
              <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">
                {currentAlert.subject}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {currentAlert.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="secondary">Paused</Badge>
              )}
              {currentAlert.channel_type === "WHATSAPP" && <Badge variant="whatsapp">WhatsApp</Badge>}
              {currentAlert.channel_type === "EMAIL" && <Badge variant="email">Email</Badge>}
              {currentAlert.channel_type === "BOTH" && (
                <Badge className="bg-purple-950/50 text-purple-300 border-purple-800/50">
                  Both Channels
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-zinc-800/60">
            <div>
              <span className="text-zinc-500 text-[11px] block">Business / Client</span>
              <span className="text-zinc-200 font-medium">
                {currentAlert.business_name} → {currentAlert.client_name}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-[11px] block">Recipient Contact</span>
              <span className="text-zinc-200 font-mono text-[11px]">
                {currentAlert.phone_number || ""} {currentAlert.email ? `(${currentAlert.email})` : ""}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-[11px] block">Schedule Type</span>
              <span className="text-zinc-200 font-mono text-[11px] flex items-center gap-1">
                {currentAlert.schedule_type === "CRON" ? (
                  <>
                    <Clock className="h-3 w-3 text-amber-400" />
                    {currentAlert.cron_expression ? formatCronDescription(currentAlert.cron_expression) : "Cron"}
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3 text-sky-400" />
                    Once: {formatDate(currentAlert.run_at)}
                  </>
                )}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-[11px] block">Next Scheduled Run</span>
              <span className="text-zinc-200 font-mono text-[11px]">
                {currentAlert.is_active ? formatDate(currentAlert.next_run_at) : "Paused"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Pills */}
      <div className="flex items-center space-x-3 text-xs">
        <span className="text-zinc-500 font-mono text-[11px]">
          Total Recorded: <strong className="text-zinc-200">{logs.length}</strong>
        </span>
        <span className="text-zinc-700">•</span>
        <span className="text-emerald-400 font-mono text-[11px]">
          Success: <strong>{successCount}</strong>
        </span>
        {partialCount > 0 && (
          <>
            <span className="text-zinc-700">•</span>
            <span className="text-amber-400 font-mono text-[11px]">
              Partial: <strong>{partialCount}</strong>
            </span>
          </>
        )}
        {failedCount > 0 && (
          <>
            <span className="text-zinc-700">•</span>
            <span className="text-rose-400 font-mono text-[11px]">
              Failed: <strong>{failedCount}</strong>
            </span>
          </>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="h-64 rounded-xl border border-zinc-800/80 bg-zinc-900/20 animate-pulse" />
      ) : (
        <LogTable logs={logs} />
      )}
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-xl border border-zinc-800/80 bg-zinc-900/20 animate-pulse" />}>
      <LogsContent />
    </Suspense>
  );
}
