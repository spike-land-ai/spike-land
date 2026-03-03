import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: ReactNode;
  className?: string;
}

const variants = {
  default: "bg-white/5 text-gray-400 border-white/5",
  success: "bg-emerald-neon/5 text-emerald-neon border-emerald-neon/20",
  warning: "bg-amber-neon/5 text-amber-neon border-amber-neon/20",
  error: "bg-red-500/5 text-red-400 border-red-500/20",
  info: "bg-blue-500/5 text-blue-400 border-blue-500/20",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
