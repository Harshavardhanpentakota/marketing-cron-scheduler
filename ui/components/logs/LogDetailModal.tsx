"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Mail, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";

interface LogDetailModalProps {
  log: AlertLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDetailModal({ log, open, onOpenChange }: LogDetailModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base flex items-center gap-2">
              Execution Log Details
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
            </DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-3 text-zinc-400 font-mono text-[11px] pt-1">
            <span>Executed: {formatDate(log.executed_at)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {log.duration_ms}ms duration
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          {/* Rendered Subject & Body */}
          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
              Rendered Message Dispatched
            </span>
            <div>
              <span className="text-zinc-500 font-medium">Subject: </span>
              <span className="text-zinc-200 font-medium">{log.rendered_subject || "—"}</span>
            </div>
            <div className="pt-1">
              <span className="text-zinc-500 font-medium block mb-1">Body:</span>
              <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed text-xs">
                {log.rendered_body || "—"}
              </pre>
            </div>
          </div>

          {/* WhatsApp Channel Audit */}
          {log.channels_attempted.includes("whatsapp") && (
            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  WhatsApp Delivery Status
                </span>
                <Badge variant={log.whatsapp_status === "SUCCESS" ? "success" : "destructive"}>
                  {log.whatsapp_status}
                </Badge>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px] mb-1">Provider API Response:</span>
                <pre className="p-2 rounded bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-36">
                  {log.whatsapp_response || "No response details recorded."}
                </pre>
              </div>
            </div>
          )}

          {/* Email Channel Audit */}
          {log.channels_attempted.includes("email") && (
            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <Mail className="h-3.5 w-3.5 text-sky-400" />
                  Email Delivery Status
                </span>
                <Badge variant={log.email_status === "SUCCESS" ? "success" : "destructive"}>
                  {log.email_status}
                </Badge>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px] mb-1">SMTP/Service Response:</span>
                <pre className="p-2 rounded bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-36">
                  {log.email_response || "No response details recorded."}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
