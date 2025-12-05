"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({
  children,
  className = "",
  variant = "default",
  padding = "md",
  onClick,
}: CardProps) {
  const baseClasses =
    variant === "default"
      ? "bg-surface-light dark:bg-slate-800/50 rounded-xl shadow-sm"
      : "bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark";

  return (
    <div 
      className={`${baseClasses} ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

