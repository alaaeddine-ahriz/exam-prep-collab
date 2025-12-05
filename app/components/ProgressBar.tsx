"use client";

interface ProgressBarProps {
  value: number; // 0-100
  variant?: "primary" | "success" | "warning" | "error" | "auto";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

function getAutoColor(value: number): string {
  if (value >= 70) return "bg-success";
  if (value >= 40) return "bg-warning";
  return "bg-error";
}

function getAutoTextColor(value: number): string {
  if (value >= 70) return "text-success";
  if (value >= 40) return "text-warning";
  return "text-error";
}

const variantClasses = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  auto: "", // Will be determined by value
};

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2",
};

export function ProgressBar({
  value,
  variant = "primary",
  size = "sm",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const barColor = variant === "auto" ? getAutoColor(value) : variantClasses[variant];
  const textColor = variant === "auto" ? getAutoTextColor(value) : `text-${variant}`;
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <p>Consensus:</p>
          <p className={`font-medium ${textColor}`}>{clampedValue}%</p>
        </div>
      )}
      <div className={`rounded-full bg-border-light dark:bg-slate-700 ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

