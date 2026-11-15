"use client";

import React, { useState } from "react";
import { AlertLog } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogDetailModal } from "@/components/logs/LogDetailModal";
import { CheckCircle2, XCircle, AlertTriangle, MessageSquare, Mail, Eye } from "lucide-react";

interface LogTableProps {
  logs: AlertLog[];
}

export function LogTable({ logs }: LogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AlertLog | null>(null);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-zinc-800/80 bg-zinc-900/20">
        <p className="text-sm font-medium text-zinc-300">No execution logs found</p>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Execution logs are recorded each time a static alert or cron job triggers. You can test-trigger any alert with the "Run Now" button.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Executed Time</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Channels</th>
              <th className="py-3 px-4">Subject Line</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="hover:bg-zinc-900/40 cursor-pointer transition-colors group"
              >
                {/* Executed Time */}
                <td className="py-3 px-4">
                  <div className="font-medium text-zinc-200">
                    {timeAgo(log.executed_at)}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {formatDate(log.executed_at)}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  {log.status === "SUCCESS" && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Success
                    </Badge>
                  )}
                  {log.status === "PARTIAL" && (
                    <Badge variant="warning">
                      <AlertTriangle className="h-3 w-3" /> Partial
                    </Badge>
                  )}
                  {log.status === "FAILED" && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3" /> Failed
                    </Badge>
                  )}
                </td>

                {/* Channels */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    {log.channels_attempted.includes("whatsapp") && (
                      <span
                        title={`WhatsApp: ${log.whatsapp_status}`}
                        className={`inline-flex items-center p-1 rounded ${
                          log.whatsapp_status === "SUCCESS"
                            ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50"
                            : "bg-rose-950/50 text-rose-400 border border-rose-800/50"
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {log.channels_attempted.includes("email") && (
                      <span
                        title={`Email: ${log.email_status}`}
                        className={`inline-flex items-center p-1 rounded ${
                          log.email_status === "SUCCESS"
                            ? "bg-sky-950/50 text-sky-400 border border-sky-800/50"
                            : "bg-rose-950/50 text-rose-400 border border-rose-800/50"
                        }`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Subject */}
                <td className="py-3 px-4 max-w-xs truncate text-zinc-300 font-medium">
                  {log.rendered_subject || "—"}
                </td>

                {/* Duration */}
                <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                  {log.duration_ms}ms
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-zinc-800 hover:border-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLog(log);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Inspect
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LogDetailModal
        log={selectedLog}
        open={Boolean(selectedLog)}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </>
  );
}
