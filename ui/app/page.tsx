"use client";

import { useEffect, useState } from "react";
import { Plus, Bell, Clock, Calendar, Search, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCard } from "@/components/alerts/AlertCard";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { Alert } from "@/lib/types";
import { fetchAlerts } from "@/lib/api";

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "STATIC" | "CRON">("ALL");

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load alerts from service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.business_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === "STATIC") return alert.schedule_type === "STATIC";
    if (filterType === "CRON") return alert.schedule_type === "CRON";
    return true;
  });

  const activeCount = alerts.filter((a) => a.is_active).length;
  const cronCount = alerts.filter((a) => a.schedule_type === "CRON").length;
  const staticCount = alerts.filter((a) => a.schedule_type === "STATIC").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Marketing Alerts & Jobs
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create automated WhatsApp and Email marketing triggers. Click on any alert to view its execution history in <code className="text-zinc-300 font-mono">/logs</code>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            disabled={loading}
            className="border-zinc-800 hover:border-zinc-700 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create New Alert
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Active Alert Jobs</span>
            <Bell className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {activeCount}
          </div>
          <span className="text-[11px] text-zinc-500">
            Ready to dispatch on schedule
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Cron Schedules</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {cronCount}
          </div>
          <span className="text-[11px] text-zinc-500">
            Recurring interval automations
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">One-Time (Static)</span>
            <Calendar className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {staticCount}
          </div>
          <span className="text-[11px] text-zinc-500">
            Targeted scheduled campaigns
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by client, business, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900/40 border-zinc-800/80 text-xs"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5 p-1 bg-zinc-900/60 rounded-lg border border-zinc-800/80 text-xs">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterType === "ALL"
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType("CRON")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterType === "CRON"
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Cron ({cronCount})
          </button>
          <button
            onClick={() => setFilterType("STATIC")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterType === "STATIC"
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Static ({staticCount})
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between">
          <span>Failed to connect to backend: {error}</span>
          <Button size="sm" variant="outline" onClick={loadAlerts} className="border-rose-800 text-rose-300 hover:bg-rose-900/40">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Grid of Alerts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-zinc-800/80 bg-zinc-900/20 animate-pulse"
            />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40">
          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <Bell className="h-6 w-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No alerts found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            {searchQuery
              ? "No alerts match your search query."
              : "Get started by creating your first static alert or recurring cron marketing schedule."}
          </p>
          {!searchQuery && (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="mt-4 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create First Alert
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onRefresh={loadAlerts} />
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      <CreateAlertModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAlertCreated={loadAlerts}
      />
    </div>
  );
}
