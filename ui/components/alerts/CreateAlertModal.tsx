"use client";

import React, { useState } from "react";
import { MessageSquare, Mail, Layers, Calendar, Clock, Sparkles, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createAlert } from "@/lib/api";
import { AlertCreateInput, ScheduleType } from "@/lib/types";
import { formatCronDescription } from "@/lib/utils";

interface CreateAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAlertCreated: () => void;
}

export function CreateAlertModal({ open, onOpenChange, onAlertCreated }: CreateAlertModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [clientName, setClientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("STATIC");
  
  // Static schedule state
  const [runAt, setRunAt] = useState("");

  // Cron schedule state
  const [cronPreset, setCronPreset] = useState("daily_9am");
  const [customCron, setCustomCron] = useState("0 9 * * 1-5");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect delivery channel
  const hasPhone = Boolean(phoneNumber.trim());
  const hasEmail = Boolean(email.trim());

  let channelPreview = "none";
  if (hasPhone && hasEmail) channelPreview = "both";
  else if (hasPhone) channelPreview = "whatsapp";
  else if (hasEmail) channelPreview = "email";

  const getEffectiveCron = () => {
    switch (cronPreset) {
      case "5_min":
        return "*/5 * * * *";
      case "hourly":
        return "0 * * * *";
      case "daily_9am":
        return "0 9 * * *";
      case "weekly_monday":
        return "0 9 * * 1";
      case "monthly":
        return "0 9 1 * *";
      case "custom":
        return customCron;
      default:
        return "0 9 * * *";
    }
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    setBody((prev) => prev + placeholder);
  };

  const handleSetQuickStaticTime = (minutesAhead: number) => {
    const target = new Date(Date.now() + minutesAhead * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const offset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - offset).toISOString().slice(0, 16);
    setRunAt(localISOTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim() || !clientName.trim() || !subject.trim() || !body.trim()) {
      setError("Please fill in Business Name, Client Name, Subject, and Body.");
      return;
    }

    if (!hasPhone && !hasEmail) {
      setError("Please enter at least a Phone Number (WhatsApp) or an Email address.");
      return;
    }

    if (scheduleType === "STATIC" && !runAt) {
      setError("Please select a date and time for the one-time alert.");
      return;
    }

    setLoading(true);

    try {
      const payload: AlertCreateInput = {
        business_name: businessName.trim(),
        client_name: clientName.trim(),
        phone_number: hasPhone ? phoneNumber.trim() : undefined,
        email: hasEmail ? email.trim() : undefined,
        subject: subject.trim(),
        body: body.trim(),
        schedule_type: scheduleType,
        is_active: true,
      };

      if (scheduleType === "STATIC") {
        // convert local datetime-local string to ISO UTC
        const dateObj = new Date(runAt);
        payload.run_at = dateObj.toISOString();
      } else {
        payload.cron_expression = getEffectiveCron();
      }

      await createAlert(payload);
      onAlertCreated();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to schedule alert.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBusinessName("");
    setClientName("");
    setPhoneNumber("");
    setEmail("");
    setSubject("");
    setBody("");
    setScheduleType("STATIC");
    setRunAt("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl border-zinc-800">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-950/60 border border-sky-800/50 text-sky-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <DialogTitle>Create Marketing Alert</DialogTitle>
          </div>
          <DialogDescription>
            Configure scenario details, recipient contacts, and schedule either a one-time static trigger or an automated cron interval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Scenario Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              1. Business & Client Scenario
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Business Name *
                </label>
                <Input
                  placeholder="e.g. Apex Marketing"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Client Name *
                </label>
                <Input
                  placeholder="e.g. Sarah Jenkins"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Contact & Channel Detection */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                2. Contact Information & Auto-Channel
              </h4>
              {/* Live Channel Detection Badge */}
              <div>
                {channelPreview === "whatsapp" && (
                  <Badge variant="whatsapp">
                    <MessageSquare className="h-3 w-3" /> WhatsApp Only
                  </Badge>
                )}
                {channelPreview === "email" && (
                  <Badge variant="email">
                    <Mail className="h-3 w-3" /> Email Only
                  </Badge>
                )}
                {channelPreview === "both" && (
                  <Badge className="bg-purple-950/50 text-purple-300 border-purple-800/50">
                    <Layers className="h-3 w-3" /> Both (WhatsApp & Email)
                  </Badge>
                )}
                {channelPreview === "none" && (
                  <span className="text-[11px] text-zinc-500 italic">
                    Enter phone and/or email below
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Phone Number (WhatsApp)
                </label>
                <Input
                  placeholder="+14155550199"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <span className="block text-[11px] text-zinc-500 mt-1">
                  With country code (e.g. +1 or +91)
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Client Email
                </label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="block text-[11px] text-zinc-500 mt-1">
                  For email notifications
                </span>
              </div>
            </div>
          </div>

          {/* Section: Message Content */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              3. Message Content
            </h4>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Subject Line *
              </label>
              <Input
                placeholder="e.g. Your Monthly Strategy Review is Ready"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Message Body *
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-zinc-500">Insert tag:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertPlaceholder("{client_name}")}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    {"{client_name}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertPlaceholder("{business_name}")}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    {"{business_name}"}
                  </button>
                </div>
              </div>
              <Textarea
                placeholder="Hello {client_name}, {business_name} has prepared an update for you..."
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section: Scheduling Mode */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              4. Schedule Options
            </h4>

            {/* Switch between Static and Cron */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/80 rounded-lg border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setScheduleType("STATIC")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                  scheduleType === "STATIC"
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                One-Time Static Alert
              </button>
              <button
                type="button"
                onClick={() => setScheduleType("CRON")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                  scheduleType === "CRON"
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Recurring Cron Job
              </button>
            </div>

            {/* Static Fields */}
            {scheduleType === "STATIC" && (
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
                <label className="block text-xs font-medium text-zinc-300">
                  Execution Date & Time (UTC/Local)
                </label>
                <Input
                  type="datetime-local"
                  value={runAt}
                  onChange={(e) => setRunAt(e.target.value)}
                  className="w-full"
                />
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500 text-[11px]">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickStaticTime(5)}
                    className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px]"
                  >
                    +5 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickStaticTime(30)}
                    className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px]"
                  >
                    +30 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickStaticTime(60)}
                    className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px]"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickStaticTime(1440)}
                    className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px]"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            )}

            {/* Cron Fields */}
            {scheduleType === "CRON" && (
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Select Recurring Interval
                  </label>
                  <select
                    value={cronPreset}
                    onChange={(e) => setCronPreset(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
                  >
                    <option value="5_min">Every 5 Minutes (*/5 * * * *)</option>
                    <option value="hourly">Every Hour (0 * * * *)</option>
                    <option value="daily_9am">Every Day at 9:00 AM (0 9 * * *)</option>
                    <option value="weekly_monday">Every Monday at 9:00 AM (0 9 * * 1)</option>
                    <option value="monthly">1st of Every Month at 9:00 AM (0 9 1 * *)</option>
                    <option value="custom">Custom Cron Expression...</option>
                  </select>
                </div>

                {cronPreset === "custom" && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Custom Cron Expression (5 parts)
                    </label>
                    <Input
                      placeholder="e.g. 0 9 * * 1-5"
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                    />
                  </div>
                )}

                <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800/70 text-xs">
                  <span className="text-zinc-500">Schedule summary: </span>
                  <span className="text-sky-400 font-medium font-mono">
                    {formatCronDescription(getEffectiveCron())}
                  </span>
                  <span className="block text-[11px] text-zinc-500 font-mono mt-0.5">
                    Expression: {getEffectiveCron()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling Job..." : "Schedule Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
