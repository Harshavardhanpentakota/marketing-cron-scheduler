import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "whatsapp" | "email";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700/60",
    secondary: "bg-zinc-900 text-zinc-400 border-zinc-800",
    success: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40",
    warning: "bg-amber-950/50 text-amber-400 border-amber-800/40",
    destructive: "bg-rose-950/50 text-rose-400 border-rose-800/40",
    outline: "border-zinc-800 text-zinc-400 bg-transparent",
    whatsapp: "bg-emerald-950/40 text-emerald-300 border-emerald-800/50",
    email: "bg-sky-950/40 text-sky-300 border-sky-800/50",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
