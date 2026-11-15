"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Mail, 
  Layers, 
  Clock, 
  Calendar, 
  Play, 
  Pause, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/lib/types";
import { formatDate, formatCronDescription, timeAgo } from "@/lib/utils";
import { toggleAlertActive, deleteAlert, triggerAlertNow } from "@/lib/api";

interface AlertCardProps {
  alert: Alert;
  onRefresh: () => void;
}

export function AlertCard({ alert, onRefresh }: AlertCardProps) {
  const router = useRouter();
  const [triggering, setTriggering] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleTriggerNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setTriggering(true);
    try {
      const res = await triggerAlertNow(alert.id);
      setToastMsg("Triggered successfully! Opening logs...");
      setTimeout(() => {
        router.push(`/logs?alert_id=${alert.id}`);
      }, 700);
    } catch (err: any) {
      setToastMsg(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(true);
    try {
      await toggleAlertActive(alert.id);
      onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${alert.subject}"?`)) return;
    setDeleting(true);
    try {
      await deleteAlert(alert.id);
      onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const navigateToLogs = () => {
    router.push(`/logs?alert_id=${alert.id}`);
  };

  return (
    <Card 
      onClick={navigateToLogs}
      className="group relative cursor-pointer border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700/80 transition-all duration-200"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                {alert.business_name}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-300 font-medium">
                {alert.client_name}
              </span>
            </div>
            <CardTitle className="text-sm font-semibold text-zinc-100 group-hover:text-sky-300 transition-colors line-clamp-1">
              {alert.subject}
            </CardTitle>
          </div>

          {/* Status Badge */}
          <div>
            {alert.is_active ? (
              <Badge variant="success" className="text-[11px]">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[11px]">
                Paused
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Message preview snippet */}
        <p className="text-xs text-zinc-400 line-clamp-2 italic bg-zinc-950/40 p-2 rounded-lg border border-zinc-900">
          "{alert.body}"
        </p>

        {/* Schedule & Channel Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/40 text-xs">
          {/* Schedule */}
          <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
            {alert.schedule_type === "CRON" ? (
              <>
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{alert.cron_expression ? formatCronDescription(alert.cron_expression) : "Cron"}</span>
              </>
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5 text-sky-400" />
                <span>Once: {formatDate(alert.run_at)}</span>
              </>
            )}
          </div>

          {/* Channel badges */}
          <div className="flex items-center gap-1">
            {alert.channel_type === "WHATSAPP" && (
              <Badge variant="whatsapp" className="text-[10px] py-0.5">
                <MessageSquare className="h-2.5 w-2.5" /> WhatsApp
              </Badge>
            )}
            {alert.channel_type === "EMAIL" && (
              <Badge variant="email" className="text-[10px] py-0.5">
                <Mail className="h-2.5 w-2.5" /> Email
              </Badge>
            )}
            {alert.channel_type === "BOTH" && (
              <Badge className="bg-purple-950/40 text-purple-300 border-purple-800/40 text-[10px] py-0.5">
                <Layers className="h-2.5 w-2.5" /> Both
              </Badge>
            )}
          </div>
        </div>

        {/* Next Run & Last Run */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-zinc-400">
          <div>
            <span className="text-zinc-500 block text-[10px]">NEXT RUN</span>
            <span className="font-mono text-zinc-200">
              {alert.is_active ? formatDate(alert.next_run_at) : "Paused"}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">LAST RUN</span>
            <span className="font-mono text-zinc-300">
              {alert.last_run_at ? timeAgo(alert.last_run_at) : "Never"}
            </span>
          </div>
        </div>

        {toastMsg && (
          <div className="text-[11px] p-1.5 rounded bg-zinc-800 text-sky-300 animate-in fade-in">
            {toastMsg}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 pb-3 text-xs bg-zinc-950/30">
        {/* Click to open logs */}
        <span className="text-zinc-400 group-hover:text-zinc-200 flex items-center gap-1 text-[11px] font-medium transition-colors">
          View execution logs
          <ChevronRight className="h-3 w-3 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
        </span>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px] text-zinc-300 hover:text-white"
            onClick={handleTriggerNow}
            disabled={triggering}
            title="Trigger this alert right now (test)"
          >
            <Play className="h-3 w-3 mr-1 text-emerald-400" />
            {triggering ? "Running..." : "Run Now"}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
            onClick={handleToggle}
            disabled={toggling}
            title={alert.is_active ? "Pause schedule" : "Resume schedule"}
          >
            {alert.is_active ? (
              <Pause className="h-3 w-3 text-amber-400" />
            ) : (
              <Play className="h-3 w-3 text-zinc-400" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-zinc-400 hover:text-rose-400"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete alert"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
