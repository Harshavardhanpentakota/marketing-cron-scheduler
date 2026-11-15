import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variants = {
      default: "bg-zinc-100 text-zinc-900 hover:bg-white shadow-sm font-semibold",
      secondary: "bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white",
      outline: "border border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-300 hover:text-white",
      ghost: "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100",
      destructive: "bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-900/40",
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-6 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
